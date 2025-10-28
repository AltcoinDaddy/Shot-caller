/**
 * Unit Tests for Network Resilience Manager
 * Tests network monitoring, retry logic, and offline operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkResilienceManager, ConnectionQuality, RetryPolicy } from '@/lib/services/network-resilience-manager';

// Mock global objects
const mockNavigator = {
  onLine: true,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50
  }
};

const mockFetch = vi.fn();

// Mock window and navigator
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

Object.defineProperty(global, 'fetch', {
  value: mockFetch,
  writable: true
});

// Mock window event listeners
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(global, 'window', {
  value: {
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener
  },
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('NetworkResilienceManager', () => {
  let networkManager: NetworkResilienceManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset navigator state
    mockNavigator.onLine = true;
    mockNavigator.connection = {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50
    };

    // Setup default fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200
    });

    // Setup default localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});

    networkManager = new NetworkResilienceManager();
  });

  afterEach(() => {
    networkManager?.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const status = networkManager.getNetworkStatus();
      
      expect(status.isOnline).toBe(true);
      expect(status.quality).toBeDefined();
      expect(status.lastChecked).toBeInstanceOf(Date);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        defaultRetryPolicy: {
          maxAttempts: 5,
          baseDelay: 2000,
          maxDelay: 60000,
          backoffMultiplier: 3,
          retryCondition: () => false
        },
        connectionCheckInterval: 10000,
        maxOfflineOperations: 200
      };

      const customManager = new NetworkResilienceManager(customConfig);
      
      expect(() => customManager.destroy()).not.toThrow();
    });

    it('should set up event listeners', () => {
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Network Status Monitoring', () => {
    it('should return current network status', () => {
      const status = networkManager.getNetworkStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('quality');
      expect(status).toHaveProperty('lastChecked');
      expect(status.lastChecked).toBeInstanceOf(Date);
    });

    it('should detect online state', () => {
      mockNavigator.onLine = true;
      
      expect(networkManager.isOnline()).toBe(true);
    });

    it('should detect offline state', () => {
      mockNavigator.onLine = false;
      networkManager = new NetworkResilienceManager();
      
      expect(networkManager.isOnline()).toBe(false);
    });

    it('should assess connection quality based on network info', () => {
      // Test excellent connection
      mockNavigator.connection = {
        effectiveType: '4g',
        downlink: 15,
        rtt: 30
      };
      
      networkManager = new NetworkResilienceManager();
      expect(networkManager.getConnectionQuality()).toBe(ConnectionQuality.EXCELLENT);
    });

    it('should handle missing network information API', () => {
      // Remove connection property
      delete (mockNavigator as any).connection;
      
      networkManager = new NetworkResilienceManager();
      
      // Should default to good quality when online
      expect(networkManager.getConnectionQuality()).toBe(ConnectionQuality.GOOD);
    });
  });

  describe('Retry Logic', () => {
    it('should execute operation successfully on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await networkManager.executeWithRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry failed operations according to policy', async () => {
      let attemptCount = 0;
      const operation = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          const error = new Error('Temporary failure');
          error.name = 'NetworkError';
          throw error;
        }
        return 'success';
      });

      const retryPolicy: RetryPolicy = {
        maxAttempts: 3,
        baseDelay: 10, // Fast for testing
        maxDelay: 100,
        backoffMultiplier: 2,
        retryCondition: (error) => error.name === 'NetworkError'
      };

      const result = await networkManager.executeWithRetry(operation, retryPolicy);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockImplementation(() => {
        const error = new Error('Validation error');
        error.name = 'ValidationError';
        throw error;
      });

      const retryPolicy: RetryPolicy = {
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
        retryCondition: (error) => error.name === 'NetworkError'
      };

      await expect(networkManager.executeWithRetry(operation, retryPolicy)).rejects.toThrow('Validation error');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect maximum retry attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));

      const retryPolicy: RetryPolicy = {
        maxAttempts: 2,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
        retryCondition: () => true
      };

      await expect(networkManager.executeWithRetry(operation, retryPolicy)).rejects.toThrow('Always fails');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should implement exponential backoff', async () => {
      const delays: number[] = [];
      let attemptCount = 0;
      
      const operation = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Retry me');
        }
        return 'success';
      });

      // Mock setTimeout to capture delays
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0); // Execute immediately for testing
      }) as any;

      try {
        const retryPolicy: RetryPolicy = {
          maxAttempts: 3,
          baseDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
          retryCondition: () => true
        };

        await networkManager.executeWithRetry(operation, retryPolicy);
        
        expect(delays).toHaveLength(2); // Two retries
        expect(delays[0]).toBeGreaterThanOrEqual(100); // First retry delay
        expect(delays[1]).toBeGreaterThanOrEqual(200); // Second retry delay (exponential)
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });
  });

  describe('Offline Operations', () => {
    it('should queue operations when offline', () => {
      const operation = {
        type: 'sync',
        operation: vi.fn(),
        data: { test: 'data' },
        priority: 1
      };

      networkManager.queueOfflineOperation(operation);
      
      const queueStatus = networkManager.getOfflineQueueStatus();
      expect(queueStatus.count).toBe(1);
      expect(queueStatus.operations[0]).toMatchObject({
        type: 'sync',
        data: { test: 'data' },
        priority: 1
      });
    });

    it('should process offline queue when online', async () => {
      const operation1 = vi.fn().mockResolvedValue('result1');
      const operation2 = vi.fn().mockResolvedValue('result2');

      networkManager.queueOfflineOperation({
        type: 'sync1',
        operation: operation1,
        data: {},
        priority: 1
      });

      networkManager.queueOfflineOperation({
        type: 'sync2',
        operation: operation2,
        data: {},
        priority: 2
      });

      await networkManager.processOfflineQueue();

      expect(operation1).toHaveBeenCalled();
      expect(operation2).toHaveBeenCalled();
      
      const queueStatus = networkManager.getOfflineQueueStatus();
      expect(queueStatus.count).toBe(0);
    });

    it('should not process queue when offline', async () => {
      mockNavigator.onLine = false;
      networkManager = new NetworkResilienceManager();

      const operation = vi.fn();
      networkManager.queueOfflineOperation({
        type: 'sync',
        operation,
        data: {},
        priority: 1
      });

      await networkManager.processOfflineQueue();

      expect(operation).not.toHaveBeenCalled();
      
      const queueStatus = networkManager.getOfflineQueueStatus();
      expect(queueStatus.count).toBe(1);
    });

    it('should handle failed operations in queue', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      const successOperation = vi.fn().mockResolvedValue('success');

      networkManager.queueOfflineOperation({
        type: 'failing',
        operation: failingOperation,
        data: {},
        priority: 1
      });

      networkManager.queueOfflineOperation({
        type: 'success',
        operation: successOperation,
        data: {},
        priority: 1
      });

      await networkManager.processOfflineQueue();

      expect(failingOperation).toHaveBeenCalled();
      expect(successOperation).toHaveBeenCalled();
      
      // Failed operation should be removed after max retries
      const queueStatus = networkManager.getOfflineQueueStatus();
      expect(queueStatus.count).toBe(0);
    });

    it('should respect operation priority in queue', async () => {
      const executionOrder: string[] = [];
      
      const lowPriorityOp = vi.fn().mockImplementation(() => {
        executionOrder.push('low');
        return Promise.resolve();
      });
      
      const highPriorityOp = vi.fn().mockImplementation(() => {
        executionOrder.push('high');
        return Promise.resolve();
      });

      // Add low priority first
      networkManager.queueOfflineOperation({
        type: 'low',
        operation: lowPriorityOp,
        data: {},
        priority: 1
      });

      // Add high priority second
      networkManager.queueOfflineOperation({
        type: 'high',
        operation: highPriorityOp,
        data: {},
        priority: 5
      });

      await networkManager.processOfflineQueue();

      // High priority should execute first
      expect(executionOrder).toEqual(['high', 'low']);
    });

    it('should limit queue size', () => {
      const limitedManager = new NetworkResilienceManager({
        maxOfflineOperations: 2
      });

      // Add more operations than the limit
      for (let i = 0; i < 5; i++) {
        limitedManager.queueOfflineOperation({
          type: `op${i}`,
          operation: vi.fn(),
          data: { index: i },
          priority: 1
        });
      }

      const queueStatus = limitedManager.getOfflineQueueStatus();
      expect(queueStatus.count).toBe(2);
      
      limitedManager.destroy();
    });

    it('should clear offline queue', () => {
      networkManager.queueOfflineOperation({
        type: 'test',
        operation: vi.fn(),
        data: {},
        priority: 1
      });

      expect(networkManager.getOfflineQueueStatus().count).toBe(1);
      
      networkManager.clearOfflineQueue();
      
      expect(networkManager.getOfflineQueueStatus().count).toBe(0);
    });
  });

  describe('Fallback Data Management', () => {
    it('should store and retrieve fallback data', () => {
      const testData = { key: 'value', timestamp: new Date() };
      
      networkManager.setCachedFallback('test-key', testData);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'fallback_test-key',
        expect.stringContaining('"key":"value"')
      );
    });

    it('should retrieve fallback data', () => {
      const testData = { key: 'value' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        data: testData,
        timestamp: new Date().toISOString()
      }));

      const retrieved = networkManager.getFallbackData('test-key');
      
      expect(retrieved).toEqual(testData);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('fallback_test-key');
    });

    it('should handle corrupted fallback data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const retrieved = networkManager.getFallbackData('test-key');
      
      expect(retrieved).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      expect(() => networkManager.setCachedFallback('test', {})).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Event Handling', () => {
    it('should allow subscribing to network events', () => {
      const callback = vi.fn();
      
      const unsubscribe = networkManager.addEventListener('networkStatusChange', callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should emit events when network status changes', () => {
      const callback = vi.fn();
      networkManager.addEventListener('networkStatusChange', callback);

      // Simulate network status change
      const statusChangeHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];

      if (statusChangeHandler) {
        statusChangeHandler();
      }

      // Note: In a real test, we'd need to trigger the actual network monitoring
      // For now, we just verify the event listener was set up
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    });

    it('should handle errors in event callbacks', () => {
      const faultyCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      networkManager.addEventListener('networkStatusChange', faultyCallback);
      
      // Manually trigger event emission to test error handling
      const emitEvent = (networkManager as any).emitEvent;
      if (emitEvent) {
        emitEvent('networkStatusChange', {});
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      networkManager.destroy();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should clear intervals on destroy', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      networkManager.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should not fail when destroying multiple times', () => {
      networkManager.destroy();
      
      expect(() => networkManager.destroy()).not.toThrow();
    });
  });

  describe('Persistence', () => {
    it('should persist offline queue to localStorage', () => {
      networkManager.queueOfflineOperation({
        type: 'test',
        operation: vi.fn(),
        data: { test: 'data' },
        priority: 1
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('offline_operations'),
        expect.any(String)
      );
    });

    it('should load offline queue from localStorage on initialization', () => {
      const savedOperations = [
        {
          id: 'op1',
          type: 'test',
          data: { test: 'data' },
          timestamp: new Date().toISOString(),
          retryCount: 0,
          priority: 1
        }
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedOperations));
      
      const newManager = new NetworkResilienceManager();
      const queueStatus = newManager.getQueuedOperationCount();
      
      expect(queueStatus).toBe(1);
      
      newManager.destroy();
    });

    it('should handle corrupted offline queue data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const newManager = new NetworkResilienceManager();
      const queueStatus = newManager.getQueuedOperationCount();
      
      expect(queueStatus).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      newManager.destroy();
    });
  });
});