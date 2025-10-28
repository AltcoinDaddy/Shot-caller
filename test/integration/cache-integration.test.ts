/**
 * Integration Tests for Cache System
 * Tests the complete cache system integration including warming and monitoring
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheManager } from '@/lib/services/cache-manager';
import { SyncEventBus } from '@/lib/services/sync-event-bus';

describe('Cache System Integration', () => {
  let cacheManager: CacheManager;
  let eventBus: SyncEventBus;

  beforeEach(async () => {
    eventBus = new SyncEventBus();
    cacheManager = new CacheManager(eventBus, {
      cache: {
        maxSize: 1024 * 1024, // 1MB
        defaultTTL: 5000, // 5 seconds
        enableCompression: false,
        compressionThreshold: 1024
      },
      warming: {
        enableAutoWarmup: true,
        warmupOnConnect: true,
        maxConcurrentWarmups: 2
      },
      monitoring: {
        enableMonitoring: true,
        metricsInterval: 1000, // 1 second for testing
        enableAlerts: true
      }
    });

    await cacheManager.initialize();
  });

  afterEach(() => {
    cacheManager.shutdown();
  });

  describe('End-to-End Cache Flow', () => {
    it('should handle complete user connection flow', async () => {
      const userAddress = '0x1234567890abcdef';
      
      // Simulate wallet connection
      eventBus.emit({
        type: 'wallet_connected',
        timestamp: new Date(),
        data: { address: userAddress },
        source: 'test'
      });

      // Wait for warmup to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that user data was warmed up
      const profileData = await cacheManager.get(`profile:${userAddress}`);
      const nftData = await cacheManager.get(`nft:collection:${userAddress}`);

      expect(profileData).toBeTruthy();
      expect(nftData).toBeTruthy();
    });

    it('should invalidate cache on NFT collection update', async () => {
      const userAddress = '0x1234567890abcdef';
      
      // Set initial data
      await cacheManager.set(`profile:${userAddress}`, { name: 'User' }, { tags: ['profile'] });
      await cacheManager.set(`nft:collection:${userAddress}`, { count: 5 }, { tags: ['nft'] });

      // Verify data exists
      expect(await cacheManager.get(`profile:${userAddress}`)).toBeTruthy();
      expect(await cacheManager.get(`nft:collection:${userAddress}`)).toBeTruthy();

      // Simulate NFT collection update
      eventBus.emit({
        type: 'nft_collection_updated',
        timestamp: new Date(),
        data: { address: userAddress },
        source: 'test'
      });

      // Wait for invalidation to process
      await new Promise(resolve => setTimeout(resolve, 50));

      // Profile and NFT data should be invalidated
      expect(await cacheManager.get(`profile:${userAddress}`)).toBeNull();
      expect(await cacheManager.get(`nft:collection:${userAddress}`)).toBeNull();
    });

    it('should handle cache with fallback fetching', async () => {
      const testKey = 'test:fallback';
      const fallbackData = { id: 1, name: 'Fallback Data' };
      
      const mockFetcher = vi.fn().mockResolvedValue(fallbackData);

      // Get data with fallback (cache miss)
      const result = await cacheManager.get(testKey, {
        fallback: mockFetcher,
        tags: ['test']
      });

      expect(result).toEqual(fallbackData);
      expect(mockFetcher).toHaveBeenCalledOnce();

      // Second call should use cache (no fallback call)
      const cachedResult = await cacheManager.get(testKey, {
        fallback: mockFetcher
      });

      expect(cachedResult).toEqual(fallbackData);
      expect(mockFetcher).toHaveBeenCalledOnce(); // Still only once
    });
  });

  describe('Cache Warming Integration', () => {
    it('should warm up user data on wallet connection', async () => {
      const userAddress = '0xabcdef1234567890';
      
      // Trigger warmup
      await cacheManager.warmupUser(userAddress);

      // Check that data was warmed up
      const profileData = await cacheManager.get(`profile:${userAddress}`);
      const nftData = await cacheManager.get(`nft:collection:${userAddress}`);

      expect(profileData).toBeTruthy();
      expect(nftData).toBeTruthy();
    });

    it('should warm up game data', async () => {
      await cacheManager.warmupGameData();

      // Check that game data was warmed up
      const leaderboard = await cacheManager.get('leaderboard:current');
      const contests = await cacheManager.get('contests:available');

      expect(leaderboard).toBeTruthy();
      expect(contests).toBeTruthy();
    });

    it('should handle concurrent warmup operations', async () => {
      const addresses = ['0x111', '0x222', '0x333'];
      
      // Start multiple warmup operations concurrently
      const warmupPromises = addresses.map(addr => cacheManager.warmupUser(addr));
      
      // Should complete without errors
      await expect(Promise.all(warmupPromises)).resolves.toBeDefined();

      // All data should be warmed up
      for (const addr of addresses) {
        expect(await cacheManager.get(`profile:${addr}`)).toBeTruthy();
        expect(await cacheManager.get(`nft:collection:${addr}`)).toBeTruthy();
      }
    });
  });

  describe('Cache Monitoring Integration', () => {
    it('should collect and report cache metrics', async () => {
      // Generate some cache activity
      await cacheManager.set('test:1', { data: 'test1' });
      await cacheManager.set('test:2', { data: 'test2' });
      await cacheManager.get('test:1');
      await cacheManager.get('test:1');
      await cacheManager.get('nonexistent');

      // Wait for metrics collection
      await new Promise(resolve => setTimeout(resolve, 1100));

      const status = cacheManager.getStatus();
      const metrics = cacheManager.getMetrics();

      expect(status.cache.entries).toBeGreaterThan(0);
      expect(status.cache.hitRate).toBeGreaterThan(0);
      expect(metrics.current).toBeTruthy();
      expect(metrics.recommendations).toBeDefined();
    });

    it('should provide optimization recommendations', async () => {
      // Fill cache with data to trigger recommendations
      for (let i = 0; i < 20; i++) {
        await cacheManager.set(`bulk:${i}`, { data: `test${i}` });
      }

      // Generate cache misses to lower hit rate
      for (let i = 0; i < 10; i++) {
        await cacheManager.get(`missing:${i}`);
      }

      const metrics = cacheManager.getMetrics();
      expect(metrics.recommendations.length).toBeGreaterThan(0);
    });

    it('should perform automatic optimization', async () => {
      // Create conditions that trigger optimization
      for (let i = 0; i < 15; i++) {
        await cacheManager.set(`data:${i}`, { large: 'x'.repeat(1000) });
      }

      // Generate many misses to lower hit rate
      for (let i = 0; i < 20; i++) {
        await cacheManager.get(`missing:${i}`);
      }

      const result = await cacheManager.optimizePerformance();
      
      expect(result.actionsPerformed.length).toBeGreaterThan(0);
      expect(result.expectedImpact.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Persistence and Recovery', () => {
    it('should export and import cache data', async () => {
      // Set up test data
      const testData = [
        { key: 'export:1', data: { id: 1, name: 'Test 1' } },
        { key: 'export:2', data: { id: 2, name: 'Test 2' } }
      ];

      for (const item of testData) {
        await cacheManager.set(item.key, item.data);
      }

      // Export cache data
      const exportedData = cacheManager.exportCacheData();
      
      expect(exportedData.entries.length).toBeGreaterThanOrEqual(testData.length);
      expect(exportedData.stats).toBeTruthy();
      expect(exportedData.timestamp).toBeInstanceOf(Date);

      // Clear cache and import
      cacheManager.cacheService.clear();
      await cacheManager.importCacheData(exportedData);

      // Verify imported data
      for (const item of testData) {
        const imported = await cacheManager.get(item.key);
        expect(imported).toEqual(item.data);
      }
    });

    it('should handle corrupted import data gracefully', async () => {
      const corruptedData = {
        entries: [
          {
            key: 'corrupted:1',
            data: { test: 'data' },
            metadata: {
              expiresAt: new Date(Date.now() - 1000), // Already expired
              tags: ['test']
            }
          },
          {
            key: 'valid:1',
            data: { test: 'valid' },
            metadata: {
              expiresAt: new Date(Date.now() + 10000), // Valid
              tags: ['test']
            }
          }
        ]
      };

      // Should not throw
      await expect(cacheManager.importCacheData(corruptedData)).resolves.toBeUndefined();

      // Only valid entry should be imported
      expect(await cacheManager.get('corrupted:1')).toBeNull();
      expect(await cacheManager.get('valid:1')).toEqual({ test: 'valid' });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle cache service failures gracefully', async () => {
      // Mock cache service to fail
      const originalGet = cacheManager.cacheService.get;
      cacheManager.cacheService.get = vi.fn().mockRejectedValue(new Error('Cache failure'));

      // Should handle failure and use fallback
      const result = await cacheManager.get('test:key', {
        fallback: async () => ({ fallback: true })
      });

      expect(result).toEqual({ fallback: true });

      // Restore original method
      cacheManager.cacheService.get = originalGet;
    });

    it('should handle warmup service failures', async () => {
      // Mock warmup to fail
      const originalWarmup = cacheManager.warmupUser;
      cacheManager.warmupUser = vi.fn().mockRejectedValue(new Error('Warmup failure'));

      // Should not throw
      await expect(cacheManager.warmupUser('0x123')).rejects.toThrow('Warmup failure');

      // Cache should still be functional
      await cacheManager.set('test:key', { data: 'test' });
      const result = await cacheManager.get('test:key');
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle monitoring service failures', async () => {
      // Stop monitoring to simulate failure
      cacheManager.monitoringService.stopMonitoring();

      // Cache operations should still work
      await cacheManager.set('test:key', { data: 'test' });
      const result = await cacheManager.get('test:key');
      expect(result).toEqual({ data: 'test' });

      // Status should still be available (may have stale data)
      const status = cacheManager.getStatus();
      expect(status).toBeTruthy();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-volume cache operations', async () => {
      const startTime = Date.now();
      const operations = 100;

      // Perform many cache operations
      const promises = [];
      for (let i = 0; i < operations; i++) {
        promises.push(cacheManager.set(`perf:${i}`, { id: i, data: `test${i}` }));
      }
      await Promise.all(promises);

      // Retrieve all data
      const retrievePromises = [];
      for (let i = 0; i < operations; i++) {
        retrievePromises.push(cacheManager.get(`perf:${i}`));
      }
      const results = await Promise.all(retrievePromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(results.length).toBe(operations);
      expect(results.every(result => result !== null)).toBe(true);
    });

    it('should maintain performance under memory pressure', async () => {
      // Fill cache beyond capacity to trigger evictions
      const largeData = 'x'.repeat(10000); // 10KB per entry
      
      for (let i = 0; i < 200; i++) {
        await cacheManager.set(`large:${i}`, { data: largeData });
      }

      // Cache should still be responsive
      const testData = { test: 'performance' };
      await cacheManager.set('perf:test', testData);
      const result = await cacheManager.get('perf:test');
      
      expect(result).toEqual(testData);

      // Check that eviction occurred
      const status = cacheManager.getStatus();
      expect(status.cache.entries).toBeLessThan(200);
    });
  });
});