import { NextRequest, NextResponse } from 'next/server';
import { leaderboardService } from '@/lib/services/leaderboard-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');

    if (!contestId) {
      return NextResponse.json(
        { error: 'contestId parameter is required' },
        { status: 400 }
      );
    }

    const contestLeaderboard = await leaderboardService.getContestLeaderboard(contestId);
    
    if (!contestLeaderboard) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contestLeaderboard);
  } catch (error) {
    console.error('Contest leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contest leaderboard' },
      { status: 500 }
    );
  }
}