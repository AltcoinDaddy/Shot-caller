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

    const lineups = premiumService.getUserPremiumLineups(userAddress)
    const features = premiumService.getUserFeatures(userAddress)

    return NextResponse.json({
      success: true,
      lineups,
      maxLineups: 1 + features.extraLineupSlots,
      canCreateMore: lineups.length < (1 + features.extraLineupSlots)
    })

  } catch (error) {
    console.error('Premium lineups error:', error)
    return NextResponse.json(
      { error: 'Failed to get premium lineups' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAddress, lineup } = body

    if (!userAddress || !lineup) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress and lineup' },
        { status: 400 }
      )
    }

    const lineupId = await premiumService.savePremiumLineup(userAddress, lineup)

    return NextResponse.json({
      success: true,
      lineupId,
      message: 'Premium lineup created successfully'
    })

  } catch (error) {
    console.error('Premium lineup creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create premium lineup' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAddress, lineupId, updates } = body

    if (!userAddress || !lineupId || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, lineupId, and updates' },
        { status: 400 }
      )
    }

    await premiumService.updatePremiumLineup(userAddress, lineupId, updates)

    return NextResponse.json({
      success: true,
      message: 'Premium lineup updated successfully'
    })

  } catch (error) {
    console.error('Premium lineup update error:', error)
    return NextResponse.json(
      { error: 'Failed to update premium lineup' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')
    const lineupId = searchParams.get('lineupId')

    if (!userAddress || !lineupId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userAddress and lineupId' },
        { status: 400 }
      )
    }

    await premiumService.deletePremiumLineup(userAddress, lineupId)

    return NextResponse.json({
      success: true,
      message: 'Premium lineup deleted successfully'
    })

  } catch (error) {
    console.error('Premium lineup deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete premium lineup' },
      { status: 500 }
    )
  }
}