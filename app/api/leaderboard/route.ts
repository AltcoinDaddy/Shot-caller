import { NextRequest, NextResponse } from 'next/server';
import { leaderboardService } from '@/lib/services/leaderboard-service';
import { LeaderboardTimeframe } from '@/lib/types/leaderboard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get('timeframe') as LeaderboardTimeframe) || 'season';
    const limit = parseInt(searchParams.get('limit') || '100');
    const userId = searchParams.get('userId');

    if (userId) {
      // Get specific user ranking
      const userRanking = await leaderboardService.getUserRanking(userId, timeframe);
      if (!userRanking) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(userRanking);
    }

    // Get full leaderboard
    const leaderboard = await leaderboardService.getLeaderboard(timeframe, limit);
    const stats = await leaderboardService.getLeaderboardStats();

    return NextResponse.json({
      leaderboard,
      stats,
      timeframe,
      total: leaderboard.length
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, weeklyPoints, totalPoints } = body;

    if (!userId || typeof weeklyPoints !== 'number' || typeof totalPoints !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: userId, weeklyPoints, totalPoints' },
        { status: 400 }
      );
    }

    await leaderboardService.updateUserPoints(userId, weeklyPoints, totalPoints);
    const updatedRanking = await leaderboardService.getUserRanking(userId);

    return NextResponse.json({
      success: true,
      ranking: updatedRanking
    });
  } catch (error) {
    console.error('Update leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to update leaderboard' },
      { status: 500 }
    );
  }
}