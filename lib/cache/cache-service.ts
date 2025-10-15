import { redisCache, CACHE_PREFIXES, CACHE_TTL } from './redis-client';
import type { NFTMoment, MarketplaceListing, PlayerStats, User, Contest } from '@/lib/types';

export class CacheService {
  // NFT Caching
  async getNFT(momentId: string): Promise<NFTMoment | null> {
    return redisCache.get<NFTMoment>(momentId, {
      prefix: CACHE_PREFIXES.NFT,
      ttl: CACHE_TTL.LONG,
    });
  }

  async setNFT(momentId: string, nft: NFTMoment): Promise<boolean> {
    return redisCache.set(momentId, nft, {
      prefix: CACHE_PREFIXES.NFT,
      ttl: CACHE_TTL.LONG,
    });
  }

  async getUserNFTs(walletAddress: string): Promise<NFTMoment[] | null> {
    return redisCache.get<NFTMoment[]>(`user:${walletAddress}`, {
      prefix: CACHE_PREFIXES.NFT,
      ttl: CACHE_TTL.MEDIUM,
    });
  }

  async setUserNFTs(walletAddress: string, nfts: NFTMoment[]): Promise<boolean> {
    return redisCache.set(`user:${walletAddress}`, nfts, {
      prefix: CACHE_PREFIXES.NFT,
      ttl: CACHE_TTL.MEDIUM,
    });
  }

  async invalidateUserNFTs(walletAddress: string): Promise<boolean> {
    return redisCache.del(`user:${walletAddress}`, {
      prefix: CACHE_PREFIXES.NFT,
    });
  }

  // Marketplace Caching
  async getMarketplaceListings(): Promise<MarketplaceListing[] | null> {
    return redisCache.get<MarketplaceListing[]>('all', {
      prefix: CACHE_PREFIXES.MARKETPLACE,
      ttl: CACHE_TTL.SHORT,
    });
  }

  async setMarketplaceListings(listings: MarketplaceListing[]): Promise<boolean> {
    return redisCache.set('all', listings, {
      prefix: CACHE_PREFIXES.MARKETPLACE,
      ttl: CACHE_TTL.SHORT,
    });
  }

  async getMarketplaceListing(listingId: string): Promise<MarketplaceListing | null> {
    return redisCache.get<MarketplaceListing>(listingId, {
      prefix: CACHE_PREFIXES.MARKETPLACE,
      ttl: CACHE_TTL.SHORT,
    });
  }

  async setMarketplaceListing(listingId: string, listing: MarketplaceListing): Promise<boolean> {
    return redisCache.set(listingId, listing, {
      prefix: CACHE_PREFIXES.MARKETPLACE,
      ttl: CACHE_TTL.SHORT,
    });
  }

  async invalidateMarketplace(): Promise<number> {
    return redisCache.invalidatePattern('*', {
      prefix: CACHE_PREFIXES.MARKETPLACE,
    });
  }

  async getUserMarketplaceListings(walletAddress: string): Promise<MarketplaceListing[] | null> {
    return redisCache.get<MarketplaceListing[]>(`user:${walletAddress}`, {
      prefix: CACHE_PREFIXES.MARKETPLACE,
      ttl: CACHE_TTL.SHORT,
    });
  }

  async setUserMarketplaceListings(walletAddress: string, listings: MarketplaceListing[]): Promise<boolean> {
    return redisCache.set(`user:${walletAddress}`, listings, {
      prefix: CACHE_PREFIXES.MARKETPLACE,
      ttl: CACHE_TTL.SHORT,
    });
  }

  // Player Stats Caching
  async getPlayerStats(playerName: string, date: string): Promise<PlayerStats | null> {
    return redisCache.get<PlayerStats>(`${playerName}:${date}`, {
      prefix: CACHE_PREFIXES.PLAYER_STATS,
      ttl: CACHE_TTL.VERY_LONG,
    });
  }

  async setPlayerStats(playerName: string, date: string, stats: PlayerStats): Promise<boolean> {
    return redisCache.set(`${playerName}:${date}`, stats, {
      prefix: CACHE_PREFIXES.PLAYER_STATS,
      ttl: CACHE_TTL.VERY_LONG,
    });
  }

  async getPlayerStatsRange(playerName: string, startDate: string, endDate: string): Promise<PlayerStats[] | null> {
    return redisCache.get<PlayerStats[]>(`${playerName}:${startDate}:${endDate}`, {
      prefix: CACHE_PREFIXES.PLAYER_STATS,
      ttl: CACHE_TTL.LONG,
    });
  }

