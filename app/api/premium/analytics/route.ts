import { NextRequest, NextResponse } from 'next/server'
import { premiumService } from '@/lib/services/premium-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')

    if (!userAddress) {
      return NextResponse.json(
        { error: 'Missing userAddress parameter' },
        { status: 400 }
      )
    }

    // Check if user has premium access
    const features = premiumService.getUserFeatures(userAddress)
    if (!features.advancedAnalytics) {
      return NextResponse.json(
        { error: 'Premium access required for analytics' },
        { status: 403 }
      )
    }

    const analytics = await premiumService.getPremiumAnalytics(userAddress)

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('Premium analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get premium analytics' },
      { status: 500 }
    )
  }
}