/**
 * Integration Tests for Complete Wallet-to-Profile Sync Flows
 * Tests end-to-end synchronization scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConcreteWalletProfileSyncManager } from '@/lib/services/wallet-profile-sync-manager';
import { SyncEventBus } from '@/lib/services/sync-event-bus';
import { NetworkResilienceManager } from '@/lib/services/network-resilience-manager';
import { 
  SyncEventType, 
  SyncStatus, 
  ProfileData,
  WalletType,
  ConnectionQuality 
} from '@/lib/types/sync';

// Mock external services
const mockNFTOwnershipService = {
  getOwnership: vi.fn(),
  getEligibleMoments: vi.fn(),
  verifyOwnership: vi.fn(),
};

const mockFindLabsAPI = {
  getNFTCollection: vi.fn(),
  verifyNFTOwnership: vi.fn(),
  getPlayerStats: vi.fn(),
};

const mockFlowBlockchain = {
  verifyAddress: vi.fn(),
  queryNFTs: vi.fn(),
  getAccountInfo: vi.fn(),
};

describe('Sync Integration Flows', () => {
  let syncManager: ConcreteWalletProfileSyncManager;
  let eventBus: SyncEventBus;
  let networkManager: NetworkResilienceManager;
  
  const testWallets = {
    dapper: '0x1234567890123456',
    flow: '0xabcdef1234567890',
    invalid: 'invalid-address'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Initialize event bus and network manager
    eventBus = new SyncEventBus({ debugMode: true });
    networkManager = new NetworkResilienceManager();
    
    // Initialize sync manager with real dependencies
    syncManager = new ConcreteWalletProfileSyncManager(
      {
        autoSyncEnabled: true,
        syncInterval: 60000,
        retryPolicy: {
          maxAttempts: 3,
          baseDelay: 100,
          maxDelay: 5000,
          backoffMultiplier: 2,
          retryCondition: (error: Error) => !error.message.includes('validation')
        }
      },
      {
        nftOwnershipService: mockNFTOwnershipService,
        networkResilienceManager: networkManager,
      }
    );

    // Setup realistic mock responses
    setupMockResponses();
  });

  afterEach(() => {
    syncManager.stopPeriodicSync();
    eventBus.destroy();
    networkManager.destroy();
  });

  function setupMockResponses() {
    // Default successful NFT ownership response
    mockNFTOwnershipService.getOwnership.mockResolvedValue({
      success: true,
      data: {
        address: testWallets.dapper,
        moments: [
          {
            id: 'nba_1',
            sport: 'NBA',
            playerName: 'LeBron James',
            team: 'Lakers',
            series: 'Series 4',
            playType: 'Dunk',
            rarity: 'Legendary'
          },
          {
            id: 'nfl_1',
            sport: 'NFL',
            playerName: 'Tom Brady',
            team: 'Buccaneers',
            series: 'Genesis',
            playType: 'Touchdown Pass',
            rarity: 'Rare'
          }
        ],
        collections: [
          { collectionName: 'NBA Top Shot', sport: 'NBA', count: 1 },
          { collectionName: 'NFL All Day', sport: 'NFL', count: 1 }
        ],
        totalCount: 2,
        lastVerified: new Date(),
        isEligible: true
      }
    });

    mockNFTOwnershipService.getEligibleMoments.mockResolvedValue({
      success: true,
      data: [
        { id: 'nba_1', sport: 'NBA', eligible: true },
        { id: 'nfl_1', sport: 'NFL', eligible: true }
      ]
    });

    mockNFTOwnershipService.verifyOwnership.mockResolvedValue({
      success: true,
      verified: true,
      timestamp: new Date()
    });
  }

  describe('Complete Wallet Connection Flow', () => {
    it('should perform full sync on wallet connection', async () => {
      const events: any[] = [];
      
      // Subscribe to all relevant events
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, (e) => events.push({ type: 'connected', data: e.data }));
      eventBus.subscribe(SyncEventType.PROFILE_SYNC_STARTED, (e) => events.push({ type: 'sync_started', data: e.data }));
      eventBus.subscribe(SyncEventType.NFT_COLLECTION_UPDATED, (e) => events.push({ type: 'nft_updated', data: e.data }));
      eventBus.subscribe(SyncEventType.PROFILE_SYNC_COMPLETED, (e) => events.push({ type: 'sync_completed', data: e.data }));
      
      // Simulate wallet connection
      await syncManager.onWalletConnect(testWallets.dapper, ['dapper-service']);
      
      // Verify event sequence
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'connected')).toBe(true);
      expect(events.some(e => e.type === 'sync_started')).toBe(true);
      expect(events.some(e => e.type === 'sync_completed')).toBe(true);
      
      // Verify sync status
      const status = syncManager.getSyncStatus();
      expect(status.lastSync).toBeInstanceOf(Date);
    });

    it('should handle wallet switching correctly', async () => {
      // Connect first wallet
      await syncManager.onWalletConnect(testWallets.dapper, ['dapper-service']);
      
      const firstProfile = syncManager.getCachedProfile(testWallets.dapper);
      expect(firstProfile).toBeTruthy();
      
      // Switch to second wallet
      await syncManager.onWalletDisconnect();
      await syncManager.onWalletConnect(testWallets.flow, ['flow-service']);
      
      // First wallet cache should be cleared
      const clearedProfile = syncManager.getCachedProfile(testWallets.dapper);
      expect(clearedProfile).toBeNull();
      
      // Second wallet should have fresh data
      const secondProfile = syncManager.getCachedProfile(testWallets.flow);
      expect(secondProfile).toBeTruthy();
      expect(secondProfile!.address).toBe(testWallets.flow);
    });

    it('should maintain sync state across wallet reconnection', async () => {
      // Initial connection and sync
      await syncManager.onWalletConnect(testWallets.dapper, ['dapper-service']);
      
      const initialStatus = syncManager.getSyncStatus();
      expect(initialStatus.lastSync).toBeInstanceOf(Date);
      
      // Disconnect and reconnect same wallet
      await syncManager.onWalletDisconnect();
      await syncManager.onWalletConnect(testWallets.dapper, ['dapper-service']);
      
      // Should have fresh sync data
      const reconnectStatus = syncManager.getSyncStatus();
      expect(reconnectStatus.lastSync).toBeInstanceOf(Date);
      expect(reconnectStatus.lastSync!.getTime()).toBeGreaterThanOrEqual(initialStatus.lastSync!.getTime());
    });
  });

  describe('NFT Collection Change Detection', () => {
    it('should detect and sync new NFT acquisitions', async () => {
      // Initial sync with 2 NFTs
      await syncManager.onWalletConnect(testWallets.dapper, []);
      
      let cachedProfile = syncManager.getCachedProfile(testWallets.dapper);
      expect(cachedProfile!.stats.totalNFTs).toBe(2);
      
      // Mock new NFT acquisition
      mockNFTOwnershipService.getOwnership.mockResolvedValueOnce({
        success: true,
        data: {
          address: testWallets.dapper,
          moments: [
            { id: 'nba_1', sport: 'NBA' },
            { id: 'nfl_1', sport: 'NFL' },
            { id: 'nba_2', sport: 'NBA' } // New NFT
          ],
          totalCount: 3,
          lastVerified: new Date(),
          isEligible: true
        }
      });

      mockNFTOwnershipService.getEligibleMoments.mockResolvedValueOnce({
        success: true,
        data: [
          { id: 'nba_1', sport: 'NBA' },
          { id: 'nfl_1', sport: 'NFL' },
          { id: 'nba_2', sport: 'NBA' }
        ]
      });
      
      // Trigger collection change
      await syncManager.onNFTCollectionChange(testWallets.dapper);
      
      // Verify updated collection
      cachedProfile = syncManager.getCachedProfile(testWallets.dapper);
      expect(cachedProfile!.stats.totalNFTs).toBe(3);
    });

    it('should detect and sync NFT sales/transfers', async () => {
      // Initial sync with 2 NFTs
      await syncManager.onWalletConnect(testWallets.dapper, []);
      
      // Mock NFT sale (reduced collection)
      mockNFTOwnershipService.getOwnership.mockResolvedValueOnce({
        success: true,
        data: {
          address: testWallets.dapper,
          moments: [
            { id: 'nba_1', sport: 'NBA' } // Only 1 NFT remaining
          ],
          totalCount: 1,
          lastVerified: new Date(),
          isEligible: true
        }
      });

      mockNFTOwnershipService.getEligibleMoments.mockResolvedValueOnce({
        success: true,
        data: [{ id: 'nba_1', sport: 'NBA' }]
      });
      
      // Trigger collection change
      await syncManager.onNFTCollectionChange(testWallets.dapper);
      
      // Verify reduced collection
      const cachedProfile = syncManager.getCachedProfile(testWallets.dapper);
      expect(cachedProfile!.stats.totalNFTs).toBe(1);
    });

    it('should handle eligibility changes', async () => {
      // Initial sync
      await syncManager.onWalletConnect(testWallets.dapper, []);
      
      // Mock eligibility change (NFT becomes ineligible)
      mockNFTOwnershipService.getEligibleMoments.mockResolvedValueOnce({
        success: true,
        data: [
          { id: 'nba_1', sport: 'NBA', eligible: true },
          { id: 'nfl_1', sport: 'NFL', eligible: false } // Now ineligible
        ]
      });
      
      // Trigger collection change
      await syncManager.onNFTCollectionChange(testWallets.dapper);
      
      // Verify eligibility update
      const cachedProfile = syncManager.getCachedProfile(testWallets.dapper);
      expect(cachedProfile!.stats.eligibleMoments).toBe(1);
    });
  });

  describe('Multi-Wallet Type Support', () => {
    it('should handle Dapper wallet sync', async () => {
      // Mock Dapper-specific responses
      mockNFTOwnershipService.getOwnership.mockResolvedValue({
        success: true,
        data: {
          address: testWallets.dapper,
          walletType: 'dapper',
          moments: [{ id: 'dapper_nft_1', sport: 'NBA' }],
          totalCount: 1,
          isEligible: true
        }
      });
      
      await syncManager.onWalletConnect(testWallets.dapper, ['dapper-service']);
      
      const profile = syncManager.getCachedProfile(testWallets.dapper);
      expect(profile).toBeTruthy();
      expect(profile!.walletType).toBe(WalletType.DAPPER);
    });

    it('should handle Flow wallet sync', async () => {
      // Mock Flow-specific responses
      mockNFTOwnershipService.getOwnership.mockResolvedValue({
        success: true,
        data: {
          address: testWallets.flow,
          walletType: 'flow',
          moments: [{ id: 'flow_nft_1', sport: 'NFL' }],
          totalCount: 1,
          isEligible: true
        }
      });
      
      await syncManager.onWalletConnect(testWallets.flow, ['flow-service']);
      
      const profile = syncManager.getCachedProfile(testWallets.flow);
      expect(profile).toBeTruthy();
      expect(profile!.walletType).toBe(WalletType.FLOW);
    });

    it('should provide consistent sync behavior across wallet types', async () => {
      const results: any[] = [];
      
      // Test Dapper wallet
      await syncManager.onWalletConnect(testWallets.dapper, ['dapper-service']);
      const dapperResult = await syncManager.syncWalletToProfile(testWallets.dapper);
      results.push({ wallet: 'dapper', result: dapperResult });
      
      await syncManager.onWalletDisconnect();
      
      // Test Flow wallet
      await syncManager.onWalletConnect(testWallets.flow, ['flow-service']);
      const flowResult = await syncManager.syncWalletToProfile(testWallets.flow);
      results.push({ wallet: 'flow', result: flowResult });
      
      // Both should have consistent result structure
      results.forEach(({ result }) => {
        expect(result.success).toBe(true);
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(result.operations).toBeDefined();
        expect(result.duration).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Real-time Profile Updates', () => {
    it('should update profile components when sync completes', async () => {
      const profileUpdates: ProfileData[] = [];
      
      // Mock profile update subscription
      const unsubscribe = syncManager.subscribe(SyncEventType.PROFILE_SYNC_COMPLETED, (event) => {
        const profile = syncManager.getCachedProfile(testWallets.dapper);
        if (profile) {
          profileUpdates.push(profile);
        }
      });
      
      try {
        await syncManager.onWalletConnect(testWallets.dapper, []);
        
        // Trigger additional sync
        await syncManager.syncWalletToProfile(testWallets.dapper, true);
        
        expect(profileUpdates.length).toBeGreaterThan(0);
        expect(profileUpdates[0].address).toBe(testWallets.dapper);
        expect(profileUpdates[0].lastUpdated).toBeInstanceOf(Date);
      } finally {
        unsubscribe();
      }
    });

    it('should provide smooth transitions for profile data updates', async () => {
      // Initial sync
      await syncManager.onWalletConnect(testWallets.dapper, []);
      
      const initialProfile = syncManager.getCachedProfile(testWallets.dapper);
      expect(initialProfile).toBeTruthy();
      
      // Mock updated data
      mockNFTOwnershipService.getOwnership.mockResolvedValueOnce({
        success: true,
        data: {
          address: testWallets.dapper,
          moments: [
            { id: 'nba_1', sport: 'NBA' },
            { id: 'nfl_1', sport: 'NFL' },
            { id: 'nba_2', sport: 'NBA' } // Additional NFT
          ],
          totalCount: 3,
          lastVerified: new Date(),
          isEligible: true
        }
      });
      
      // Perform update sync
      await syncManager.syncWalletToProfile(testWallets.dapper, true);
      
      const updatedProfile = syncManager.getCachedProfile(testWallets.dapper);
      expect(updatedProfile!.stats.totalNFTs).toBe(3);
      expect(updatedProfile!.lastUpdated.getTime()).toBeGreaterThan(initialProfile!.lastUpdated.getTime());
    });
  });

  describe('Periodic and Background Sync', () => {
    it('should perform periodic sync when enabled', async () => {
      vi.spyOn(syncManager as any, 'getConnectedAddress').mockReturnValue(testWallets.dapper);
      
      const syncSpy = vi.spyOn(syncManager, 'syncWalletToProfile');
      
      // Start periodic sync with short interval for testing
      syncManager.setSyncInterval(100); // 100ms for testing
      syncManager.startPeriodicSync();
      
      // Wait for at least one periodic sync
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(syncSpy).toHaveBeenCalled();
      
      syncManager.stopPeriodicSync();
    });

    it('should sync on app focus after being inactive', async () => {
      vi.spyOn(syncManager as any, 'getConnectedAddress').mockReturnValue(testWallets.dapper);
      
      // Simulate app blur (going to background)
      syncManager.onAppBlur();
      
      // Simulate time passing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const syncSpy = vi.spyOn(syncManager, 'syncWalletToProfile');
      
      // Simulate app focus (coming back to foreground)
      await syncManager.onAppFocus();
      
      expect(syncSpy).toHaveBeenCalled();
    });

    it('should handle background sync with reduced frequency', async () => {
      vi.spyOn(syncManager as any, 'getConnectedAddress').mockReturnValue(testWallets.dapper);
      
      // Simulate user inactivity
      const oldActivity = new Date(Date.now() - 120000); // 2 minutes ago
      vi.spyOn(syncManager as any, 'lastUserActivity', 'get').mockReturnValue(oldActivity);
      
      const nftSyncSpy = vi.spyOn(syncManager, 'syncNFTCollection');
      
      // Trigger periodic sync (should use lighter sync for inactive users)
      await (syncManager as any).performPeriodicSync();
      
      expect(nftSyncSpy).toHaveBeenCalled();
    });
  });

  describe('Network Resilience Integration', () => {
    it('should handle network quality changes', async () => {
      // Mock poor network quality
      vi.spyOn(networkManager, 'getConnectionQuality').mockReturnValue(ConnectionQuality.POOR);
      
      await syncManager.onWalletConnect(testWallets.dapper, []);
      
      // Should still complete sync despite poor connection
      const result = await syncManager.syncWalletToProfile(testWallets.dapper);
      expect(result.success).toBe(true);
    });

    it('should queue operations when offline and process when online', async () => {
      // Mock offline state
      vi.spyOn(networkManager, 'isOnline').mockReturnValue(false);
      
      const queueSpy = vi.spyOn(networkManager, 'queueOfflineOperation');
      
      try {
        await syncManager.syncNFTCollection(testWallets.dapper);
      } catch (error) {
        // Expected to fail when offline
      }
      
      // Should have queued the operation
      expect(queueSpy).toHaveBeenCalled();
      
      // Mock coming back online
      vi.spyOn(networkManager, 'isOnline').mockReturnValue(true);
      
      const processSpy = vi.spyOn(networkManager, 'processOfflineQueue');
      
      // Simulate connection restored event
      await (syncManager as any).handleConnectionRestored();
      
      expect(processSpy).toHaveBeenCalled();
    });
  });
});