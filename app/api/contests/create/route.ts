import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { CreateContestSchema, validateContestTiming, formatZodError } from '@/lib/utils/validation'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weekId, startTime, endTime, entryFee, maxParticipants, contestType } = CreateContestSchema.parse(body)

    // Validate contest timing
    const timingValidation = validateContestTiming(startTime, endTime)
    if (!timingValidation.valid) {
      return NextResponse.json(
        { success: false, error: timingValidation.error },
        { status: 400 }
      )
    }

    // Create contest
    const contest = await enhancedDatabaseService.createContest({
      week_id: weekId,
      start_time: startTime,
      end_time: endTime,
      status: 'upcoming',
      entry_fee: entryFee,
      prize_pool: 0, // Will be calculated based on entries
      max_participants: maxParticipants,
      contest_type: contestType
    })

    return NextResponse.json({
      success: true,
      contest: {
        id: contest.id,
        weekId: contest.week_id,
        startTime: contest.start_time,
        endTime: contest.end_time,
        status: contest.status,
        totalParticipants: contest.total_participants,
        rewardsDistributed: contest.rewards_distributed,
        entryFee: contest.entry_fee,
        prizePool: contest.prize_pool,
        maxParticipants: contest.max_participants,
        contestType: contest.contest_type
      }
    })

  } catch (error) {
    console.error('Create contest error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: formatZodError(error)
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