import { NextRequest, NextResponse } from 'next/server';
import { FantasyScoringEngine } from '@/lib/services/fantasy-scoring-engine';
import { sportsDataIntegration } from '@/lib/services/sports-data-integration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineupId, playerIds, date } = body;

    if (!lineupId || !playerIds || !Array.isArray(playerIds)) {
      return NextResponse.json(
        { error: 'Lineup ID and player IDs array are required' },
        { status: 400 }
      );
    }

    const targetDate = date ? new Date(date) : new Date();
    const scoringEngine = new FantasyScoringEngine();

    // Ensure sports data integration is initialized
    const initialized = await sportsDataIntegration.initialize();
    if (!initialized) {
      return NextResponse.json(
        { error: 'Sports data integration failed to initialize' },
        { status: 500 }
      );
    }

    // Fetch player stats for each player
    const playerStats = [];
    for (const playerId of playerIds) {
      const sport = playerId.includes('nfl') ? 'NFL' : 'NBA';
      const stats = await sportsDataIntegration.getPlayerStats(playerId, sport, targetDate);
      if (stats) {
        playerStats.push(stats);
      }
    }

    if (playerStats.length === 0) {
      return NextResponse.json(
        { error: 'No player stats found for the specified players and date' },
        { status: 404 }
      );
    }

    // Calculate detailed lineup score with breakdown
    const lineupScore = scoringEngine.calculateLineupScore(lineupId, playerStats);

    // Calculate additional analytics
    const topPerformer = lineupScore.playerScores.reduce((prev, current) => 
      prev.fantasyPoints > current.fantasyPoints ? prev : current
    );

    const averagePoints = lineupScore.totalPoints / lineupScore.playerScores.length;
    const aboveAverageCount = lineupScore.playerScores.filter(p => p.fantasyPoints > averagePoints).length;

    // Calculate sport distribution
    const sportDistribution = lineupScore.playerScores.reduce((acc, player) => {
      acc[player.sport] = (acc[player.sport] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate scoring efficiency (points per stat category)
    const scoringEfficiency = lineupScore.playerScores.map(player => {
      const totalStats = player.breakdown.reduce((sum, stat) => sum + Math.abs(stat.statValue), 0);
      return {
        playerId: player.playerId,
        playerName: player.playerName,
        efficiency: totalStats > 0 ? player.fantasyPoints / totalStats : 0
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        lineupScore,
        analytics: {
          topPerformer: {
            playerId: topPerformer.playerId,
            playerName: topPerformer.playerName,
            points: topPerformer.fantasyPoints,
            sport: topPerformer.sport
          },
          averagePoints: Math.round(averagePoints * 10) / 10,
          aboveAverageCount,
          sportDistribution,
          scoringEfficiency: scoringEfficiency.sort((a, b) => b.efficiency - a.efficiency)
        },
        metadata: {
          lineupId,
          calculatedAt: lineupScore.calculatedAt,
          playerCount: lineupScore.playerScores.length,
          date: targetDate.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Error calculating scoring breakdown:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate scoring breakdown',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const sport = searchParams.get('sport') as 'NBA' | 'NFL';
    const date = searchParams.get('date');

    if (!playerId || !sport) {
      return NextResponse.json(
        { error: 'Player ID and sport are required' },
        { status: 400 }
      );
    }

    const targetDate = date ? new Date(date) : new Date();
    const scoringEngine = new FantasyScoringEngine();

    // Ensure sports data integration is initialized
    const initialized = await sportsDataIntegration.initialize();
    if (!initialized) {
      return NextResponse.json(
        { error: 'Sports data integration failed to initialize' },
        { status: 500 }
      );
    }

    // Get player stats
    const playerStats = await sportsDataIntegration.getPlayerStats(playerId, sport, targetDate);
    
    if (!playerStats) {
      return NextResponse.json(
        { error: 'Player stats not found' },
        { status: 404 }
      );
    }

    // Calculate player score with detailed breakdown
    const playerScore = scoringEngine.calculatePlayerScore(playerStats);

    // Calculate performance rating
    const performanceRating = playerScore.fantasyPoints >= 50 ? 'Excellent' : 
                             playerScore.fantasyPoints >= 30 ? 'Good' : 
                             playerScore.fantasyPoints >= 15 ? 'Average' : 'Below Average';

    // Calculate stat contributions as percentages
    const statContributions = playerScore.breakdown.map(stat => ({
      ...stat,
      contributionPercentage: Math.round((Math.abs(stat.totalPoints) / Math.abs(playerScore.fantasyPoints)) * 100)
    }));

    return NextResponse.json({
      success: true,
      data: {
        playerScore: {
          ...playerScore,
          breakdown: statContributions
        },
        analytics: {
          performanceRating,
          dominantStat: statContributions.reduce((prev, current) => 
            prev.totalPoints > current.totalPoints ? prev : current
          ),
          negativeStats: statContributions.filter(stat => stat.totalPoints < 0),
          positiveStats: statContributions.filter(stat => stat.totalPoints > 0)
        },
        metadata: {
          playerId,
          sport,
          date: targetDate.toISOString().split('T')[0],
          gameStatus: playerStats.gameStatus,
          opponent: playerStats.opponent
        }
      }
    });

  } catch (error) {
    console.error('Error getting player scoring breakdown:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get player scoring breakdown',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}