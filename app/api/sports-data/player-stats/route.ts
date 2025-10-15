import { NextRequest, NextResponse } from 'next/server';
import { sportsDataIntegration } from '@/lib/services/sports-data-integration';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get('playerId');
    const sport = searchParams.get('sport') as 'NBA' | 'NFL';
    const dateStr = searchParams.get('date');

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    if (!sport || !['NBA', 'NFL'].includes(sport)) {
      return NextResponse.json(
        { error: 'Invalid sport parameter. Must be NBA or NFL.' },
        { status: 400 }
      );
    }

    const date = dateStr ? new Date(dateStr) : new Date();

    // Ensure the integration is initialized
    const initialized = await sportsDataIntegration.initialize();
    if (!initialized) {
      return NextResponse.json(
        { error: 'Sports data integration failed to initialize' },
        { status: 500 }
      );
    }

    const playerStats = await sportsDataIntegration.getPlayerStats(playerId, sport, date);

    if (!playerStats) {
      return NextResponse.json(
        { 
          success: false,
          message: 'No stats found for the specified player and date'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: playerStats
    });

  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch player stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}