import { supabase, Database } from '@/lib/supabase'
import { z } from 'zod'

// Validation schemas
const WalletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address')
const UUIDSchema = z.string().uuid()

// Type definitions
type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

type NFT = Database['public']['Tables']['nfts']['Row']
type NFTInsert = Database['public']['Tables']['nfts']['Insert']

type Lineup = Database['public']['Tables']['lineups']['Row']
type LineupInsert = Database['public']['Tables']['lineups']['Insert']
type LineupUpdate = Database['public']['Tables']['lineups']['Update']

type Contest = Database['public']['Tables']['contests']['Row']
type ContestInsert = Database['public']['Tables']['contests']['Insert']
type ContestUpdate = Database['public']['Tables']['contests']['Update']

type TreasuryTransaction = Database['public']['Tables']['treasury_transactions']['Row']
type TreasuryTransactionInsert = Database['public']['Tables']['treasury_transactions']['Insert']

type MarketplaceListing = Database['public']['Tables']['marketplace_listings']['Row']
type MarketplaceListingInsert = Database['public']['Tables']['marketplace_listings']['Insert']
type MarketplaceListingUpdate = Database['public']['Tables']['marketplace_listings']['Update']

type Booster = Database['public']['Tables']['boosters']['Row']
type BoosterInsert = Database['public']['Tables']['boosters']['Insert']
type BoosterUpdate = Database['public']['Tables']['boosters']['Update']

type PremiumAccess = Database['public']['Tables']['premium_access']['Row']
type PremiumAccessInsert = Database['public']['Tables']['premium_access']['Insert']

type PlayerStats = Database['public']['Tables']['player_stats']['Row']
type PlayerStatsInsert = Database['public']['Tables']['player_stats']['Insert']

