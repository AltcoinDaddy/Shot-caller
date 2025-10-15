// Caching Layer for NFT Ownership Data

import {
  NFTMoment,
  NFTOwnership,
  NFTCacheEntry,
  NFTCache,
  CacheStrategy,
  NFTCacheError,
  NFTAPIResponse
} from '@/lib/types/nft';

export class NFTCacheService {
  private cache: NFTCache;
  private strategy: CacheStrategy;
  private ttl: number; // Time to live in milliseconds
  private maxSize: number;
  private storageKey: string;

  constructor(config: {
    strategy?: CacheStrategy;
    ttl?: number; // Default 5 minutes
    maxSize?: number; // Default 1000 entries
    storageKey?: string;
  } = {}) {
    this.strategy = config.strategy || 'memory';
    this.ttl = config.ttl || 5 * 60 * 1000; // 5 minutes
    this.maxSize = config.maxSize || 1000;
    this.storageKey = config.storageKey || 'nft_cache';

    this.cache = {
      moments: new Map(),
      ownership: new Map(),
      collections: new Map(),
    };

    this.initializeCache();
  }

  private initializeCache(): void {
    if (this.strategy !== 'memory') {
      this.loadFromStorage();
    }

    // Set up periodic cleanup
    setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private loadFromStorage(): void {
    try {
      const storage = this.getStorage();
      if (!storage) return;

      const cached = storage.getItem(this.storageKey);
      if (cached) {
        const data = JSON.parse(cached);
        
        // Restore Maps from serialized data
        if (data.moments) {
          this.cache.moments = new Map(Object.entries(data.moments));
        }
        if (data.ownership) {
          this.cache.ownership = new Map(Object.entries(data.ownership));
        }
        if (data.collections) {
          this.cache.collections = new Map(Object.entries(data.collections));
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
      this.clearCache();
    }
  }

  private saveToStorage(): void {
    try {
      const storage = this.getStorage();
      if (!storage) return;

      // Convert Maps to objects for serialization
      const data = {
        moments: Object.fromEntries(this.cache.moments),
        ownership: Object.fromEntries(this.cache.ownership),
        collections: Object.fromEntries(this.cache.collections),
        timestamp: Date.now(),
      };

      storage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;

    switch (this.strategy) {
      case 'localStorage':
        return window.localStorage;
      case 'sessionStorage':
        return window.sessionStorage;
      default:
        return null;
    }
  }

  private createCacheEntry<T>(data: T): NFTCacheEntry {
    const now = Date.now();
    return {
      data,
      timestamp: now,
      expiresAt: now + this.ttl,
    };
  }

  private isExpired(entry: NFTCacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  private enforceMaxSize(cache: Map<string, NFTCacheEntry>): void {
    if (cache.size <= this.maxSize) return;

    // Remove oldest entries first
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, cache.size - this.maxSize);
    toRemove.forEach(([key]) => cache.delete(key));
  }

  private cleanup(): void {
    // Remove expired entries from all caches
    [this.cache.moments, this.cache.ownership, this.cache.collections].forEach(cache => {
      for (const [key, entry] of cache.entries()) {
        if (this.isExpired(entry)) {
          cache.delete(key);
        }
      }
    });

    // Save to storage after cleanup
    if (this.strategy !== 'memory') {
      this.saveToStorage();
    }
  }

  /**
   * Cache NFT moment data
   */
  cacheMoment(momentId: string, moment: NFTMoment): void {
    try {
      const entry = this.createCacheEntry(moment);
      this.cache.moments.set(momentId, entry);
      this.enforceMaxSize(this.cache.moments);

      if (this.strategy !== 'memory') {
        this.saveToStorage();
      }
    } catch (error) {
      throw new NFTCacheError('Failed to cache moment', { momentId, error });
    }
  }

  /**
   * Get cached NFT moment data
   */
  getCachedMoment(momentId: string): NFTMoment | null {
    try {
      const entry = this.cache.moments.get(momentId);
      if (!entry) return null;

      if (this.isExpired(entry)) {
        this.cache.moments.delete(momentId);
        return null;
      }

      return entry.data as NFTMoment;
    } catch (error) {
      console.warn('Failed to get cached moment:', error);
      return null;
    }
  }

  /**
   * Cache ownership data for an address
   */
  cacheOwnership(address: string, ownership: NFTOwnership): void {
    try {
      const entry = this.createCacheEntry(ownership);
      this.cache.ownership.set(address, entry);
      this.enforceMaxSize(this.cache.ownership);

      if (this.strategy !== 'memory') {
        this.saveToStorage();
      }
    } catch (error) {
      throw new NFTCacheError('Failed to cache ownership', { address, error });
    }
  }

  /**
   * Get cached ownership data for an address
   */
  getCachedOwnership(address: string): NFTOwnership | null {
    try {
      const entry = this.cache.ownership.get(address);
      if (!entry) return null;

      if (this.isExpired(entry)) {
        this.cache.ownership.delete(address);
        return null;
      }

      return entry.data as NFTOwnership;
    } catch (error) {
      console.warn('Failed to get cached ownership:', error);
      return null;
    }
  }

  /**
   * Cache collection data
   */
  cacheCollection(collectionKey: string, data: any): void {
    try {
      const entry = this.createCacheEntry(data);
      this.cache.collections.set(collectionKey, entry);
      this.enforceMaxSize(this.cache.collections);

      if (this.strategy !== 'memory') {
        this.saveToStorage();
      }
    } catch (error) {
      throw new NFTCacheError('Failed to cache collection', { collectionKey, error });
    }
  }

  /**
   * Get cached collection data
   */
  getCachedCollection(collectionKey: string): any | null {
    try {
      const entry = this.cache.collections.get(collectionKey);
      if (!entry) return null;

      if (this.isExpired(entry)) {
        this.cache.collections.delete(collectionKey);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to get cached collection:', error);
      return null;
    }
  }

  /**
   * Invalidate cache for specific address
   */
  invalidateOwnership(address: string): void {
    this.cache.ownership.delete(address);
    
    // Also remove related moments
    for (const [key, entry] of this.cache.moments.entries()) {
      const moment = entry.data as NFTMoment;
      if (moment.ownerAddress === address) {
        this.cache.moments.delete(key);
      }
    }

    if (this.strategy !== 'memory') {
      this.saveToStorage();
    }
  }

  /**
   * Invalidate specific moment cache
   */
  invalidateMoment(momentId: string): void {
    this.cache.moments.delete(momentId);

    if (this.strategy !== 'memory') {
      this.saveToStorage();
    }
  }

  /**
   * Clear all cache data
   */
  clearCache(): void {
    this.cache.moments.clear();
    this.cache.ownership.clear();
    this.cache.collections.clear();

    if (this.strategy !== 'memory') {
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem(this.storageKey);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    moments: number;
    ownership: number;
    collections: number;
    totalSize: number;
    hitRate?: number;
  } {
    return {
      moments: this.cache.moments.size,
      ownership: this.cache.ownership.size,
      collections: this.cache.collections.size,
      totalSize: this.cache.moments.size + this.cache.ownership.size + this.cache.collections.size,
    };
  }

  /**
   * Preload ownership data for multiple addresses
   */
  async preloadOwnership(
    addresses: string[],
    fetchFunction: (address: string) => Promise<NFTAPIResponse<NFTOwnership>>
  ): Promise<void> {
    const uncachedAddresses = addresses.filter(address => 
      !this.getCachedOwnership(address)
    );

    if (uncachedAddresses.length === 0) return;

    // Fetch in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < uncachedAddresses.length; i += batchSize) {
      const batch = uncachedAddresses.slice(i, i + batchSize);
      
      const promises = batch.map(async (address) => {
        try {
          const response = await fetchFunction(address);
          if (response.success && response.data) {
            this.cacheOwnership(address, response.data);
          }
        } catch (error) {
          console.warn(`Failed to preload ownership for ${address}:`, error);
        }
      });

      await Promise.all(promises);
      
      // Add delay between batches
      if (i + batchSize < uncachedAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Refresh expired cache entries
   */
  async refreshExpiredEntries(
    fetchOwnership: (address: string) => Promise<NFTAPIResponse<NFTOwnership>>,
    fetchMoment: (momentId: string) => Promise<NFTAPIResponse<NFTMoment>>
  ): Promise<void> {
    const now = Date.now();
    const expiredOwnership: string[] = [];
    const expiredMoments: string[] = [];

    // Find expired entries
    for (const [address, entry] of this.cache.ownership.entries()) {
      if (now > entry.expiresAt) {
        expiredOwnership.push(address);
      }
    }

    for (const [momentId, entry] of this.cache.moments.entries()) {
      if (now > entry.expiresAt) {
        expiredMoments.push(momentId);
      }
    }

    // Refresh expired ownership data
    if (expiredOwnership.length > 0) {
      await this.preloadOwnership(expiredOwnership, fetchOwnership);
    }

    // Refresh expired moment data
    for (const momentId of expiredMoments) {
      try {
        const response = await fetchMoment(momentId);
        if (response.success && response.data) {
          this.cacheMoment(momentId, response.data);
        }
      } catch (error) {
        console.warn(`Failed to refresh moment ${momentId}:`, error);
      }
    }
  }

  /**
   * Export cache data for backup
   */
  exportCache(): string {
    const data = {
      moments: Object.fromEntries(this.cache.moments),
      ownership: Object.fromEntries(this.cache.ownership),
      collections: Object.fromEntries(this.cache.collections),
      metadata: {
        strategy: this.strategy,
        ttl: this.ttl,
        maxSize: this.maxSize,
        exportedAt: Date.now(),
      },
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import cache data from backup
   */
  importCache(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.moments) {
        this.cache.moments = new Map(Object.entries(parsed.moments));
      }
      if (parsed.ownership) {
        this.cache.ownership = new Map(Object.entries(parsed.ownership));
      }
      if (parsed.collections) {
        this.cache.collections = new Map(Object.entries(parsed.collections));
      }

      if (this.strategy !== 'memory') {
        this.saveToStorage();
      }
    } catch (error) {
      throw new NFTCacheError('Failed to import cache data', { error });
    }
  }
}

// Default cache instance
export const nftCache = new NFTCacheService({
  strategy: 'localStorage',
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  storageKey: 'shotcaller_nft_cache',
});

// Utility functions for cache management
export const createCacheKey = (prefix: string, ...parts: string[]): string => {
  return `${prefix}:${parts.join(':')}`;
};

export const isCacheEnabled = (): boolean => {
  return typeof window !== 'undefined' && 
         (window.localStorage !== undefined || window.sessionStorage !== undefined);
};

export const getCacheSize = (): number => {
  if (!isCacheEnabled()) return 0;
  
  try {
    const storage = window.localStorage;
    let size = 0;
    for (let key in storage) {
      if (storage.hasOwnProperty(key)) {
        size += storage[key].length;
      }
    }
    return size;
  } catch (error) {
    return 0;
  }
};