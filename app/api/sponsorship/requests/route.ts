import { NextRequest, NextResponse } from 'next/server'
import { sponsorshipService } from '@/lib/services/sponsorship-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      sponsorName, 
      contactEmail, 
      website, 
      proposedContribution,
      tournamentPreferences,
      brandingRequirements,
      customRewards
    } = body

    if (!sponsorName || !contactEmail || !proposedContribution) {
      return NextResponse.json(
        { error: 'Sponsor name, contact email, and proposed contribution are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const sponsorshipRequest = {
      sponsorName,
      contactEmail,
      website,
      proposedContribution,
      tournamentPreferences: tournamentPreferences || {
        frequency: 'monthly' as const,
        sportPreference: 'both' as const,
        targetAudience: 'General sports fans'
      },
      brandingRequirements: brandingRequirements || {
        logoUrl: '',
        primaryColor: '#000000',
        customMessage: ''
      },
      customRewards: customRewards || {
        nftRewards: false,
        bonusRewards: false,
        exclusiveContent: false
      }
    }

    const result = await sponsorshipService.submitSponsorshipRequest(sponsorshipRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      message: result.message,
      success: true 
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to submit sponsorship request:', error)
    return NextResponse.json(
      { error: 'Failed to submit sponsorship request' },
      { status: 500 }
    )
  }
}