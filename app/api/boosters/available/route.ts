import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError } from '@/lib/services/enhanced-database-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const boosterType = searchParams.get('type')
    const sport = searchParams.get('sport')

    // Get available boosters from marketplace (not owned by users)
    const availableBoosters = [
      {
        id: 'disney_energy_1',
        type: 'disney_energy',
        name: 'Disney Energy Boost',
        description: '+5% score multiplier for all players',
        price: 5.0,
        effectType: 'score_multiplier',
        effectValue: 1.05,
        durationHours: 168,
        rarity: 'Common',
        imageUrl: '/placeholder.jpg'
      },
      {
        id: 'disney_luck_1',
        type: 'disney_luck',
        name: 'Disney Luck Charm',
        description: 'Random bonus points (5-15 points)',
        price: 8.0,
        effectType: 'random_bonus',
        effectValue: 10.0,
        durationHours: 168,
        rarity: 'Rare',
        imageUrl: '/placeholder.jpg'
      },
      {
        id: 'shotcaller_power_1',
        type: 'shotcaller_power',
        name: 'ShotCaller Power Boost',
        description: '+5 bonus points to total score',
        price: 3.0,
        effectType: 'extra_points',
        effectValue: 5.0,
        durationHours: 168,
        rarity: 'Common',
        imageUrl: '/placeholder.jpg'
      },
      {
        id: 'shotcaller_multiplier_1',
        type: 'shotcaller_multiplier',
        name: 'ShotCaller Score Multiplier',
        description: '+10% score multiplier for all players',
        price: 12.0,
        effectType: 'score_multiplier',
        effectValue: 1.10,
        durationHours: 168,
        rarity: 'Epic',
        imageUrl: '/placeholder.jpg'
      }
    ]

    let filteredBoosters = availableBoosters

    if (boosterType) {
      filteredBoosters = filteredBoosters.filter(b => b.type === boosterType)
    }

    return NextResponse.json({
      success: true,
      boosters: filteredBoosters
    })

  } catch (error) {
    console.error('Get available boosters error:', error)

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