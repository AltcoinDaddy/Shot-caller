// React Hook for NFT Ownership Management

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  nftOwnershipService,
  NFTOwnershipService 
} from '@/lib/services/nft-ownership-service';
import {
  NFTMoment,
  NFTOwnership,
  NFTVerificationResult,
  DisneyPinnacleNFT
} from '@/lib/types/nft';

interface UseNFTOwnershipReturn {
  // Data
  ownership: NFTOwnership | null;
  moments: NFTMoment[];
  eligibleMoments: NFTMoment[];
  disneyNFTs: DisneyPinnacleNFT[];
  
  // State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Actions
  refreshOwnership: () => Promise<void>;
  verifyMoment: (collection: 'TopShot' | 'AllDay', momentId: number) => Promise<NFTVerificationResult>;
  searchMoments: (query: string, sport?: 'NBA' | 'NFL') => Promise<NFTMoment[]>;
  clearCache: () => void;
  
  // Utilities
  hasEligibleNFTs: boolean;
  totalMoments: number;
  topShotCount: number;
  allDayCount: number;
  cacheStats: any;
}

export const useNFTOwnership = (
  autoRefresh: boolean = true,
  refreshInterval: number = 5 * 60 * 1000 // 5 minutes
): UseNFTOwnershipReturn => {
  const { 
    user, 
    isAuthenticated, 
    nftCollection, 
    syncStatus, 
    onSyncStatusChange,
    refreshNFTCollection 
  } = useAuth();
  
  // State
  const [ownership, setOwnership] = useState<NFTOwnership | null>(null);
  const [disneyNFTs, setDisneyNFTs] = useState<DisneyPinnacleNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state - prioritize sync-aware data from auth context
  const moments = nftCollection.length > 0 ? nftCollection : (ownership?.moments || []);
  const eligibleMoments = moments.filter(moment => 
    moment.sport === 'NBA' || moment.sport === 'NFL'
  );
  const hasEligibleNFTs = eligibleMoments.length > 0;
  const totalMoments = moments.length;
  const topShotCount = moments.filter(m => m.sport === 'NBA').length;
  const allDayCount = moments.filter(m => m.sport === 'NFL').length;

  // Load ownership data with Dapper Wallet integration
  const loadOwnership = useCallback(async (useCache: boolean = true) => {
    if (!isAuthenticated || !user.addr) {
      setOwnership(null);
      setError(null);
      return;
    }

    try {
      setError(null);
      if (!useCache) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Use Dapper Wallet specific verification for better accuracy
      const response = await nftOwnershipService.verifyDapperWalletOwnership(user.addr);
      
      if (response.success && response.data) {
        setOwnership(response.data);
        setError(null);
        
        // Log successful verification for debugging
        console.log(`Successfully loaded ${response.data.moments.length} NFTs for ${user.addr}`);
      } else {
        const errorMessage = response.error || 'Failed to load NFT ownership';
        setError(errorMessage);
        setOwnership(null);
        
        // Log error for debugging
        console.warn('NFT ownership verification failed:', errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setOwnership(null);
      console.error('NFT ownership loading error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, user.addr]);

  // Load Disney Pinnacle NFTs for boosters
  const loadDisneyNFTs = useCallback(async () => {
    if (!isAuthenticated || !user.addr) {
      setDisneyNFTs([]);
      return;
    }

    try {
      const response = await nftOwnershipService.getDisneyPinnacleNFTs(user.addr);
      if (response.success && response.data) {
        setDisneyNFTs(response.data);
      }
    } catch (err) {
      console.warn('Failed to load Disney Pinnacle NFTs:', err);
      setDisneyNFTs([]);
    }
  }, [isAuthenticated, user.addr]);

  // Refresh ownership data - use sync-aware method when available
  const refreshOwnership = useCallback(async () => {
    if (refreshNFTCollection) {
      try {
        await refreshNFTCollection();
      } catch (error) {
        console.warn('Sync-aware NFT refresh failed, falling back to direct method:', error);
        await loadOwnership(false); // Fallback to direct method
      }
    } else {
      await loadOwnership(false); // Force refresh without cache
    }
  }, [loadOwnership, refreshNFTCollection]);

  // Verify specific moment ownership
  const verifyMoment = useCallback(async (
    collection: 'TopShot' | 'AllDay',
    momentId: number
  ): Promise<NFTVerificationResult> => {
    if (!isAuthenticated || !user.addr) {
      return {
        isValid: false,
        error: 'User not authenticated',
      };
    }

    try {
      return await nftOwnershipService.verifyMomentOwnership(
        user.addr,
        collection,
        momentId
      );
    } catch (err) {
      return {
        isValid: false,
        error: err instanceof Error ? err.message : 'Verification failed',
      };
    }
  }, [isAuthenticated, user.addr]);

  // Search moments
  const searchMoments = useCallback(async (
    query: string,
    sport?: 'NBA' | 'NFL'
  ): Promise<NFTMoment[]> => {
    if (!isAuthenticated || !user.addr) {
      return [];
    }

    try {
      const response = await nftOwnershipService.searchMoments(user.addr, query, sport);
      return response.success && response.data ? response.data : [];
    } catch (err) {
      console.warn('Search failed:', err);
      return [];
    }
  }, [isAuthenticated, user.addr]);

  // Clear cache
  const clearCache = useCallback(() => {
    nftOwnershipService.clearCache();
  }, []);

  // Get cache statistics
  const cacheStats = nftOwnershipService.getCacheStats();

  // Load data on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated && user.addr) {
      // Only load if we don't have sync-aware data
      if (nftCollection.length === 0) {
        loadOwnership(true);
      }
      loadDisneyNFTs();
    } else {
      setOwnership(null);
      setDisneyNFTs([]);
      setError(null);
    }
  }, [isAuthenticated, user.addr, nftCollection.length, loadOwnership, loadDisneyNFTs]);

  // Subscribe to sync events for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !onSyncStatusChange) return;

    const unsubscribe = onSyncStatusChange((status) => {
      // Update loading state based on sync status
      if (status.isActive && status.currentOperation === 'nft_collection_fetch') {
        setIsLoading(true);
      } else if (!status.isActive) {
        setIsLoading(false);
        // Clear any errors when sync completes successfully
        if (status.lastSync) {
          setError(null);
        }
      }
    });

    return unsubscribe;
  }, [isAuthenticated, onSyncStatusChange]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || !user.addr) {
      return;
    }

    const interval = setInterval(() => {
      loadOwnership(true); // Use cache for auto-refresh
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isAuthenticated, user.addr, loadOwnership]);

  return {
    // Data
    ownership,
    moments,
    eligibleMoments,
    disneyNFTs,
    
    // State
    isLoading,
    isRefreshing,
    error,
    
    // Actions
    refreshOwnership,
    verifyMoment,
    searchMoments,
    clearCache,
    
    // Utilities
    hasEligibleNFTs,
    totalMoments,
    topShotCount,
    allDayCount,
    cacheStats,
  };
};

// Hook for verifying specific NFT ownership
export const useNFTVerification = () => {
  const { user, isAuthenticated } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyOwnership = useCallback(async (
    collection: 'TopShot' | 'AllDay',
    momentId: number
  ): Promise<NFTVerificationResult> => {
    if (!isAuthenticated || !user.addr) {
      return {
        isValid: false,
        error: 'User not authenticated',
      };
    }

    setIsVerifying(true);
    try {
      const result = await nftOwnershipService.verifyMomentOwnership(
        user.addr,
        collection,
        momentId
      );
      return result;
    } catch (err) {
      return {
        isValid: false,
        error: err instanceof Error ? err.message : 'Verification failed',
      };
    } finally {
      setIsVerifying(false);
    }
  }, [isAuthenticated, user.addr]);

  const batchVerify = useCallback(async (
    verifications: Array<{
      collection: 'TopShot' | 'AllDay';
      momentId: number;
    }>
  ): Promise<Record<string, boolean>> => {
    if (!isAuthenticated || !user.addr) {
      return {};
    }

    setIsVerifying(true);
    try {
      const verificationsWithAddress = verifications.map(v => ({
        ...v,
        address: user.addr!,
      }));

      const response = await nftOwnershipService.batchVerifyOwnership(verificationsWithAddress);
      return response.success && response.data ? response.data : {};
    } catch (err) {
      console.error('Batch verification failed:', err);
      return {};
    } finally {
      setIsVerifying(false);
    }
  }, [isAuthenticated, user.addr]);

  return {
    verifyOwnership,
    batchVerify,
    isVerifying,
  };
};

// Hook for Disney Pinnacle NFTs (boosters)
export const useDisneyNFTs = () => {
  const { user, isAuthenticated } = useAuth();
  const [disneyNFTs, setDisneyNFTs] = useState<DisneyPinnacleNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDisneyNFTs = useCallback(async () => {
    if (!isAuthenticated || !user.addr) {
      setDisneyNFTs([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await nftOwnershipService.getDisneyPinnacleNFTs(user.addr);
      
      if (response.success && response.data) {
        setDisneyNFTs(response.data);
      } else {
        setError(response.error || 'Failed to load Disney NFTs');
        setDisneyNFTs([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setDisneyNFTs([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user.addr]);

  useEffect(() => {
    loadDisneyNFTs();
  }, [loadDisneyNFTs]);

  const energyBoosters = disneyNFTs.filter(nft => nft.boosterType === 'energy');
  const luckBoosters = disneyNFTs.filter(nft => nft.boosterType === 'luck');

  return {
    disneyNFTs,
    energyBoosters,
    luckBoosters,
    isLoading,
    error,
    refresh: loadDisneyNFTs,
    hasEnergyBoosters: energyBoosters.length > 0,
    hasLuckBoosters: luckBoosters.length > 0,
    totalBoosters: disneyNFTs.length,
  };
};