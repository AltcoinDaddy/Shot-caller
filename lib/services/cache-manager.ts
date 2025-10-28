/**
 * Cache Manager
 * Central orchestrator for all caching operations, integrating intelligent caching,
 * warming strategies, and monitoring
 */

import { intelligentCache, IntelligentCacheService } from './intelligent-cache-service';
import { CacheWarmingService } from './cache-warming-service';
import { CacheMonitoringService } from './cache-monitoring-service';
import { SyncEventBus } from './sync-event-bus';

export interface CacheManagerConfig {
  cache: {
    maxSize: number;
    defaultTTL: number;
    enableCompression: boolean;
    compressionThreshold: number;
  };
  warming: {
    enableAutoWarmup: boolean;
    warmupOnConnect: boolean;
    maxConcurrentWarmups: number;
  };
  monitoring: {
    enableMonitoring: boolean;
    metricsInterval: number;
    enableAlerts: boolean;
  };
}

export class CacheManager {
  private cacheService: IntelligentCacheService;
  private warmingService: CacheWarmingService;
  private monitoringService: CacheMonitoringService;
  private eventBus: SyncEventBus;
  private initialized = false;

  constructor(
    eventBus: SyncEventBus,
    config: Partial<CacheManagerConfig> = {}
  ) {
    this.eventBus = eventBus;
    
    const defaultConfig: CacheManagerConfig = {
      cache: {
        maxSize: 50 * 1024 * 1024, // 50MB
        defaultTTL: 5 * 60 * 1000, // 5 minutes
        enableCompression: true,
        compressionThreshold: 10 * 1024 // 10KB
      },
      warming: {
        enableAutoWarmup: true,
        warmupOnConnect: true,
        maxConcurrentWarmups: 3
      },
      monitoring: {
        enableMonitoring: true,
        metricsInterval: 30000, // 30 seconds
        enableAlerts: true
      }
    };

    const mergedConfig = this.mergeConfig(defaultConfig, config);
    
    this.cacheService = intelligentCache;
    this.warmingService = new CacheWarmingService(eventBus, mergedConfig.warming);
    this.monitoringService = new CacheMonitoringService(mergedConfig.monitoring);
    
    this.setupEventHandlers();
  }

  /**
   * Initialize the cache manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Start monitoring
      this.monitoringService.startMonitoring();
      
      // Execute initial warmup strategies
      await this.warmingService.executeWarmupStrategies();
      
      this.initialized = true;
      console.log('Cache Manager initialized successfully');
    } catch (error) {
      console.error('Cache Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Shutdown the cache manager
   */
  shutdown(): void {
    this.monitoringService.stopMonitoring();
    this.warmingService.stopAllWarmups();
    this.cacheService.clear();
    this.initialized = false;
    console.log('Cache Manager shutdown completed');
  }

  /**
   * Get data from cache with automatic warming
   */
  async get<T>(key: string, options?: {
    fallback?: () => Promise<T>;
    warmup?: boolean;
    tags?: string[];
  }): Promise<T | null> {
    const { fallback, warmup = true, tags = [] } = options || {};
    
    // Try to get from cache first
    let data = await this.cacheService.get<T>(key);
    
    if (data === null && fallback) {
      // Cache miss - fetch data and cache it
      try {
        data = await fallback();
        if (data !== null) {
          await this.cacheService.set(key, data, { tags });
        }
      } catch (error) {
        console.error(`Fallback fetch failed for key ${key}:`, error);
        return null;
      }
    }
    
    // Trigger warmup for related data if enabled
    if (warmup && data !== null) {
      this.triggerRelatedWarmup(key, tags);
    }
    
    return data;
  }

  /**
   * Set data in cache with intelligent optimization
   */
  async set<T>(key: string, data: T, options?: {
    ttl?: number;
    tags?: string[];
    version?: string;
    priority?: number;
  }): Promise<void> {
    await this.cacheService.set(key, data, options);
  }

