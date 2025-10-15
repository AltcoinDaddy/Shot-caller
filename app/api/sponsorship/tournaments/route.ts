import { NextRequest, NextResponse } from 'next/server'
import { sponsorshipService } from '@/lib/services/sponsorship-service'

export async function GET() {
  try {
    const sponsoredTournaments = await sponsorshipService.getSponsoredTournaments()
    return NextResponse.json({ sponsoredTournaments })
  } catch (error) {
    console.error('Failed to fetch sponsored tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sponsored tournaments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tournamentId, 
      sponsorId, 
      sponsorContribution, 
      brandingConfig, 
      customRewards 
    } = body

    if (!tournamentId || !sponsorId || !sponsorContribution) {
      return NextResponse.json(
        { error: 'Tournament ID, sponsor ID, and contribution amount are required' },
        { status: 400 }
      )
    }

    const sponsoredTournament = await sponsorshipService.createSponsoredTournament({
      tournamentId,
      sponsorId,
      sponsorContribution,
      brandingConfig: brandingConfig || {
        logoPlacement: 'header' as const
      },
      customRewards: customRewards || {
        nftRewards: [],
        bonusFlowRewards: []
      },
      status: 'active' as const
    })

    return NextResponse.json({ sponsoredTournament }, { status: 201 })
  } catch (error) {
    console.error('Failed to create sponsored tournament:', error)
    return NextResponse.json(
      { error: 'Failed to create sponsored tournament' },
      { status: 500 }
    )
  }
}