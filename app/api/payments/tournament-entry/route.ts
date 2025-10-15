import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const TournamentEntrySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  contestId: z.string().uuid('Invalid contest ID'),
  entryFee: z.number().positive('Entry fee must be positive'),
  transactionHash: z.string().min(1, 'Transaction hash is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, contestId, entryFee, transactionHash } = TournamentEntrySchema.parse(body)

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

    // Verify contest is accepting entries
    if (contest.status !== 'active' && contest.status !== 'upcoming') {
      return NextResponse.json(
        { success: false, error: 'Contest is not accepting entries' },
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

    // Verify entry fee matches contest requirement
    if (Math.abs(entryFee - contest.entry_fee) > 0.001) {
      return NextResponse.json(
        { success: false, error: 'Entry fee does not match contest requirement' },
        { status: 400 }
      )
    }

    // Calculate fee distribution (70% to reward pool, 30% to treasury)
    const rewardPoolAmount = entryFee * 0.7
    const treasuryAmount = entryFee * 0.3

    // Create treasury transaction
    const transaction = await enhancedDatabaseService.createTreasuryTransaction({
      transaction_hash: transactionHash,
      transaction_type: 'tournament_entry',
      amount: entryFee,
      fee_amount: 0, // No additional fee for tournament entry
      reward_pool_amount: rewardPoolAmount,
      treasury_amount: treasuryAmount,
      user_address: walletAddress
    })

    // Update contest participant count and prize pool
    const updatedContest = await enhancedDatabaseService.updateContest(contestId, {
      total_participants: contest.total_participants + 1,
      prize_pool: contest.prize_pool + rewardPoolAmount
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        transactionHash: transaction.transaction_hash,
        amount: transaction.amount,
        rewardPoolAmount: transaction.reward_pool_amount,
        treasuryAmount: transaction.treasury_amount
      },
      contest: {
        id: updatedContest.id,
        totalParticipants: updatedContest.total_participants,
        prizePool: updatedContest.prize_pool
      }
    })

  } catch (error) {
    console.error('Tournament entry payment error:', error)

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