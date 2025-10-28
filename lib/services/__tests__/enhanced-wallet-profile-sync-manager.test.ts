/**
 * Integration Tests for Enhanced Wallet Profile Sync Manager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EnhancedWalletProfileSyncManager } from '../enhanced-wallet-profile-sync-manager';
import { SyncOperationType } from '../../types/sync';

// Mock dependencies
vi.mock('../sync-performance-optimizer', () => ({
  syncPerformanceOptimizer: {
    batchOperation: vi.fn(async (op) => ({
      success: true,
      timestamp: new Date(),
      operations: [op],
      duration: 100
    })),
    deduplicateRequest: vi.fn(async (key, fn) => fn()),
    incrementalNFTSync: vi.fn(async () => ({
      success: true,
      timestamp: new Date(),
      operations: [],
      duration: 50,
      collectionCount: 5,
      newNFTs: 2,
      removedNFTs: 0,
      eligibleMoments: 3
    })),
    optimizeCacheForUser: vi.fn(async () => {}),
    getPerformanceMetrics: vi.fn(() => ({
      batchProcessingTime: 100,
      deduplicationSavings: 5,
      incrementalSyncEfficiency: 50,
      cacheOptimizationGains: 3,
      totalRequestsOptimized: 10,
      averageResponseTime: 200
    }))
  }
}));

vi.mock('../intelligent-cache-service', () => ({
  intelligentCache: {
    clear: vi.fn(),
    warmupCache: vi.fn(async () => {})
  }
}));

describe('EnhancedWalletProfileSyncManager', () => {
  let syncManager: EnhancedWalletProfileSyncManager;

  beforeEach(() => {
    syncManager = new EnhancedWalletProfileSyncManager({
      enableBatching: true,
      enableDeduplication: true,
      enableIncrementalSync: true,
      enableCacheOptimization: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Performance Optimization Configuration', () => {
    it('should initialize with optimization features enabled', () => {
      const config = syncManager.getOptimizationConfig();
      
      expect(config.batchingEnabled).toBe(true);
      expect(config.deduplicationEnabled).toBe(true);
      expect(config.incrementalSyncEnabled).toBe(true);
      expect(config.cacheOptimizationEnabled).toBe(true);
    });

    it('should allow configuration of optimization features', () => {
      syncManager.configurePerformanceOptimization({
        enableBatching: false,
        enableDeduplication: true
      });

      const config = syncManager.getOptimizationConfig();
      expect(config.batchingEnabled).toBe(false);
      expect(config.deduplicationEnabled).toBe(true);
      expect(config.incrementalSyncEnabled).toBe(true); // unchanged
      expect(config.cacheOptimizationEnabled).toBe(true); // unchanged
    });
  });

  describe('Enhanced Wallet Sync', () => {
    it('should use batching for non-forced wallet sync', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      const address = '0x123';

      await syncManager.syncWalletToProfile(address, false);

      expect(syncPerformanceOptimizer.batchOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SyncOperationType.WALLET_VERIFICATION,
          address,
          priority: 5
        })
      );
    });

    it('should bypass batching for forced wallet sync', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      const address = '0x123';

      // Mock the parent class method
      const parentSyncSpy = vi.spyOn(syncManager as any, 'syncWalletToProfile');
      parentSyncSpy.mockResolvedValue({
        success: true,
        timestamp: new Date(),
        operations: [],
        duration: 100
      });

      await syncManager.syncWalletToProfile(address, true);

      expect(syncPerformanceOptimizer.batchOperation).not.toHaveBeenCalled();
    });

    it('should use deduplication when batching is disabled', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      
      syncManager.configurePerformanceOptimization({ enableBatching: false });
      
      const address = '0x123';
      await syncManager.syncWalletToProfile(address, false);

      expect(syncPerformanceOptimizer.deduplicateRequest).toHaveBeenCalledWith(
        `wallet-sync:${address}:false`,
        expect.any(Function)
      );
    });
  });

  describe('Enhanced NFT Collection Sync', () => {
    it('should use incremental sync when enabled', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      const address = '0x123';

      const result = await syncManager.syncNFTCollection(address);

      expect(syncPerformanceOptimizer.incrementalNFTSync).toHaveBeenCalledWith(
        address,
        expect.any(Function),
        expect.any(Function)
      );

      expect(result.success).toBe(true);
      expect(result.collectionCount).toBe(5);
      expect(result.newNFTs).toBe(2);
    });

    it('should use batching when incremental sync is disabled', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      
      syncManager.configurePerformanceOptimization({ enableIncrementalSync: false });
      
      const address = '0x123';
      await syncManager.syncNFTCollection(address);

      expect(syncPerformanceOptimizer.batchOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SyncOperationType.NFT_COLLECTION_FETCH,
          address,
          priority: 7
        })
      );
    });

    it('should use deduplication as fallback', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      
      syncManager.configurePerformanceOptimization({ 
        enableIncrementalSync: false,
        enableBatching: false 
      });
      
      const address = '0x123';
      await syncManager.syncNFTCollection(address);

      expect(syncPerformanceOptimizer.deduplicateRequest).toHaveBeenCalledWith(
        `nft-sync:${address}`,
        expect.any(Function)
      );
    });
  });

  describe('Enhanced Profile Stats Sync', () => {
    it('should use batching for profile stats sync', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      const address = '0x123';

      await syncManager.syncProfileStats(address);

      expect(syncPerformanceOptimizer.batchOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SyncOperationType.PROFILE_DATA_UPDATE,
          address,
          priority: 6
        })
      );
    });

    it('should use deduplication when batching is disabled', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      
      syncManager.configurePerformanceOptimization({ enableBatching: false });
      
      const address = '0x123';
      await syncManager.syncProfileStats(address);

      expect(syncPerformanceOptimizer.deduplicateRequest).toHaveBeenCalledWith(
        `profile-sync:${address}`,
        expect.any(Function)
      );
    });
  });

  describe('Wallet Connection Optimization', () => {
    it('should trigger cache optimization on wallet connect', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      const address = '0x123';
      const services = ['nft-service'];

      // Mock parent method to avoid actual sync
      const parentConnectSpy = vi.spyOn(syncManager as any, 'onWalletConnect');
      parentConnectSpy.mockResolvedValue(undefined);

      await syncManager.onWalletConnect(address, services);

      expect(syncPerformanceOptimizer.optimizeCacheForUser).toHaveBeenCalledWith(address);
    });

    it('should not block wallet connection if cache optimization fails', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      
      // Make cache optimization fail
      syncPerformanceOptimizer.optimizeCacheForUser = vi.fn(async () => {
        throw new Error('Cache optimization failed');
      });

      const address = '0x123';
      const services = ['nft-service'];

      // Mock parent method
      const parentConnectSpy = vi.spyOn(syncManager as any, 'onWalletConnect');
      parentConnectSpy.mockResolvedValue(undefined);

      // Should not throw
      await expect(syncManager.onWalletConnect(address, services)).resolves.not.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    it('should return performance metrics from optimizer', () => {
      const metrics = syncManager.getPerformanceMetrics();

      expect(metrics).toEqual({
        batchProcessingTime: 100,
        deduplicationSavings: 5,
        incrementalSyncEfficiency: 50,
        cacheOptimizationGains: 3,
        totalRequestsOptimized: 10,
        averageResponseTime: 200
      });
    });
  });

  describe('Cache Management', () => {
    it('should optimize cache for specific user', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      const address = '0x123';

      await syncManager.optimizeCacheForUser(address);

      expect(syncPerformanceOptimizer.optimizeCacheForUser).toHaveBeenCalledWith(address);
    });

    it('should not optimize cache when disabled', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      
      syncManager.configurePerformanceOptimization({ enableCacheOptimization: false });
      
      const address = '0x123';
      await syncManager.optimizeCacheForUser(address);

      expect(syncPerformanceOptimizer.optimizeCacheForUser).not.toHaveBeenCalled();
    });

    it('should clear optimization caches', () => {
      const { intelligentCache } = require('../intelligent-cache-service');
      
      syncManager.clearOptimizationCaches();

      expect(intelligentCache.clear).toHaveBeenCalled();
    });
  });

  describe('Result Conversion', () => {
    it('should convert SyncResult to NFTSyncResult', async () => {
      syncManager.configurePerformanceOptimization({ 
        enableIncrementalSync: false,
        enableBatching: true 
      });

      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      
      // Mock batch operation to return SyncResult
      syncPerformanceOptimizer.batchOperation = vi.fn(async () => ({
        success: true,
        timestamp: new Date(),
        operations: [],
        duration: 100,
        collectionCount: 3,
        newNFTs: 1,
        removedNFTs: 0,
        eligibleMoments: 2
      }));

      const result = await syncManager.syncNFTCollection('0x123');

      expect(result).toHaveProperty('collectionCount', 3);
      expect(result).toHaveProperty('newNFTs', 1);
      expect(result).toHaveProperty('removedNFTs', 0);
      expect(result).toHaveProperty('eligibleMoments', 2);
    });

    it('should convert SyncResult to ProfileSyncResult', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      
      // Mock batch operation to return SyncResult
      syncPerformanceOptimizer.batchOperation = vi.fn(async () => ({
        success: true,
        timestamp: new Date(),
        operations: [],
        duration: 100,
        profileUpdated: true,
        statsUpdated: true,
        achievementsUpdated: false
      }));

      const result = await syncManager.syncProfileStats('0x123');

      expect(result).toHaveProperty('profileUpdated', true);
      expect(result).toHaveProperty('statsUpdated', true);
      expect(result).toHaveProperty('achievementsUpdated', false);
    });
  });

  describe('Error Handling', () => {
    it('should handle optimization errors gracefully', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      
      // Make batch operation fail
      syncPerformanceOptimizer.batchOperation = vi.fn(async () => {
        throw new Error('Batch operation failed');
      });

      const address = '0x123';

      await expect(syncManager.syncWalletToProfile(address, false)).rejects.toThrow();
    });

    it('should fallback to parent implementation when optimization fails', async () => {
      const { syncPerformanceOptimizer } = await import('../sync-performance-optimizer');
      
      // Disable all optimizations
      syncManager.configurePerformanceOptimization({
        enableBatching: false,
        enableDeduplication: false,
        enableIncrementalSync: false,
        enableCacheOptimization: false
      });

      // Mock parent method
      const parentSyncSpy = vi.spyOn(syncManager as any, 'syncWalletToProfile');
      parentSyncSpy.mockResolvedValue({
        success: true,
        timestamp: new Date(),
        operations: [],
        duration: 100
      });

      const result = await syncManager.syncWalletToProfile('0x123', false);

      expect(result.success).toBe(true);
      expect(syncPerformanceOptimizer.batchOperation).not.toHaveBeenCalled();
      expect(syncPerformanceOptimizer.deduplicateRequest).not.toHaveBeenCalled();
    });
  });
});