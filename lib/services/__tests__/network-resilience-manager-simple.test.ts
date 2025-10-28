/**
 * Simplified Network Resilience Manager Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NetworkResilienceManager, ConnectionQuality } from '../network-resilience-manager';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
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

describe('NetworkResilienceManager - Core Functionality', () => {
  let manager: NetworkResilienceManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup global mocks
    global.localStorage = localStorageMock as any;
    global.navigator = navigatorMock as any;
    global.window = windowMock as any;
    
    // Reset navigator state
    navigatorMock.onLine = true;
    
    manager = new NetworkResilienceManager({
      connectionCheckInterval: 60000, // Long interval to avoid timer issues
      qualityCheckInterval: 60000
    });
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Basic Functionality', () => {
    it('should be online by default', () => {
      expect(manager.isOnline()).toBe(true);
    });

    it('should have a connection quality', () => {
      const quality = manager.getConnectionQuality();
      expect(Object.values(ConnectionQuality)).toContain(quality);
    });

    it('should queue offline operations', () => {
      const operation = vi.fn().mockResolvedValue('test');
      
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

    it('should clear offline queue', () => {
      const operation = vi.fn().mockResolvedValue('test');
      
      manager.queueOfflineOperation({
        type: 'test_operation',
        operation,
        data: {},
        priority: 1
      });

      expect(manager.getOfflineQueueStatus().count).toBe(1);
      
      manager.clearOfflineQueue();
      expect(manager.getOfflineQueueStatus().count).toBe(0);
    });

    it('should handle fallback data', () => {
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
      const unsubscribe = manager.addEventListener('test_event', callback);

      // Emit event
      manager['emitEvent']('test_event', { test: 'data' });

      expect(callback).toHaveBeenCalledWith({ test: 'data' });

      // Unsubscribe should work
      unsubscribe();
      manager['emitEvent']('test_event', { test: 'data2' });

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
    });
  });
});