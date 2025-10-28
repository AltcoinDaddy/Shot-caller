/**
 * React Hook for Intelligent Cache Integration
 * Provides easy access to caching functionality in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCacheManager } from '@/lib/services/cache-manager';
import { syncEventBus } from '@/lib/services/sync-event-bus';

export interface UseCacheOptions<T> {
  key: string;
  fetcher?: () => Promise<T>;
  ttl?: number;
  tags?: string[];
  enabled?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

export interface CacheHookResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
  refresh: () => Promise<void>;
  invalidate: () => void;
  setData: (data: T) => Promise<void>;
}

export function useIntelligentCache<T>(
  options: UseCacheOptions<T>
): CacheHookResult<T> {
  const {
    key,
    fetcher,
    ttl,
    tags = [],
    enabled = true,
    refreshInterval,
    onError,
    onSuccess
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const cacheManager = getCacheManager(syncEventBus);
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  // Fetch data from cache or fetcher
  const fetchData = useCallback(async (force = false) => {
    if (!enabled || !key) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let result: T | null = null;
      
      if (!force) {
        // Try cache first
        result = await cacheManager.get<T>(key);
      }
      
      if (result === null && fetcher) {
        // Cache miss or forced refresh - use fetcher
        result = await fetcher();
        
        if (result !== null) {
          // Cache the result
          await cacheManager.set(key, result, { ttl, tags });
        }
      }
      
      if (mountedRef.current) {
        setData(result);
        setIsStale(false);
        
        if (result !== null && onSuccess) {
          onSuccess(result);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Cache fetch failed');
      
      if (mountedRef.current) {
        setError(error);
        
        if (onError) {
          onError(error);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [key, fetcher, enabled, ttl, tags, onError, onSuccess, cacheManager]);

  // Refresh data (force fetch)
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Invalidate cache entry
  const invalidate = useCallback(() => {
    cacheManager.invalidate({ keys: [key] });
    setIsStale(true);
  }, [key, cacheManager]);

  // Set data directly in cache
  const setCachedData = useCallback(async (newData: T) => {
    await cacheManager.set(key, newData, { ttl, tags });
    setData(newData);
    setIsStale(false);
  }, [key, ttl, tags, cacheManager]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData();
      }, refreshInterval);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    isStale,
    refresh,
    invalidate,
    setData: setCachedData
  };
}

/**
 * Hook for cache status monitoring
 */
export function useCacheStatus() {
  const [status, setStatus] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  
  const cacheManager = getCacheManager(syncEventBus);

  const refreshStatus = useCallback(() => {
    const currentStatus = cacheManager.getStatus();
    const currentMetrics = cacheManager.getMetrics();
    
    setStatus(currentStatus);
    setMetrics(currentMetrics);
  }, [cacheManager]);

  useEffect(() => {
    refreshStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(refreshStatus, 30000);
    
    return () => clearInterval(interval);
  }, [refreshStatus]);

  return {
    status,
    metrics,
    refresh: refreshStatus
  };
}

/**
 * Hook for cache warming operations
 */
export function useCacheWarming() {
  const [isWarming, setIsWarming] = useState(false);
  const cacheManager = getCacheManager(syncEventBus);

  const warmupUser = useCallback(async (address: string) => {
    setIsWarming(true);
    try {
      await cacheManager.warmupUser(address);
    } finally {
      setIsWarming(false);
    }
  }, [cacheManager]);

  const warmupGameData = useCallback(async () => {
    setIsWarming(true);
    try {
      await cacheManager.warmupGameData();
    } finally {
      setIsWarming(false);
    }
  }, [cacheManager]);

  return {
    isWarming,
    warmupUser,
    warmupGameData
  };
}

/**
 * Hook for profile data with intelligent caching
 */
export function useCachedProfile(address: string | null) {
  return useIntelligentCache({
    key: address ? `profile:${address}` : '',
    fetcher: address ? async () => {
      // This would integrate with your actual profile service
      const response = await fetch(`/api/users?address=${address}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    } : undefined,
    tags: ['profile', 'user-data'],
    enabled: !!address,
    ttl: 5 * 60 * 1000, // 5 minutes
    refreshInterval: 10 * 60 * 1000 // Refresh every 10 minutes
  });
}

/**
 * Hook for NFT collection data with intelligent caching
 */
export function useCachedNFTCollection(address: string | null) {
  return useIntelligentCache({
    key: address ? `nft:collection:${address}` : '',
    fetcher: address ? async () => {
      // This would integrate with your actual NFT service
      const response = await fetch(`/api/nfts?address=${address}`);
      if (!response.ok) throw new Error('Failed to fetch NFT collection');
      return response.json();
    } : undefined,
    tags: ['nft', 'collection'],
    enabled: !!address,
    ttl: 2 * 60 * 1000, // 2 minutes (NFT data changes more frequently)
    refreshInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });
}

/**
 * Hook for leaderboard data with intelligent caching
 */
export function useCachedLeaderboard() {
  return useIntelligentCache({
    key: 'leaderboard:current',
    fetcher: async () => {
      const response = await fetch('/api/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
    tags: ['game', 'leaderboard'],
    ttl: 1 * 60 * 1000, // 1 minute
    refreshInterval: 2 * 60 * 1000 // Refresh every 2 minutes
  });
}