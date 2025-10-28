/**
 * Network-Aware Operations Utilities
 * 
 * Provides utilities for making network operations resilient to connectivity issues
 * and adaptive to connection quality.
 */

import { networkResilienceManager, ConnectionQuality, RetryPolicy } from '@/lib/services/network-resilience-manager';

export interface NetworkAwareConfig {
  enableOfflineQueue?: boolean;
  priority?: number;
  retryPolicy?: Partial<RetryPolicy>;
  fallbackData?: any;
  cacheKey?: string;
}

/**
 * Execute a network operation with resilience features
 */
export async function executeNetworkOperation<T>(
  operation: () => Promise<T>,
  config: NetworkAwareConfig = {}
): Promise<T> {
  const {
    enableOfflineQueue = true,
    priority = 1,
    retryPolicy = {},
    fallbackData,
    cacheKey
  } = config;

  // Check if we're online
  if (!networkResilienceManager.isOnline()) {
    if (enableOfflineQueue) {
      // Queue operation for later execution
      networkResilienceManager.queueOfflineOperation({
        type: 'network_operation',
        operation,
        data: config,
        priority
      });
    }

    // Return fallback data if available
    if (fallbackData !== undefined) {
      return fallbackData;
    }

    if (cacheKey) {
      const cached = networkResilienceManager.getFallbackData(cacheKey);
      if (cached) {
        return cached.data;
      }
    }

    throw new Error('Network unavailable and no fallback data provided');
  }

  // Create retry policy with defaults
  const fullRetryPolicy: RetryPolicy = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryCondition: (error: Error) => {
      return error.name === 'NetworkError' || 
             error.name === 'TimeoutError' ||
             (error.message && error.message.includes('fetch'));
    },
    ...retryPolicy
  };

  try {
    const result = await networkResilienceManager.executeWithRetry(operation, fullRetryPolicy);
    
    // Cache successful result if cache key provided
    if (cacheKey) {
      networkResilienceManager.setCachedFallback(cacheKey, result);
    }
    
    return result;
  } catch (error) {
    // If operation fails and we have fallback data, use it
    if (fallbackData !== undefined) {
      return fallbackData;
    }

    if (cacheKey) {
      const cached = networkResilienceManager.getFallbackData(cacheKey);
      if (cached) {
        console.warn('Network operation failed, using cached data:', error);
        return cached.data;
      }
    }

    throw error;
  }
}

/**
 * Adaptive fetch based on connection quality
 */
export async function adaptiveFetch(
  url: string,
  options: RequestInit = {},
  config: NetworkAwareConfig = {}
): Promise<Response> {
  const quality = networkResilienceManager.getConnectionQuality();
  
  // Adjust timeout based on connection quality
  const timeoutMap = {
    [ConnectionQuality.EXCELLENT]: 5000,
    [ConnectionQuality.GOOD]: 10000,
    [ConnectionQuality.FAIR]: 15000,
    [ConnectionQuality.POOR]: 30000,
    [ConnectionQuality.OFFLINE]: 1000
  };

  const timeout = timeoutMap[quality];
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchOptions: RequestInit = {
    ...options,
    signal: controller.signal
  };

  const operation = async () => {
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('TimeoutError');
      }
      
      throw error;
    }
  };

  return executeNetworkOperation(operation, config);
}

/**
 * Batch network operations with quality-based concurrency limits
 */
export async function batchNetworkOperations<T>(
  operations: Array<() => Promise<T>>,
  config: NetworkAwareConfig = {}
): Promise<T[]> {
  const quality = networkResilienceManager.getConnectionQuality();
  
  // Adjust concurrency based on connection quality
  const concurrencyMap = {
    [ConnectionQuality.EXCELLENT]: 10,
    [ConnectionQuality.GOOD]: 6,
    [ConnectionQuality.FAIR]: 3,
    [ConnectionQuality.POOR]: 1,
    [ConnectionQuality.OFFLINE]: 0
  };

  const maxConcurrency = concurrencyMap[quality];
  
  if (maxConcurrency === 0) {
    throw new Error('Cannot execute batch operations while offline');
  }

  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];
    
    const promise = executeNetworkOperation(operation, {
      ...config,
      priority: config.priority || (operations.length - i) // Higher priority for earlier operations
    }).then(result => {
      results[i] = result;
    });

    executing.push(promise);

    // Limit concurrency
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      // Remove completed promises
      executing.splice(0, executing.findIndex(p => p === promise) + 1);
    }
  }

  // Wait for all remaining operations
  await Promise.all(executing);
  
  return results;
}

