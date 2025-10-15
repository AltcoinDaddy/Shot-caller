import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError } from '@/lib/services/enhanced-database-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'

    // Get basic database stats
    const dbStats = await enhancedDatabaseService.getStats()
    
    // Get treasury stats
    const treasuryStats = await enhancedDatabaseService.getTreasuryStats()

    let detailedStats = {}

    if (detailed) {
      // Get active contests
      const activeContests = await enhancedDatabaseService.getActiveContests()
      
      // Get active marketplace listings
      const activeListings = await enhancedDatabaseService.getActiveMarketplaceListings()
      
      // Calculate additional metrics
      const totalPrizePool = activeContests.reduce((sum, contest) => sum + contest.prize_pool, 0)
      const averageEntryFee = activeContests.length > 0 
        ? activeContests.reduce((sum, contest) => sum + contest.entry_fee, 0) / activeContests.length 
        : 0

      const marketplaceVolume = activeListings.reduce((sum, listing) => sum + listing.price, 0)
      const averageListingPrice = activeListings.length > 0 
        ? marketplaceVolume / activeListings.length 
        : 0

      detailedStats = {
        contests: {
          totalPrizePool,
          averageEntryFee,
          contestsByType: activeContests.reduce((acc, contest) => {
            acc[contest.contest_type] = (acc[contest.contest_type] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        },
        marketplace: {
          totalVolume: marketplaceVolume,
          averagePrice: averageListingPrice,
          listingsBySport: activeListings.reduce((acc, listing) => {
            // Would need to join with NFTs table to get sport
            return acc
          }, {} as Record<string, number>)
        },
        treasury: {
          rewardPoolPercentage: treasuryStats.totalVolume > 0 
            ? (treasuryStats.totalRewardPool / treasuryStats.totalVolume) * 100 
            : 0,
          treasuryPercentage: treasuryStats.totalVolume > 0 
            ? (treasuryStats.totalTreasury / treasuryStats.totalVolume) * 100 
            : 0
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        platform: {
          totalUsers: dbStats.totalUsers,
          totalNFTs: dbStats.totalNFTs,
          totalLineups: dbStats.totalLineups,
          totalContests: dbStats.totalContests,
          activeContests: dbStats.activeContests,
          totalMarketplaceListings: dbStats.totalMarketplaceListings,
          activeMarketplaceListings: dbStats.activeMarketplaceListings
        },
        treasury: {
          totalRewardPool: treasuryStats.totalRewardPool,
          totalTreasury: treasuryStats.totalTreasury,
          totalVolume: treasuryStats.totalVolume
        },
        ...detailedStats
      }
    })

  } catch (error) {
    console.error('Get stats error:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { success: false, error: 'Database error occurred' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}