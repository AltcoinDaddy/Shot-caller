import { NextRequest, NextResponse } from 'next/server'
import { sponsorshipService } from '@/lib/services/sponsorship-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tournamentId, sponsorId, contribution } = body

    if (!tournamentId || !sponsorId || !contribution) {
      return NextResponse.json(
        { error: 'Tournament ID, sponsor ID, and contribution amount are required' },
        { status: 400 }
      )
    }

    if (contribution <= 0) {
      return NextResponse.json(
        { error: 'Contribution amount must be positive' },
        { status: 400 }
      )
    }

    const result = await sponsorshipService.enhanceTournamentWithSponsorship(
      tournamentId,
      sponsorId,
      contribution
    )

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to enhance tournament with sponsorship' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      newPrizePool: result.newPrizePool,
      message: `Tournament enhanced with ${contribution} FLOW contribution`
    })
  } catch (error) {
    console.error('Failed to enhance tournament:', error)
    return NextResponse.json(
      { error: 'Failed to enhance tournament with sponsorship' },
      { status: 500 }
    )
  }
}