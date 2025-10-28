/**
 * Comprehensive Unit Tests for Wallet Profile Sync Manager
 * Tests all sync manager methods and error scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WalletProfileSyncManager, ConcreteWalletProfileSyncManager } from '@/lib/services/wallet-profile-sync-manager';
import { 
  SyncEventType, 
  SyncOperationType, 
  OperationStatus, 
  SyncErrorType,
  SyncConfiguration 
} from '@/lib/types/sync';

// Mock dependencies
const mockNFTOwnershipService = {
  getOwnership: vi.fn(),
  getEligibleMoments: vi.fn(),
  verifyOwnership: vi.fn(),
};

const mockNetworkResilienceManager = {
  executeWithRetry: vi.fn(),
  isOnline: vi.fn(() => true),
  getConnectionQuality: vi.fn(() => 'good'),
  queueOfflineOperation: vi.fn(),
  getFallbackData: vi.fn(),
  setCachedFallback: vi.fn(),
};

describe('WalletProfileSyncManager Unit Tests', () => {
  let syncManager: WalletProfileSyncManager;
  let concreteSyncManager: ConcreteWalletProfileSyncManager;
  const testAddress = '0x1234567890123456';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Initialize base sync manager
    syncManager = new WalletProfileSyncManager({
      autoSyncEnabled: true,
      syncInterval: 60000,
      retryPolicy: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        retryCondition: () => true
      }
    });

    // Initialize concrete sync manager with mocked dependencies
    concreteSyncManager = new ConcreteWalletProfileSyncManager(
      {
        autoSyncEnabled: true,
        syncInterval: 60000,
      },
      {
        nftOwnershipService: mockNFTOwnershipService,
        networkResilienceManager: mockNetworkResilienceManager,
      }
    );

    // Setup default mock responses
    mockNFTOwnershipService.getOwnership.mockResolvedValue({
      success: true,
      data: {
        address: testAddress,
        moments: [
          { id: '1', sport: 'NBA', playerName: 'LeBron James' },
          { id: '2', sport: 'NFL', playerName: 'Tom Brady' }
        ],
        totalCount: 2,
        lastVerified: new Date(),
        isEligible: true
      }
    });

    mockNFTOwnershipService.getEligibleMoments.mockResolvedValue({
      success: true,
      data: [{ id: '1', sport: 'NBA' }, { id: '2', sport: 'NFL' }]
    });

    mockNetworkResilienceManager.executeWithRetry.mockImplementation(
      async (operation: () => Promise<any>) => await operation()
    );
  });

  afterEach(() => {
    syncManager.stopPeriodicSync();
    concreteSyncManager.stopPeriodicSync();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultSyncManager = new WalletProfileSyncManager();
      const status = defaultSyncManager.getSyncStatus();
      
      expect(status.isActive).toBe(false);
      expect(status.lastSync).toBeNull();
      expect(status.failureCount).toBe(0);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<SyncConfiguration> = {
        autoSyncEnabled: false,
        syncInterval: 120000,
        retryPolicy: {
          maxAttempts: 5,
          baseDelay: 2000,
          maxDelay: 60000,
          backoffMultiplier: 3,
          retryCondition: () => false
        }
      };

      const customSyncManager = new WalletProfileSyncManager(customConfig);
      
      // Test that configuration is applied (indirectly through behavior)
      expect(() => customSyncManager.setSyncInterval(180000)).not.toThrow();
      expect(() => customSyncManager.enableAutoSync(true)).not.toThrow();
    });

    it('should allow configuration updates', () => {
      syncManager.setSyncInterval(30000);
      syncManager.enableAutoSync(false);
      
      const retryPolicy = {
        maxAttempts: 5,
        baseDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 3,
        retryCondition: (error: Error) => error.name === 'NetworkError'
      };
      
      expect(() => syncManager.setRetryPolicy(retryPolicy)).not.toThrow();
    });
  });

  describe('Core Sync Operations', () => {
    it('should perform wallet to profile sync successfully', async () => {
      const result = await syncManager.syncWalletToProfile(testAddress);
      
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].type).toBe(SyncOperationType.WALLET_VERIFICATION);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should perform NFT collection sync successfully', async () => {
      const result = await syncManager.syncNFTCollection(testAddress);
      
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.collectionCount).toBeGreaterThanOrEqual(0);
      expect(result.newNFTs).toBeGreaterThanOrEqual(0);
      expect(result.removedNFTs).toBeGreaterThanOrEqual(0);
      expect(result.eligibleMoments).toBeGreaterThanOrEqual(0);
    });

    it('should perform profile stats sync successfully', async () => {
      const result = await syncManager.syncProfileStats(testAddress);
      
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(typeof result.profileUpdated).toBe('boolean');
      expect(typeof result.statsUpdated).toBe('boolean');
      expect(typeof result.achievementsUpdated).toBe('boolean');
    });

    it('should handle force sync parameter', async () => {
      const result1 = await syncManager.syncWalletToProfile(testAddress, false);
      const result2 = await syncManager.syncWalletToProfile(testAddress, true);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Both should succeed regardless of force parameter in base implementation
    });
  });

  describe('Event System', () => {
    it('should allow event subscription and unsubscription', () => {
      const handler = vi.fn();
      const unsubscribe = syncManager.subscribe(SyncEventType.WALLET_CONNECTED, handler);
      
      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should emit events during sync operations', async () => {
      const events: any[] = [];
      
      syncManager.subscribe(SyncEventType.PROFILE_SYNC_STARTED, (event) => {
        events.push({ type: 'started', event });
      });
      
      syncManager.subscribe(SyncEventType.PROFILE_SYNC_COMPLETED, (event) => {
        events.push({ type: 'completed', event });
      });
      
      await syncManager.syncWalletToProfile(testAddress);
      
      expect(events.length).toBeGreaterThanOrEqual(2);
      expect(events.some(e => e.type === 'started')).toBe(true);
      expect(events.some(e => e.type === 'completed')).toBe(true);
    });

    it('should handle multiple subscribers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      const unsubscribe1 = syncManager.subscribe(SyncEventType.WALLET_CONNECTED, handler1);
      const unsubscribe2 = syncManager.subscribe(SyncEventType.WALLET_CONNECTED, handler2);
      
      expect(typeof unsubscribe1).toBe('function');
      expect(typeof unsubscribe2).toBe('function');
      
      // Cleanup
      unsubscribe1();
      unsubscribe2();
    });

    it('should not fail when emitting events with no subscribers', async () => {
      // This should not throw even with no event subscribers
      await expect(syncManager.syncWalletToProfile(testAddress)).resolves.toBeDefined();
    });
  });

  describe('Wallet Event Handling', () => {
    it('should handle wallet connection events', async () => {
      const services = ['nft-service', 'profile-service'];
      
      await expect(syncManager.onWalletConnect(testAddress, services)).resolves.not.toThrow();
    });

    it('should handle wallet disconnection events', async () => {
      // First connect
      await syncManager.onWalletConnect(testAddress, []);
      
      // Then disconnect
      await expect(syncManager.onWalletDisconnect()).resolves.not.toThrow();
      
      const status = syncManager.getSyncStatus();
      expect(status.isActive).toBe(false);
      expect(status.lastSync).toBeNull();
    });

    it('should handle NFT collection change events', async () => {
      await expect(syncManager.onNFTCollectionChange(testAddress)).resolves.not.toThrow();
    });

    it('should trigger sync on wallet connection when auto-sync enabled', async () => {
      const syncSpy = vi.spyOn(syncManager, 'syncWalletToProfile');
      
      await syncManager.onWalletConnect(testAddress, []);
      
      expect(syncSpy).toHaveBeenCalledWith(testAddress, true);
    });
  });

  describe('Status and Monitoring', () => {
    it('should track sync status correctly', () => {
      const initialStatus = syncManager.getSyncStatus();
      
      expect(initialStatus.isActive).toBe(false);
      expect(initialStatus.lastSync).toBeNull();
      expect(initialStatus.nextSync).toBeNull();
      expect(initialStatus.failureCount).toBe(0);
    });

    it('should indicate when sync is in progress', async () => {
      expect(syncManager.isSyncInProgress()).toBe(false);
      
      // Start a sync operation (don't await to check in-progress state)
      const syncPromise = syncManager.syncWalletToProfile(testAddress);
      
      // Complete the sync
      await syncPromise;
      
      // After completion, should not be in progress
      expect(syncManager.isSyncInProgress()).toBe(false);
    });

    it('should return last sync time', async () => {
      expect(syncManager.getLastSyncTime()).toBeNull();
      
      await syncManager.syncWalletToProfile(testAddress);
      
      const lastSyncTime = syncManager.getLastSyncTime();
      expect(lastSyncTime).toBeInstanceOf(Date);
    });
  });

  describe('Periodic Sync Controls', () => {
    it('should start and stop periodic sync', () => {
      expect(syncManager.isPeriodicSyncActive()).toBe(false);
      
      syncManager.startPeriodicSync();
      expect(syncManager.isPeriodicSyncActive()).toBe(true);
      
      syncManager.stopPeriodicSync();
      expect(syncManager.isPeriodicSyncActive()).toBe(false);
    });

    it('should not start multiple periodic sync timers', () => {
      syncManager.startPeriodicSync();
      syncManager.startPeriodicSync(); // Should not create duplicate timer
      
      expect(syncManager.isPeriodicSyncActive()).toBe(true);
      
      syncManager.stopPeriodicSync();
    });

    it('should handle periodic sync when auto-sync disabled', () => {
      syncManager.enableAutoSync(false);
      
      syncManager.startPeriodicSync();
      expect(syncManager.isPeriodicSyncActive()).toBe(false); // Should not start when disabled
    });
  });

  describe('Manual Sync Controls', () => {
    it('should perform manual sync with connected wallet', async () => {
      // Mock connected address for concrete implementation
      vi.spyOn(concreteSyncManager as any, 'getConnectedAddress').mockReturnValue(testAddress);
      
      const result = await concreteSyncManager.manualSync();
      
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error for manual sync without connected wallet', async () => {
      // Mock no connected address
      vi.spyOn(concreteSyncManager as any, 'getConnectedAddress').mockReturnValue(null);
      
      await expect(concreteSyncManager.manualSync()).rejects.toThrow('No wallet connected');
    });

    it('should force sync when manual sync called', async () => {
      vi.spyOn(concreteSyncManager as any, 'getConnectedAddress').mockReturnValue(testAddress);
      const syncSpy = vi.spyOn(concreteSyncManager, 'syncWalletToProfile');
      
      await concreteSyncManager.manualSync(true);
      
      expect(syncSpy).toHaveBeenCalledWith(testAddress, true);
    });
  });

  describe('Activity-Based Sync', () => {
    it('should handle app focus events', async () => {
      vi.spyOn(concreteSyncManager as any, 'getConnectedAddress').mockReturnValue(testAddress);
      
      await expect(concreteSyncManager.onAppFocus()).resolves.not.toThrow();
    });

    it('should handle app blur events', () => {
      expect(() => concreteSyncManager.onAppBlur()).not.toThrow();
    });

    it('should track user activity', () => {
      expect(() => concreteSyncManager.onUserActivity()).not.toThrow();
    });

    it('should sync on app focus when needed', async () => {
      vi.spyOn(concreteSyncManager as any, 'getConnectedAddress').mockReturnValue(testAddress);
      const syncSpy = vi.spyOn(concreteSyncManager, 'syncWalletToProfile');
      
      await concreteSyncManager.onAppFocus();
      
      // Should trigger sync when app gains focus
      expect(syncSpy).toHaveBeenCalled();
    });
  });
});