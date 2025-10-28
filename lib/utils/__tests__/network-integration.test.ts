/**
 * Network Integration Tests
 * 
 * Tests the integration between network resilience manager and network-aware operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeNetworkOperation, NetworkAwareCache } from '../network-aware-operations';
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

describe('Network Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeNetworkOperation Integration', () => {
    it('should execute operation when online', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      (networkResilienceManager.isOnline as any).mockReturnValue(true);
      (networkResilienceManager.executeWithRetry as any).mockImplementation(
        (op: any) => op()
      );

      const result = await executeNetworkOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
      expect(networkResilienceManager.executeWithRetry).toHaveBeenCalled();
    });

    it('should use fallback when offline', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      (networkResilienceManager.isOnline as any).mockReturnValue(false);

      const result = await executeNetworkOperation(operation, {
        fallbackData: 'fallback_result'
      });

      expect(result).toBe('fallback_result');
      expect(networkResilienceManager.queueOfflineOperation).toHaveBeenCalled();
    });

    it('should cache successful results', async () => {
      const operation = vi.fn().mockResolvedValue('cached_data');
      (networkResilienceManager.isOnline as any).mockReturnValue(true);
      (networkResilienceManager.executeWithRetry as any).mockImplementation(
        (op: any) => op()
      );

      await executeNetworkOperation(operation, {
        cacheKey: 'test_cache'
      });

      expect(networkResilienceManager.setCachedFallback).toHaveBeenCalledWith(
        'test_cache',
        'cached_data'
      );
    });
  });

  describe('NetworkAwareCache Integration', () => {
    let cache: NetworkAwareCache<string>;

    beforeEach(() => {
      cache = new NetworkAwareCache<string>(1000);
    });

    it('should fetch and cache data when online', async () => {
      const fetcher = vi.fn().mockResolvedValue('fresh_data');
      (networkResilienceManager.isOnline as any).mockReturnValue(true);
      (networkResilienceManager.executeWithRetry as any).mockImplementation(
        (op: any) => op()
      );

      const result = await cache.get('test_key', fetcher);

      expect(result).toBe('fresh_data');
      expect(fetcher).toHaveBeenCalled();
    });

    it('should return cached data when offline', async () => {
      const fetcher = vi.fn().mockResolvedValue('fresh_data');
      (networkResilienceManager.isOnline as any).mockReturnValue(false);

      // Set cached data first
      cache.set('test_key', 'cached_data');

      const result = await cache.get('test_key', fetcher);

      expect(result).toBe('cached_data');
      expect(fetcher).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'));
      (networkResilienceManager.isOnline as any).mockReturnValue(true);
      (networkResilienceManager.executeWithRetry as any).mockImplementation(
        (op: any) => op()
      );
      (networkResilienceManager.getFallbackData as any).mockReturnValue({
        data: 'fallback_from_cache'
      });

      const result = await executeNetworkOperation(operation, {
        cacheKey: 'error_test'
      });

      expect(result).toBe('fallback_from_cache');
      expect(networkResilienceManager.getFallbackData).toHaveBeenCalledWith('error_test');
    });

    it('should throw error when no fallback available', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'));
      (networkResilienceManager.isOnline as any).mockReturnValue(true);
      (networkResilienceManager.executeWithRetry as any).mockImplementation(
        (op: any) => op()
      );
      (networkResilienceManager.getFallbackData as any).mockReturnValue(null);

      await expect(executeNetworkOperation(operation)).rejects.toThrow('Network error');
    });
  });
});