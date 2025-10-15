import { NextRequest, NextResponse } from 'next/server';
import { leaderboardService } from '@/lib/services/leaderboard-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');

    if (contestId) {
      // Get specific prize pool
      const prizePool = await leaderboardService.getPrizePool(contestId);
      if (!prizePool) {
        return NextResponse.json({ error: 'Prize pool not found' }, { status: 404 });
      }
      return NextResponse.json(prizePool);
    }

    // Get all prize pools (for admin/overview)
    const stats = await leaderboardService.getLeaderboardStats();
    return NextResponse.json({
      totalPrizePool: stats.totalPrizePool,
      activeContests: stats.activeContests
    });
  } catch (error) {
    console.error('Prize pools API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prize pools' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      contestId, 
      totalPool, 
      currency = 'FLOW', 
      distribution, 
      sponsored = false, 
      sponsorName, 
      sponsorLogo 
    } = body;

    if (!contestId || !totalPool || !distribution || !Array.isArray(distribution)) {
      return NextResponse.json(
        { error: 'Missing required fields: contestId, totalPool, distribution' },
        { status: 400 }
      );
    }

    // Validate distribution percentages add up to 100%
    const totalPercentage = distribution.reduce((sum: number, dist: any) => sum + dist.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Distribution percentages must add up to 100%' },
        { status: 400 }
      );
    }

    const prizePoolId = await leaderboardService.createPrizePool({
      contestId,
      totalPool,
      currency,
      distribution,
      sponsored,
      sponsorName,
      sponsorLogo
    });

    return NextResponse.json({
      success: true,
      prizePoolId
    });
  } catch (error) {
    console.error('Create prize pool API error:', error);
    return NextResponse.json(
      { error: 'Failed to create prize pool' },
      { status: 500 }
    );
  }
}