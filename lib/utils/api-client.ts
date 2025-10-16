/**
 * Enhanced API client with error handling, retry logic, and fallback mechanisms
 */

import { handleError, ErrorType, CircuitBreaker } from './error-handling'
import { offlineModeManager } from './offline-mode'

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retryConfig?: {
    maxAttempts?: number
    baseDelay?: number
    maxDelay?: number
  }
  fallbackData?: any
  cacheKey?: string
  cacheMinutes?: number
  offlineAction?: {
    type: string
    data: any
  }
}

export interface ApiResponse<T = any> {
  data: T
  success: boolean
  error?: string
  fromCache?: boolean
  fromFallback?: boolean
}

// Circuit breakers for different API endpoints
const circuitBreakers = new Map<string, CircuitBreaker>()

function getCircuitBreaker(endpoint: string): CircuitBreaker {
  if (!circuitBreakers.has(endpoint)) {
    circuitBreakers.set(endpoint, new CircuitBreaker())
  }
  return circuitBreakers.get(endpoint)!
}

/**
 * Enhanced fetch with timeout support
 */
async function fetchWithTimeout(
  url: string, 
  options: RequestInit & { timeout?: number }
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

/**
 * Make API request with comprehensive error handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  config: ApiRequestConfig = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 10000,
    retryConfig,
    fallbackData,
    cacheKey,
    cacheMinutes,
    offlineAction
  } = config

  // Check cache first for GET requests
  if (method === 'GET' && cacheKey) {
    const cachedData = offlineModeManager.getCachedData(cacheKey)
    if (cachedData) {
      return {
        data: cachedData,
        success: true,
        fromCache: true
      }
    }
  }

  // If offline and this is a mutation, queue it
  if (!offlineModeManager.isOnline() && method !== 'GET' && offlineAction) {
    offlineModeManager.queueAction(offlineAction.type, offlineAction.data)
    
    // Return optimistic response if available
    if (fallbackData) {
      return {
        data: fallbackData,
        success: true,
        fromFallback: true
      }
    }
    
    throw new Error('Offline: Action queued for later synchronization')
  }

  const circuitBreaker = getCircuitBreaker(endpoint)

  return handleError(
    async () => {
      return circuitBreaker.execute(async () => {
        const requestOptions: RequestInit & { timeout?: number } = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          timeout
        }

        if (body && method !== 'GET') {
          requestOptions.body = JSON.stringify(body)
        }

        const response = await fetchWithTimeout(endpoint, requestOptions)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          ;(error as any).status = response.status
          ;(error as any).response = response
          throw error
        }

        const data = await response.json()

        // Cache successful GET responses
        if (method === 'GET' && cacheKey && cacheMinutes) {
          offlineModeManager.cacheData(cacheKey, data, cacheMinutes)
        }

        return {
          data,
          success: true
        }
      })
    },
    {
      errorType: ErrorType.API_REQUEST,
      retryConfig,
      fallbackFn: fallbackData ? async () => ({
        data: fallbackData,
        success: true,
        fromFallback: true
      }) : undefined
    }
  )
}

/**
 * Specialized API methods
 */
export const api = {
  // Authentication
  auth: {
    connect: (walletAddress: string, username?: string) =>
      apiRequest('/api/auth/connect', {
        method: 'POST',
        body: { walletAddress, username },
        offlineAction: { type: 'auth_connect', data: { walletAddress, username } }
      }),

    verify: (walletAddress: string) =>
      apiRequest('/api/auth/verify', {
        method: 'POST',
        body: { walletAddress },
        cacheKey: `auth_verify_${walletAddress}`,
        cacheMinutes: 5
      })
  },

  // NFTs
  nfts: {
    getOwned: (walletAddress: string) =>
      apiRequest(`/api/nfts?owner=${walletAddress}`, {
        cacheKey: `nfts_owned_${walletAddress}`,
        cacheMinutes: 10,
        fallbackData: []
      }),

    getMetadata: (momentId: number) =>
      apiRequest(`/api/nfts?momentId=${momentId}`, {
        cacheKey: `nft_metadata_${momentId}`,
        cacheMinutes: 60,
        fallbackData: null
      })
  },

  // Lineups
  lineups: {
    submit: (walletAddress: string, weekId: number, nftIds: number[]) =>
      apiRequest('/api/lineups/submit', {
        method: 'POST',
        body: { walletAddress, weekId, nftIds },
        offlineAction: { type: 'lineup_submit', data: { walletAddress, weekId, nftIds } },
        fallbackData: { success: true, queued: true }
      }),

    getCurrent: (walletAddress: string) =>
      apiRequest(`/api/lineups/current?walletAddress=${walletAddress}`, {
        cacheKey: `lineup_current_${walletAddress}`,
        cacheMinutes: 5,
        fallbackData: null
      })
  },

  // Contests
  contests: {
    getAvailable: () =>
      apiRequest('/api/contests/available', {
        cacheKey: 'contests_available',
        cacheMinutes: 5,
        fallbackData: []
      }),

    join: (walletAddress: string, contestId: string, entryFee: number, transactionHash: string) =>
      apiRequest('/api/contests/join', {
        method: 'POST',
        body: { walletAddress, contestId, entryFee, transactionHash },
        offlineAction: { 
          type: 'tournament_entry', 
          data: { walletAddress, contestId, entryFee, transactionHash } 
        }
      })
  },

  // Marketplace
  marketplace: {
    getListings: () =>
      apiRequest('/api/marketplace/listings', {
        cacheKey: 'marketplace_listings',
        cacheMinutes: 2,
        fallbackData: []
      }),

    createListing: (sellerAddress: string, momentId: number, price: number) =>
      apiRequest('/api/marketplace/listings', {
        method: 'POST',
        body: { sellerAddress, momentId, price },
        offlineAction: { 
          type: 'marketplace_listing', 
          data: { sellerAddress, momentId, price } 
        }
      }),

    purchase: (buyerAddress: string, listingId: string, transactionHash: string) =>
      apiRequest('/api/marketplace/purchase', {
        method: 'POST',
        body: { buyerAddress, listingId, transactionHash }
      })
  },

  // Boosters
  boosters: {
    getAvailable: () =>
      apiRequest('/api/boosters/available', {
        cacheKey: 'boosters_available',
        cacheMinutes: 10,
        fallbackData: []
      }),

    purchase: (buyerAddress: string, boosterType: string, transactionHash: string) =>
      apiRequest('/api/boosters/purchase', {
        method: 'POST',
        body: { buyerAddress, boosterType, transactionHash },
        offlineAction: { 
          type: 'booster_purchase', 
          data: { buyerAddress, boosterType, transactionHash } 
        }
      }),

    getInventory: (walletAddress: string) =>
      apiRequest(`/api/boosters/inventory?walletAddress=${walletAddress}`, {
        cacheKey: `boosters_inventory_${walletAddress}`,
        cacheMinutes: 5,
        fallbackData: []
      })
  },

  // Premium
  premium: {
    purchase: (buyerAddress: string, accessType: string, transactionHash: string) =>
      apiRequest('/api/premium/purchase', {
        method: 'POST',
        body: { buyerAddress, accessType, transactionHash },
        offlineAction: { 
          type: 'premium_purchase', 
          data: { buyerAddress, accessType, transactionHash } 
        }
      }),

    getStatus: (walletAddress: string) =>
      apiRequest(`/api/premium/status?walletAddress=${walletAddress}`, {
        cacheKey: `premium_status_${walletAddress}`,
        cacheMinutes: 10,
        fallbackData: { hasAccess: false }
      })
  },

  // Leaderboard
  leaderboard: {
    getWeekly: (weekId?: number) =>
      apiRequest(`/api/leaderboard${weekId ? `?weekId=${weekId}` : ''}`, {
        cacheKey: `leaderboard_weekly_${weekId || 'current'}`,
        cacheMinutes: 5,
        fallbackData: []
      }),

    getSeason: () =>
      apiRequest('/api/leaderboard/season', {
        cacheKey: 'leaderboard_season',
        cacheMinutes: 10,
        fallbackData: []
      })
  },

  // Stats
  stats: {
    getPlayer: (playerId: string) =>
      apiRequest(`/api/stats/player/${playerId}`, {
        cacheKey: `player_stats_${playerId}`,
        cacheMinutes: 30,
        fallbackData: null
      }),

    getWeeklyScores: (weekId: number) =>
      apiRequest(`/api/scoring/weekly-update?weekId=${weekId}`, {
        cacheKey: `weekly_scores_${weekId}`,
        cacheMinutes: 60,
        fallbackData: []
      })
  },

  // Treasury
  treasury: {
    getStatus: () =>
      apiRequest('/api/treasury/status', {
        cacheKey: 'treasury_status',
        cacheMinutes: 5,
        fallbackData: { balance: 0, rewardPool: 0 }
      })
  }
}

/**
 * Batch API requests with error handling
 */
export async function batchApiRequests<T extends Record<string, Promise<ApiResponse>>>(
  requests: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const results = {} as { [K in keyof T]: Awaited<T[K]> }
  const errors: Array<{ key: keyof T; error: any }> = []

  await Promise.allSettled(
    Object.entries(requests).map(async ([key, promise]) => {
      try {
        results[key as keyof T] = await promise
      } catch (error) {
        errors.push({ key: key as keyof T, error })
        // Provide fallback response for failed requests
        results[key as keyof T] = {
          data: null,
          success: false,
          error: error.message
        } as Awaited<T[keyof T]>
      }
    })
  )

  if (errors.length > 0) {
    console.warn(`${errors.length} batch requests failed:`, errors)
  }

  return results
}

/**
 * Preload data for offline use
 */
export async function preloadOfflineData(walletAddress: string) {
  console.log('Preloading data for offline use...')
  
  try {
    await batchApiRequests({
      nfts: api.nfts.getOwned(walletAddress),
      contests: api.contests.getAvailable(),
      marketplace: api.marketplace.getListings(),
      boosters: api.boosters.getAvailable(),
      leaderboard: api.leaderboard.getWeekly(),
      premiumStatus: api.premium.getStatus(walletAddress),
      treasuryStatus: api.treasury.getStatus()
    })
    
    console.log('Offline data preloaded successfully')
  } catch (error) {
    console.error('Failed to preload offline data:', error)
  }
}