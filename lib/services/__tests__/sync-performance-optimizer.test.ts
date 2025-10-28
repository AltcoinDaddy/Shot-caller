/**
 * Unit Tests for Sync Performance Optimizer
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SyncPerformanceOptimizer } from '../sync-performance-optimizer';
import { SyncOperationType } from '../../types/sync';

// Mock timers
vi.useFakeTimers();

describe('SyncPerformanceOptimizer', () => {
  let optimizer: SyncPerformanceOptimizer;

  beforeEach(() => {
    optimizer = new SyncPerformanceOptimizer();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Batch Processing', () => {
    it('should batch operations when under size limit', async () => {
      const operation1 = {
        id: 'op1',
        type: SyncOperationType.NFT_COLLECTION_FETCH,
        address: '0x123',
        priority: 5,
        timestamp: new Date(),
        metadata: {}
      };

      const operation2 = {
        id: 'op2',
        type: SyncOperationType.NFT_COLLECTION_FETCH,
        address: '0x456',
        priority: 5,
        timestamp: new Date(),
        metadata: {}
      };

      // Start both operations
      const promise1 = optimizer.batchOperation(operation1);
      const promise2 = optimizer.batchOperation(operation2);

      // Advance timer to trigger batch processing
      vi.advanceTimersByTime(2100);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.operations).toBeDefined();
      expect(result2.operations).toBeDefined();
    });

    it('should process batch immediately when size limit reached', async () => {
      const operations = Array.from({ length: 5 }, (_, i) => ({
        id: `op${i}`,
        type: SyncOperationType.NFT_COLLECTION_FETCH,
        address: `0x${i}`,
        priority: 5,
        timestamp: new Date(),
        metadata: {}
      }));

      const promises = operations.map(op => optimizer.batchOperation(op));
      
      // Should process immediately without timer
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should group operations by type and address', async () => {
      const nftOp = {
        id: 'nft1',
        type: SyncOperationType.NFT_COLLECTION_FETCH,
        address: '0x123',
        priority: 5,
        timestamp: new Date(),
        metadata: {}
      };

      const profileOp = {
        id: 'profile1',
        type: SyncOperationType.PROFILE_DATA_UPDATE,
        address: '0x123',
        priority: 5,
        timestamp: new Date(),
        metadata: {}
      };

      const promise1 = optimizer.batchOperation(nftOp);
      const promise2 = optimizer.batchOperation(profileOp);

      vi.advanceTimersByTime(2100);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Request Deduplication', () => {
    it('should deduplicate identical requests', async () => {
      let callCount = 0;
      const mockFetcher = vi.fn(async () => {
        callCount++;
        return { data: 'test' };
      });

      const key = 'test-key';
      
      // Make multiple identical requests
      const promise1 = optimizer.deduplicateRequest(key, mockFetcher);
      const promise2 = optimizer.deduplicateRequest(key, mockFetcher);
      const promise3 = optimizer.deduplicateRequest(key, mockFetcher);

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      // Should only call fetcher once
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(callCount).toBe(1);
      
      // All results should be identical
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('should not deduplicate after TTL expires', async () => {
      const mockFetcher = vi.fn(async () => ({ data: 'test' }));
      const key = 'test-key';
      const ttl = 1000;

      // First request
      await optimizer.deduplicateRequest(key, mockFetcher, ttl);
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(1100);
      
      // Second request after TTL
      await optimizer.deduplicateRequest(key, mockFetcher, ttl);

      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    it('should track deduplication savings in metrics', async () => {
      const mockFetcher = vi.fn(async () => ({ data: 'test' }));
      const key = 'test-key';

      // Make multiple requests to trigger deduplication
      await Promise.all([
        optimizer.deduplicateRequest(key, mockFetcher),
        optimizer.deduplicateRequest(key, mockFetcher),
        optimizer.deduplicateRequest(key, mockFetcher)
      ]);

      const metrics = optimizer.getPerformanceMetrics();
      expect(metrics.deduplicationSavings).toBeGreaterThan(0);
    });
  });

  describe('Incremental NFT Sync', () => {
    it('should perform full sync when no previous state exists', async () => {
      const mockCollection = [
        { id: '1', tokenId: 'token1' },
        { id: '2', tokenId: 'token2' }
      ];

      const fullFetcher = vi.fn(async () => mockCollection);
      const address = '0x123';

      const result = await optimizer.incrementalNFTSync(address, fullFetcher);

      expect(fullFetcher).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.collectionCount).toBe(2);
      expect(result.newNFTs).toBe(2);
      expect(result.removedNFTs).toBe(0);
    });

    it('should perform incremental sync when delta fetcher available', async () => {
      const mockCollection = [
        { id: '1', tokenId: 'token1' },
        { id: '2', tokenId: 'token2' }
      ];

      const fullFetcher = vi.fn(async () => mockCollection);
      const deltaFetcher = vi.fn(async () => ({
        added: [{ id: '3', tokenId: 'token3' }],
        removed: [],
        hash: 'new-hash'
      }));

      const address = '0x123';

      // First sync to establish state
      await optimizer.incrementalNFTSync(address, fullFetcher);
      
      // Second sync should use delta
      const result = await optimizer.incrementalNFTSync(address, fullFetcher, deltaFetcher);

      expect(deltaFetcher).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.newNFTs).toBe(1);
      expect(result.removedNFTs).toBe(0);
    });

    it('should fallback to full sync if delta sync fails', async () => {
      const mockCollection = [{ id: '1', tokenId: 'token1' }];
      const fullFetcher = vi.fn(async () => mockCollection);
      const deltaFetcher = vi.fn(async () => {
        throw new Error('Delta fetch failed');
      });

      const address = '0x123';

      // First sync to establish state
      await optimizer.incrementalNFTSync(address, fullFetcher);
      
      // Second sync should fallback to full sync
      const result = await optimizer.incrementalNFTSync(address, fullFetcher, deltaFetcher);

      expect(deltaFetcher).toHaveBeenCalledTimes(1);
      expect(fullFetcher).toHaveBeenCalledTimes(2); // Once for initial, once for fallback
      expect(result.success).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should track performance metrics', () => {
      const metrics = optimizer.getPerformanceMetrics();

      expect(metrics).toHaveProperty('batchProcessingTime');
      expect(metrics).toHaveProperty('deduplicationSavings');
      expect(metrics).toHaveProperty('incrementalSyncEfficiency');
      expect(metrics).toHaveProperty('cacheOptimizationGains');
      expect(metrics).toHaveProperty('totalRequestsOptimized');
      expect(metrics).toHaveProperty('averageResponseTime');
    });

    it('should update metrics after operations', async () => {
      const operation = {
        id: 'test-op',
        type: SyncOperationType.NFT_COLLECTION_FETCH,
        address: '0x123',
        priority: 5,
        timestamp: new Date(),
        metadata: {}
      };

      const initialMetrics = optimizer.getPerformanceMetrics();
      
      await optimizer.batchOperation(operation);
      vi.advanceTimersByTime(2100);

      const updatedMetrics = optimizer.getPerformanceMetrics();
      
      expect(updatedMetrics.totalRequestsOptimized).toBeGreaterThan(
        initialMetrics.totalRequestsOptimized
      );
    });
  });

  describe('Cache Optimization', () => {
    it('should optimize cache for user', async () => {
      const address = '0x123';
      
      // This should not throw
      await expect(optimizer.optimizeCacheForUser(address)).resolves.not.toThrow();
    });

    it('should track cache optimization gains', async () => {
      const address = '0x123';
      const initialMetrics = optimizer.getPerformanceMetrics();
      
      await optimizer.optimizeCacheForUser(address);
      
      const updatedMetrics = optimizer.getPerformanceMetrics();
      expect(updatedMetrics.cacheOptimizationGains).toBeGreaterThanOrEqual(
        initialMetrics.cacheOptimizationGains
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle batch operation failures gracefully', async () => {
      const operation = {
        id: 'failing-op',
        type: 'INVALID_TYPE' as any,
        address: '0x123',
        priority: 5,
        timestamp: new Date(),
        metadata: {}
      };

      // Should not throw, but return failed result
      const result = await optimizer.batchOperation(operation);
      vi.advanceTimersByTime(2100);

      // The operation should complete even if it fails internally
      expect(result).toBeDefined();
    });

    it('should handle deduplication failures', async () => {
      const failingFetcher = vi.fn(async () => {
        throw new Error('Fetch failed');
      });

      await expect(
        optimizer.deduplicateRequest('failing-key', failingFetcher)
      ).rejects.toThrow('Fetch failed');
    });
  });
});