import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const PurchaseBoosterSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  boosterType: z.enum(['disney_energy', 'disney_luck', 'shotcaller_power', 'shotcaller_multiplier']),
  flowAmount: z.number().positive('Flow amount must be positive'),
  transactionHash: z.string().min(1, 'Transaction hash is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, boosterType, flowAmount, transactionHash } = PurchaseBoosterSchema.parse(body)

    // Get user
    const user = await enhancedDatabaseService.getUserByWallet(walletAddress)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Define booster effects
    const boosterEffects = {
      disney_energy: { effectType: 'score_multiplier', effectValue: 1.05 },
      disney_luck: { effectType: 'random_bonus', effectValue: 10.0 },
      shotcaller_power: { effectType: 'extra_points', effectValue: 5.0 },
      shotcaller_multiplier: { effectType: 'score_multiplier', effectValue: 1.10 }
    }

    const effect = boosterEffects[boosterType]

    // Create booster
    const booster = await enhancedDatabaseService.createBooster({
      owner_address: walletAddress,
      booster_type: boosterType,
      effect_type: effect.effectType,
      effect_value: effect.effectValue,
      duration_hours: 168, // 1 week
      status: 'available'
    })

    // Create treasury transaction
    const feeAmount = flowAmount * 0.05 // 5% fee
    const rewardPoolAmount = flowAmount * 0.70 // 70% to reward pool
    const treasuryAmount = flowAmount * 0.30 // 30% to treasury

    await enhancedDatabaseService.createTreasuryTransaction({
      transaction_hash: transactionHash,
      transaction_type: 'booster_purchase',
      amount: flowAmount,
      fee_amount: feeAmount,
      reward_pool_amount: rewardPoolAmount,
      treasury_amount: treasuryAmount,
      user_address: walletAddress
    })

    return NextResponse.json({
      success: true,
      booster: {
        id: booster.id,
        ownerAddress: booster.owner_address,
        boosterType: booster.booster_type,
        effectType: booster.effect_type,
        effectValue: booster.effect_value,
        durationHours: booster.duration_hours,
        purchasedAt: booster.purchased_at,
        status: booster.status
      }
    })

  } catch (error) {
    console.error('Purchase booster error:', error)

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