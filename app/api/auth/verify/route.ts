import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const VerifyRequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, signature, message } = VerifyRequestSchema.parse(body)

    // In a real implementation, you would verify the signature here
    // For now, we'll just check if the user exists and return verification status
    
    const user = await enhancedDatabaseService.getUserByWallet(walletAddress)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Mock signature verification - in production, implement proper cryptographic verification
    const isValidSignature = signature.length > 0 && message.includes(walletAddress)

    if (!isValidSignature) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Update last login on successful verification
    await enhancedDatabaseService.updateUser(user.id, {
      last_login: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      verified: true,
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
    console.error('Auth verify error:', error)

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

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}