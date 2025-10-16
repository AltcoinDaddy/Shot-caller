/**
 * Fallback service for handling API outages and providing cached/mock data
 */

import { offlineModeManager } from '@/lib/utils/offline-mode'

export interface FallbackConfig {
  useCache: boolean
  useMockData: boolean
  cacheExpirationMinutes: number
}

const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  useCache: true,
  useMockData: true,
  cacheExpirationMinutes: 60
}

/**
 * Mock data for fallback scenarios
 */
const MOCK_DATA = {
  nfts: [
    {
      id: 'mock-1',
      momentId: 1001,
      playerName: 'LeBron James',
      team: 'LAL',
      position: 'SF',
      sport: 'NBA',
      rarity: 'Legendary',
      metadata: { series: 'Series 1', set: 'Base Set' },
      imageUrl: '/lebron-james-nba-action.jpg'
    },
    {
      id: 'mock-2',
      momentId: 1002,
      playerName: 'Stephen Curry',
      team: 'GSW',
      position: 'PG',
      sport: 'NBA',
      rarity: 'Epic',
      metadata: { series: 'Series 1', set: 'Base Set' },
      imageUrl: '/stephen-curry-nba-shooting.jpg'
    },
    {
      id: 'mock-3',
      momentId: 2001,
      playerName: 'Patrick Mahomes',
      team: 'KC',
      position: 'QB',
      sport: 'NFL',
      rarity: 'Rare',
      metadata: { series: 'Series 1', set: 'Base Set' },
      imageUrl: '/patrick-mahomes-nfl-throwing.jpg'
    }
  ],

  contests: [
    {
      id: 'mock-contest-1',
      weekId: 1,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      totalParticipants: 156,
      maxParticipants: 500,
      entryFee: 10,
      prizePool: 1092,
      contestType: 'paid'
    }
  ],

  leaderboard: [
    {
      rank: 1,
      username: 'FlowMaster',
      totalPoints: 2847,
      weeklyPoints: 387,
      change: 2,
      avatar: '/placeholder-user.jpg'
    },
    {
      rank: 2,
      username: 'NFTChamp',
      totalPoints: 2756,
      weeklyPoints: 342,
      change: -1,
      avatar: '/placeholder-user.jpg'
    },
    {
      rank: 3,
      username: 'ShotCaller',
      totalPoints: 2698,
      weeklyPoints: 298,
      change: 1,
      avatar: '/placeholder-user.jpg'
    }
  ],

  marketplace: [
    {
      id: 'mock-listing-1',
      sellerAddress: '0x1234567890abcdef',
      momentId: 1001,
      price: 25.5,
      status: 'active',
      createdAt: new Date().toISOString(),
      nft: {
        playerName: 'LeBron James',
        team: 'LAL',
        rarity: 'Legendary',
        imageUrl: '/lebron-james-nba-action.jpg'
      }
    }
  ],

  boosters: [
    {
      id: 'energy-boost',
      name: 'Energy Boost',
      description: '+5% score multiplier for all players',
      price: 5,
      duration: 168, // 1 week in hours
      effectType: 'score_multiplier',
      effectValue: 1.05,
      available: true
    },
    {
      id: 'luck-charm',
      name: 'Luck Charm',
      description: 'Random bonus points (10-50)',
      price: 3,
      duration: 168,
      effectType: 'random_bonus',
      effectValue: 30,
      available: true
    }
  ],

  playerStats: {
    'lebron-james': {
      playerName: 'LeBron James',
      gameDate: new Date().toISOString(),
      sport: 'NBA',
      stats: {
        points: 28,
        rebounds: 8,
        assists: 7,
        steals: 2,
        blocks: 1,
        turnovers: 3
      },
      fantasyPoints: 52.5
    }
  },

  treasuryStatus: {
    balance: 15420.75,
    rewardPool: 10794.53,
    platformTreasury: 4626.22,
    totalTransactions: 1247,
    weeklyVolume: 2847.32
  }
}

class FallbackService {
  private config: FallbackConfig = DEFAULT_FALLBACK_CONFIG

