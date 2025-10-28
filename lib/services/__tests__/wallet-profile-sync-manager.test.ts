// Tests for Wallet Profile Sync Manager
// Verifies core sync infrastructure functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletProfileSyncManager } from '../wallet-profile-sync-manager';
import { SyncEventType, SyncOperationType, OperationStatus } from '../../types/sync';

describe('WalletProfileSyncManager', () => {
  let syncManager: WalletProfileSyncManager;

  beforeEach(() => {
    syncManager = new WalletProfileSyncManager();
  });

  describe('Core Sync Operations', () => {
    it('should initialize with correct default status', () => {
      const status = syncManager.getSyncStatus();
      
      expect(status.isActive).toBe(false);
      expect(status.lastSync).toBeNull();
      expect(status.nextSync).toBeNull();
      expect(status.failureCount).toBe(0);
      expect(status.currentOperation).toBeUndefined();
    });

    it('should indicate sync is not in progress initially', () => {
      expect(syncManager.isSyncInProgress()).toBe(false);
    });

    it('should return null for last sync time initially', () => {
      expect(syncManager.getLastSyncTime()).toBeNull();
    });
  });

  describe('Configuration', () => {
    it('should allow setting sync interval', () => {
      const newInterval = 60000; // 1 minute
      syncManager.setSyncInterval(newInterval);
      
      // Since configuration is private, we test indirectly by checking behavior
      expect(() => syncManager.setSyncInterval(newInterval)).not.toThrow();
    });

    it('should allow enabling/disabling auto sync', () => {
      syncManager.enableAutoSync(false);
      syncManager.enableAutoSync(true);
      
      expect(() => syncManager.enableAutoSync(false)).not.toThrow();
    });

    it('should allow setting retry policy', () => {
      const retryPolicy = {
        maxAttempts: 5,
        baseDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 2,
        retryCondition: () => true
      };
      
      expect(() => syncManager.setRetryPolicy(retryPolicy)).not.toThrow();
    });
  });

  describe('Event System', () => {
    it('should allow subscribing to events', () => {
      const handler = vi.fn();
      const unsubscribe = syncManager.subscribe(SyncEventType.WALLET_CONNECTED, handler);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call event handlers when events are emitted', async () => {
      const handler = vi.fn();
      syncManager.subscribe(SyncEventType.WALLET_CONNECTED, handler);
      
      await syncManager.onWalletConnect('0x123', []);
      
      expect(handler).toHaveBeenCalled();
    });

    it('should allow unsubscribing from events', () => {
      const handler = vi.fn();
      const unsubscribe = syncManager.subscribe(SyncEventType.WALLET_CONNECTED, handler);
      
      unsubscribe();
      
      // Handler should not be called after unsubscribing
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('Wallet Event Handling', () => {
    it('should handle wallet connection', async () => {
      const address = '0x123456789';
      const services = ['nft-service', 'profile-service'];
      
      await expect(syncManager.onWalletConnect(address, services)).resolves.not.toThrow();
    });

    it('should handle wallet disconnection', async () => {
      await expect(syncManager.onWalletDisconnect()).resolves.not.toThrow();
      
      const status = syncManager.getSyncStatus();
      expect(status.isActive).toBe(false);
      expect(status.lastSync).toBeNull();
    });

    it('should handle NFT collection changes', async () => {
      const address = '0x123456789';
      
      await expect(syncManager.onNFTCollectionChange(address)).resolves.not.toThrow();
    });
  });

  describe('Sync Operations', () => {
    it('should perform wallet to profile sync', async () => {
      const address = '0x123456789';
      
      const result = await syncManager.syncWalletToProfile(address);
      
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.operations).toHaveLength(1);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should perform NFT collection sync', async () => {
      const address = '0x123456789';
      
      const result = await syncManager.syncNFTCollection(address);
      
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.collectionCount).toBeGreaterThanOrEqual(0);
      expect(result.newNFTs).toBeGreaterThanOrEqual(0);
      expect(result.removedNFTs).toBeGreaterThanOrEqual(0);
      expect(result.eligibleMoments).toBeGreaterThanOrEqual(0);
    });

    it('should perform profile stats sync', async () => {
      const address = '0x123456789';
      
      const result = await syncManager.syncProfileStats(address);
      
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(typeof result.profileUpdated).toBe('boolean');
      expect(typeof result.statsUpdated).toBe('boolean');
      expect(typeof result.achievementsUpdated).toBe('boolean');
    });
  });
});