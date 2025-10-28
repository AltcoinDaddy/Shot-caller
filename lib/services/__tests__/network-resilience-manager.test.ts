/**
 * Network Resilience Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { NetworkResilienceManager, ConnectionQuality, RetryPolicy } from '../network-resilience-manager';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock navigator
const navigatorMock = {
  onLine: true,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50
  }
};

// Mock window
const windowMock = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

// Mock fetch
const fetchMock = vi.fn();

describe('NetworkResilienceManager', () => {
  let manager: NetworkResilienceManager;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup global mocks
    global.localStorage = localStorageMock as any;
    global.navigator = navigatorMock as any;
    global.window = windowMock as any;
    global.fetch = fetchMock;
    
    // Reset navigator state
    navigatorMock.onLine = true;
    navigatorMock.connection = {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50
    };
    
    // Mock localStorage to return null initially
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock setTimeout and clearTimeout
    vi.useFakeTimers();
    
    manager = new NetworkResilienceManager({
      connectionCheckInterval: 1000,
      qualityCheckInterval: 5000
    });
  });

  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
  });

  describe('Network Status Monitoring', () => {
    it('should initialize with online status', () => {
      const status = manager.getNetworkStatus();
      expect(status.isOnline).toBe(true);
      expect(status.quality).toBe(ConnectionQuality.GOOD);
    });

    it('should detect online/offline events', () => {
      const eventCallback = vi.fn();
      manager.addEventListener('networkStatusChange', eventCallback);

      // Simulate offline event
      navigatorMock.onLine = false;
      const offlineHandler = windowMock.addEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];
      
      if (offlineHandler) {
        offlineHandler();
      }

      expect(manager.isOnline()).toBe(false);
      expect(manager.getConnectionQuality()).toBe(ConnectionQuality.OFFLINE);
    });

    it('should assess connection quality based on network info', () => {
      // Test excellent connection
      navigatorMock.connection = {
        effectiveType: '4g',
        downlink: 15,
        rtt: 30
      };

      // Trigger quality assessment
      manager['assessConnectionQuality']();
      expect(manager.getConnectionQuality()).toBe(ConnectionQuality.EXCELLENT);

      // Test poor connection
      navigatorMock.connection = {
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 200
      };

      manager['assessConnectionQuality']();
      expect(manager.getConnectionQuality()).toBe(ConnectionQuality.POOR);
    });
  });

  describe('Retry Logic', () => {
    it('should retry operations with exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const retryPolicy: RetryPolicy = {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        retryCondition: (error) => error.message.includes('Network')
      };

      const promise = manager.executeWithRetry(operation, retryPolicy);

      // Manually advance timers for each retry
      vi.advanceTimersByTime(100); // First retry delay
      vi.advanceTimersByTime(200); // Second retry delay

      const result = await promise;
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Validation error'));

      const retryPolicy: RetryPolicy = {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        retryCondition: (error) => error.message.includes('Network')
      };

      await expect(manager.executeWithRetry(operation, retryPolicy))
        .rejects.toThrow('Validation error');
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect maximum retry attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'));

      const retryPolicy: RetryPolicy = {
        maxAttempts: 2,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        retryCondition: (error) => error.message.includes('Network')
      };

      const promise = manager.executeWithRetry(operation, retryPolicy);
      
      // Advance timer for retry delay
      vi.advanceTimersByTime(100);

      await expect(promise).rejects.toThrow('Network error');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Offline Operation Queue', () => {
    it('should queue operations when offline', () => {
      const operation = vi.fn().mockResolvedValue('result');
      
      manager.queueOfflineOperation({
        type: 'test_operation',
        operation,
        data: { test: 'data' },
        priority: 1
      });

      const queueStatus = manager.getOfflineQueueStatus();
      expect(queueStatus.count).toBe(1);
      expect(queueStatus.operations[0].type).toBe('test_operation');
    });

    it('should process offline queue when connection is restored', async () => {
      const operation1 = vi.fn().mockResolvedValue('result1');
      const operation2 = vi.fn().mockResolvedValue('result2');

      // Queue operations
      manager.queueOfflineOperation({
        type: 'operation1',
        operation: operation1,
        data: {},
        priority: 1
      });

      manager.queueOfflineOperation({
        type: 'operation2',
        operation: operation2,
        data: {},
        priority: 2
      });

      expect(manager.getOfflineQueueStatus().count).toBe(2);

      // Ensure we're online and process queue
      navigatorMock.onLine = true;
      manager['networkStatus'].isOnline = true;
      await manager.processOfflineQueue();

      expect(operation1).toHaveBeenCalled();
      expect(operation2).toHaveBeenCalled();
      expect(manager.getOfflineQueueStatus().count).toBe(0);
    });

    it('should prioritize operations by priority and timestamp', async () => {
      const operations: any[] = [];
      const createOperation = (id: string) => {
        const op = vi.fn().mockImplementation(() => {
          operations.push(id);
          return Promise.resolve(id);
        });
        return op;
      };

      // Queue operations with different priorities
      manager.queueOfflineOperation({
        type: 'low_priority',
        operation: createOperation('low'),
        data: {},
        priority: 1
      });

      manager.queueOfflineOperation({
        type: 'high_priority',
        operation: createOperation('high'),
        data: {},
        priority: 3
      });

      manager.queueOfflineOperation({
        type: 'medium_priority',
        operation: createOperation('medium'),
        data: {},
        priority: 2
      });

      // Ensure we're online
      manager['networkStatus'].isOnline = true;
      await manager.processOfflineQueue();

      // Should execute in priority order: high, medium, low
      expect(operations).toEqual(['high', 'medium', 'low']);
    });

    it('should persist offline queue to localStorage', () => {
      const operation = vi.fn();
      
      manager.queueOfflineOperation({
        type: 'persistent_operation',
        operation,
        data: { test: 'data' },
        priority: 1
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'shotcaller_offline_operations',
        expect.stringContaining('persistent_operation')
      );
    });

    it('should limit queue size', () => {
      const maxOperations = 5;
      const managerWithLimit = new NetworkResilienceManager({
        maxOfflineOperations: maxOperations
      });

      // Queue more operations than the limit
      for (let i = 0; i < maxOperations + 3; i++) {
        managerWithLimit.queueOfflineOperation({
          type: `operation_${i}`,
          operation: vi.fn(),
          data: {},
          priority: 1
        });
      }

      const queueStatus = managerWithLimit.getOfflineQueueStatus();
      expect(queueStatus.count).toBe(maxOperations);

      managerWithLimit.destroy();
    });
  });

  describe('Fallback Data Management', () => {
    it('should store and retrieve fallback data', () => {
      const testData = { user: 'test', nfts: [] };
      
      manager.setCachedFallback('test_key', testData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'fallback_test_key',
        expect.stringContaining('"user":"test"')
      );

      // Mock localStorage return
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        data: testData,
        timestamp: new Date().toISOString()
      }));

      const retrieved = manager.getFallbackData('test_key');
      expect(retrieved).toEqual(testData);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => {
        manager.setCachedFallback('test_key', { data: 'test' });
      }).not.toThrow();

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should return null on error
      const result = manager.getFallbackData('test_key');
      expect(result).toBeNull();
    });
  });

  describe('Event System', () => {
    it('should emit and handle events', () => {
      const callback = vi.fn();
      const unsubscribe = manager.addEventListener('networkStatusChange', callback);

      // Emit event
      manager['emitEvent']('networkStatusChange', { test: 'data' });

      expect(callback).toHaveBeenCalledWith({ test: 'data' });

      // Unsubscribe should work
      unsubscribe();
      manager['emitEvent']('networkStatusChange', { test: 'data2' });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in event listeners', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const goodCallback = vi.fn();

      manager.addEventListener('test_event', errorCallback);
      manager.addEventListener('test_event', goodCallback);

      // Should not throw and should call good callback
      expect(() => {
        manager['emitEvent']('test_event', { data: 'test' });
      }).not.toThrow();

      expect(goodCallback).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      manager.destroy();

      expect(windowMock.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(windowMock.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(manager['isInitialized']).toBe(false);
    });
  });
});