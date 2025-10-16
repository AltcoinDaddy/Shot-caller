import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from './cache-service';

interface CacheOptions {
  ttl?: number;
  skipCache?: boolean;
  cacheKey?: string;
  varyBy?: string[];
}

export function withCache(options: CacheOptions = {}) {
  return function <T>(
    handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse<T>>
  ) {
    return async function cachedHandler(req: NextRequest, ...args: any[]): Promise<NextResponse<T>> {
      const { ttl = 300, skipCache = false, cacheKey, varyBy = [] } = options;

      if (skipCache || req.method !== 'GET') {
        return handler(req, ...args);
      }

      // Generate cache key
      const url = new URL(req.url);
      const baseKey = cacheKey || `${url.pathname}${url.search}`;
      
      // Add vary parameters to cache key
      const varyParams = varyBy.map(param => {
        const value = req.headers.get(param) || req.nextUrl.searchParams.get(param);
        return `${param}:${value}`;
      }).join('|');
      
      const finalCacheKey = varyParams ? `${baseKey}|${varyParams}` : baseKey;

      try {
        // Try to get from cache
        const cached = await cacheService.getAPIResponse<T>(finalCacheKey);
        if (cached) {
          console.log(`Cache hit for ${finalCacheKey}`);
          return NextResponse.json(cached, {
            headers: {
              'X-Cache': 'HIT',
              'Cache-Control': `public, max-age=${ttl}`,
            },
          });
        }

        // Execute handler
        const response = await handler(req, ...args);
        
        // Cache successful responses
        if (response.ok) {
          const data = await response.json();
          await cacheService.setAPIResponse(finalCacheKey, data, undefined, ttl);
          
          return NextResponse.json(data, {
            headers: {
              'X-Cache': 'MISS',
              'Cache-Control': `public, max-age=${ttl}`,
            },
          });
        }

        return response;
      } catch (error) {
        console.error('Cache middleware error:', error);
        return handler(req, ...args);
      }
    };
  };
}

// Specific cache configurations for different endpoints
export const CACHE_CONFIGS = {
  nfts: {
    ttl: 1800, // 30 minutes
    varyBy: ['wallet-address'],
  },
  marketplace: {
    ttl: 300, // 5 minutes
    varyBy: ['sport', 'rarity', 'price-range'],
  },
  leaderboard: {
    ttl: 600, // 10 minutes
    varyBy: ['week', 'season'],
  },
  playerStats: {
    ttl: 3600, // 1 hour
    varyBy: ['player', 'date-range'],
  },
  treasury: {
    ttl: 300, // 5 minutes
  },
  contests: {
    ttl: 600, // 10 minutes
  },
} as const;

// Cache invalidation utilities
export class CacheInvalidator {
  static async invalidateUserData(walletAddress: string): Promise<void> {
    await Promise.all([
      cacheService.invalidateUser(walletAddress),
      cacheService.invalidateUserNFTs(walletAddress),
      cacheService.invalidateAPIResponse('nfts', { walletAddress }),
      cacheService.invalidateAPIResponse('lineups', { walletAddress }),
      cacheService.invalidateAPIResponse('boosters', { walletAddress }),
    ]);
  }

  static async invalidateMarketplaceData(): Promise<void> {
    await Promise.all([
      cacheService.invalidateMarketplace(),
      cacheService.invalidateAPIResponse('marketplace'),
      cacheService.invalidateAPIResponse('marketplace/stats'),
    ]);
  }

  static async invalidateLeaderboardData(): Promise<void> {
    await Promise.all([
      cacheService.invalidateLeaderboards(),
      cacheService.invalidateAPIResponse('leaderboard'),
      cacheService.invalidateAPIResponse('leaderboard/weekly'),
      cacheService.invalidateAPIResponse('leaderboard/season'),
    ]);
  }

  static async invalidateContestData(contestId?: string): Promise<void> {
    await Promise.all([
      cacheService.invalidateAPIResponse('contests'),
      cacheService.invalidateAPIResponse('contests/available'),
      contestId && cacheService.invalidateAPIResponse(`contests/${contestId}`),
    ].filter(Boolean));
  }

  static async invalidatePlayerStats(playerName?: string, date?: string): Promise<void> {
    if (playerName && date) {
      await cacheService.del(`${playerName}:${date}`, { prefix: 'player_stats' });
    }
    await cacheService.invalidateAPIResponse('stats');
  }
}

// Cache warming utilities
export class CacheWarmer {
  static async warmupCommonEndpoints(): Promise<void> {
    const commonEndpoints = [
      '/api/contests/available',
      '/api/marketplace/listings',
      '/api/leaderboard',
      '/api/treasury/status',
    ];

    const warmupPromises = commonEndpoints.map(async (endpoint) => {
      try {
        // This would make actual requests to warm up the cache
        // In a real implementation, you'd make HTTP requests to these endpoints
        console.log(`Warming up cache for ${endpoint}`);
      } catch (error) {
        console.error(`Failed to warm up cache for ${endpoint}:`, error);
      }
    });

    await Promise.allSettled(warmupPromises);
  }

  static async warmupUserData(walletAddress: string): Promise<void> {
    try {
      // Warm up user-specific data
      await Promise.allSettled([
        cacheService.getUser(walletAddress),
        cacheService.getUserNFTs(walletAddress),
        cacheService.getUserMarketplaceListings(walletAddress),
      ]);
    } catch (error) {
      console.error(`Failed to warm up user data for ${walletAddress}:`, error);
    }
  }
}