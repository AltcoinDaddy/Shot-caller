import { NextRequest, NextResponse } from 'next/server';
import { sportsDataIntegration } from '@/lib/services/sports-data-integration';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sport = searchParams.get('sport') as 'NBA' | 'NFL';
    const dateStr = searchParams.get('date');

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

    const dailyStats = await sportsDataIntegration.getDailyStats(sport, date);

    return NextResponse.json({
      success: true,
      sport,
      date: date.toISOString().split('T')[0],
      count: dailyStats.length,
      data: dailyStats
    });

  } catch (error) {
    console.error('Error fetching daily stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch daily stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sport, date, force = false } = body;

    if (!sport || !['NBA', 'NFL'].includes(sport)) {
      return NextResponse.json(
        { error: 'Invalid sport parameter. Must be NBA or NFL.' },
        { status: 400 }
      );
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

    let syncResult;
    if (force) {
      syncResult = await sportsDataIntegration.forceSyncDate(sport, targetDate);
    } else {
      const dailyStats = await sportsDataIntegration.getDailyStats(sport, targetDate);
      syncResult = {
        success: true,
        playersUpdated: dailyStats.length,
        errors: [],
        duration: 0
      };
    }

    return NextResponse.json({
      success: syncResult.success,
      sport,
      date: targetDate.toISOString().split('T')[0],
      playersUpdated: syncResult.playersUpdated,
      errors: syncResult.errors,
      duration: syncResult.duration
    });

  } catch (error) {
    console.error('Error syncing daily stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync daily stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}