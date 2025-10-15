import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const ActivateBoosterSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  boosterId: z.string().uuid('Invalid booster ID'),
  lineupId: z.string().uuid('Invalid lineup ID').optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, boosterId, lineupId } = ActivateBoosterSchema.parse(body)

    // Get user
    const user = await enhancedDatabaseService.getUserByWallet(walletAddress)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get booster and verify ownership
    const boosters = await enhancedDatabaseService.getUserBoosters(walletAddress)
    const booster = boosters.find(b => b.id === boosterId)

    if (!booster) {
      return NextResponse.json(
        { success: false, error: 'Booster not found or not owned by user' },
        { status: 404 }
      )
    }

    if (booster.status !== 'available') {
      return NextResponse.json(
        { success: false, error: 'Booster is not available for activation' },
        { status: 400 }
      )
    }

    // Calculate expiration time
    const activatedAt = new Date()
    const expiresAt = new Date(activatedAt.getTime() + (booster.duration_hours * 60 * 60 * 1000))

    // Update booster status
    const updatedBooster = await enhancedDatabaseService.updateBooster(boosterId, {
      status: 'active',
      activated_at: activatedAt.toISOString(),
      expires_at: expiresAt.toISOString()
    })

    return NextResponse.json({
      success: true,
      booster: {
        id: updatedBooster.id,
        ownerAddress: updatedBooster.owner_address,
        boosterType: updatedBooster.booster_type,
        effectType: updatedBooster.effect_type,
        effectValue: updatedBooster.effect_value,
        status: updatedBooster.status,
        activatedAt: updatedBooster.activated_at,
        expiresAt: updatedBooster.expires_at
      }
    })

  } catch (error) {
    console.error('Activate booster error:', error)

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