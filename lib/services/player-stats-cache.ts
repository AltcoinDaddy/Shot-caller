import { PlayerStats } from '@/lib/types/player-stats';

export interface CacheEntry {
  data: PlayerStats;
  timestamp: Date;
  expiresAt: Date;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  lastCleanup: Date;
}

export class PlayerStatsCache {
  private cache: Map<string, CacheEntry> = new Map();
  private hits: number = 0;
  private misses: number = 0;
  private readonly defaultTTL: number = 60 * 60 * 1000; // 1 hour in milliseconds
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(ttlMs: number = 60 * 60 * 1000) {
    this.defaultTTL = ttlMs;
    this.startCleanupInterval();
  }

  /**
   * Get player stats from cache
   */
  get(playerId: string, gameDate: Date): PlayerStats | null {
    const key = this.generateKey(playerId, gameDate);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  /**
   * Set player stats in cache
   */
  set(playerStats: PlayerStats, ttlMs?: number): void {
    const key = this.generateKey(playerStats.id.split('_')[1], playerStats.gameDate);
    const ttl = ttlMs || this.defaultTTL;
    const expiresAt = new Date(Date.now() + ttl);

    const entry: CacheEntry = {
      data: playerStats,
      timestamp: new Date(),
      expiresAt
    };

    this.cache.set(key, entry);
  }

  /**
   * Get multiple player stats from cache
   */
  getMultiple(playerIds: string[], gameDate: Date): Map<string, PlayerStats> {
    const results = new Map<string, PlayerStats>();

    playerIds.forEach(playerId => {
      const stats = this.get(playerId, gameDate);
      if (stats) {
        results.set(playerId, stats);
      }
    });

    return results;
  }

  /**
   * Set multiple player stats in cache
   */
  setMultiple(playerStats: PlayerStats[], ttlMs?: number): void {
    playerStats.forEach(stats => {
      this.set(stats, ttlMs);
    });
  }

  /**
   * Get daily stats from cache
   */
  getDailyStats(sport: 'NBA' | 'NFL', gameDate: Date): PlayerStats[] {
    const dailyKey = this.generateDailyKey(sport, gameDate);
    const entry = this.cache.get(dailyKey);

    if (!entry || this.isExpired(entry)) {
      this.misses++;
      return [];
    }

    this.hits++;
    return entry.data as any; // Daily stats are stored as array
  }

  /**
   * Set daily stats in cache
   */
  setDailyStats(sport: 'NBA' | 'NFL', gameDate: Date, stats: PlayerStats[], ttlMs?: number): void {
    const dailyKey = this.generateDailyKey(sport, gameDate);
    const ttl = ttlMs || this.defaultTTL;
    const expiresAt = new Date(Date.now() + ttl);

    const entry: CacheEntry = {
      data: stats as any, // Store array as data
      timestamp: new Date(),
      expiresAt
    };

    this.cache.set(dailyKey, entry);
  }

  /**
   * Clear expired entries from cache
   */
  cleanup(): number {
    const now = new Date();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    
    return {
      totalEntries: this.cache.size,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.misses / totalRequests : 0,
      lastCleanup: new Date()
    };
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return new Date() > entry.expiresAt;
  }

  /**
   * Generate cache key for player stats
   */
  private generateKey(playerId: string, gameDate: Date): string {
    const dateStr = gameDate.toISOString().split('T')[0];
    return `player_${playerId}_${dateStr}`;
  }

  /**
   * Generate cache key for daily stats
   */
  private generateDailyKey(sport: 'NBA' | 'NFL', gameDate: Date): string {
    const dateStr = gameDate.toISOString().split('T')[0];
    return `daily_${sport}_${dateStr}`;
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    // Run cleanup every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30 * 60 * 1000);
  }

  /**
   * Stop automatic cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    this.stopCleanupInterval();
    this.clear();
  }
}