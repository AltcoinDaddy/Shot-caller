import { createClient, RedisClientType } from 'redis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

class RedisCache {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionErrorLogged = false;
  private readonly defaultTTL = 3600; // 1 hour default

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      });

      this.client.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
          // Don't spam logs for connection refused errors
          if (!this.connectionErrorLogged) {
            console.warn('Redis connection refused - running without cache');
            this.connectionErrorLogged = true;
          }
        } else {
          console.error('Redis Client Error:', err);
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  private getKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const fullKey = this.getKey(key, options?.prefix);
      const value = await this.client.get(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const fullKey = this.getKey(key, options?.prefix);
      const ttl = options?.ttl || this.defaultTTL;
      const serializedValue = JSON.stringify(value);
      
      await this.client.setEx(fullKey, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const fullKey = this.getKey(key, options?.prefix);
      await this.client.del(fullKey);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const fullKey = this.getKey(key, options?.prefix);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async mget<T>(keys: string[], options?: CacheOptions): Promise<(T | null)[]> {
    if (!this.isConnected || !this.client) {
      return keys.map(() => null);
    }

    try {
      const fullKeys = keys.map(key => this.getKey(key, options?.prefix));
      const values = await this.client.mGet(fullKeys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Redis mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset<T>(keyValuePairs: Array<[string, T]>, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const pipeline = this.client.multi();
      const ttl = options?.ttl || this.defaultTTL;

      keyValuePairs.forEach(([key, value]) => {
        const fullKey = this.getKey(key, options?.prefix);
        const serializedValue = JSON.stringify(value);
        pipeline.setEx(fullKey, ttl, serializedValue);
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Redis mset error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern: string, options?: CacheOptions): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const fullPattern = this.getKey(pattern, options?.prefix);
      const keys = await this.client.keys(fullPattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Redis invalidatePattern error:', error);
      return 0;
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }
}

// Singleton instance
const redisCache = new RedisCache();

// Cache key prefixes for different data types
export const CACHE_PREFIXES = {
  NFT: 'nft',
  MARKETPLACE: 'marketplace',
  PLAYER_STATS: 'player_stats',
  LEADERBOARD: 'leaderboard',
  USER: 'user',
  CONTEST: 'contest',
  TREASURY: 'treasury',
  BOOSTER: 'booster',
  PREMIUM: 'premium',
} as const;

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

export { redisCache };
export type { CacheOptions };