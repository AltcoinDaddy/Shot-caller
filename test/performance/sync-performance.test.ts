/**
 * Sync Performance Tests
 * 
 * Tests sync system performance under various load conditions
 * and validates performance requirements are met.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConcreteWalletProfileSyncManager } from '@/lib/services/wallet-profile-sync-manager';
import { SyncEventBus } from '@/lib/services/sync-event-bus';
import { SyncEventType } from '@/lib/types/sync';

// Performance test utilities
class PerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private memoryStart: number = 0;
  private memoryEnd: number = 0;

  start() {
    this.startTime = performance.now();
    this.memoryStart = (performance as any).memory?.usedJSHeapSize || 0;
  }

  end() {
    this.endTime = performance.now();
    this.memoryEnd = (performance as any).memory?.usedJSHeapSize || 0;
  }

  getDuration() {
    return this.endTime - this.startTime;
  }

  getMemoryDelta() {
    return this.memoryEnd - this.memoryStart;
  }
}

// Mock large NFT collection for performance testing
const generateLargeNFTCollection = (size: number) => {
  return Array.from({ length: size }, (_, i) => ({
    id: `nft_${i}`,
    sport: i % 2 === 0 ? 'NBA' : 'NFL',
    playerName: `Player ${i}`,
    team: `Team ${i % 10}`,
    imageUrl: `/placeholder_${i}.jpg`
  }));
};

// Mock services with configurable delays
const createMockServices = (delay: number = 0) => ({
  nftOwnershipService: {
    getOwnership: vi.fn().mockImplementation(async (address: string) => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return {
        success: true,
        data: {
          address,
          moments: generateLargeNFTCollection(100), // Large collection
          collections: [
            { collectionName: 'NBA Top Shot', sport: 'NBA' },
            { collectionName: 'NFL All Day', sport: 'NFL' }
          ],
          totalCount: 100,
          lastVerified: new Date(),
          isEligible: true
        }
      };
    }),
    getEligibleMoments: vi.fn().mockImplementation(async () => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return {
        success: true,
        data: generateLargeNFTCollection(50)
      };
    })
  },
  networkResilienceManager: {
    executeWithRetry: vi.fn().mockImplementation(async (operation) => operation()),
    isOnline: vi.fn(() => true),
    getConnectionQuality: vi.fn(() => 'good')
  }
});

describe('Sync Performance Tests', () => {
  let syncManager: ConcreteWalletProfileSyncManager;
  let eventBus: SyncEventBus;
  let performanceMonitor: PerformanceMonitor;
  const testAddress = '0x1234567890123456';

  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor = new PerformanceMonitor();
    eventBus = new SyncEventBus();
  });

  afterEach(() => {
    syncManager?.clearAllCaches();
    eventBus?.destroy();
  });

  describe('Sync Operation Performance', () => {
    it('should complete wallet sync within acceptable time limits', async () => {
      const mockServices = createMockServices(100); // 100ms API delay
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        mockServices
      );

      performanceMonitor.start();
      const result = await syncManager.syncWalletToProfile(testAddress, true);
      performanceMonitor.end();

      expect(result.success).toBe(true);
      expect(performanceMonitor.getDuration()).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result.duration).toBeLessThan(1500); // Internal duration tracking
    });

    it('should handle large NFT collections efficiently', async () => {
      const mockServices = createMockServices(50);
      // Override to return very large collection
      mockServices.nftOwnershipService.getOwnership.mockResolvedValue({
        success: true,
        data: {
          address: testAddress,
          moments: generateLargeNFTCollection(1000), // Very large collection
          totalCount: 1000,
          isEligible: true
        }
      });

      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        mockServices
      );

      performanceMonitor.start();
      const result = await syncManager.syncNFTCollection(testAddress);
      performanceMonitor.end();

      expect(result.success).toBe(true);
      expect(result.collectionCount).toBe(1000);
      expect(performanceMonitor.getDuration()).toBeLessThan(3000); // Should handle large collections efficiently
    });

    it('should maintain performance with concurrent operations', async () => {
      const mockServices = createMockServices(200);
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        mockServices
      );

      performanceMonitor.start();
      
      // Run multiple concurrent sync operations
      const promises = [
        syncManager.syncWalletToProfile(testAddress, true),
        syncManager.syncNFTCollection(testAddress),
        syncManager.syncProfileStats(testAddress)
      ];

      const results = await Promise.all(promises);
      performanceMonitor.end();

      expect(results.every(r => r.success)).toBe(true);
      expect(performanceMonitor.getDuration()).toBeLessThan(5000); // Concurrent operations should be efficient
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not leak memory during repeated sync operations', async () => {
      const mockServices = createMockServices(10);
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        mockServices
      );

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many sync operations
      for (let i = 0; i < 50; i++) {
        await syncManager.syncWalletToProfile(testAddress, true);
        
        // Clear caches periodically to simulate real usage
        if (i % 10 === 0) {
          syncManager.clearCacheForAddress(testAddress);
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should efficiently manage cache memory usage', async () => {
      const mockServices = createMockServices(10);
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        mockServices
      );

      // Fill cache with multiple addresses
      const addresses = Array.from({ length: 20 }, (_, i) => `0x${i.toString().padStart(16, '0')}`);
      
      performanceMonitor.start();
      
      for (const address of addresses) {
        await syncManager.syncWalletToProfile(address, true);
      }
      
      performanceMonitor.end();

      const stats = syncManager.getSyncStatistics();
      expect(stats.cachedProfiles).toBeLessThanOrEqual(20);
      expect(performanceMonitor.getMemoryDelta()).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });
  });

  describe('Event System Performance', () => {
    it('should handle high-frequency events efficiently', async () => {
      const eventCounts = new Map<string, number>();
      
      // Subscribe to all event types
      Object.values(SyncEventType).forEach(eventType => {
        eventBus.subscribe(eventType, () => {
          eventCounts.set(eventType, (eventCounts.get(eventType) || 0) + 1);
        });
      });

      performanceMonitor.start();

      // Emit many events rapidly
      for (let i = 0; i < 1000; i++) {
        eventBus.emitEvent(SyncEventType.PROFILE_SYNC_STARTED, { iteration: i }, 'test');
        eventBus.emitEvent(SyncEventType.PROFILE_SYNC_COMPLETED, { iteration: i }, 'test');
        eventBus.emitEvent(SyncEventType.NFT_COLLECTION_UPDATED, { iteration: i }, 'test');
      }

      performanceMonitor.end();

      expect(performanceMonitor.getDuration()).toBeLessThan(1000); // Should handle 3000 events in under 1 second
      expect(eventCounts.get(SyncEventType.PROFILE_SYNC_STARTED)).toBe(1000);
    });

    it('should maintain performance with many subscribers', async () => {
      // Create many subscribers
      const unsubscribeFunctions: (() => void)[] = [];
      
      for (let i = 0; i < 100; i++) {
        const unsubscribe = eventBus.subscribe(SyncEventType.PROFILE_SYNC_COMPLETED, () => {
          // Simulate some work
          Math.random() * 1000;
        });
        unsubscribeFunctions.push(unsubscribe);
      }

      performanceMonitor.start();

      // Emit events to all subscribers
      for (let i = 0; i < 100; i++) {
        eventBus.emitEvent(SyncEventType.PROFILE_SYNC_COMPLETED, { iteration: i }, 'test');
      }

      performanceMonitor.end();

      expect(performanceMonitor.getDuration()).toBeLessThan(500); // Should handle 100 subscribers efficiently

      // Cleanup
      unsubscribeFunctions.forEach(fn => fn());
    });
  });

  describe('Cache Performance', () => {
    it('should provide fast cache lookups', async () => {
      const mockServices = createMockServices(10);
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        mockServices
      );

      // Populate cache
      await syncManager.syncWalletToProfile(testAddress, true);

      performanceMonitor.start();

      // Perform many cache lookups
      for (let i = 0; i < 1000; i++) {
        const cached = syncManager.getCachedProfile(testAddress);
        expect(cached).toBeTruthy();
      }

      performanceMonitor.end();

      expect(performanceMonitor.getDuration()).toBeLessThan(100); // 1000 lookups in under 100ms
    });

    it('should efficiently invalidate cache entries', async () => {
      const mockServices = createMockServices(10);
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        mockServices
      );

      // Populate cache with many entries
      const addresses = Array.from({ length: 100 }, (_, i) => `0x${i.toString().padStart(16, '0')}`);
      
      for (const address of addresses) {
        await syncManager.syncWalletToProfile(address, true);
      }

      performanceMonitor.start();

      // Invalidate all caches
      syncManager.clearAllCaches();

      performanceMonitor.end();

      expect(performanceMonitor.getDuration()).toBeLessThan(50); // Should clear quickly
      
      const stats = syncManager.getSyncStatistics();
      expect(stats.cachedProfiles).toBe(0);
    });
  });

  describe('Network Resilience Performance', () => {
    it('should handle retry operations efficiently', async () => {
      let attempts = 0;
      const mockServices = createMockServices(100);
      
      // Mock network resilience with retries
      mockServices.networkResilienceManager.executeWithRetry.mockImplementation(
        async (operation) => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Network error');
          }
          return await operation();
        }
      );

      syncManager = new ConcreteWalletProfileSyncManager(
        { 
          autoSyncEnabled: true,
          retryPolicy: {
            maxAttempts: 3,
            baseDelay: 100,
            maxDelay: 1000,
            backoffMultiplier: 2,
            retryCondition: () => true
          }
        },
        mockServices
      );

      performanceMonitor.start();
      const result = await syncManager.syncWalletToProfile(testAddress, true);
      performanceMonitor.end();

      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
      expect(performanceMonitor.getDuration()).toBeLessThan(5000); // Should complete retries efficiently
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid successive sync requests', async () => {
      const mockServices = createMockServices(50);
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        mockServices
      );

      performanceMonitor.start();

      // Rapid successive requests
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 20; i++) {
        promises.push(syncManager.syncWalletToProfile(testAddress, true));
      }

      const results = await Promise.all(promises);
      performanceMonitor.end();

      expect(results.every(r => r.success)).toBe(true);
      expect(performanceMonitor.getDuration()).toBeLessThan(10000); // Should handle burst requests
    });

    it('should maintain performance under sustained load', async () => {
      const mockServices = createMockServices(20);
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        mockServices
      );

      const durations: number[] = [];

      // Sustained load test
      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        await syncManager.syncWalletToProfile(testAddress, true);
        const end = performance.now();
        durations.push(end - start);
      }

      // Performance should remain consistent
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      expect(avgDuration).toBeLessThan(1000); // Average under 1 second
      expect(maxDuration - minDuration).toBeLessThan(2000); // Consistent performance
    });
  });

  describe('Real-world Scenario Performance', () => {
    it('should handle typical user session efficiently', async () => {
      const mockServices = createMockServices(100);
      syncManager = new ConcreteWalletProfileSyncManager(
        { autoSyncEnabled: true },
        mockServices
      );

      performanceMonitor.start();

      // Simulate typical user session
      // 1. Initial wallet connection and sync
      await syncManager.onWalletConnect(testAddress, []);
      
      // 2. Several manual refreshes
      for (let i = 0; i < 5; i++) {
        await syncManager.manualSync(false);
      }
      
      // 3. NFT collection changes
      for (let i = 0; i < 3; i++) {
        await syncManager.onNFTCollectionChange(testAddress);
      }
      
      // 4. App focus events
      for (let i = 0; i < 10; i++) {
        await syncManager.onAppFocus();
      }

      performanceMonitor.end();

      expect(performanceMonitor.getDuration()).toBeLessThan(15000); // Typical session under 15 seconds
      
      const stats = syncManager.getSyncStatistics();
      expect(stats.totalSyncOperations).toBeGreaterThan(0);
    });
  });
});