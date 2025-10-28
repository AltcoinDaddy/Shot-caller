/**
 * Network Resilience Usage Examples
 * 
 * This file demonstrates how to use the network resilience system
 * for wallet-profile synchronization operations.
 */

import { executeNetworkOperation, adaptiveFetch, NetworkAwareCache } from './network-aware-operations';
import { networkResilienceManager, ConnectionQuality } from '@/lib/services/network-resilience-manager';
import { classifySyncError, syncErrorRecoveryManager, SyncOperationType } from './sync-error-handling';

/**
 * Example: Sync wallet NFT collection with network resilience
 */
export async function syncWalletNFTCollection(walletAddress: string): Promise<any> {
  const operation = async () => {
    const response = await adaptiveFetch(`/api/nfts?address=${walletAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      cacheKey: `nft_collection_${walletAddress}`,
      priority: 2
    });

    return response.json();
  };

  try {
    return await executeNetworkOperation(operation, {
      enableOfflineQueue: true,
      priority: 2,
      cacheKey: `nft_collection_${walletAddress}`,
      retryPolicy: {
        maxAttempts: 3,
        baseDelay: 2000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        retryCondition: (error) => {
          // Retry on network errors and 5xx server errors
          return error.message.includes('fetch') || 
                 error.message.includes('50');
        }
      }
    });
  } catch (error) {
    // Classify and handle the error
    const syncError = classifySyncError(
      error as Error,
      SyncOperationType.NFT_COLLECTION_FETCH,
      { walletAddress }
    );

    const recovery = await syncErrorRecoveryManager.handleError(syncError);
    
    if (recovery.success) {
      return recovery.data;
    }

    // If recovery failed, provide user-friendly error
    const userMessage = syncErrorRecoveryManager.getUserFriendlyMessage(syncError);
    const suggestedActions = syncErrorRecoveryManager.getSuggestedActions(syncError);
    
    throw new Error(`${userMessage}\n\nSuggested actions:\n${suggestedActions.join('\n')}`);
  }
}

/**
 * Example: Sync profile data with caching
 */
export class ProfileSyncService {
  private cache = new NetworkAwareCache<any>(300000); // 5 minutes TTL

  async syncProfileData(walletAddress: string): Promise<any> {
    const cacheKey = `profile_${walletAddress}`;
    
    const fetcher = async () => {
      const response = await adaptiveFetch(`/api/users?address=${walletAddress}`, {
        method: 'GET'
      }, {
        cacheKey,
        priority: 1
      });

      return response.json();
    };

    try {
      return await this.cache.get(cacheKey, fetcher, {
        ttl: 300000, // 5 minutes
        enableOfflineQueue: true,
        priority: 1
      });
    } catch (error) {
      const syncError = classifySyncError(
        error as Error,
        SyncOperationType.PROFILE_DATA_UPDATE,
        { walletAddress }
      );

      const recovery = await syncErrorRecoveryManager.handleError(syncError);
      
      if (recovery.success) {
        return recovery.data;
      }

      throw error;
    }
  }

  async forceRefreshProfile(walletAddress: string): Promise<any> {
    const cacheKey = `profile_${walletAddress}`;
    
    // Clear cache to force refresh
    this.cache.delete(cacheKey);
    
    return this.syncProfileData(walletAddress);
  }
}

/**
 * Example: Monitor network status and adapt behavior
 */
export class NetworkAwareWalletSync {
  private profileService = new ProfileSyncService();

  constructor() {
    // Listen for network status changes
    networkResilienceManager.addEventListener('networkStatusChange', (status) => {
      console.log('Network status changed:', status);
      
      if (status.isOnline) {
        // Process any queued operations when back online
        networkResilienceManager.processOfflineQueue();
      }
    });

    networkResilienceManager.addEventListener('connectionRestored', () => {
      console.log('Connection restored, processing offline queue');
    });
  }

  async syncWallet(walletAddress: string): Promise<{
    nftCollection: any;
    profileData: any;
    syncQuality: ConnectionQuality;
  }> {
    const quality = networkResilienceManager.getConnectionQuality();
    
    // Adjust sync strategy based on connection quality
    const syncPromises = [];

    if (quality === ConnectionQuality.EXCELLENT || quality === ConnectionQuality.GOOD) {
      // Full sync for good connections
      syncPromises.push(
        syncWalletNFTCollection(walletAddress),
        this.profileService.syncProfileData(walletAddress)
      );
    } else if (quality === ConnectionQuality.FAIR) {
      // Priority sync for fair connections
      syncPromises.push(
        this.profileService.syncProfileData(walletAddress) // Profile first
      );
      
      // Queue NFT sync for later
      networkResilienceManager.queueOfflineOperation({
        type: 'nft_collection_sync',
        operation: () => syncWalletNFTCollection(walletAddress),
        data: { walletAddress },
        priority: 1
      });
    } else if (quality === ConnectionQuality.POOR) {
      // Use cached data only
      const cachedProfile = networkResilienceManager.getFallbackData(`profile_${walletAddress}`);
      const cachedNFTs = networkResilienceManager.getFallbackData(`nft_collection_${walletAddress}`);
      
      return {
        nftCollection: cachedNFTs,
        profileData: cachedProfile,
        syncQuality: quality
      };
    } else {
      // Offline - use all cached data
      const cachedProfile = networkResilienceManager.getFallbackData(`profile_${walletAddress}`);
      const cachedNFTs = networkResilienceManager.getFallbackData(`nft_collection_${walletAddress}`);
      
      return {
        nftCollection: cachedNFTs,
        profileData: cachedProfile,
        syncQuality: quality
      };
    }

    try {
      const results = await Promise.allSettled(syncPromises);
      
      return {
        nftCollection: results[0]?.status === 'fulfilled' ? results[0].value : null,
        profileData: results[1]?.status === 'fulfilled' ? results[1].value : results[0]?.status === 'fulfilled' ? results[0].value : null,
        syncQuality: quality
      };
    } catch (error) {
      console.error('Wallet sync failed:', error);
      
      // Return cached data as fallback
      const cachedProfile = networkResilienceManager.getFallbackData(`profile_${walletAddress}`);
      const cachedNFTs = networkResilienceManager.getFallbackData(`nft_collection_${walletAddress}`);
      
      return {
        nftCollection: cachedNFTs,
        profileData: cachedProfile,
        syncQuality: quality
      };
    }
  }

  getNetworkStatus() {
    return networkResilienceManager.getNetworkStatus();
  }

  getOfflineQueueStatus() {
    return networkResilienceManager.getOfflineQueueStatus();
  }

  clearOfflineQueue() {
    networkResilienceManager.clearOfflineQueue();
  }
}

/**
 * Example: Batch sync operations with quality-based concurrency
 */
export async function batchSyncMultipleWallets(walletAddresses: string[]): Promise<any[]> {
  const quality = networkResilienceManager.getConnectionQuality();
  
  // Adjust batch size based on connection quality
  const batchSizes = {
    [ConnectionQuality.EXCELLENT]: 10,
    [ConnectionQuality.GOOD]: 6,
    [ConnectionQuality.FAIR]: 3,
    [ConnectionQuality.POOR]: 1,
    [ConnectionQuality.OFFLINE]: 0
  };

  const batchSize = batchSizes[quality];
  
  if (batchSize === 0) {
    throw new Error('Cannot perform batch sync while offline');
  }

  const results: any[] = [];
  
  // Process wallets in batches
  for (let i = 0; i < walletAddresses.length; i += batchSize) {
    const batch = walletAddresses.slice(i, i + batchSize);
    
    const batchPromises = batch.map(address => 
      syncWalletNFTCollection(address).catch(error => {
        console.warn(`Failed to sync wallet ${address}:`, error);
        return null;
      })
    );

    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults.map(result => 
      result.status === 'fulfilled' ? result.value : null
    ));
  }

  return results;
}

// Export singleton instance for easy use
export const networkAwareWalletSync = new NetworkAwareWalletSync();