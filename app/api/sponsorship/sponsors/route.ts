import { NextRequest, NextResponse } from 'next/server'
import { sponsorshipService } from '@/lib/services/sponsorship-service'

export async function GET() {
  try {
    const sponsors = await sponsorshipService.getSponsors()
    return NextResponse.json({ sponsors })
  } catch (error) {
    console.error('Failed to fetch sponsors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sponsors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, logoUrl, website, description } = body

    if (!name || !logoUrl) {
      return NextResponse.json(
        { error: 'Name and logo URL are required' },
        { status: 400 }
      )
    }

    const sponsor = await sponsorshipService.createSponsor({
      name,
      logoUrl,
      website,
      description,
      isActive: true
    })

    return NextResponse.json({ sponsor }, { status: 201 })
  } catch (error) {
    console.error('Failed to create sponsor:', error)
    return NextResponse.json(
      { error: 'Failed to create sponsor' },
      { status: 500 }
    )
  }
}