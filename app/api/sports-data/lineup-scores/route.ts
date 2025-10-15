import { NextRequest, NextResponse } from 'next/server';
import { sportsDataIntegration } from '@/lib/services/sports-data-integration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineups, date } = body;

    if (!lineups || !Array.isArray(lineups)) {
      return NextResponse.json(
        { error: 'Lineups array is required' },
        { status: 400 }
      );
    }

    // Validate lineup format
    for (const lineup of lineups) {
      if (!lineup.id || !lineup.playerIds || !Array.isArray(lineup.playerIds)) {
        return NextResponse.json(
          { error: 'Each lineup must have an id and playerIds array' },
          { status: 400 }
        );
      }
    }

    const targetDate = date ? new Date(date) : new Date();

    // Ensure the integration is initialized
    const initialized = await sportsDataIntegration.initialize();
    if (!initialized) {
      return NextResponse.json(
        { error: 'Sports data integration failed to initialize' },
        { status: 500 }
      );
    }

    const lineupScores = await sportsDataIntegration.calculateLineupScores(lineups, targetDate);

    return NextResponse.json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      lineupCount: lineupScores.length,
      data: lineupScores
    });

  } catch (error) {
    console.error('Error calculating lineup scores:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate lineup scores',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}