import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const UpdateUserSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  username: z.string().min(1).max(50).optional(),
  totalPoints: z.number().min(0).optional(),
  seasonRank: z.number().int().positive().optional(),
  wins: z.number().int().min(0).optional(),
  losses: z.number().int().min(0).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    const includeStats = searchParams.get('includeStats') === 'true'

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Validate wallet address format
    const walletRegex = /^0x[a-fA-F0-9]{40}$/
    if (!walletRegex.test(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    const user = await enhancedDatabaseService.getUserByWallet(walletAddress)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    let additionalData = {}

    if (includeStats) {
      // Get user's lineups
      const lineups = await enhancedDatabaseService.getUserLineups(user.id)
      
      // Get user's premium access
      const premiumAccess = await enhancedDatabaseService.getUserPremiumAccess(walletAddress)
      const hasActivePremium = await enhancedDatabaseService.hasActivePremiumAccess(walletAddress)
      
      // Get user's boosters
      const boosters = await enhancedDatabaseService.getUserBoosters(walletAddress)
      const activeBoosters = await enhancedDatabaseService.getActiveBoosters(walletAddress)
      
      // Get user's marketplace listings
      const marketplaceListings = await enhancedDatabaseService.getUserMarketplaceListings(walletAddress)
      
      // Get user's treasury transactions
      const treasuryTransactions = await enhancedDatabaseService.getTreasuryTransactionsByUser(walletAddress)

      additionalData = {
        stats: {
          totalLineups: lineups.length,
          averagePoints: lineups.length > 0 ? lineups.reduce((sum, l) => sum + l.total_points, 0) / lineups.length : 0,
          bestScore: lineups.length > 0 ? Math.max(...lineups.map(l => l.total_points)) : 0,
          winRate: (user.wins + user.losses) > 0 ? user.wins / (user.wins + user.losses) : 0
        },
        premium: {
          hasActive: hasActivePremium,
          accessCount: premiumAccess.length
        },
        boosters: {
          total: boosters.length,
          active: activeBoosters.length
        },
        marketplace: {
          totalListings: marketplaceListings.length,
          activeListings: marketplaceListings.filter(l => l.status === 'active').length
        },
        treasury: {
          totalTransactions: treasuryTransactions.length,
          totalVolume: treasuryTransactions.reduce((sum, tx) => sum + tx.amount, 0)
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        totalPoints: user.total_points,
        seasonRank: user.season_rank,
        wins: user.wins,
        losses: user.losses,
        ...additionalData
      }
    })

  } catch (error) {
    console.error('Get user error:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, ...updateData } = UpdateUserSchema.parse(body)

    // Get existing user
    const user = await enhancedDatabaseService.getUserByWallet(walletAddress)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updates: any = {}
    if (updateData.username !== undefined) updates.username = updateData.username
    if (updateData.totalPoints !== undefined) updates.total_points = updateData.totalPoints
    if (updateData.seasonRank !== undefined) updates.season_rank = updateData.seasonRank
    if (updateData.wins !== undefined) updates.wins = updateData.wins
    if (updateData.losses !== undefined) updates.losses = updateData.losses

    // Update user
    const updatedUser = await enhancedDatabaseService.updateUser(user.id, updates)

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        walletAddress: updatedUser.wallet_address,
        username: updatedUser.username,
        createdAt: updatedUser.created_at,
        lastLogin: updatedUser.last_login,
        totalPoints: updatedUser.total_points,
        seasonRank: updatedUser.season_rank,
        wins: updatedUser.wins,
        losses: updatedUser.losses
      }
    })

  } catch (error) {
    console.error('Update user error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

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