  /**
   * Invalidate cache entries by pattern or tags
   */
  invalidate(criteria: {
    keys?: string[];
    tags?: string[];
    pattern?: RegExp;
  }): void {
    const { keys, tags, pattern } = criteria;
    
    if (keys) {
      keys.forEach(key => this.cacheService.cache.delete(key));
    }
    
    if (tags) {
      this.cacheService.invalidateByTags(tags);
    }
    
    if (pattern) {
      const keysToDelete: string[] = [];
      for (const key of this.cacheService.cache.keys()) {
        if (pattern.test(key)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cacheService.cache.delete(key));
    }
  }

  /**
   * Warm up cache for specific user
   */
  async warmupUser(address: string): Promise<void> {
    await Promise.all([
      this.warmingService.warmupProfileData(address),
      this.warmingService.warmupNFTData(address)
    ]);
  }

  /**
   * Warm up general game data
   */
  async warmupGameData(): Promise<void> {
    await this.warmingService.warmupGameData();
  }

  /**
   * Get comprehensive cache status
   */
  getStatus(): {
    cache: {
      entries: number;
      size: number;
      hitRate: number;
    };
    warming: {
      activeWarmups: string[];
      totalStrategies: number;
    };
    monitoring: {
      healthScore: number;
      activeAlerts: number;
    };
  } {
    const cacheStats = this.cacheService.getStats();
    const cacheSizeInfo = this.cacheService.getSizeInfo();
    const warmupStatus = this.warmingService.getWarmupStatus();
    const healthReport = this.monitoringService.getHealthReport();
    const activeAlerts = this.monitoringService.getActiveAlerts();

    return {
      cache: {
        entries: cacheSizeInfo.entries,
        size: cacheSizeInfo.totalSize,
        hitRate: cacheStats.hitRate
      },
      warming: {
        activeWarmups: warmupStatus.activeWarmups,
        totalStrategies: warmupStatus.totalStrategies
      },
      monitoring: {
        healthScore: healthReport.overallHealth,
        activeAlerts: activeAlerts.length
      }
    };
  }

  /**
   * Get detailed performance metrics
   */
  getMetrics(): {
    current: any;
    historical: any[];
    recommendations: any[];
  } {
    const currentMetrics = this.monitoringService.getCurrentMetrics();
    const historicalMetrics = this.monitoringService.getHistoricalMetrics(1);
    const recommendations = this.monitoringService.getOptimizationRecommendations();

    return {
      current: currentMetrics,
      historical: historicalMetrics,
      recommendations
    };
  }

  /**
   * Optimize cache performance based on current metrics
   */
  async optimizePerformance(): Promise<{
    actionsPerformed: string[];
    expectedImpact: string[];
  }> {
    const recommendations = this.monitoringService.getOptimizationRecommendations();
    const actionsPerformed: string[] = [];
    const expectedImpact: string[] = [];

    for (const rec of recommendations.filter(r => r.priority === 'high')) {
      switch (rec.action) {
        case 'Improve Cache Hit Rate':
          // Trigger aggressive warmup
          await this.warmingService.executeWarmupStrategies();
          actionsPerformed.push('Executed warmup strategies');
          expectedImpact.push('Improved cache hit rate');
          break;
          
        case 'Optimize Memory Usage':
          // Force eviction of least used entries
          this.forceEviction(0.2); // Evict 20% of entries
          actionsPerformed.push('Forced cache eviction');
          expectedImpact.push('Reduced memory usage');
          break;
      }
    }

    return { actionsPerformed, expectedImpact };
  }

  /**
   * Export cache data for backup or analysis
   */
  exportCacheData(): {
    entries: Array<{ key: string; data: any; metadata: any }>;
    stats: any;
    timestamp: Date;
  } {
    const entries: Array<{ key: string; data: any; metadata: any }> = [];
    
    for (const [key, entry] of this.cacheService.cache.entries()) {
      entries.push({
        key,
        data: entry.data,
        metadata: {
          timestamp: entry.timestamp,
          expiresAt: entry.expiresAt,
          accessCount: entry.accessCount,
          size: entry.size,
          tags: entry.tags
        }
      });
    }

    return {
      entries,
      stats: this.cacheService.getStats(),
      timestamp: new Date()
    };
  }

  /**
   * Import cache data from backup
   */
  async importCacheData(data: {
    entries: Array<{ key: string; data: any; metadata: any }>;
  }): Promise<void> {
    for (const entry of data.entries) {
      // Only import non-expired entries
      if (new Date(entry.metadata.expiresAt) > new Date()) {
        await this.cacheService.set(entry.key, entry.data, {
          tags: entry.metadata.tags || []
        });
      }
    }
    
    console.log(`Imported ${data.entries.length} cache entries`);
  }

  private setupEventHandlers(): void {
    // Handle sync events for cache invalidation
    this.eventBus.subscribe('wallet_connected', (event) => {
      this.cacheService.invalidateByEvent(event);
    });

    this.eventBus.subscribe('wallet_disconnected', (event) => {
      this.cacheService.invalidateByEvent(event);
    });

    this.eventBus.subscribe('nft_collection_updated', (event) => {
      this.cacheService.invalidateByEvent(event);
    });

    this.eventBus.subscribe('profile_sync_completed', (event) => {
      this.cacheService.invalidateByEvent(event);
    });

    // Handle cache alerts
    if (typeof window !== 'undefined') {
      // Monitor for memory pressure
      if ('memory' in performance) {
        setInterval(() => {
          const memInfo = (performance as any).memory;
          if (memInfo && memInfo.usedJSHeapSize > memInfo.jsHeapSizeLimit * 0.9) {
            this.forceEviction(0.3); // Aggressive eviction on memory pressure
          }
        }, 60000); // Check every minute
      }
    }
  }

  private triggerRelatedWarmup(key: string, tags: string[]): void {
    // Trigger warmup for related data based on access patterns
    if (key.includes('profile:') && !tags.includes('warmup-triggered')) {
      const address = key.split(':')[1];
      if (address) {
        // Don't await - run in background
        this.warmingService.warmupNFTData(address).catch(console.error);
      }
    }
    
    if (key.includes('nft:') && !tags.includes('warmup-triggered')) {
      // Warmup game data when NFT data is accessed
      this.warmingService.warmupGameData().catch(console.error);
    }
  }

  private forceEviction(percentage: number): void {
    const entries = Array.from(this.cacheService.cache.entries());
    const toEvict = Math.floor(entries.length * percentage);
    
    // Sort by access count (LFU) and evict least frequently used
    entries
      .sort(([, a], [, b]) => a.accessCount - b.accessCount)
      .slice(0, toEvict)
      .forEach(([key]) => this.cacheService.cache.delete(key));
      
    console.log(`Force evicted ${toEvict} cache entries`);
  }

  private mergeConfig(
    defaultConfig: CacheManagerConfig, 
    userConfig: Partial<CacheManagerConfig>
  ): CacheManagerConfig {
    return {
      cache: { ...defaultConfig.cache, ...userConfig.cache },
      warming: { ...defaultConfig.warming, ...userConfig.warming },
      monitoring: { ...defaultConfig.monitoring, ...userConfig.monitoring }
    };
  }
}

// Export singleton instance
let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(eventBus?: SyncEventBus, config?: Partial<CacheManagerConfig>): CacheManager {
  if (!cacheManagerInstance && eventBus) {
    cacheManagerInstance = new CacheManager(eventBus, config);
  }
  
  if (!cacheManagerInstance) {
    throw new Error('CacheManager not initialized. Provide eventBus on first call.');
  }
  
  return cacheManagerInstance;
}