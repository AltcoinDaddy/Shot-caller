/**
 * Integration test for wallet-profile sync manager with auth context
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConcreteWalletProfileSyncManager } from '@/lib/services/wallet-profile-sync-manager';
import { SyncEventType, SyncStatus, ProfileData } from '@/lib/types/sync';

// Mock dependencies
const mockNFTOwnershipService = {
  getOwnership: vi.fn(),
  getEligibleMoments: vi.fn(),
};

const mockNetworkResilienceManager = {
  executeWithRetry: vi.fn(),
  isOnline: vi.fn(() => true),
};

describe('Wallet Profile Sync Integration', () => {
  let syncManager: ConcreteWalletProfileSyncManager;
  const testAddress = '0x1234567890123456';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock responses
    mockNFTOwnershipService.getOwnership.mockResolvedValue({
      success: true,
      data: {
        address: testAddress,
        moments: [
          { id: '1', sport: 'NBA', playerName: 'LeBron James', team: 'Lakers' },
          { id: '2', sport: 'NFL', playerName: 'Tom Brady', team: 'Buccaneers' }
        ],
        collections: [
          { collectionName: 'NBA Top Shot', sport: 'NBA' },
          { collectionName: 'NFL All Day', sport: 'NFL' }
        ],
        totalCount: 2,
        lastVerified: new Date(),
        isEligible: true
      }
    });

    mockNFTOwnershipService.getEligibleMoments.mockResolvedValue({
      success: true,
      data: [
        { id: '1', sport: 'NBA' },
        { id: '2', sport: 'NFL' }
      ]
    });

    mockNetworkResilienceManager.executeWithRetry.mockImplementation(
      async (operation: () => Promise<any>) => {
        return await operation();
      }
    );

    syncManager = new ConcreteWalletProfileSyncManager(
      {
        autoSyncEnabled: true,
        syncInterval: 60000, // 1 minute for testing
      },
      {
        nftOwnershipService: mockNFTOwnershipService,
        networkResilienceManager: mockNetworkResilienceManager,
      }
    );
  });

  afterEach(() => {
    syncManager.clearAllCaches();
  });

  describe('Wallet Connection Integration', () => {
    it('should trigger immediate sync on wallet connection', async () => {
      const syncSpy = vi.spyOn(syncManager, 'syncWalletToProfile');
      
      await syncManager.onWalletConnect(testAddress, []);
      
      expect(syncSpy).toHaveBeenCalledWith(testAddress, true);
      expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalledWith(testAddress, false);
    });

    it('should clear caches on wallet disconnection', async () => {
      // First connect and sync
      await syncManager.onWalletConnect(testAddress, []);
      
      // Verify data is cached
      const cachedProfile = syncManager.getCachedProfile(testAddress);
      expect(cachedProfile).toBeTruthy();
      
      // Disconnect
      await syncManager.onWalletDisconnect();
      
      // Verify caches are cleared
      const clearedProfile = syncManager.getCachedProfile(testAddress);
      expect(clearedProfile).toBeNull();
    });
  });

  describe('NFT Collection Sync Integration', () => {
    it('should sync NFT collection with blockchain verification', async () => {
      const result = await syncManager.syncNFTCollection(testAddress);
      
      expect(result.success).toBe(true);
      expect(result.collectionCount).toBe(2);
      expect(result.eligibleMoments).toBe(2);
      expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalled();
      expect(mockNFTOwnershipService.getEligibleMoments).toHaveBeenCalled();
    });

    it('should detect NFT collection changes', async () => {
      // Initial sync
      await syncManager.syncNFTCollection(testAddress);
      
      // Mock updated collection with new NFT
      mockNFTOwnershipService.getOwnership.mockResolvedValueOnce({
        success: true,
        data: {
          address: testAddress,
          moments: [
            { id: '1', sport: 'NBA' },
            { id: '2', sport: 'NFL' },
            { id: '3', sport: 'NBA' } // New NFT
          ],
          totalCount: 3,
          lastVerified: new Date(),
          isEligible: true
        }
      });

      mockNFTOwnershipService.getEligibleMoments.mockResolvedValueOnce({
        success: true,
        data: [
          { id: '1', sport: 'NBA' },
          { id: '2', sport: 'NFL' },
          { id: '3', sport: 'NBA' }
        ]
      });
      
      // Trigger collection change
      await syncManager.onNFTCollectionChange(testAddress);
      
      const result = await syncManager.syncNFTCollection(testAddress);
      expect(result.newNFTs).toBe(1);
      expect(result.collectionCount).toBe(3);
    });
  });

  describe('Profile Stats Integration', () => {
    it('should calculate consistent profile stats', async () => {
      await syncManager.syncWalletToProfile(testAddress, true);
      
      const cachedProfile = syncManager.getCachedProfile(testAddress);
      expect(cachedProfile).toBeTruthy();
      expect(cachedProfile!.stats.totalNFTs).toBe(2);
      expect(cachedProfile!.stats.eligibleMoments).toBe(2);
      expect(cachedProfile!.address).toBe(testAddress);
    });

    it('should update profile when NFT collection changes', async () => {
      // Initial sync
      await syncManager.syncWalletToProfile(testAddress, true);
      let profile = syncManager.getCachedProfile(testAddress);
      expect(profile!.stats.totalNFTs).toBe(2);
      
      // Mock collection change
      mockNFTOwnershipService.getOwnership.mockResolvedValueOnce({
        success: true,
        data: {
          address: testAddress,
          moments: [{ id: '1', sport: 'NBA' }], // Reduced collection
          totalCount: 1,
          lastVerified: new Date(),
          isEligible: true
        }
      });

      mockNFTOwnershipService.getEligibleMoments.mockResolvedValueOnce({
        success: true,
        data: [{ id: '1', sport: 'NBA' }]
      });
      
      // Trigger sync
      await syncManager.onNFTCollectionChange(testAddress);
      
      profile = syncManager.getCachedProfile(testAddress);
      expect(profile!.stats.totalNFTs).toBe(1);
    });
  });

  describe('Event System Integration', () => {
    it('should emit events during sync operations', async () => {
      const events: any[] = [];
      
      // Subscribe to all sync events
      syncManager.subscribe(SyncEventType.PROFILE_SYNC_STARTED, (event) => {
        events.push({ type: 'started', data: event.data });
      });
      
      syncManager.subscribe(SyncEventType.PROFILE_SYNC_COMPLETED, (event) => {
        events.push({ type: 'completed', data: event.data });
      });
      
      syncManager.subscribe(SyncEventType.NFT_COLLECTION_UPDATED, (event) => {
        events.push({ type: 'nft_updated', data: event.data });
      });
      
      // Perform sync
      await syncManager.syncWalletToProfile(testAddress, true);
      
      // Verify events were emitted
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'started')).toBe(true);
      expect(events.some(e => e.type === 'completed')).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle NFT service failures gracefully', async () => {
      mockNFTOwnershipService.getOwnership.mockRejectedValueOnce(
        new Error('API temporarily unavailable')
      );
      
      await expect(syncManager.syncNFTCollection(testAddress)).rejects.toThrow();
      
      // Verify sync status reflects the error
      const status = syncManager.getSyncStatus();
      expect(status.failureCount).toBeGreaterThan(0);
    });

    it('should use network resilience for retries', async () => {
      let attempts = 0;
      mockNetworkResilienceManager.executeWithRetry.mockImplementation(
        async (operation: () => Promise<any>) => {
          attempts++;
          if (attempts < 2) {
            throw new Error('Network error');
          }
          return await operation();
        }
      );
      
      const result = await syncManager.syncWalletToProfile(testAddress, true);
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(2); // Should have retried once
    });
  });

  describe('Cache Management Integration', () => {
    it('should manage cache lifecycle correctly', async () => {
      // Initial sync should populate cache
      await syncManager.syncWalletToProfile(testAddress, true);
      
      const stats = syncManager.getSyncStatistics();
      expect(stats.cachedProfiles).toBe(1);
      expect(stats.cachedCollections).toBe(1);
      
      // Clear cache for address
      syncManager.clearCacheForAddress(testAddress);
      
      const clearedStats = syncManager.getSyncStatistics();
      expect(clearedStats.cachedProfiles).toBe(0);
      expect(clearedStats.cachedCollections).toBe(0);
    });

    it('should determine when sync is needed', async () => {
      // No previous sync - should need sync
      expect(syncManager.isSyncNeeded(testAddress)).toBe(true);
      
      // After sync - should not need immediate sync
      await syncManager.syncWalletToProfile(testAddress, true);
      expect(syncManager.isSyncNeeded(testAddress)).toBe(false);
    });
  });
});