  /**
   * Update fallback configuration
   */
  updateConfig(config: Partial<FallbackConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get fallback data for NFTs
   */
  async getNFTsFallback(walletAddress?: string): Promise<any[]> {
    // Try cache first
    if (this.config.useCache) {
      const cached = offlineModeManager.getCachedData(`nfts_owned_${walletAddress}`)
      if (cached) {
        console.log('Using cached NFT data as fallback')
        return cached
      }
    }

    // Use mock data
    if (this.config.useMockData) {
      console.log('Using mock NFT data as fallback')
      return MOCK_DATA.nfts
    }

    return []
  }

  /**
   * Get fallback data for contests
   */
  async getContestsFallback(): Promise<any[]> {
    if (this.config.useCache) {
      const cached = offlineModeManager.getCachedData('contests_available')
      if (cached) {
        console.log('Using cached contest data as fallback')
        return cached
      }
    }

    if (this.config.useMockData) {
      console.log('Using mock contest data as fallback')
      return MOCK_DATA.contests
    }

    return []
  }

  /**
   * Get fallback data for leaderboard
   */
  async getLeaderboardFallback(type: 'weekly' | 'season' = 'weekly'): Promise<any[]> {
    const cacheKey = `leaderboard_${type}`
    
    if (this.config.useCache) {
      const cached = offlineModeManager.getCachedData(cacheKey)
      if (cached) {
        console.log(`Using cached ${type} leaderboard data as fallback`)
        return cached
      }
    }

    if (this.config.useMockData) {
      console.log(`Using mock ${type} leaderboard data as fallback`)
      return MOCK_DATA.leaderboard
    }

    return []
  }

  /**
   * Get fallback data for marketplace
   */
  async getMarketplaceFallback(): Promise<any[]> {
    if (this.config.useCache) {
      const cached = offlineModeManager.getCachedData('marketplace_listings')
      if (cached) {
        console.log('Using cached marketplace data as fallback')
        return cached
      }
    }

    if (this.config.useMockData) {
      console.log('Using mock marketplace data as fallback')
      return MOCK_DATA.marketplace
    }

    return []
  }

  /**
   * Get fallback data for boosters
   */
  async getBoostersFallback(): Promise<any[]> {
    if (this.config.useCache) {
      const cached = offlineModeManager.getCachedData('boosters_available')
      if (cached) {
        console.log('Using cached booster data as fallback')
        return cached
      }
    }

    if (this.config.useMockData) {
      console.log('Using mock booster data as fallback')
      return MOCK_DATA.boosters
    }

    return []
  }

  /**
   * Get fallback data for player stats
   */
  async getPlayerStatsFallback(playerId: string): Promise<any | null> {
    const cacheKey = `player_stats_${playerId}`
    
    if (this.config.useCache) {
      const cached = offlineModeManager.getCachedData(cacheKey)
      if (cached) {
        console.log(`Using cached player stats for ${playerId} as fallback`)
        return cached
      }
    }

    if (this.config.useMockData) {
      const mockStats = MOCK_DATA.playerStats[playerId as keyof typeof MOCK_DATA.playerStats]
      if (mockStats) {
        console.log(`Using mock player stats for ${playerId} as fallback`)
        return mockStats
      }
    }

    return null
  }

  /**
   * Get fallback data for treasury status
   */
  async getTreasuryStatusFallback(): Promise<any> {
    if (this.config.useCache) {
      const cached = offlineModeManager.getCachedData('treasury_status')
      if (cached) {
        console.log('Using cached treasury status as fallback')
        return cached
      }
    }

    if (this.config.useMockData) {
      console.log('Using mock treasury status as fallback')
      return MOCK_DATA.treasuryStatus
    }

    return {
      balance: 0,
      rewardPool: 0,
      platformTreasury: 0,
      totalTransactions: 0,
      weeklyVolume: 0
    }
  }

  /**
   * Get fallback data for user lineup
   */
  async getLineupFallback(walletAddress: string): Promise<any | null> {
    const cacheKey = `lineup_current_${walletAddress}`
    
    if (this.config.useCache) {
      const cached = offlineModeManager.getCachedData(cacheKey)
      if (cached) {
        console.log('Using cached lineup data as fallback')
        return cached
      }
    }

    // No mock lineup data - return null to indicate no lineup
    return null
  }

  /**
   * Get fallback data for premium status
   */
  async getPremiumStatusFallback(walletAddress: string): Promise<any> {
    const cacheKey = `premium_status_${walletAddress}`
    
    if (this.config.useCache) {
      const cached = offlineModeManager.getCachedData(cacheKey)
      if (cached) {
        console.log('Using cached premium status as fallback')
        return cached
      }
    }

    // Default to no premium access
    return {
      hasAccess: false,
      accessType: null,
      expiresAt: null
    }
  }

  /**
   * Check if fallback data is available for a given type
   */
  hasFallbackData(type: string, identifier?: string): boolean {
    if (this.config.useCache) {
      const cacheKey = identifier ? `${type}_${identifier}` : type
      const cached = offlineModeManager.getCachedData(cacheKey)
      if (cached) return true
    }

    if (this.config.useMockData) {
      return type in MOCK_DATA
    }

    return false
  }

  /**
   * Preload fallback data into cache
   */
  async preloadFallbackData() {
    console.log('Preloading fallback data into cache...')
    
    const cacheData = [
      { key: 'contests_available', data: MOCK_DATA.contests },
      { key: 'leaderboard_weekly', data: MOCK_DATA.leaderboard },
      { key: 'leaderboard_season', data: MOCK_DATA.leaderboard },
      { key: 'marketplace_listings', data: MOCK_DATA.marketplace },
      { key: 'boosters_available', data: MOCK_DATA.boosters },
      { key: 'treasury_status', data: MOCK_DATA.treasuryStatus }
    ]

    cacheData.forEach(({ key, data }) => {
      offlineModeManager.cacheData(key, data, this.config.cacheExpirationMinutes)
    })

    console.log('Fallback data preloaded successfully')
  }

  /**
   * Clear all fallback cache data
   */
  clearFallbackCache() {
    offlineModeManager.clearCache()
    console.log('Fallback cache cleared')
  }
}

// Export singleton instance
export const fallbackService = new FallbackService()

/**
 * Hook for using fallback service in React components
 */
export function useFallbackService() {
  return {
    getNFTsFallback: fallbackService.getNFTsFallback.bind(fallbackService),
    getContestsFallback: fallbackService.getContestsFallback.bind(fallbackService),
    getLeaderboardFallback: fallbackService.getLeaderboardFallback.bind(fallbackService),
    getMarketplaceFallback: fallbackService.getMarketplaceFallback.bind(fallbackService),
    getBoostersFallback: fallbackService.getBoostersFallback.bind(fallbackService),
    getPlayerStatsFallback: fallbackService.getPlayerStatsFallback.bind(fallbackService),
    getTreasuryStatusFallback: fallbackService.getTreasuryStatusFallback.bind(fallbackService),
    getLineupFallback: fallbackService.getLineupFallback.bind(fallbackService),
    getPremiumStatusFallback: fallbackService.getPremiumStatusFallback.bind(fallbackService),
    hasFallbackData: fallbackService.hasFallbackData.bind(fallbackService),
    preloadFallbackData: fallbackService.preloadFallbackData.bind(fallbackService),
    clearFallbackCache: fallbackService.clearFallbackCache.bind(fallbackService)
  }
}