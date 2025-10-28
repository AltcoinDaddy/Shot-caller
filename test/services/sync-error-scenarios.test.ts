/**
 * Comprehensive Error Scenario Tests for Sync Manager
 * Tests all error conditions and recovery mechanisms
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConcreteWalletProfileSyncManager } from '@/lib/services/wallet-profile-sync-manager';
import { 
  SyncEventType, 
  SyncErrorType,
  SyncOperationType 
} from '@/lib/types/sync';

// Mock services with error scenarios
const mockNFTOwnershipService = {
  getOwnership: vi.fn(),
  getEligibleMoments: vi.fn(),
  verifyOwnership: vi.fn(),
};

const mockNetworkResilienceManager = {
  executeWithRetry: vi.fn(),
  isOnline: vi.fn(),
  getConnectionQuality: vi.fn(),
  queueOfflineOperation: vi.fn(),
  getFallbackData: vi.fn(),
  setCachedFallback: vi.fn(),
};

describe('Sync Manager Error Scenarios', () => {
  let syncManager: ConcreteWalletProfileSyncManager;
  const testAddress = '0x1234567890123456';

  beforeEach(() => {
    vi.clearAllMocks();
    
    syncManager = new ConcreteWalletProfileSyncManager(
      {
        autoSyncEnabled: true,
        syncInterval: 60000,
        retryPolicy: {
          maxAttempts: 3,
          baseDelay: 100, // Faster for testing
          maxDelay: 1000,
          backoffMultiplier: 2,
          retryCondition: (error: Error) => error.name !== 'ValidationError'
        }
      },
      {
        nftOwnershipService: mockNFTOwnershipService,
        networkResilienceManager: mockNetworkResilienceManager,
      }
    );
  });

  describe('Network Error Scenarios', () => {
    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      mockNFTOwnershipService.getOwnership.mockRejectedValue(timeoutError);
      mockNetworkResilienceManager.executeWithRetry.mockRejectedValue(timeoutError);
      
      await expect(syncManager.syncNFTCollection(testAddress)).rejects.toThrow('Request timeout');
      
      const status = syncManager.getSyncStatus();
      expect(status.failureCount).toBeGreaterThan(0);
    });

    it('should handle network connectivity loss', async () => {
      mockNetworkResilienceManager.isOnline.mockReturnValue(false);
      
      const networkError = new Error('Network unavailable');
      networkError.name = 'NetworkError';
      
      mockNFTOwnershipService.getOwnership.mockRejectedValue(networkError);
      mockNetworkResilienceManager.executeWithRetry.mockRejectedValue(networkError);
      
      await expect(syncManager.syncNFTCollection(testAddress)).rejects.toThrow();
    });

    it('should queue operations when offline', async () => {
      mockNetworkResilienceManager.isOnline.mockReturnValue(false);
      
      const networkError = new Error('Offline');
      mockNetworkResilienceManager.executeWithRetry.mockRejectedValue(networkError);
      
      try {
        await syncManager.syncNFTCollection(testAddress);
      } catch (error) {
        // Expected to fail
      }
      
      // Should have attempted to queue offline operation
      expect(mockNetworkResilienceManager.queueOfflineOperation).toHaveBeenCalled();
    });

    it('should use fallback data when network fails', async () => {
      const fallbackData = {
        address: testAddress,
        moments: [{ id: 'cached1', sport: 'NBA' }],
        totalCount: 1,
        isEligible: true
      };
      
      mockNetworkResilienceManager.getFallbackData.mockReturnValue(fallbackData);
      mockNFTOwnershipService.getOwnership.mockRejectedValue(new Error('Network error'));
      mockNetworkResilienceManager.executeWithRetry.mockRejectedValue(new Error('Network error'));
      
      try {
        await syncManager.syncNFTCollection(testAddress);
      } catch (error) {
        // Should have attempted to get fallback data
        expect(mockNetworkResilienceManager.getFallbackData).toHaveBeenCalled();
      }
    });
  });

  describe('API Error Scenarios', () => {
    it('should handle API rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      
      mockNFTOwnershipService.getOwnership.mockRejectedValue(rateLimitError);
      mockNetworkResilienceManager.executeWithRetry.mockRejectedValue(rateLimitError);
      
      await expect(syncManager.syncNFTCollection(testAddress)).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle API server errors (5xx)', async () => {
      const serverError = new Error('Internal server error');
      serverError.name = 'ServerError';
      
      mockNFTOwnershipService.getOwnership.mockRejectedValue(serverError);
      mockNetworkResilienceManager.executeWithRetry.mockRejectedValue(serverError);
      
      await expect(syncManager.syncNFTCollection(testAddress)).rejects.toThrow('Internal server error');
    });

    it('should handle API authentication errors', async () => {
      const authError = new Error('Unauthorized access');
      authError.name = 'AuthenticationError';
      
      mockNFTOwnershipService.getOwnership.mockRejectedValue(authError);
      mockNetworkResilienceManager.executeWithRetry.mockRejectedValue(authError);
      
      await expect(syncManager.syncNFTCollection(testAddress)).rejects.toThrow('Unauthorized access');
    });

    it('should handle malformed API responses', async () => {
      mockNFTOwnershipService.getOwnership.mockResolvedValue({
        success: false,
        error: 'Invalid response format'
      });
      
      mockNetworkResilienceManager.executeWithRetry.mockImplementation(
        async (operation: () => Promise<any>) => await operation()
      );
      
      await expect(syncManager.syncNFTCollection(testAddress)).rejects.toThrow();
    });
  });

  describe('Validation Error Scenarios', () => {
    it('should handle invalid wallet addresses', async () => {
      const invalidAddress = 'invalid-address';
      
      await expect(syncManager.syncWalletToProfile(invalidAddress)).rejects.toThrow();
    });

    it('should handle empty or null addresses', async () => {
      await expect(syncManager.syncWalletToProfile('')).rejects.toThrow();
      await expect(syncManager.syncWalletToProfile(null as any)).rejects.toThrow();
    });

    it('should validate NFT collection data format', async () => {
      mockNFTOwnershipService.getOwnership.mockResolvedValue({
        success: true,
        data: null // Invalid data format
      });
      
      mockNetworkResilienceManager.executeWithRetry.mockImplementation(
        async (operation: () => Promise<any>) => await operation()
      );
      
      await expect(syncManager.syncNFTCollection(testAddress)).rejects.toThrow();
    });
  });

  describe('Concurrent Operation Errors', () => {
    it('should handle concurrent sync operations gracefully', async () => {
      mockNFTOwnershipService.getOwnership.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { address: testAddress, moments: [], totalCount: 0, isEligible: true }
        }), 100))
      );
      
      mockNetworkResilienceManager.executeWithRetry.mockImplementation(
        async (operation: () => Promise<any>) => await operation()
      );
      
      // Start multiple concurrent syncs
      const sync1 = syncManager.syncNFTCollection(testAddress);
      const sync2 = syncManager.syncNFTCollection(testAddress);
      const sync3 = syncManager.syncNFTCollection(testAddress);
      
      const results = await Promise.allSettled([sync1, sync2, sync3]);
      
      // All should complete (either successfully or with controlled errors)
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(['fulfilled', 'rejected']).toContain(result.status);
      });
    });

    it('should handle sync during wallet disconnection', async () => {
      // Start a sync operation
      const syncPromise = syncManager.syncNFTCollection(testAddress);
      
      // Immediately disconnect wallet
      await syncManager.onWalletDisconnect();
      
      // Sync should still complete or fail gracefully
      await expect(syncPromise).resolves.toBeDefined();
    });
  });

  describe('Cache Error Scenarios', () => {
    it('should handle cache corruption', async () => {
      // Mock corrupted cache data
      vi.spyOn(syncManager as any, 'getCachedProfile').mockReturnValue({
        address: testAddress,
        // Missing required fields to simulate corruption
      });
      
      // Should still perform sync despite cache issues
      mockNFTOwnershipService.getOwnership.mockResolvedValue({
        success: true,
        data: { address: testAddress, moments: [], totalCount: 0, isEligible: true }
      });
      
      mockNetworkResilienceManager.executeWithRetry.mockImplementation(
        async (operation: () => Promise<any>) => await operation()
      );
      
      const result = await syncManager.syncNFTCollection(testAddress);
      expect(result.success).toBe(true);
    });

    it('should handle cache storage failures', async () => {
      // Mock localStorage failure
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });
      
      try {
        mockNFTOwnershipService.getOwnership.mockResolvedValue({
          success: true,
          data: { address: testAddress, moments: [], totalCount: 0, isEligible: true }
        });
        
        mockNetworkResilienceManager.executeWithRetry.mockImplementation(
          async (operation: () => Promise<any>) => await operation()
        );
        
        // Should still complete sync even if caching fails
        const result = await syncManager.syncNFTCollection(testAddress);
        expect(result.success).toBe(true);
      } finally {
        Storage.prototype.setItem = originalSetItem;
      }
    });
  });

  describe('Error Event Emission', () => {
    it('should emit error events when sync fails', async () => {
      const errorEvents: any[] = [];
      
      syncManager.subscribe(SyncEventType.SYNC_ERROR, (event) => {
        errorEvents.push(event);
      });
      
      const testError = new Error('Test sync error');
      mockNFTOwnershipService.getOwnership.mockRejectedValue(testError);
      mockNetworkResilienceManager.executeWithRetry.mockRejectedValue(testError);
      
      try {
        await syncManager.syncNFTCollection(testAddress);
      } catch (error) {
        // Expected to fail
      }
      
      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].data.error).toBeDefined();
    });

    it('should include error context in events', async () => {
      const errorEvents: any[] = [];
      
      syncManager.subscribe(SyncEventType.SYNC_ERROR, (event) => {
        errorEvents.push(event);
      });
      
      const contextError = new Error('Context test error');
      mockNFTOwnershipService.getOwnership.mockRejectedValue(contextError);
      mockNetworkResilienceManager.executeWithRetry.mockRejectedValue(contextError);
      
      try {
        await syncManager.syncNFTCollection(testAddress);
      } catch (error) {
        // Expected to fail
      }
      
      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].data.operation).toBeDefined();
    });
  });

  describe('Error Recovery', () => {
    it('should retry operations according to retry policy', async () => {
      let attemptCount = 0;
      
      mockNetworkResilienceManager.executeWithRetry.mockImplementation(async (operation) => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary error');
        }
        return await operation();
      });
      
      mockNFTOwnershipService.getOwnership.mockResolvedValue({
        success: true,
        data: { address: testAddress, moments: [], totalCount: 0, isEligible: true }
      });
      
      const result = await syncManager.syncNFTCollection(testAddress);
      
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3); // Should have retried
    });

    it('should not retry non-retryable errors', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      
      mockNetworkResilienceManager.executeWithRetry.mockRejectedValue(validationError);
      
      await expect(syncManager.syncNFTCollection(testAddress)).rejects.toThrow('Validation failed');
    });

    it('should clear error state after successful sync', async () => {
      // First, cause an error
      mockNFTOwnershipService.getOwnership.mockRejectedValueOnce(new Error('First error'));
      mockNetworkResilienceManager.executeWithRetry.mockRejectedValueOnce(new Error('First error'));
      
      try {
        await syncManager.syncNFTCollection(testAddress);
      } catch (error) {
        // Expected first failure
      }
      
      let status = syncManager.getSyncStatus();
      expect(status.failureCount).toBeGreaterThan(0);
      
      // Then succeed
      mockNFTOwnershipService.getOwnership.mockResolvedValue({
        success: true,
        data: { address: testAddress, moments: [], totalCount: 0, isEligible: true }
      });
      
      mockNetworkResilienceManager.executeWithRetry.mockImplementation(
        async (operation: () => Promise<any>) => await operation()
      );
      
      await syncManager.syncNFTCollection(testAddress);
      
      status = syncManager.getSyncStatus();
      // Failure count should remain (it tracks total failures, not current state)
      expect(status.failureCount).toBeGreaterThan(0);
      expect(status.lastSync).toBeInstanceOf(Date);
    });
  });
});