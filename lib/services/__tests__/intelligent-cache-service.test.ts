/**
 * Unit Tests for Intelligent Cache Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IntelligentCacheService } from '../intelligent-cache-service';
import { SyncEvent } from '../sync-event-bus';

describe('IntelligentCacheService', () => {
  let cacheService: IntelligentCacheService;

  beforeEach(() => {
    cacheService = new IntelligentCacheService({
      maxSize: 1024 * 1024, // 1MB for testing
      defaultTTL: 1000, // 1 second for testing
      enableCompression: false, // Disable for simpler testing
      maxEntries: 10
    });
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve data', async () => {
      const testData = { id: 1, name: 'test' };
      await cacheService.set('test-key', testData);
      
      const retrieved = await cacheService.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle TTL expiration', async () => {
      const testData = { id: 1, name: 'test' };
      await cacheService.set('test-key', testData, { ttl: 100 });
      
      // Should exist immediately
      let retrieved = await cacheService.get('test-key');
      expect(retrieved).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      retrieved = await cacheService.get('test-key');
      expect(retrieved).toBeNull();
    });

    it('should update access statistics', async () => {
      const testData = { id: 1, name: 'test' };
      await cacheService.set('test-key', testData);
      
      // Access multiple times
      await cacheService.get('test-key');
      await cacheService.get('test-key');
      await cacheService.get('test-key');
      
      const entry = cacheService.cache.get('test-key');
      expect(entry?.accessCount).toBe(3);
    });
  });

  describe('Cache Invalidation', () => {
    beforeEach(async () => {
      // Set up test data
      await cacheService.set('profile:user1', { name: 'User 1' }, { tags: ['profile'] });
      await cacheService.set('nft:user1', { count: 5 }, { tags: ['nft'] });
      await cacheService.set('game:leaderboard', { top: [] }, { tags: ['game'] });
    });

    it('should invalidate by tags', () => {
      cacheService.invalidateByTags(['profile']);
      
      expect(cacheService.cache.has('profile:user1')).toBe(false);
      expect(cacheService.cache.has('nft:user1')).toBe(true);
      expect(cacheService.cache.has('game:leaderboard')).toBe(true);
    });

    it('should invalidate by sync events', () => {
      const walletConnectedEvent: SyncEvent = {
        type: 'wallet_connected',
        timestamp: new Date(),
        data: { address: '0x123' },
        source: 'test'
      };

      cacheService.invalidateByEvent(walletConnectedEvent);
      
      // All entries should be invalidated for wallet connection
      expect(cacheService.cache.size).toBe(0);
    });

    it('should invalidate NFT-related entries on collection update', async () => {
      await cacheService.set('profile:user1', { name: 'User 1' }, { tags: ['profile'] });
      await cacheService.set('nft:user1', { count: 5 }, { tags: ['nft'] });
      
      const nftUpdateEvent: SyncEvent = {
        type: 'nft_collection_updated',
        timestamp: new Date(),
        data: { address: '0x123' },
        source: 'test'
      };

      cacheService.invalidateByEvent(nftUpdateEvent);
      
      // NFT and profile entries should be invalidated
      expect(cacheService.cache.has('nft:user1')).toBe(false);
      expect(cacheService.cache.has('profile:user1')).toBe(false);
    });
  });

  describe('Cache Eviction', () => {
    it('should evict entries when max entries exceeded', async () => {
      // Fill cache to max capacity
      for (let i = 0; i < 12; i++) {
        await cacheService.set(`key-${i}`, { data: i });
      }
      
      // Should not exceed max entries
      expect(cacheService.cache.size).toBeLessThanOrEqual(10);
    });

    it('should evict least recently used entries (LRU)', async () => {
      // Fill cache
      for (let i = 0; i < 10; i++) {
        await cacheService.set(`key-${i}`, { data: i });
      }
      
      // Access some entries to update their LRU status
      await cacheService.get('key-0');
      await cacheService.get('key-1');
      
      // Add new entry to trigger eviction
      await cacheService.set('new-key', { data: 'new' });
      
      // Recently accessed entries should still exist
      expect(await cacheService.get('key-0')).not.toBeNull();
      expect(await cacheService.get('key-1')).not.toBeNull();
      expect(await cacheService.get('new-key')).not.toBeNull();
    });
  });

  describe('Cache Warming', () => {
    it('should warm up cache with provided data', async () => {
      const warmupData = [
        {
          key: 'warm-1',
          fetcher: async () => ({ id: 1, name: 'Warm 1' }),
          tags: ['warmup']
        },
        {
          key: 'warm-2',
          fetcher: async () => ({ id: 2, name: 'Warm 2' }),
          tags: ['warmup']
        }
      ];

      await cacheService.warmupCache(warmupData);
      
      expect(await cacheService.get('warm-1')).toEqual({ id: 1, name: 'Warm 1' });
      expect(await cacheService.get('warm-2')).toEqual({ id: 2, name: 'Warm 2' });
    });

    it('should not overwrite existing entries during warmup', async () => {
      const existingData = { id: 1, name: 'Existing' };
      await cacheService.set('existing-key', existingData);
      
      const warmupData = [
        {
          key: 'existing-key',
          fetcher: async () => ({ id: 1, name: 'Warmup' }),
          tags: ['warmup']
        }
      ];

      await cacheService.warmupCache(warmupData);
      
      // Should keep existing data
      expect(await cacheService.get('existing-key')).toEqual(existingData);
    });

    it('should handle warmup failures gracefully', async () => {
      const warmupData = [
        {
          key: 'success-key',
          fetcher: async () => ({ success: true }),
          tags: ['warmup']
        },
        {
          key: 'failure-key',
          fetcher: async () => {
            throw new Error('Fetch failed');
          },
          tags: ['warmup']
        }
      ];

      // Should not throw
      await expect(cacheService.warmupCache(warmupData)).resolves.toBeUndefined();
      
      // Successful entry should be cached
      expect(await cacheService.get('success-key')).toEqual({ success: true });
      
      // Failed entry should not be cached
      expect(await cacheService.get('failure-key')).toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    it('should track hit and miss rates', async () => {
      await cacheService.set('test-key', { data: 'test' });
      
      // Generate hits and misses
      await cacheService.get('test-key'); // hit
      await cacheService.get('test-key'); // hit
      await cacheService.get('non-existent'); // miss
      
      const stats = cacheService.getStats();
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.missRate).toBeGreaterThan(0);
    });

    it('should track cache size', async () => {
      const initialStats = cacheService.getStats();
      expect(initialStats.totalEntries).toBe(0);
      
      await cacheService.set('key1', { data: 'test1' });
      await cacheService.set('key2', { data: 'test2' });
      
      const updatedStats = cacheService.getStats();
      expect(updatedStats.totalEntries).toBe(2);
      expect(updatedStats.totalSize).toBeGreaterThan(0);
    });
  });

  describe('Cache Configuration', () => {
    it('should respect custom TTL', async () => {
      const customTTL = 200;
      await cacheService.set('test-key', { data: 'test' }, { ttl: customTTL });
      
      // Should exist before TTL
      expect(await cacheService.get('test-key')).not.toBeNull();
      
      // Wait for custom TTL to expire
      await new Promise(resolve => setTimeout(resolve, customTTL + 50));
      
      // Should be expired
      expect(await cacheService.get('test-key')).toBeNull();
    });

    it('should handle version-based invalidation', async () => {
      await cacheService.set('test-key', { data: 'v1' }, { version: '1.0' });
      
      const versionMismatchEvent: SyncEvent = {
        type: 'profile_sync_completed',
        timestamp: new Date(),
        data: { version: '2.0' },
        source: 'test'
      };

      cacheService.invalidateByEvent(versionMismatchEvent);
      
      // Entry with different version should be invalidated
      expect(await cacheService.get('test-key')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle compression errors gracefully', async () => {
      // Create a service with compression enabled but mock compression to fail
      const compressedService = new IntelligentCacheService({
        enableCompression: true,
        compressionThreshold: 1 // Very low threshold to trigger compression
      });

      // Mock compression to fail
      const originalCompress = (compressedService as any).compress;
      (compressedService as any).compress = vi.fn().mockRejectedValue(new Error('Compression failed'));

      // Should still store data without compression
      await expect(compressedService.set('test-key', { large: 'data'.repeat(1000) }))
        .resolves.toBeUndefined();
      
      const retrieved = await compressedService.get('test-key');
      expect(retrieved).toEqual({ large: 'data'.repeat(1000) });
    });

    it('should handle decompression errors gracefully', async () => {
      const testData = { test: 'data' };
      await cacheService.set('test-key', testData);
      
      // Manually corrupt the entry to simulate decompression failure
      const entry = cacheService.cache.get('test-key');
      if (entry) {
        entry.compressed = true;
        entry.data = 'corrupted-data';
      }
      
      // Should handle decompression failure
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });
  });
});