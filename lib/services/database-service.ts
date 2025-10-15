// Enhanced Database Service using Supabase
// This service provides a comprehensive interface to the Supabase database
// replacing the localStorage-based implementation

import { enhancedDatabaseService } from './enhanced-database-service'
import type { 
  User, 
  Contest, 
  Lineup, 
  TreasuryTransaction,
  MarketplaceListing,
  Booster,
  PremiumAccess,
  PlayerStats,
  NFT
} from './enhanced-database-service'

export interface StoredLineup {
  id: string;
  contestId: string;
  playerAddress: string;
  nftIds: number[];
  submittedAt: string;
  transactionId?: string;
  status: 'pending' | 'confirmed' | 'failed';
  totalPoints: number;
  locked: boolean;
}

export interface StoredContest {
  id: string;
  weekId: number;
  startTime: string;
  endTime: string;
  status: string;
  totalParticipants: number;
  rewardPool: number;
  entryFee: number;
  maxParticipants?: number;
  contestType: string;
}

class DatabaseService {
  // Lineup Management
  async saveLineup(lineup: Omit<StoredLineup, 'id'>): Promise<string> {
    try {
      // Get user by wallet address
      const user = await enhancedDatabaseService.getUserByWallet(lineup.playerAddress)
      if (!user) {
        throw new Error('User not found')
      }

      // Create lineup in database
      const dbLineup = await enhancedDatabaseService.createLineup({
        user_id: user.id,
        week_id: parseInt(lineup.contestId), // Assuming contestId maps to weekId
        nft_ids: lineup.nftIds,
        total_points: 0,
        locked: false
      })

      return dbLineup.id
    } catch (error) {
      console.error('Failed to save lineup:', error)
      throw error
    }
  }

  async getLineup(contestId: number, playerAddress: string): Promise<StoredLineup | null> {
    try {
      const user = await enhancedDatabaseService.getUserByWallet(playerAddress)
      if (!user) return null

      const lineup = await enhancedDatabaseService.getLineupByUserAndWeek(user.id, contestId)
      if (!lineup) return null

      return {
        id: lineup.id,
        contestId: contestId.toString(),
        playerAddress,
        nftIds: lineup.nft_ids,
        submittedAt: lineup.submitted_at,
        status: 'confirmed',
        totalPoints: lineup.total_points,
        locked: lineup.locked
      }
    } catch (error) {
      console.error('Failed to get lineup:', error)
      return null
    }
  }

  async updateLineupStatus(id: string, status: StoredLineup['status'], transactionId?: string): Promise<void> {
    try {
      // For now, we'll just update the lineup without specific status tracking
      // In a full implementation, you might add a status field to the lineups table
      await enhancedDatabaseService.updateLineup(id, {
        // Add any relevant updates based on status
      })
    } catch (error) {
      console.error('Failed to update lineup status:', error)
      throw error
    }
  }

  async getPlayerLineups(playerAddress: string): Promise<StoredLineup[]> {
    try {
      const user = await enhancedDatabaseService.getUserByWallet(playerAddress)
      if (!user) return []

      const lineups = await enhancedDatabaseService.getUserLineups(user.id)
      
      return lineups.map(lineup => ({
        id: lineup.id,
        contestId: lineup.week_id.toString(),
        playerAddress,
        nftIds: lineup.nft_ids,
        submittedAt: lineup.submitted_at,
        status: 'confirmed' as const,
        totalPoints: lineup.total_points,
        locked: lineup.locked
      }))
    } catch (error) {
      console.error('Failed to get player lineups:', error)
      return []
    }
  }

  // Contest Management
  async saveContest(contest: StoredContest): Promise<void> {
    try {
      const existingContest = await enhancedDatabaseService.getContest(contest.id)
      
      if (existingContest) {
        await enhancedDatabaseService.updateContest(contest.id, {
          start_time: contest.startTime,
          end_time: contest.endTime,
          status: contest.status,
          total_participants: contest.totalParticipants,
          prize_pool: contest.rewardPool,
          entry_fee: contest.entryFee,
          max_participants: contest.maxParticipants,
          contest_type: contest.contestType
        })
      } else {
        await enhancedDatabaseService.createContest({
          week_id: contest.weekId,
          start_time: contest.startTime,
          end_time: contest.endTime,
          status: contest.status,
          total_participants: contest.totalParticipants,
          prize_pool: contest.rewardPool,
          entry_fee: contest.entryFee,
          max_participants: contest.maxParticipants,
          contest_type: contest.contestType
        })
      }
    } catch (error) {
      console.error('Failed to save contest:', error)
      throw error
    }
  }

