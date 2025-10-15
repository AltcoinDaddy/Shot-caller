import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const SubmitLineupSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  weekId: z.number().int().positive('Week ID must be positive'),
  nftIds: z.array(z.number().int().positive()).min(1).max(5, 'Lineup must have 1-5 NFTs'),
  contestId: z.string().uuid('Invalid contest ID').optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, weekId, nftIds, contestId } = SubmitLineupSchema.parse(body)

    // Get user
    const user = await enhancedDatabaseService.getUserByWallet(walletAddress)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if contest exists and is active (if contestId provided)
    if (contestId) {
      const contest = await enhancedDatabaseService.getContest(contestId)
      if (!contest) {
        return NextResponse.json(
          { success: false, error: 'Contest not found' },
          { status: 404 }
        )
      }

      if (contest.status !== 'active') {
        return NextResponse.json(
          { success: false, error: 'Contest is not active' },
          { status: 400 }
        )
      }

      // Check if contest deadline has passed
      if (new Date() > new Date(contest.end_time)) {
        return NextResponse.json(
          { success: false, error: 'Contest deadline has passed' },
          { status: 400 }
        )
      }
    }

    // Verify NFT ownership (in production, this would check blockchain)
    for (const nftId of nftIds) {
      const nft = await enhancedDatabaseService.getNFTByMomentId(nftId)
      if (!nft) {
        return NextResponse.json(
          { success: false, error: `NFT with moment ID ${nftId} not found` },
          { status: 400 }
        )
      }
    }

    // Check if user already has a lineup for this week
    const existingLineup = await enhancedDatabaseService.getLineupByUserAndWeek(user.id, weekId)
    
    let lineup
    if (existingLineup) {
      // Update existing lineup if not locked
      if (existingLineup.locked) {
        return NextResponse.json(
          { success: false, error: 'Lineup is locked and cannot be modified' },
          { status: 400 }
        )
      }

      lineup = await enhancedDatabaseService.updateLineup(existingLineup.id, {
        nft_ids: nftIds,
        submitted_at: new Date().toISOString()
      })
    } else {
      // Create new lineup
      lineup = await enhancedDatabaseService.createLineup({
        user_id: user.id,
        week_id: weekId,
        nft_ids: nftIds
      })
    }

    return NextResponse.json({
      success: true,
      lineup: {
        id: lineup.id,
        userId: lineup.user_id,
        weekId: lineup.week_id,
        nftIds: lineup.nft_ids,
        totalPoints: lineup.total_points,
        submittedAt: lineup.submitted_at,
        locked: lineup.locked
      }
    })

  } catch (error) {
    console.error('Submit lineup error:', error)

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