import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, ValidationError } from '@/lib/services/enhanced-database-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    const weekId = searchParams.get('weekId')

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    if (!weekId) {
      return NextResponse.json(
        { success: false, error: 'Week ID is required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await enhancedDatabaseService.getUserByWallet(walletAddress)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get lineup for the specified week
    const lineup = await enhancedDatabaseService.getLineupByUserAndWeek(user.id, parseInt(weekId))
    
    if (!lineup) {
      return NextResponse.json({
        success: true,
        lineup: null
      })
    }

    // Get NFT details for the lineup
    const nftDetails = await Promise.all(
      lineup.nft_ids.map(async (momentId) => {
        const nft = await enhancedDatabaseService.getNFTByMomentId(momentId)
        return nft ? {
          momentId: nft.moment_id,
          playerName: nft.player_name,
          team: nft.team,
          position: nft.position,
          sport: nft.sport,
          rarity: nft.rarity,
          metadata: nft.metadata
        } : null
      })
    )

    return NextResponse.json({
      success: true,
      lineup: {
        id: lineup.id,
        userId: lineup.user_id,
        weekId: lineup.week_id,
        nftIds: lineup.nft_ids,
        nftDetails: nftDetails.filter(Boolean),
        totalPoints: lineup.total_points,
        submittedAt: lineup.submitted_at,
        locked: lineup.locked
      }
    })

  } catch (error) {
    console.error('Get current lineup error:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}