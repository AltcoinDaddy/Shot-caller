import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'

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

    // Get user boosters
    const boosters = await enhancedDatabaseService.getUserBoosters(walletAddress)
    const activeBoosters = await enhancedDatabaseService.getActiveBoosters(walletAddress)

    // Format boosters for response
    const formattedBoosters = boosters.map(booster => ({
      id: booster.id,
      ownerAddress: booster.owner_address,
      boosterType: booster.booster_type,
      effectType: booster.effect_type,
      effectValue: booster.effect_value,
      durationHours: booster.duration_hours,
      purchasedAt: booster.purchased_at,
      activatedAt: booster.activated_at,
      expiresAt: booster.expires_at,
      status: booster.status,
      isActive: activeBoosters.some(ab => ab.id === booster.id)
    }))

    return NextResponse.json({
      success: true,
      boosters: formattedBoosters,
      activeBoosters: activeBoosters.map(booster => ({
        id: booster.id,
        boosterType: booster.booster_type,
        effectType: booster.effect_type,
        effectValue: booster.effect_value,
        expiresAt: booster.expires_at
      }))
    })

  } catch (error) {
    console.error('Get booster inventory error:', error)

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