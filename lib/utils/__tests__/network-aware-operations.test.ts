/**
 * Network-Aware Operations Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  executeNetworkOperation, 
  adaptiveFetch, 
  batchNetworkOperations,
  NetworkAwareCache,
  getOptimalResourceUrl
} from '../network-aware-operations';
import { ConnectionQuality } from '@/lib/services/network-resilience-manager';

// Mock the network resilience manager
vi.mock('@/lib/services/network-resilience-manager', () => {
  const mockManager = {
    isOnline: vi.fn(() => true),
    getConnectionQuality: vi.fn(() => ConnectionQuality.GOOD),
    executeWithRetry: vi.fn(),
    queueOfflineOperation: vi.fn(),
    getFallbackData: vi.fn(),
    setCachedFallback: vi.fn(),
    addEventListener: vi.fn(() => () => {}),
    getNetworkStatus: vi.fn(() => ({
      isOnline: true,
      quality: ConnectionQuality.GOOD,
      lastChecked: new Date()
    }))
  };

  return {
    networkResilienceManager: mockManager,
    ConnectionQuality: {
      EXCELLENT: 'excellent',
      GOOD: 'good',
      FAIR: 'fair',
      POOR: 'poor',
      OFFLINE: 'offline'
    }
  };
});

import { networkResilienceManager } from '@/lib/services/network-resilience-manager';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('Network-Aware Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('executeNetworkOperation', () => {
    it('should execute operation when online', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      (networkResilienceManager.isOnline as any).mockReturnValue(true);
      (networkResilienceManager.executeWithRetry as any).mockImplementation(
        (op: any) => op()
      );

      const result = await executeNetworkOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should queue operation when offline and offline queue enabled', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      (networkResilienceManager.isOnline as any).mockReturnValue(false);

      const config = {
        enableOfflineQueue: true,
        priority: 2,
        fallbackData: 'fallback'
      };

      const result = await executeNetworkOperation(operation, config);

      expect(result).toBe('fallback');
      expect(networkResilienceManager.queueOfflineOperation).toHaveBeenCalledWith({
        type: 'network_operation',
        operation,
        data: config,
        priority: 2
      });
    });

    it('should use cached data when offline and no fallback provided', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      (networkResilienceManager.isOnline as any).mockReturnValue(false);
      (networkResilienceManager.getFallbackData as any).mockReturnValue({
        data: 'cached_data'
      });

      const result = await executeNetworkOperation(operation, {
        cacheKey: 'test_key'
      });

      expect(result).toBe('cached_data');
      expect(networkResilienceManager.getFallbackData).toHaveBeenCalledWith('test_key');
    });

    it('should throw error when offline and no fallback available', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      (networkResilienceManager.isOnline as any).mockReturnValue(false);
      (networkResilienceManager.getFallbackData as any).mockReturnValue(null);

      await expect(executeNetworkOperation(operation, { enableOfflineQueue: false }))
        .rejects.toThrow('Network unavailable and no fallback data provided');
    });

    it('should cache successful results', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      (networkResilienceManager.isOnline as any).mockReturnValue(true);
      (networkResilienceManager.executeWithRetry as any).mockImplementation(
        (op: any) => op()
      );

      await executeNetworkOperation(operation, { cacheKey: 'test_key' });

      expect(networkResilienceManager.setCachedFallback).toHaveBeenCalledWith(
        'test_key',
        'success'
      );
    });

    it('should use fallback data on operation failure', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      (networkResilienceManager.isOnline as any).mockReturnValue(true);
      (networkResilienceManager.executeWithRetry as any).mockImplementation(
        (op: any) => op()
      );
      (networkResilienceManager.getFallbackData as any).mockReturnValue({
        data: 'cached_fallback'
      });

      const result = await executeNetworkOperation(operation, {
        cacheKey: 'test_key'
      });

      expect(result).toBe('cached_fallback');
    });
  });

  describe('adaptiveFetch', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      } as Response);
    });

    it('should adjust timeout based on connection quality', async () => {
      (networkResilienceManager.getConnectionQuality as any).mockReturnValue(
        ConnectionQuality.POOR
      );
      (networkResilienceManager.executeWithRetry as any).mockImplementation(
        (op: any) => op()
      );

      const promise = adaptiveFetch('https://api.example.com/data');

      // Fast-forward time to trigger timeout for poor connection (30s)
      vi.advanceTimersByTime(35000);

      // The fetch should have been called with abort signal
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      );
    });

    it('should handle fetch timeout', async () => {
      (networkResilienceManager.getConnectionQuality as any).mockReturnValue(
        ConnectionQuality.POOR
      );

      // Mock fetch to never resolve (simulating timeout)
      fetchMock.mockImplementation(() => new Promise(() => {}));

      const fetchPromise = adaptiveFetch('https://api.example.com/data');

      // Fast-forward past timeout
      vi.advanceTimersByTime(35000);

      // Should reject with timeout error
      await expect(fetchPromise).rejects.toThrow();
    });

    it('should handle HTTP errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      (networkResilienceManager.executeWithRetry as any).mockImplementation(
        (op: any) => op()
      );

      await expect(adaptiveFetch('https://api.example.com/data'))
        .rejects.toThrow('HTTP 404: Not Found');
    });
  });

  describe('batchNetworkOperations', () => {
    it('should limit concurrency based on connection quality', async () => {
      (networkResilienceManager.getConnectionQuality as any).mockReturnValue(
        ConnectionQuality.FAIR
      );

      const operations = Array.from({ length: 10 }, (_, i) => 
        vi.fn().mockResolvedValue(`result_${i}`)
      );

      // Mock executeNetworkOperation to track concurrent calls
      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;

      vi.doMock('../network-aware-operations', async () => {
        const actual = await vi.importActual('../network-aware-operations');
        return {
          ...actual,
          executeNetworkOperation: vi.fn().mockImplementation(async (op: any) => {
            concurrentCalls++;
            maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);
            const result = await op();
            concurrentCalls--;
            return result;
          })
        };
      });

      await batchNetworkOperations(operations);

      // For FAIR connection, max concurrency should be 3
      expect(maxConcurrentCalls).toBeLessThanOrEqual(3);
    });

    it('should throw error when offline', async () => {
      (networkResilienceManager.getConnectionQuality as any).mockReturnValue(
        ConnectionQuality.OFFLINE
      );

      const operations = [vi.fn().mockResolvedValue('result')];

      await expect(batchNetworkOperations(operations))
        .rejects.toThrow('Cannot execute batch operations while offline');
    });
  });

  describe('NetworkAwareCache', () => {
    let cache: NetworkAwareCache<string>;

    beforeEach(() => {
      cache = new NetworkAwareCache<string>(1000); // 1 second TTL
    });

    it('should return cached data when fresh', async () => {
      const fetcher = vi.fn().mockResolvedValue('fresh_data');
      
      // First call should fetch
      const result1 = await cache.get('test_key', fetcher);
      expect(result1).toBe('fresh_data');
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await cache.get('test_key', fetcher);
      expect(result2).toBe('fresh_data');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should fetch new data when cache is stale', async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce('old_data')
        .mockResolvedValueOnce('new_data');

      // First call
      await cache.get('test_key', fetcher);
      
      // Advance time past TTL
      vi.advanceTimersByTime(2000);

      // Second call should fetch new data
      const result = await cache.get('test_key', fetcher);
      expect(result).toBe('new_data');
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should return stale cache when offline', async () => {
      (networkResilienceManager.isOnline as any).mockReturnValue(false);
      
      const fetcher = vi.fn().mockResolvedValue('fresh_data');
      
      // Set some cached data first
      cache.set('test_key', 'stale_data');
      
      // Advance time past TTL
      vi.advanceTimersByTime(2000);

      // Should return stale data when offline
      const result = await cache.get('test_key', fetcher);
      expect(result).toBe('stale_data');
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should prevent duplicate requests', async () => {
      const fetcher = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('data'), 100))
      );

      // Start multiple concurrent requests
      const promises = [
        cache.get('test_key', fetcher),
        cache.get('test_key', fetcher),
        cache.get('test_key', fetcher)
      ];

      vi.advanceTimersByTime(200);
      const results = await Promise.all(promises);

      // All should return same result
      expect(results).toEqual(['data', 'data', 'data']);
      // Fetcher should only be called once
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should return stale cache on fetch error', async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce('good_data')
        .mockRejectedValueOnce(new Error('Fetch failed'));

      // First successful call
      await cache.get('test_key', fetcher);
      
      // Advance time past TTL
      vi.advanceTimersByTime(2000);

      // Second call should fail but return stale cache
      const result = await cache.get('test_key', fetcher);
      expect(result).toBe('good_data');
    });
  });

  describe('getOptimalResourceUrl', () => {
    it('should return appropriate quality URLs', () => {
      const baseUrl = 'https://cdn.example.com/image.jpg';

      expect(getOptimalResourceUrl(baseUrl, ConnectionQuality.EXCELLENT))
        .toBe('https://cdn.example.com/image.jpg?quality=high');

      expect(getOptimalResourceUrl(baseUrl, ConnectionQuality.GOOD))
        .toBe('https://cdn.example.com/image.jpg?quality=medium');

      expect(getOptimalResourceUrl(baseUrl, ConnectionQuality.POOR))
        .toBe('https://cdn.example.com/image.jpg?quality=low');

      expect(getOptimalResourceUrl(baseUrl, ConnectionQuality.OFFLINE))
        .toBe('https://cdn.example.com/image.jpg?quality=cached');
    });
  });
});