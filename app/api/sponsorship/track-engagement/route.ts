import { NextRequest, NextResponse } from 'next/server'
import { sponsorshipService } from '@/lib/services/sponsorship-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sponsoredTournamentId, eventType } = body

    if (!sponsoredTournamentId || !eventType) {
      return NextResponse.json(
        { error: 'Sponsored tournament ID and event type are required' },
        { status: 400 }
      )
    }

    const validEventTypes = ['view', 'click', 'mention', 'participation']
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid event type. Must be one of: view, click, mention, participation' },
        { status: 400 }
      )
    }

    await sponsorshipService.trackSponsorEngagement(
      sponsoredTournamentId,
      eventType as 'view' | 'click' | 'mention' | 'participation'
    )

    return NextResponse.json({
      success: true,
      message: `${eventType} event tracked successfully`
    })
  } catch (error) {
    console.error('Failed to track engagement:', error)
    return NextResponse.json(
      { error: 'Failed to track sponsor engagement' },
      { status: 500 }
    )
  }
}