/**
 * Intelligent Cache Service for Wallet-Profile Sync
 * Provides advanced caching with invalidation strategies, compression, and monitoring
 */

import { SyncEvent, SyncEventType } from './sync-event-bus';

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
  size: number;
  compressed: boolean;
  tags: string[];
  version: string;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  compressionRatio: number;
  averageAccessTime: number;
  evictionCount: number;
  warmupHits: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  compressionThreshold: number;
  enableCompression: boolean;
  enableWarmup: boolean;
  maxEntries: number;
  evictionPolicy: 'LRU' | 'LFU' | 'TTL';
}

export interface InvalidationStrategy {
  name: string;
  condition: (entry: CacheEntry, event: SyncEvent) => boolean;
  priority: number;
}

export class IntelligentCacheService {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats;
  private config: CacheConfig;
  private invalidationStrategies: InvalidationStrategy[] = [];
  private warmupQueue: Set<string> = new Set();
  private compressionWorker: Worker | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      compressionThreshold: 10 * 1024, // 10KB
      enableCompression: true,
      enableWarmup: true,
      maxEntries: 1000,
      evictionPolicy: 'LRU',
      ...config
    };

    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      compressionRatio: 0,
      averageAccessTime: 0,
      evictionCount: 0,
      warmupHits: 0
    };

    this.initializeInvalidationStrategies();
    this.initializeCompression();
  }

  /**
   * Get data from cache with intelligent access tracking
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.updateStats('miss');
      return null;
    }

    // Check expiration
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      this.updateStats('miss');
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = new Date();
    
    const accessTime = performance.now() - startTime;
    this.updateAccessTime(accessTime);
    this.updateStats('hit');

    // Decompress if needed
    let data = entry.data;
    if (entry.compressed && typeof data === 'string') {
      data = await this.decompress(data);
    }

    return data as T;
  }

  /**
   * Set data in cache with intelligent compression and eviction
   */
  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      tags?: string[];
      version?: string;
      priority?: number;
    } = {}
  ): Promise<void> {
    const {
      ttl = this.config.defaultTTL,
      tags = [],
      version = '1.0',
      priority = 1
    } = options;

    let processedData = data;
    let compressed = false;
    let size = this.calculateSize(data);

    // Apply compression if data exceeds threshold
    if (this.config.enableCompression && size > this.config.compressionThreshold) {
      try {
        processedData = await this.compress(data) as T;
        compressed = true;
        size = this.calculateSize(processedData);
      } catch (error) {
        console.warn('Compression failed, storing uncompressed:', error);
      }
    }

    const entry: CacheEntry<T> = {
      key,
      data: processedData,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + ttl),
      accessCount: 0,
      lastAccessed: new Date(),
      size,
      compressed,
      tags,
      version
    };

    // Check if eviction is needed
    if (this.needsEviction(size)) {
      await this.evictEntries(size);
    }

    this.cache.set(key, entry);
    this.updateCacheStats();
  }

  /**
   * Invalidate cache entries based on sync events
   */
  invalidateByEvent(event: SyncEvent): void {
    const keysToInvalidate: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      for (const strategy of this.invalidationStrategies) {
        if (strategy.condition(entry, event)) {
          keysToInvalidate.push(key);
          break;
        }
      }
    }

    keysToInvalidate.forEach(key => {
      this.cache.delete(key);
    });

    if (keysToInvalidate.length > 0) {
      console.log(`Invalidated ${keysToInvalidate.length} cache entries for event:`, event.type);
      this.updateCacheStats();
    }
  }

  /**
   * Invalidate cache entries by tags
   */
  invalidateByTags(tags: string[]): void {
    const keysToInvalidate: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToInvalidate.push(key);
      }
    }

    keysToInvalidate.forEach(key => {
      this.cache.delete(key);
    });

    this.updateCacheStats();
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmupCache(warmupData: Array<{ key: string; fetcher: () => Promise<any>; tags?: string[] }>): Promise<void> {
    if (!this.config.enableWarmup) return;

    const warmupPromises = warmupData.map(async ({ key, fetcher, tags = [] }) => {
      try {
        if (!this.cache.has(key)) {
          const data = await fetcher();
          await this.set(key, data, { tags: [...tags, 'warmup'] });
          this.warmupQueue.add(key);
          this.stats.warmupHits++;
        }
      } catch (error) {
        console.warn(`Cache warmup failed for key ${key}:`, error);
      }
    });

    await Promise.allSettled(warmupPromises);
    console.log(`Cache warmup completed for ${warmupData.length} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.warmupQueue.clear();
    this.updateCacheStats();
  }

  /**
   * Get cache size information
   */
  getSizeInfo(): { entries: number; totalSize: number; maxSize: number } {
    return {
      entries: this.cache.size,
      totalSize: this.stats.totalSize,
      maxSize: this.config.maxSize
    };
  }

  private initializeInvalidationStrategies(): void {
    this.invalidationStrategies = [
      {
        name: 'wallet-connection',
        condition: (entry, event) => 
          event.type === 'wallet_connected' || event.type === 'wallet_disconnected',
        priority: 1
      },
      {
        name: 'nft-collection-update',
        condition: (entry, event) => 
          event.type === 'nft_collection_updated' && 
          entry.tags.includes('nft') || entry.tags.includes('profile'),
        priority: 2
      },
      {
        name: 'profile-sync',
        condition: (entry, event) => 
          event.type === 'profile_sync_completed' && 
          entry.tags.includes('profile'),
        priority: 3
      },
      {
        name: 'version-mismatch',
        condition: (entry, event) => 
          event.data?.version && entry.version !== event.data.version,
        priority: 1
      }
    ];

    // Sort by priority
    this.invalidationStrategies.sort((a, b) => a.priority - b.priority);
  }

  private initializeCompression(): void {
    if (this.config.enableCompression && typeof Worker !== 'undefined') {
      try {
        // Initialize compression worker for large datasets
        this.compressionWorker = new Worker(
          URL.createObjectURL(new Blob([this.getCompressionWorkerCode()], { type: 'application/javascript' }))
        );
      } catch (error) {
        console.warn('Compression worker initialization failed:', error);
      }
    }
  }

  private async compress(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    
    if (this.compressionWorker) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Compression timeout')), 5000);
        
        this.compressionWorker!.onmessage = (e) => {
          clearTimeout(timeout);
          resolve(e.data);
        };
        
        this.compressionWorker!.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
        
        this.compressionWorker!.postMessage(jsonString);
      });
    }

    // Fallback to simple base64 encoding
    return btoa(jsonString);
  }

  private async decompress(compressedData: string): Promise<any> {
    if (this.compressionWorker) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Decompression timeout')), 5000);
        
        this.compressionWorker!.onmessage = (e) => {
          clearTimeout(timeout);
          resolve(JSON.parse(e.data));
        };
        
        this.compressionWorker!.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
        
        this.compressionWorker!.postMessage({ decompress: compressedData });
      });
    }

    // Fallback to simple base64 decoding
    return JSON.parse(atob(compressedData));
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private needsEviction(newEntrySize: number): boolean {
    return (
      this.stats.totalSize + newEntrySize > this.config.maxSize ||
      this.cache.size >= this.config.maxEntries
    );
  }

  private async evictEntries(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.cache.entries());
    let freedSpace = 0;

    switch (this.config.evictionPolicy) {
      case 'LRU':
        entries.sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
        break;
      case 'LFU':
        entries.sort(([, a], [, b]) => a.accessCount - b.accessCount);
        break;
      case 'TTL':
        entries.sort(([, a], [, b]) => a.expiresAt.getTime() - b.expiresAt.getTime());
        break;
    }

    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace && this.cache.size < this.config.maxEntries) {
        break;
      }

      this.cache.delete(key);
      freedSpace += entry.size;
      this.stats.evictionCount++;
    }
  }

  private updateStats(type: 'hit' | 'miss'): void {
    const totalRequests = (this.stats.hitRate + this.stats.missRate) || 1;
    
    if (type === 'hit') {
      this.stats.hitRate = (this.stats.hitRate * totalRequests + 1) / (totalRequests + 1);
    } else {
      this.stats.missRate = (this.stats.missRate * totalRequests + 1) / (totalRequests + 1);
    }
  }

  private updateAccessTime(accessTime: number): void {
    this.stats.averageAccessTime = (this.stats.averageAccessTime + accessTime) / 2;
  }

  private updateCacheStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
    
    const compressedEntries = Array.from(this.cache.values())
      .filter(entry => entry.compressed);
    
    if (compressedEntries.length > 0) {
      this.stats.compressionRatio = compressedEntries.length / this.cache.size;
    }
  }

  private getCompressionWorkerCode(): string {
    return `
      self.onmessage = function(e) {
        try {
          if (typeof e.data === 'object' && e.data.decompress) {
            // Decompression logic would go here
            self.postMessage(e.data.decompress);
          } else {
            // Compression logic would go here
            self.postMessage(btoa(e.data));
          }
        } catch (error) {
          self.onerror(error);
        }
      };
    `;
  }
}

// Export singleton instance
export const intelligentCache = new IntelligentCacheService();