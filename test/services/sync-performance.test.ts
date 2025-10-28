/**
 * Performance Tests for Sync Operations
 * Tests sync operations under various conditions and loads
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConcreteWalletProfileSyncManager } from '@/lib/services/wallet-profile-sync-manager';
import { SyncEventBus } from '@/lib/services/sync-event-bus';
import { NetworkResilienceManager } from '@/lib/services/network-resilience-manager';
import { SyncEventType } from '@/lib/types/sync';

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  SYNC_OPERATION_MAX_TIME: 5000, // 5 seconds
  LARGE_COLLECTION_SYNC_MAX_TIME: 10000, // 10 seconds
  CONCURRENT_OPERATIONS_MAX_TIME: 15000, // 15 seconds
  MEMORY_LEAK_THRESHOLD: 50, // MB
  EVENT_EMISSION_MAX_TIME: 100, // 100ms
};

// Mock services with performance characteristics
const createMockNFTService = (delay: number = 100, collectionSize: number = 10) => ({
  getOwnership: vi.fn().mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve({
      success: true,
      data: {
        address: '0x1234567890123456',
        moments: Array.from({ length: collectionSize }, (_, i) => ({
          id: `nft_${i}`,
          sport: i % 2 === 0 ? 'NBA' : 'NFL',
          playerName: `Player ${i}`,
          team: `Team ${i}`,
          rarity: 'Common'
        })),
        totalCount: collectionSize,
        lastVerified: new Date(),
        isEligible: true
      }
    }), delay))
  ),
  getEligibleMoments: vi.fn().mockImplementation(() =>
    new Promise(resolve => setTimeout(() => resolve({
      success: true,
      data: Array.from({ length: collectionSize }, (_, i) => ({
        id: `nft_${i}`,
        sport: i % 2 === 0 ? 'NBA' : 'NFL',
        eligible: true
      }))
    }), delay / 2))
  ),
});

describe('Sync Performance Tests', () => {
  let syncManager: ConcreteWalletProfileSyncManager;
  let eventBus: SyncEventBus;
  let networkManager: NetworkResilienceManager;
  
  const testAddress = '0x1234567890123456';

  beforeEach(() => {
    vi.clearAllMocks();
    
    eventBus = new SyncEventBus();
    networkManager = new NetworkResilienceManager();
  });

  afterEach(() => {
    syncManager?.stopPeriodicSync();
    eventBus?.destroy();
    networkManager?.destroy();
  });

  describe('Basic Sync Operation Performance', () => {
    it('should complete wallet sync within performance threshold', async () => {
      const mockNFTService = createMockNFTService(50, 5); // Fast, small collection
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      const startTime = Date.now();
      const result = await syncManager.syncWalletToProfile(testAddress);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME);
      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME);
    });

    it('should complete NFT collection sync within threshold', async () => {
      const mockNFTService = createMockNFTService(100, 10);
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      const startTime = Date.now();
      const result = await syncManager.syncNFTCollection(testAddress);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME);
    });

    it('should complete profile stats sync within threshold', async () => {
      const mockNFTService = createMockNFTService(50, 5);
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      const startTime = Date.now();
      const result = await syncManager.syncProfileStats(testAddress);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME);
    });
  });

  describe('Large Collection Performance', () => {
    it('should handle large NFT collections efficiently', async () => {
      const mockNFTService = createMockNFTService(200, 1000); // Large collection
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      const startTime = Date.now();
      const result = await syncManager.syncNFTCollection(testAddress);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.collectionCount).toBe(1000);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_COLLECTION_SYNC_MAX_TIME);
    });

    it('should maintain performance with incremental sync', async () => {
      const mockNFTService = createMockNFTService(100, 500);
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      // Initial sync
      await syncManager.syncNFTCollection(testAddress);

      // Mock incremental change (add 10 new NFTs)
      mockNFTService.getOwnership.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: {
            address: testAddress,
            moments: Array.from({ length: 510 }, (_, i) => ({
              id: `nft_${i}`,
              sport: i % 2 === 0 ? 'NBA' : 'NFL'
            })),
            totalCount: 510,
            lastVerified: new Date(),
            isEligible: true
          }
        }), 50)) // Faster for incremental
      );

      const startTime = Date.now();
      const result = await syncManager.syncNFTCollection(testAddress);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.newNFTs).toBe(10);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle multiple concurrent sync operations', async () => {
      const mockNFTService = createMockNFTService(200, 50);
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      const addresses = [
        '0x1111111111111111',
        '0x2222222222222222',
        '0x3333333333333333',
        '0x4444444444444444',
        '0x5555555555555555'
      ];

      const startTime = Date.now();
      
      // Start multiple concurrent syncs
      const syncPromises = addresses.map(address => 
        syncManager.syncNFTCollection(address)
      );

      const results = await Promise.all(syncPromises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_OPERATIONS_MAX_TIME);
    });

    it('should maintain performance under high event load', async () => {
      const mockNFTService = createMockNFTService(50, 10);
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      // Subscribe many event handlers
      const handlers = Array.from({ length: 100 }, () => vi.fn());
      const unsubscribers = handlers.map(handler => 
        syncManager.subscribe(SyncEventType.NFT_COLLECTION_UPDATED, handler)
      );

      try {
        const startTime = Date.now();
        await syncManager.syncNFTCollection(testAddress);
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME);
        
        // Verify all handlers were called
        handlers.forEach(handler => {
          expect(handler).toHaveBeenCalled();
        });
      } finally {
        // Cleanup
        unsubscribers.forEach(unsubscribe => unsubscribe());
      }
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during repeated sync operations', async () => {
      const mockNFTService = createMockNFTService(10, 100);
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      // Get initial memory usage (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many sync operations
      for (let i = 0; i < 50; i++) {
        await syncManager.syncNFTCollection(`0x${i.toString().padStart(16, '0')}`);
        
        // Clear caches periodically to simulate real usage
        if (i % 10 === 0) {
          syncManager.clearAllCaches();
        }
      }

      // Check memory usage after operations
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Memory increase should be reasonable (skip if performance.memory not available)
      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
      }
    });

    it('should efficiently manage cache memory', async () => {
      const mockNFTService = createMockNFTService(10, 200); // Large collections
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      // Fill cache with multiple large collections
      const addresses = Array.from({ length: 20 }, (_, i) => 
        `0x${i.toString().padStart(16, '0')}`
      );

      for (const address of addresses) {
        await syncManager.syncNFTCollection(address);
      }

      // Verify cache statistics
      const stats = syncManager.getSyncStatistics();
      expect(stats.cachedProfiles).toBeLessThanOrEqual(20);
      expect(stats.cachedCollections).toBeLessThanOrEqual(20);

      // Cache should be manageable size
      expect(stats.totalCacheSize).toBeLessThan(10 * 1024 * 1024); // 10MB
    });
  });

  describe('Event System Performance', () => {
    it('should emit events efficiently', async () => {
      const mockNFTService = createMockNFTService(50, 10);
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      const eventTimes: number[] = [];
      
      syncManager.subscribe(SyncEventType.NFT_COLLECTION_UPDATED, () => {
        eventTimes.push(Date.now());
      });

      const syncStartTime = Date.now();
      await syncManager.syncNFTCollection(testAddress);

      expect(eventTimes).toHaveLength(1);
      
      // Event should be emitted quickly after sync completion
      const eventDelay = eventTimes[0] - syncStartTime;
      expect(eventDelay).toBeLessThan(PERFORMANCE_THRESHOLDS.EVENT_EMISSION_MAX_TIME);
    });

    it('should handle rapid event emission', async () => {
      const mockNFTService = createMockNFTService(10, 5);
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      let eventCount = 0;
      const startTime = Date.now();
      
      syncManager.subscribe(SyncEventType.NFT_COLLECTION_UPDATED, () => {
        eventCount++;
      });

      // Trigger rapid sync operations
      const rapidSyncs = Array.from({ length: 10 }, () => 
        syncManager.syncNFTCollection(testAddress)
      );

      await Promise.all(rapidSyncs);
      const duration = Date.now() - startTime;

      expect(eventCount).toBe(10);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_OPERATIONS_MAX_TIME);
    });
  });

  describe('Network Condition Performance', () => {
    it('should maintain performance under poor network conditions', async () => {
      const mockNFTService = createMockNFTService(1000, 10); // Slow network simulation
      
      syncManager = new ConcreteWalletProfileSyncManager(
        {
          autoSyncEnabled: true,
          retryPolicy: {
            maxAttempts: 2, // Reduce retries for performance test
            baseDelay: 100,
            maxDelay: 500,
            backoffMultiplier: 2,
            retryCondition: () => true
          }
        },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      const startTime = Date.now();
      const result = await syncManager.syncNFTCollection(testAddress);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      // Should still complete within reasonable time even with slow network
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME * 2);
    });

    it('should optimize sync frequency based on network quality', async () => {
      const mockNFTService = createMockNFTService(100, 20);
      
      // Mock poor network quality
      vi.spyOn(networkManager, 'getConnectionQuality').mockReturnValue('poor' as any);
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      const startTime = Date.now();
      const result = await syncManager.syncNFTCollection(testAddress);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      // Should adapt to poor network conditions
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME);
    });
  });

  describe('Cache Performance', () => {
    it('should provide fast cache lookups', async () => {
      const mockNFTService = createMockNFTService(100, 50);
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      // Populate cache
      await syncManager.syncWalletToProfile(testAddress);

      // Test cache lookup performance
      const lookupTimes: number[] = [];
      
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        const cachedProfile = syncManager.getCachedProfile(testAddress);
        const endTime = performance.now();
        
        lookupTimes.push(endTime - startTime);
        expect(cachedProfile).toBeTruthy();
      }

      // Cache lookups should be very fast (< 1ms average)
      const averageLookupTime = lookupTimes.reduce((a, b) => a + b, 0) / lookupTimes.length;
      expect(averageLookupTime).toBeLessThan(1);
    });

    it('should efficiently determine sync necessity', async () => {
      const mockNFTService = createMockNFTService(50, 20);
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        {
          nftOwnershipService: mockNFTService,
          networkResilienceManager: networkManager,
        }
      );

      // Initial sync
      await syncManager.syncWalletToProfile(testAddress);

      // Test sync necessity check performance
      const checkTimes: number[] = [];
      
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        const needsSync = syncManager.isSyncNeeded(testAddress);
        const endTime = performance.now();
        
        checkTimes.push(endTime - startTime);
        expect(typeof needsSync).toBe('boolean');
      }

      // Sync necessity checks should be very fast
      const averageCheckTime = checkTimes.reduce((a, b) => a + b, 0) / checkTimes.length;
      expect(averageCheckTime).toBeLessThan(0.5);
    });
  });
});