  async setPlayerStatsRange(playerName: string, startDate: string, endDate: string, stats: PlayerStats[]): Promise<boolean> {
    return redisCache.set(`${playerName}:${startDate}:${endDate}`, stats, {
      prefix: CACHE_PREFIXES.PLAYER_STATS,
      ttl: CACHE_TTL.LONG,
    });
  }

  // Leaderboard Caching
  async getLeaderboard(type: 'weekly' | 'season', identifier?: string): Promise<any[] | null> {
    const key = identifier ? `${type}:${identifier}` : type;
    return redisCache.get<any[]>(key, {
      prefix: CACHE_PREFIXES.LEADERBOARD,
      ttl: CACHE_TTL.SHORT,
    });
  }

  async setLeaderboard(type: 'weekly' | 'season', data: any[], identifier?: string): Promise<boolean> {
    const key = identifier ? `${type}:${identifier}` : type;
    return redisCache.set(key, data, {
      prefix: CACHE_PREFIXES.LEADERBOARD,
      ttl: CACHE_TTL.SHORT,
    });
  }

  async invalidateLeaderboards(): Promise<number> {
    return redisCache.invalidatePattern('*', {
      prefix: CACHE_PREFIXES.LEADERBOARD,
    });
  }

  // User Caching
  async getUser(walletAddress: string): Promise<User | null> {
    return redisCache.get<User>(walletAddress, {
      prefix: CACHE_PREFIXES.USER,
      ttl: CACHE_TTL.MEDIUM,
    });
  }

  async setUser(walletAddress: string, user: User): Promise<boolean> {
    return redisCache.set(walletAddress, user, {
      prefix: CACHE_PREFIXES.USER,
      ttl: CACHE_TTL.MEDIUM,
    });
  }

  async invalidateUser(walletAddress: string): Promise<boolean> {
    return redisCache.del(walletAddress, {
      prefix: CACHE_PREFIXES.USER,
    });
  }

  // Contest Caching
  async getContest(contestId: string): Promise<Contest | null> {
    return redisCache.get<Contest>(contestId, {
      prefix: CACHE_PREFIXES.CONTEST,
      ttl: CACHE_TTL.MEDIUM,
    });
  }

  async setContest(contestId: string, contest: Contest): Promise<boolean> {
    return redisCache.set(contestId, contest, {
      prefix: CACHE_PREFIXES.CONTEST,
      ttl: CACHE_TTL.MEDIUM,
    });
  }

  async getActiveContests(): Promise<Contest[] | null> {
    return redisCache.get<Contest[]>('active', {
      prefix: CACHE_PREFIXES.CONTEST,
      ttl: CACHE_TTL.SHORT,
    });
  }

  async setActiveContests(contests: Contest[]): Promise<boolean> {
    return redisCache.set('active', contests, {
      prefix: CACHE_PREFIXES.CONTEST,
      ttl: CACHE_TTL.SHORT,
    });
  }

  // Treasury Caching
  async getTreasuryStatus(): Promise<any | null> {
    return redisCache.get<any>('status', {
      prefix: CACHE_PREFIXES.TREASURY,
      ttl: CACHE_TTL.SHORT,
    });
  }

  async setTreasuryStatus(status: any): Promise<boolean> {
    return redisCache.set('status', status, {
      prefix: CACHE_PREFIXES.TREASURY,
      ttl: CACHE_TTL.SHORT,
    });
  }

  // Generic cache methods
  async warmupCache(): Promise<void> {
    try {
      await redisCache.connect();
      console.log('Cache warmed up successfully');
    } catch (error) {
      console.error('Failed to warm up cache:', error);
    }
  }

  // Test cache functionality
  async testCache(): Promise<boolean> {
    try {
      const testKey = 'cache:test';
      const testData = { timestamp: Date.now(), test: true };
      
      await this.set(testKey, testData);
      const retrieved = await this.get(testKey);
      await this.del(testKey);
      
      return retrieved !== null && retrieved.timestamp === testData.timestamp;
    } catch (error) {
      console.error('Cache test failed:', error);
      return false;
    }
  }

  // Set with generic key (for testing)
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    return redisCache.set(key, value, { ttl: ttl || 300 });
  }

  // Get with generic key (for testing)
  async get<T>(key: string): Promise<T | null> {
    return redisCache.get<T>(key);
  }

  // Delete with generic key (for testing)
  async del(key: string): Promise<boolean> {
    return redisCache.del(key);
  }

  async clearAllCache(): Promise<void> {
    try {
      const patterns = Object.values(CACHE_PREFIXES);
      for (const prefix of patterns) {
        await redisCache.invalidatePattern('*', { prefix });
      }
      console.log('All cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  isHealthy(): boolean {
    return redisCache.isHealthy();
  }
}

export const cacheService = new CacheService();