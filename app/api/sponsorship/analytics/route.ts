import { NextRequest, NextResponse } from 'next/server'
import { sponsorshipService } from '@/lib/services/sponsorship-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sponsorId = searchParams.get('sponsorId')
    const period = searchParams.get('period') || '30d'

    if (!sponsorId) {
      return NextResponse.json(
        { error: 'Sponsor ID is required' },
        { status: 400 }
      )
    }

    // Calculate date range based on period
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    const analytics = await sponsorshipService.getSponsorAnalytics(
      sponsorId,
      startDate,
      endDate
    )

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Failed to fetch sponsor analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sponsor analytics' },
      { status: 500 }
    )
  }
}