/**
 * Smart cache with network-aware refresh
 */
export class NetworkAwareCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();
  private refreshPromises = new Map<string, Promise<T>>();

  constructor(private defaultTtl: number = 300000) {} // 5 minutes default

  async get(
    key: string,
    fetcher: () => Promise<T>,
    config: NetworkAwareConfig & { ttl?: number } = {}
  ): Promise<T> {
    const { ttl = this.defaultTtl } = config;
    const cached = this.cache.get(key);
    const now = Date.now();

    // Return cached data if fresh
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data;
    }

    // If offline, return stale cache if available
    if (!networkResilienceManager.isOnline() && cached) {
      return cached.data;
    }

    // Prevent duplicate requests
    if (this.refreshPromises.has(key)) {
      return this.refreshPromises.get(key)!;
    }

    // Fetch fresh data
    const refreshPromise = executeNetworkOperation(fetcher, config)
      .then(data => {
        this.cache.set(key, { data, timestamp: now, ttl });
        this.refreshPromises.delete(key);
        return data;
      })
      .catch(error => {
        this.refreshPromises.delete(key);
        
        // Return stale cache on error if available
        if (cached) {
          console.warn(`Cache refresh failed for ${key}, using stale data:`, error);
          return cached.data;
        }
        
        throw error;
      });

    this.refreshPromises.set(key, refreshPromise);
    return refreshPromise;
  }

  set(key: string, data: T, ttl: number = this.defaultTtl): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.refreshPromises.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.refreshPromises.clear();
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const isExpired = (Date.now() - cached.timestamp) >= cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

/**
 * Network status hook for React components
 */
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [status, setStatus] = useState(networkResilienceManager.getNetworkStatus());

  useEffect(() => {
    const unsubscribe = networkResilienceManager.addEventListener('networkStatusChange', setStatus);
    return unsubscribe;
  }, []);

  return status;
}

/**
 * Connection quality-based resource loading
 */
export function getOptimalResourceUrl(baseUrl: string, quality: ConnectionQuality): string {
  const qualityMap = {
    [ConnectionQuality.EXCELLENT]: 'high',
    [ConnectionQuality.GOOD]: 'medium',
    [ConnectionQuality.FAIR]: 'low',
    [ConnectionQuality.POOR]: 'low',
    [ConnectionQuality.OFFLINE]: 'cached'
  };

  const qualityLevel = qualityMap[quality];
  return `${baseUrl}?quality=${qualityLevel}`;
}

/**
 * Preload critical resources based on connection quality
 */
export async function preloadCriticalResources(
  resources: Array<{ url: string; priority: number }>,
  maxResources?: number
): Promise<void> {
  const quality = networkResilienceManager.getConnectionQuality();
  
  if (quality === ConnectionQuality.OFFLINE) {
    return;
  }

  // Limit resources based on connection quality
  const limits = {
    [ConnectionQuality.EXCELLENT]: maxResources || 20,
    [ConnectionQuality.GOOD]: maxResources || 10,
    [ConnectionQuality.FAIR]: maxResources || 5,
    [ConnectionQuality.POOR]: maxResources || 2,
    [ConnectionQuality.OFFLINE]: 0
  };

  const limit = limits[quality];
  const sortedResources = resources
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);

  const preloadPromises = sortedResources.map(resource => 
    adaptiveFetch(getOptimalResourceUrl(resource.url, quality), {
      method: 'HEAD'
    }).catch(error => {
      console.warn(`Failed to preload resource ${resource.url}:`, error);
    })
  );

  await Promise.allSettled(preloadPromises);
}