  async getContest(contestId: number): Promise<StoredContest | null> {
    try {
      // For backward compatibility, try to find contest by week_id
      const contests = await enhancedDatabaseService.getActiveContests()
      const contest = contests.find(c => c.week_id === contestId)
      
      if (!contest) return null

      return {
        id: contest.id,
        weekId: contest.week_id,
        startTime: contest.start_time,
        endTime: contest.end_time,
        status: contest.status,
        totalParticipants: contest.total_participants,
        rewardPool: contest.prize_pool,
        entryFee: contest.entry_fee,
        maxParticipants: contest.max_participants,
        contestType: contest.contest_type
      }
    } catch (error) {
      console.error('Failed to get contest:', error)
      return null
    }
  }

  async getActiveContests(): Promise<StoredContest[]> {
    try {
      const contests = await enhancedDatabaseService.getActiveContests()
      
      return contests.map(contest => ({
        id: contest.id,
        weekId: contest.week_id,
        startTime: contest.start_time,
        endTime: contest.end_time,
        status: contest.status,
        totalParticipants: contest.total_participants,
        rewardPool: contest.prize_pool,
        entryFee: contest.entry_fee,
        maxParticipants: contest.max_participants,
        contestType: contest.contest_type
      }))
    } catch (error) {
      console.error('Failed to get active contests:', error)
      return []
    }
  }

  // Initialize with database data
  async initializeMockData(): Promise<void> {
    try {
      // Check if we have any contests, if not the seed data should handle this
      const contests = await this.getActiveContests()
      if (contests.length === 0) {
        console.log('No contests found. Make sure to run database migrations and seed data.')
      }
    } catch (error) {
      console.error('Failed to initialize data:', error)
    }
  }

  // Clear all data (for development/testing)
  async clearAllData(): Promise<void> {
    console.warn('clearAllData is not implemented for Supabase service. Use database migrations instead.')
  }

  // Get comprehensive statistics
  async getStats(): Promise<{
    totalLineups: number;
    totalContests: number;
    activeContests: number;
    totalUsers: number;
    totalNFTs: number;
    totalMarketplaceListings: number;
    totalTreasuryTransactions: number;
  }> {
    try {
      const stats = await enhancedDatabaseService.getStats()
      return {
        totalLineups: stats.totalLineups,
        totalContests: stats.totalContests,
        activeContests: stats.activeContests,
        totalUsers: stats.totalUsers,
        totalNFTs: stats.totalNFTs,
        totalMarketplaceListings: stats.totalMarketplaceListings,
        totalTreasuryTransactions: 0 // Would need to add this to enhanced service
      }
    } catch (error) {
      console.error('Failed to get stats:', error)
      return {
        totalLineups: 0,
        totalContests: 0,
        activeContests: 0,
        totalUsers: 0,
        totalNFTs: 0,
        totalMarketplaceListings: 0,
        totalTreasuryTransactions: 0
      }
    }
  }

  // Additional methods for comprehensive functionality
  async getTreasuryStats(): Promise<{
    totalRewardPool: number;
    totalTreasury: number;
    totalVolume: number;
  }> {
    try {
      return await enhancedDatabaseService.getTreasuryStats()
    } catch (error) {
      console.error('Failed to get treasury stats:', error)
      return { totalRewardPool: 0, totalTreasury: 0, totalVolume: 0 }
    }
  }

  async getUserBoosters(walletAddress: string): Promise<Booster[]> {
    try {
      return await enhancedDatabaseService.getUserBoosters(walletAddress)
    } catch (error) {
      console.error('Failed to get user boosters:', error)
      return []
    }
  }

  async getUserPremiumAccess(walletAddress: string): Promise<PremiumAccess[]> {
    try {
      return await enhancedDatabaseService.getUserPremiumAccess(walletAddress)
    } catch (error) {
      console.error('Failed to get user premium access:', error)
      return []
    }
  }

  async getMarketplaceListings(): Promise<MarketplaceListing[]> {
    try {
      return await enhancedDatabaseService.getActiveMarketplaceListings()
    } catch (error) {
      console.error('Failed to get marketplace listings:', error)
      return []
    }
  }

  async getUserMarketplaceListings(walletAddress: string): Promise<MarketplaceListing[]> {
    try {
      return await enhancedDatabaseService.getUserMarketplaceListings(walletAddress)
    } catch (error) {
      console.error('Failed to get user marketplace listings:', error)
      return []
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', timestamp: string }> {
    try {
      return await enhancedDatabaseService.healthCheck()
    } catch (error) {
      console.error('Health check failed:', error)
      return { status: 'unhealthy', timestamp: new Date().toISOString() }
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService()

// Initialize data on first load (only in browser)
if (typeof window !== 'undefined') {
  databaseService.initializeMockData().catch(console.error)
}

// Export types for backward compatibility
export type { User, Contest, Lineup, TreasuryTransaction, MarketplaceListing, Booster, PremiumAccess, PlayerStats, NFT }