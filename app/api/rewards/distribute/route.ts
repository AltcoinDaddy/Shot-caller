import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const DistributeRewardsSchema = z.object({
  contestId: z.string().uuid('Invalid contest ID'),
  winners: z.array(z.object({
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
    rank: z.number().int().positive('Rank must be positive'),
    totalPoints: z.number().min(0, 'Total points cannot be negative'),
    rewardAmount: z.number().min(0, 'Reward amount cannot be negative')
  })).min(1, 'At least one winner is required'),
  transactionHash: z.string().min(1, 'Transaction hash is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contestId, winners, transactionHash } = DistributeRewardsSchema.parse(body)

    // Get contest
    const contest = await enhancedDatabaseService.getContest(contestId)
    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      )
    }

    // Validate contest status
    if (contest.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Contest must be completed before distributing rewards' },
        { status: 400 }
      )
    }

    if (contest.rewards_distributed) {
      return NextResponse.json(
        { success: false, error: 'Rewards have already been distributed for this contest' },
        { status: 400 }
      )
    }

    // Calculate total reward amount
    const totalRewardAmount = winners.reduce((sum, winner) => sum + winner.rewardAmount, 0)

    // Validate total doesn't exceed prize pool
    if (totalRewardAmount > contest.prize_pool) {
      return NextResponse.json(
        { success: false, error: 'Total reward amount exceeds available prize pool' },
        { status: 400 }
      )
    }

    // Create treasury transactions for each winner
    const treasuryTransactions = await Promise.all(
      winners.map(async (winner, index) => {
        return await enhancedDatabaseService.createTreasuryTransaction({
          transaction_hash: `${transactionHash}_${index}`,
          transaction_type: 'reward_distribution',
          amount: winner.rewardAmount,
          fee_amount: 0,
          reward_pool_amount: -winner.rewardAmount, // Negative because it's leaving the pool
          treasury_amount: 0,
          user_address: winner.walletAddress
        })
      })
    )

    // Update user stats for winners
    await Promise.all(
      winners.map(async (winner) => {
        const user = await enhancedDatabaseService.getUserByWallet(winner.walletAddress)
        if (user) {
          const isWin = winner.rank === 1
          await enhancedDatabaseService.updateUser(user.id, {
            total_points: user.total_points + winner.totalPoints,
            wins: isWin ? user.wins + 1 : user.wins,
            losses: !isWin ? user.losses + 1 : user.losses
          })
        }
      })
    )

    // Mark contest as rewards distributed
    await enhancedDatabaseService.updateContest(contestId, {
      rewards_distributed: true
    })

    return NextResponse.json({
      success: true,
      message: 'Rewards distributed successfully',
      distribution: {
        contestId: contest.id,
        totalRewardAmount,
        winnersCount: winners.length,
        transactions: treasuryTransactions.map(tx => ({
          id: tx.id,
          transactionHash: tx.transaction_hash,
          amount: tx.amount,
          userAddress: tx.user_address
        }))
      }
    })

  } catch (error) {
    console.error('Distribute rewards error:', error)

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