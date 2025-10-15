import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError } from '@/lib/services/enhanced-database-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contestType = searchParams.get('type')
    const status = searchParams.get('status')

    // Get active contests
    const contests = await enhancedDatabaseService.getActiveContests()

    let filteredContests = contests

    // Filter by contest type if specified
    if (contestType) {
      filteredContests = filteredContests.filter(c => c.contest_type === contestType)
    }

    // Filter by status if specified
    if (status) {
      filteredContests = filteredContests.filter(c => c.status === status)
    }

    // Format contests for response
    const formattedContests = filteredContests.map(contest => ({
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
      contestType: contest.contest_type,
      spotsRemaining: contest.max_participants ? contest.max_participants - contest.total_participants : null,
      timeUntilStart: new Date(contest.start_time).getTime() - Date.now(),
      timeUntilEnd: new Date(contest.end_time).getTime() - Date.now()
    }))

    return NextResponse.json({
      success: true,
      contests: formattedContests
    })

  } catch (error) {
    console.error('Get available contests error:', error)

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