// Error types
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class EnhancedDatabaseService {
  // User Management
  async createUser(userData: UserInsert): Promise<User> {
    try {
      WalletAddressSchema.parse(userData.wallet_address)
      
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to create user: ${error.message}`, error.code)
      return data
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid user data: ${error.errors.map(e => e.message).join(', ')}`)
      }
      throw error
    }
  }

  async getUserByWallet(walletAddress: string): Promise<User | null> {
    try {
      WalletAddressSchema.parse(walletAddress)
      
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('wallet_address', walletAddress)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(`Failed to get user: ${error.message}`, error.code)
      }
      
      return data || null
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid wallet address: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  async updateUser(id: string, updates: UserUpdate): Promise<User> {
    try {
      UUIDSchema.parse(id)
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to update user: ${error.message}`, error.code)
      return data
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid user ID: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  // NFT Management
  async createNFT(nftData: NFTInsert): Promise<NFT> {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .insert(nftData)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to create NFT: ${error.message}`, error.code)
      return data
    } catch (error) {
      throw error
    }
  }

  async getNFTByMomentId(momentId: number): Promise<NFT | null> {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .select()
        .eq('moment_id', momentId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(`Failed to get NFT: ${error.message}`, error.code)
      }
      
      return data || null
    } catch (error) {
      throw error
    }
  }

  async getNFTsBySport(sport: string): Promise<NFT[]> {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .select()
        .eq('sport', sport)
        .order('player_name')

      if (error) throw new DatabaseError(`Failed to get NFTs by sport: ${error.message}`, error.code)
      return data || []
    } catch (error) {
      throw error
    }
  }

  // Lineup Management
  async createLineup(lineupData: LineupInsert): Promise<Lineup> {
    try {
      const { data, error } = await supabase
        .from('lineups')
        .insert(lineupData)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to create lineup: ${error.message}`, error.code)
      return data
    } catch (error) {
      throw error
    }
  }

  async getLineupByUserAndWeek(userId: string, weekId: number): Promise<Lineup | null> {
    try {
      UUIDSchema.parse(userId)
      
      const { data, error } = await supabase
        .from('lineups')
        .select()
        .eq('user_id', userId)
        .eq('week_id', weekId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(`Failed to get lineup: ${error.message}`, error.code)
      }
      
      return data || null
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid user ID: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  async updateLineup(id: string, updates: LineupUpdate): Promise<Lineup> {
    try {
      UUIDSchema.parse(id)
      
      const { data, error } = await supabase
        .from('lineups')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to update lineup: ${error.message}`, error.code)
      return data
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid lineup ID: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  async getUserLineups(userId: string): Promise<Lineup[]> {
    try {
      UUIDSchema.parse(userId)
      
      const { data, error } = await supabase
        .from('lineups')
        .select()
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })

      if (error) throw new DatabaseError(`Failed to get user lineups: ${error.message}`, error.code)
      return data || []
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid user ID: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  // Contest Management
  async createContest(contestData: ContestInsert): Promise<Contest> {
    try {
      const { data, error } = await supabase
        .from('contests')
        .insert(contestData)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to create contest: ${error.message}`, error.code)
      return data
    } catch (error) {
      throw error
    }
  }

  async getContest(id: string): Promise<Contest | null> {
    try {
      UUIDSchema.parse(id)
      
      const { data, error } = await supabase
        .from('contests')
        .select()
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(`Failed to get contest: ${error.message}`, error.code)
      }
      
      return data || null
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid contest ID: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  async getActiveContests(): Promise<Contest[]> {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select()
        .in('status', ['upcoming', 'active'])
        .order('start_time')

      if (error) throw new DatabaseError(`Failed to get active contests: ${error.message}`, error.code)
      return data || []
    } catch (error) {
      throw error
    }
  }

  async updateContest(id: string, updates: ContestUpdate): Promise<Contest> {
    try {
      UUIDSchema.parse(id)
      
      const { data, error } = await supabase
        .from('contests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to update contest: ${error.message}`, error.code)
      return data
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid contest ID: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  // Treasury Management
  async createTreasuryTransaction(transactionData: TreasuryTransactionInsert): Promise<TreasuryTransaction> {
    try {
      const { data, error } = await supabase
        .from('treasury_transactions')
        .insert(transactionData)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to create treasury transaction: ${error.message}`, error.code)
      return data
    } catch (error) {
      throw error
    }
  }

  async getTreasuryTransactionsByUser(userAddress: string): Promise<TreasuryTransaction[]> {
    try {
      WalletAddressSchema.parse(userAddress)
      
      const { data, error } = await supabase
        .from('treasury_transactions')
        .select()
        .eq('user_address', userAddress)
        .order('created_at', { ascending: false })

      if (error) throw new DatabaseError(`Failed to get treasury transactions: ${error.message}`, error.code)
      return data || []
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid wallet address: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  async getTreasuryStats(): Promise<{
    totalRewardPool: number
    totalTreasury: number
    totalVolume: number
  }> {
    try {
      const { data, error } = await supabase
        .from('treasury_transactions')
        .select('reward_pool_amount, treasury_amount, amount')

      if (error) throw new DatabaseError(`Failed to get treasury stats: ${error.message}`, error.code)
      
      const stats = (data || []).reduce(
        (acc, tx) => ({
          totalRewardPool: acc.totalRewardPool + (tx.reward_pool_amount || 0),
          totalTreasury: acc.totalTreasury + (tx.treasury_amount || 0),
          totalVolume: acc.totalVolume + tx.amount
        }),
        { totalRewardPool: 0, totalTreasury: 0, totalVolume: 0 }
      )

      return stats
    } catch (error) {
      throw error
    }
  }

  // Marketplace Management
  async createMarketplaceListing(listingData: MarketplaceListingInsert): Promise<MarketplaceListing> {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .insert(listingData)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to create marketplace listing: ${error.message}`, error.code)
      return data
    } catch (error) {
      throw error
    }
  }

  async getActiveMarketplaceListings(): Promise<MarketplaceListing[]> {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select()
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw new DatabaseError(`Failed to get marketplace listings: ${error.message}`, error.code)
      return data || []
    } catch (error) {
      throw error
    }
  }

  async getUserMarketplaceListings(userAddress: string): Promise<MarketplaceListing[]> {
    try {
      WalletAddressSchema.parse(userAddress)
      
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select()
        .eq('seller_address', userAddress)
        .order('created_at', { ascending: false })

      if (error) throw new DatabaseError(`Failed to get user marketplace listings: ${error.message}`, error.code)
      return data || []
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid wallet address: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  async updateMarketplaceListing(id: string, updates: MarketplaceListingUpdate): Promise<MarketplaceListing> {
    try {
      UUIDSchema.parse(id)
      
      const { data, error } = await supabase
        .from('marketplace_listings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to update marketplace listing: ${error.message}`, error.code)
      return data
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid listing ID: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  // Booster Management
  async createBooster(boosterData: BoosterInsert): Promise<Booster> {
    try {
      const { data, error } = await supabase
        .from('boosters')
        .insert(boosterData)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to create booster: ${error.message}`, error.code)
      return data
    } catch (error) {
      throw error
    }
  }

  async getUserBoosters(userAddress: string): Promise<Booster[]> {
    try {
      WalletAddressSchema.parse(userAddress)
      
      const { data, error } = await supabase
        .from('boosters')
        .select()
        .eq('owner_address', userAddress)
        .order('purchased_at', { ascending: false })

      if (error) throw new DatabaseError(`Failed to get user boosters: ${error.message}`, error.code)
      return data || []
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid wallet address: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  async getActiveBoosters(userAddress: string): Promise<Booster[]> {
    try {
      WalletAddressSchema.parse(userAddress)
      
      const { data, error } = await supabase
        .from('boosters')
        .select()
        .eq('owner_address', userAddress)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())

      if (error) throw new DatabaseError(`Failed to get active boosters: ${error.message}`, error.code)
      return data || []
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid wallet address: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  async updateBooster(id: string, updates: BoosterUpdate): Promise<Booster> {
    try {
      UUIDSchema.parse(id)
      
      const { data, error } = await supabase
        .from('boosters')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to update booster: ${error.message}`, error.code)
      return data
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid booster ID: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  // Premium Access Management
  async createPremiumAccess(accessData: PremiumAccessInsert): Promise<PremiumAccess> {
    try {
      const { data, error } = await supabase
        .from('premium_access')
        .insert(accessData)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to create premium access: ${error.message}`, error.code)
      return data
    } catch (error) {
      throw error
    }
  }

  async getUserPremiumAccess(userAddress: string): Promise<PremiumAccess[]> {
    try {
      WalletAddressSchema.parse(userAddress)
      
      const { data, error } = await supabase
        .from('premium_access')
        .select()
        .eq('user_address', userAddress)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())

      if (error) throw new DatabaseError(`Failed to get premium access: ${error.message}`, error.code)
      return data || []
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid wallet address: ${error.errors[0].message}`)
      }
      throw error
    }
  }

  async hasActivePremiumAccess(userAddress: string): Promise<boolean> {
    try {
      const access = await this.getUserPremiumAccess(userAddress)
      return access.length > 0
    } catch (error) {
      throw error
    }
  }

  // Player Stats Management
  async createPlayerStats(statsData: PlayerStatsInsert): Promise<PlayerStats> {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .insert(statsData)
        .select()
        .single()

      if (error) throw new DatabaseError(`Failed to create player stats: ${error.message}`, error.code)
      return data
    } catch (error) {
      throw error
    }
  }

  async getPlayerStatsByDate(playerName: string, gameDate: string): Promise<PlayerStats | null> {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select()
        .eq('player_name', playerName)
        .eq('game_date', gameDate)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(`Failed to get player stats: ${error.message}`, error.code)
      }
      
      return data || null
    } catch (error) {
      throw error
    }
  }

  async getPlayerStatsRange(playerName: string, startDate: string, endDate: string): Promise<PlayerStats[]> {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select()
        .eq('player_name', playerName)
        .gte('game_date', startDate)
        .lte('game_date', endDate)
        .order('game_date', { ascending: false })

      if (error) throw new DatabaseError(`Failed to get player stats range: ${error.message}`, error.code)
      return data || []
    } catch (error) {
      throw error
    }
  }

  // Utility Methods
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', timestamp: string }> {
    try {
      const { error } = await supabase.from('users').select('id').limit(1)
      
      return {
        status: error ? 'unhealthy' : 'healthy',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    }
  }

  async getStats(): Promise<{
    totalUsers: number
    totalNFTs: number
    totalLineups: number
    totalContests: number
    activeContests: number
    totalMarketplaceListings: number
    activeMarketplaceListings: number
  }> {
    try {
      const [
        usersResult,
        nftsResult,
        lineupsResult,
        contestsResult,
        activeContestsResult,
        marketplaceResult,
        activeMarketplaceResult
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('nfts').select('id', { count: 'exact', head: true }),
        supabase.from('lineups').select('id', { count: 'exact', head: true }),
        supabase.from('contests').select('id', { count: 'exact', head: true }),
        supabase.from('contests').select('id', { count: 'exact', head: true }).in('status', ['upcoming', 'active']),
        supabase.from('marketplace_listings').select('id', { count: 'exact', head: true }),
        supabase.from('marketplace_listings').select('id', { count: 'exact', head: true }).eq('status', 'active')
      ])

      return {
        totalUsers: usersResult.count || 0,
        totalNFTs: nftsResult.count || 0,
        totalLineups: lineupsResult.count || 0,
        totalContests: contestsResult.count || 0,
        activeContests: activeContestsResult.count || 0,
        totalMarketplaceListings: marketplaceResult.count || 0,
        activeMarketplaceListings: activeMarketplaceResult.count || 0
      }
    } catch (error) {
      throw new DatabaseError('Failed to get database stats')
    }
  }
}

// Export singleton instance
export const enhancedDatabaseService = new EnhancedDatabaseService()
export { DatabaseError, ValidationError }

// Export types for use in other modules
export type {
  User,
  UserInsert,
  UserUpdate,
  NFT,
  NFTInsert,
  Lineup,
  LineupInsert,
  LineupUpdate,
  Contest,
  ContestInsert,
  ContestUpdate,
  TreasuryTransaction,
  TreasuryTransactionInsert,
  MarketplaceListing,
  MarketplaceListingInsert,
  MarketplaceListingUpdate,
  Booster,
  BoosterInsert,
  BoosterUpdate,
  PremiumAccess,
  PremiumAccessInsert,
  PlayerStats,
  PlayerStatsInsert
}