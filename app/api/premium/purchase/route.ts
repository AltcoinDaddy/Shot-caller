import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const PurchasePremiumSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  accessType: z.enum(['season_pass', 'monthly_premium', 'tournament_vip']),
  flowAmount: z.number().positive('Flow amount must be positive'),
  transactionHash: z.string().min(1, 'Transaction hash is required'),
  durationDays: z.number().int().positive().default(90)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAddress, accessType, flowAmount, transactionHash, durationDays } = PurchasePremiumSchema.parse(body)

    // Validate pricing
    const pricingMap = {
      season_pass: 50.0,
      monthly_premium: 15.0,
      tournament_vip: 25.0
    }

    const expectedPrice = pricingMap[accessType]
    if (Math.abs(flowAmount - expectedPrice) > 0.001) {
      return NextResponse.json(
        { success: false, error: `Invalid flow amount. Expected ${expectedPrice} FLOW for ${accessType}` },
        { status: 400 }
      )
    }

    // Get or create user
    let user = await enhancedDatabaseService.getUserByWallet(userAddress)
    if (!user) {
      user = await enhancedDatabaseService.createUser({
        wallet_address: userAddress
      })
    }

    // Create premium access
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    const premiumAccess = await enhancedDatabaseService.createPremiumAccess({
      user_address: userAddress,
      access_type: accessType,
      expires_at: expiresAt.toISOString(),
      flow_amount: flowAmount
    })

    // Create treasury transaction
    const rewardPoolAmount = flowAmount * 0.70 // 70% to reward pool
    const treasuryAmount = flowAmount * 0.30 // 30% to treasury

    await enhancedDatabaseService.createTreasuryTransaction({
      transaction_hash: transactionHash,
      transaction_type: 'season_pass',
      amount: flowAmount,
      fee_amount: 0,
      reward_pool_amount: rewardPoolAmount,
      treasury_amount: treasuryAmount,
      user_address: userAddress
    })

    return NextResponse.json({
      success: true,
      premiumAccess: {
        id: premiumAccess.id,
        userAddress: premiumAccess.user_address,
        accessType: premiumAccess.access_type,
        purchasedAt: premiumAccess.purchased_at,
        expiresAt: premiumAccess.expires_at,
        status: premiumAccess.status,
        flowAmount: premiumAccess.flow_amount
      },
      message: `Successfully purchased ${accessType.replace('_', ' ')}`
    })

  } catch (error) {
    console.error('Premium purchase error:', error)

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
    const userAddress = searchParams.get('userAddress')

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing userAddress parameter' },
        { status: 400 }
      )
    }

    // Validate wallet address
    const walletRegex = /^0x[a-fA-F0-9]{40}$/
    if (!walletRegex.test(userAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    // Get user's premium access
    const premiumAccess = await enhancedDatabaseService.getUserPremiumAccess(userAddress)
    const hasActivePremium = await enhancedDatabaseService.hasActivePremiumAccess(userAddress)

    // Calculate days remaining for active access
    let daysRemaining = 0
    if (premiumAccess.length > 0) {
      const activeAccess = premiumAccess[0] // Most recent active access
      const expiresAt = new Date(activeAccess.expires_at)
      const now = new Date()
      const timeDiff = expiresAt.getTime() - now.getTime()
      daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)))
    }

    // Define premium features
    const premiumFeatures = {
      advancedAnalytics: hasActivePremium,
      extraLineupSlots: hasActivePremium,
      bonusRewards: hasActivePremium,
      prioritySupport: hasActivePremium,
      exclusiveContests: hasActivePremium
    }

    return NextResponse.json({
      success: true,
      isActive: hasActivePremium,
      daysRemaining,
      canRenew: daysRemaining <= 30,
      features: premiumFeatures,
      access: premiumAccess.map(access => ({
        id: access.id,
        accessType: access.access_type,
        purchasedAt: access.purchased_at,
        expiresAt: access.expires_at,
        status: access.status,
        flowAmount: access.flow_amount
      }))
    })

  } catch (error) {
    console.error('Premium status error:', error)

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