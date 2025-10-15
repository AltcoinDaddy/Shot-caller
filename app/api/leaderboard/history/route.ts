import { NextRequest, NextResponse } from 'next/server';
import { leaderboardService } from '@/lib/services/leaderboard-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    const history = await leaderboardService.getUserRankingHistory(userId, limit);

    return NextResponse.json({
      history,
      userId,
      total: history.length
    });
  } catch (error) {
    console.error('Ranking history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ranking history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      weekId, 
      rank, 
      points, 
      nftsUsed, 
      contestsEntered, 
      contestsWon, 
      rewardsEarned 
    } = body;

    if (!userId || !weekId || !rank || !points) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, weekId, rank, points' },
        { status: 400 }
      );
    }

    await leaderboardService.addRankingHistory({
      userId,
      weekId,
      rank,
      points,
      nftsUsed: nftsUsed || 0,
      contestsEntered: contestsEntered || 0,
      contestsWon: contestsWon || 0,
      rewardsEarned: rewardsEarned || 0
    });

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Add ranking history API error:', error);
    return NextResponse.json(
      { error: 'Failed to add ranking history' },
      { status: 500 }
    );
  }
}