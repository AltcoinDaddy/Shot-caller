import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const ConnectRequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  username: z.string().min(1).max(50).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, username } = ConnectRequestSchema.parse(body)

    // Check if user already exists
    let user = await enhancedDatabaseService.getUserByWallet(walletAddress)
    
    if (!user) {
      // Create new user
      user = await enhancedDatabaseService.createUser({
        wallet_address: walletAddress,
        username: username || null,
        last_login: new Date().toISOString()
      })
    } else {
      // Update last login
      user = await enhancedDatabaseService.updateUser(user.id, {
        last_login: new Date().toISOString(),
        ...(username && { username })
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        totalPoints: user.total_points,
        seasonRank: user.season_rank,
        wins: user.wins,
        losses: user.losses
      }
    })

  } catch (error) {
    console.error('Auth connect error:', error)

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
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

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        totalPoints: user.total_points,
        seasonRank: user.season_rank,
        wins: user.wins,
        losses: user.losses
      }
    })

  } catch (error) {
    console.error('Auth get user error:', error)

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