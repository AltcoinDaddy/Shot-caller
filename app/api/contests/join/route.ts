import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const JoinContestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  contestId: z.string().uuid('Invalid contest ID'),
  transactionHash: z.string().min(1, 'Transaction hash is required').optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, contestId, transactionHash } = JoinContestSchema.parse(body)

    // Get user
    const user = await enhancedDatabaseService.getUserByWallet(walletAddress)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get contest
    const contest = await enhancedDatabaseService.getContest(contestId)
    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      )
    }

    // Validate contest status
    if (contest.status !== 'upcoming' && contest.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Contest is not available for joining' },
        { status: 400 }
      )
    }

    // Check if contest is full
    if (contest.max_participants && contest.total_participants >= contest.max_participants) {
      return NextResponse.json(
        { success: false, error: 'Contest is full' },
        { status: 400 }
      )
    }

    // Check if user already has a lineup for this contest week
    const existingLineup = await enhancedDatabaseService.getLineupByUserAndWeek(user.id, contest.week_id)
    if (existingLineup) {
      return NextResponse.json(
        { success: false, error: 'User already has a lineup for this contest week' },
        { status: 400 }
      )
    }

    // If paid contest, create treasury transaction
    if (contest.entry_fee > 0 && transactionHash) {
      const rewardPoolAmount = contest.entry_fee * 0.70 // 70% to reward pool
      const treasuryAmount = contest.entry_fee * 0.30 // 30% to treasury

      await enhancedDatabaseService.createTreasuryTransaction({
        transaction_hash: transactionHash,
        transaction_type: 'tournament_entry',
        amount: contest.entry_fee,
        fee_amount: 0,
        reward_pool_amount: rewardPoolAmount,
        treasury_amount: treasuryAmount,
        user_address: walletAddress
      })

      // Update contest prize pool
      const newPrizePool = contest.prize_pool + rewardPoolAmount
      await enhancedDatabaseService.updateContest(contestId, {
        prize_pool: newPrizePool,
        total_participants: contest.total_participants + 1
      })
    } else {
      // Free contest, just update participant count
      await enhancedDatabaseService.updateContest(contestId, {
        total_participants: contest.total_participants + 1
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined contest',
      contest: {
        id: contest.id,
        weekId: contest.week_id,
        entryFee: contest.entry_fee,
        prizePool: contest.prize_pool + (contest.entry_fee * 0.70),
        totalParticipants: contest.total_participants + 1
      }
    })

  } catch (error) {
    console.error('Join contest error:', error)

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