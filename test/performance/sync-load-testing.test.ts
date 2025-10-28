/**
 * Sync Performance and Load Testing Suite
 * 
 * Tests sync performance under realistic user load conditions including:
 * - Concurrent sync operations
 * - Large NFT collections
 * - Memory usage validation
 * - Response time benchmarks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConcreteWalletProfileSyncManager } from '@/lib/services/wallet-profile-sync-manager';
import { SyncEventBus } from '@/lib/services/sync-event-bus';
import { 
  SyncEventType, 
  SyncResult, 
  NFTSyncResult,
  SyncConfiguration 
} from '@/lib/types/sync';

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  SYNC_OPERATION_MAX_TIME: 5000, // 5 seconds
  CONCURRENT_OPERATIONS_MAX_TIME: 10000, // 10 seconds
  LARGE_COLLECTION_MAX_TIME: 15000, // 15 seconds
  MEMORY_LEAK_THRESHOLD: 50 * 1024 * 1024, // 50MB
  MAX_EVENT_HISTORY_SIZE: 1000
};

// Mock large NFT collection for performance testing
const generateLargeNFTCollection = (size: number) => {
  return Array.from({ length: size }, (_, i) => ({
    id: `nft_${i}`,
    sport: i % 2 === 0 ? 'NBA' : 'NFL',
    playerName: `Player ${i}`,
    team: `Team ${i % 30}`, // 30 different teams
    momentId: `moment_${i}`,
    imageUrl: `/nft-image-${i}.jpg`,
    eligible: i % 3 !== 0 // ~66% eligible
  }));
};

// Mock services with performance simulation
const createPerformanceMockServices = (options: {
  responseDelay?: number;
  collectionSize?: number;
  failureRate?: number;
} = {}) => {
  const { responseDelay = 100, collectionSize = 100, failureRate = 0 } = options;
  const nftCollection = generateLargeNFTCollection(collectionSize);
  
  return {
    nftOwnershipService: {
      getOwnership: vi.fn().mockImplementation(async (address: string) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, responseDelay));
        
        // Simulate occasional failures
        if (Math.random() < failureRate) {
          throw new Error('Simulated network failure');
        }
        
        return {
          success: true,
          data: {
            address,
            moments: nftCollection,
            collections: [
              { collectionName: 'NBA Top Shot', sport: 'NBA' },
              { collectionName: 'NFL All Day', sport: 'NFL' }
            ],
            totalCount: nftCollection.length,
            lastVerified: new Date(),
            isEligible: nftCollection.length > 0
          }
        };
      }),
      
      getEligibleMoments: vi.fn().mockImplementation(async (address: string) => {
        await new Promise(resolve => setTimeout(resolve, responseDelay / 2));
        return {
          success: true,
          data: nftCollection.filter(nft => nft.eligible)
        };
      })
    },
    
    networkResilienceManager: {
      executeWithRetry: vi.fn().mockImplementation(async (operation) => {
        return await operation();
      }),
      isOnline: vi.fn(() => true),
      getConnectionQuality: vi.fn(() => 'good')
    }
  };
};

// Memory usage tracking utility
class MemoryTracker {
  private initialMemory: number = 0;
  private measurements: number[] = [];
  
  start() {
    if (typeof performance !== 'undefined' && performance.memory) {
      this.initialMemory = performance.memory.usedJSHeapSize;
    }
    this.measurements = [];
  }
  
  measure() {
    if (typeof performance !== 'undefined' && performance.memory) {
      this.measurements.push(performance.memory.usedJSHeapSize);
    }
  }
  
  getMemoryIncrease(): number {
    if (this.measurements.length === 0) return 0;
    const currentMemory = this.measurements[this.measurements.length - 1];
    return currentMemory - this.initialMemory;
  }
  
  getAverageMemoryUsage(): number {
    if (this.measurements.length === 0) return 0;
    return this.measurements.reduce((sum, mem) => sum + mem, 0) / this.measurements.length;
  }
}

describe('Sync Performance and Load Testing', () => {
  let syncManager: ConcreteWalletProfileSyncManager;
  let eventBus: SyncEventBus;
  let memoryTracker: MemoryTracker;
  const testAddress = '0x1234567890123456';

  beforeEach(() => {
    vi.clearAllMocks();
    memoryTracker = new MemoryTracker();
    eventBus = new SyncEventBus({ maxHistorySize: PERFORMANCE_THRESHOLDS.MAX_EVENT_HISTORY_SIZE });
  });

  afterEach(() => {
    syncManager?.clearAllCaches();
    eventBus?.destroy();
  });

  describe('Single Operation Performance', () => {
    it('should complete basic sync operations within performance thresholds', async () => {
      const mockServices = createPerformanceMockServices({
        responseDelay: 100,
        collectionSize: 50
      });
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: false },
        mockServices
      );

      const startTime = Date.now();
      
      const result = await syncManager.syncWalletToProfile(testAddress, true);
      
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME);
      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME);
    });

    it('should handle NFT collection sync efficiently', async () => {
      const mockServices = createPerformanceMockServices({
        responseDelay: 150,
        collectionSize: 100
      });
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: false },
        mockServices
      );

      const startTime = Date.now();
      
      const result = await syncManager.syncNFTCollection(testAddress);
      
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME);
      expect(result.collectionCount).toBe(100);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle multiple concurrent sync operations efficiently', async () => {
      const mockServices = createPerformanceMockServices({
        responseDelay: 200,
        collectionSize: 75
      });
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: false },
        mockServices
      );

      memoryTracker.start();
      const startTime = Date.now();
      
      // Execute multiple concurrent operations
      const operations = [
        syncManager.syncWalletToProfile(testAddress, true),
        syncManager.syncNFTCollection(testAddress),
        syncManager.syncProfileStats(testAddress),
        syncManager.syncWalletToProfile(`${testAddress}2`, true),
        syncManager.syncNFTCollection(`${testAddress}2`)
      ];
      
      const results = await Promise.all(operations);
      
      const duration = Date.now() - startTime;
      memoryTracker.measure();
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Should complete within threshold
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_OPERATIONS_MAX_TIME);
      
      // Memory usage should be reasonable
      const memoryIncrease = memoryTracker.getMemoryIncrease();
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
    });

    it('should maintain performance with high concurrency', async () => {
      const mockServices = createPerformanceMockServices({
        responseDelay: 100,
        collectionSize: 50
      });
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: false },
        mockServices
      );

      const concurrentOperations = 20;
      const startTime = Date.now();
      
      // Create many concurrent operations
      const operations = Array.from({ length: concurrentOperations }, (_, i) => 
        syncManager.syncWalletToProfile(`${testAddress}_${i}`, true)
      );
      
      const results = await Promise.all(operations);
      
      const duration = Date.now() - startTime;
      
      // All operations should succeed
      expect(results.every(result => result.success)).toBe(true);
      
      // Should complete within reasonable time (allowing for concurrency overhead)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_OPERATIONS_MAX_TIME * 2);
    });
  });

  describe('Large Collection Performance', () => {
    it('should handle large NFT collections efficiently', async () => {
      const largeCollectionSize = 1000;
      const mockServices = createPerformanceMockServices({
        responseDelay: 300,
        collectionSize: largeCollectionSize
      });
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: false },
        mockServices
      );

      memoryTracker.start();
      const startTime = Date.now();
      
      const result = await syncManager.syncNFTCollection(testAddress);
      
      const duration = Date.now() - startTime;
      memoryTracker.measure();
      
      expect(result.success).toBe(true);
      expect(result.collectionCount).toBe(largeCollectionSize);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_COLLECTION_MAX_TIME);
      
      // Memory usage should be reasonable even with large collections
      const memoryIncrease = memoryTracker.getMemoryIncrease();
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
    });

    it('should maintain performance with very large collections', async () => {
      const veryLargeCollectionSize = 5000;
      const mockServices = createPerformanceMockServices({
        responseDelay: 500,
        collectionSize: veryLargeCollectionSize
      });
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: false },
        mockServices
      );

      const startTime = Date.now();
      
      const result = await syncManager.syncWalletToProfile(testAddress, true);
      
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      // Allow more time for very large collections
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_COLLECTION_MAX_TIME * 3);
    });
  });

  describe('Memory Usage and Leak Detection', () => {
    it('should not have memory leaks during repeated operations', async () => {
      const mockServices = createPerformanceMockServices({
        responseDelay: 50,
        collectionSize: 100
      });
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: false },
        mockServices
      );

      memoryTracker.start();
      
      // Perform many repeated operations
      for (let i = 0; i < 50; i++) {
        await syncManager.syncWalletToProfile(`${testAddress}_${i}`, true);
        
        if (i % 10 === 0) {
          memoryTracker.measure();
        }
      }
      
      const memoryIncrease = memoryTracker.getMemoryIncrease();
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
    });

    it('should clean up resources properly', async () => {
      const mockServices = createPerformanceMockServices({
        responseDelay: 100,
        collectionSize: 200
      });
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: false },
        mockServices
      );

      memoryTracker.start();
      
      // Perform operations and then cleanup
      await syncManager.syncWalletToProfile(testAddress, true);
      memoryTracker.measure();
      
      const memoryBeforeCleanup = memoryTracker.getMemoryIncrease();
      
      // Clear caches and cleanup
      syncManager.clearAllCaches();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      memoryTracker.measure();
      const memoryAfterCleanup = memoryTracker.getMemoryIncrease();
      
      // Memory usage should decrease after cleanup
      expect(memoryAfterCleanup).toBeLessThanOrEqual(memoryBeforeCleanup);
    });
  });

  describe('Event System Performance', () => {
    it('should handle high-frequency events efficiently', async () => {
      const eventCount = 1000;
      const events: any[] = [];
      
      eventBus.subscribe(SyncEventType.PROFILE_SYNC_COMPLETED, (event) => {
        events.push(event);
      });

      const startTime = Date.now();
      
      // Emit many events rapidly
      for (let i = 0; i < eventCount; i++) {
        eventBus.emitEvent(
          SyncEventType.PROFILE_SYNC_COMPLETED,
          { syncId: i, timestamp: new Date() },
          'performance-test'
        );
      }
      
      const duration = Date.now() - startTime;
      
      expect(events.length).toBe(eventCount);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should maintain event history size limits', async () => {
      const maxHistorySize = 100;
      const testEventBus = new SyncEventBus({ maxHistorySize });
      
      // Emit more events than the history limit
      for (let i = 0; i < maxHistorySize * 2; i++) {
        testEventBus.emitEvent(
          SyncEventType.PROFILE_SYNC_COMPLETED,
          { syncId: i },
          'history-test'
        );
      }
      
      const history = testEventBus.getEventHistory();
      expect(history.length).toBeLessThanOrEqual(maxHistorySize);
      
      testEventBus.destroy();
    });
  });

  describe('Network Resilience Performance', () => {
    it('should handle network failures efficiently', async () => {
      const mockServices = createPerformanceMockServices({
        responseDelay: 200,
        collectionSize: 100,
        failureRate: 0.3 // 30% failure rate
      });
      
      // Override network manager to implement retry logic
      mockServices.networkResilienceManager.executeWithRetry = vi.fn()
        .mockImplementation(async (operation, retries = 3) => {
          let lastError;
          for (let i = 0; i < retries; i++) {
            try {
              return await operation();
            } catch (error) {
              lastError = error;
              if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
              }
            }
          }
          throw lastError;
        });
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: false },
        mockServices
      );

      const startTime = Date.now();
      
      // This should eventually succeed despite failures
      const result = await syncManager.syncWalletToProfile(testAddress, true);
      
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      // Should complete within reasonable time even with retries
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME * 2);
    });
  });

  describe('Cache Performance', () => {
    it('should improve performance with caching', async () => {
      const mockServices = createPerformanceMockServices({
        responseDelay: 500, // Slow response to highlight cache benefits
        collectionSize: 200
      });
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: false, cacheEnabled: true },
        mockServices
      );

      // First sync (no cache)
      const startTime1 = Date.now();
      const result1 = await syncManager.syncWalletToProfile(testAddress, true);
      const duration1 = Date.now() - startTime1;
      
      expect(result1.success).toBe(true);
      
      // Second sync (should use cache)
      const startTime2 = Date.now();
      const result2 = await syncManager.syncWalletToProfile(testAddress, false);
      const duration2 = Date.now() - startTime2;
      
      expect(result2.success).toBe(true);
      // Second sync should be significantly faster due to caching
      expect(duration2).toBeLessThan(duration1 / 2);
    });
  });

  describe('Stress Testing', () => {
    it('should handle sustained high load', async () => {
      const mockServices = createPerformanceMockServices({
        responseDelay: 100,
        collectionSize: 150
      });
      
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: false },
        mockServices
      );

      memoryTracker.start();
      const startTime = Date.now();
      
      // Simulate sustained load over time
      const iterations = 100;
      const results: SyncResult[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const result = await syncManager.syncWalletToProfile(`${testAddress}_${i}`, true);
        results.push(result);
        
        if (i % 20 === 0) {
          memoryTracker.measure();
        }
      }
      
      const totalDuration = Date.now() - startTime;
      const averageDuration = totalDuration / iterations;
      
      // All operations should succeed
      expect(results.every(result => result.success)).toBe(true);
      
      // Average operation time should be reasonable
      expect(averageDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_OPERATION_MAX_TIME);
      
      // Memory usage should remain stable
      const memoryIncrease = memoryTracker.getMemoryIncrease();
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
    });
  });
});