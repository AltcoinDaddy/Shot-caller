'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calculator, Users } from 'lucide-react';
import { FantasyScoringEngine } from '@/lib/services/fantasy-scoring-engine';
import { PlayerStats, NBAStats, NFLStats } from '@/lib/types/player-stats';
import { ScoringBreakdownComponent } from './scoring-breakdown';

export function ScoringExample() {
  const [calculatedScores, setCalculatedScores] = useState<any[]>([]);
  const [lineupScore, setLineupScore] = useState<any>(null);

  const scoringEngine = new FantasyScoringEngine();

  // Example NBA player stats
  const exampleNBAStats: PlayerStats = {
    id: 'example_nba_1',
    playerName: 'LeBron James',
    gameDate: new Date(),
    sport: 'NBA',
    team: 'Lakers',
    opponent: 'Warriors',
    gameStatus: 'completed',
    stats: {
      minutes: 35,
      points: 28,
      rebounds: 9,
      assists: 7,
      steals: 2,
      blocks: 1,
      turnovers: 4,
      fieldGoalsMade: 11,
      fieldGoalsAttempted: 20,
      threePointersMade: 3,
      threePointersAttempted: 8,
      freeThrowsMade: 3,
      freeThrowsAttempted: 4,
      personalFouls: 2,
      plusMinus: 15
    } as NBAStats,
    fantasyPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Example NFL player stats
  const exampleNFLStats: PlayerStats = {
    id: 'example_nfl_1',
    playerName: 'Patrick Mahomes',
    gameDate: new Date(),
    sport: 'NFL',
    team: 'Chiefs',
    opponent: 'Bills',
    gameStatus: 'completed',
    stats: {
      passingYards: 315,
      passingTouchdowns: 3,
      interceptions: 1,
      completions: 24,
      attempts: 38,
      rushingYards: 42,
      rushingTouchdowns: 1,
      rushingAttempts: 6,
      receivingYards: 0,
      receivingTouchdowns: 0,
      receptions: 0,
      targets: 0,
      tackles: 0,
      sacks: 0,
      forcedFumbles: 0,
      interceptionsCaught: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      extraPointsMade: 0,
      extraPointsAttempted: 0
    } as NFLStats,
    fantasyPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const calculateExampleScores = () => {
    // Calculate individual player scores
    const nbaScore = scoringEngine.calculatePlayerScore(exampleNBAStats);
    const nflScore = scoringEngine.calculatePlayerScore(exampleNFLStats);

    setCalculatedScores([nbaScore, nflScore]);

    // Calculate lineup score
    const lineup = scoringEngine.calculateLineupScore('example_lineup', [exampleNBAStats, exampleNFLStats]);
    setLineupScore(lineup);
  };

  const applyBoosterExample = () => {
    if (!lineupScore) return;

    const boosters = [
      {
        type: 'score_multiplier' as const,
        value: 1.05,
        description: 'Disney Energy Boost (+5%)'
      },
      {
        type: 'extra_points' as const,
        value: 15,
        description: 'Lucky Bonus Points'
      }
    ];

    const boostedScore = scoringEngine.applyBoosterEffects(lineupScore, boosters);
    setLineupScore(boostedScore);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Fantasy Scoring System Demo
          </CardTitle>
          <CardDescription>
            Interactive example showing how the fantasy scoring engine calculates points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={calculateExampleScores}>
              Calculate Scores
            </Button>
            {lineupScore && (
              <Button variant="outline" onClick={applyBoosterExample}>
                Apply Boosters
              </Button>
            )}
          </div>

          {/* Example Player Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Example NBA Stats</h4>
                <Badge variant="default">NBA</Badge>
              </div>
              <div className="text-sm space-y-1">
                <div>Player: {exampleNBAStats.playerName}</div>
                <div>Points: {(exampleNBAStats.stats as NBAStats).points}</div>
                <div>Rebounds: {(exampleNBAStats.stats as NBAStats).rebounds}</div>
                <div>Assists: {(exampleNBAStats.stats as NBAStats).assists}</div>
                <div>Steals: {(exampleNBAStats.stats as NBAStats).steals}</div>
                <div>Blocks: {(exampleNBAStats.stats as NBAStats).blocks}</div>
                <div>Turnovers: {(exampleNBAStats.stats as NBAStats).turnovers}</div>
                <div>3PM: {(exampleNBAStats.stats as NBAStats).threePointersMade}</div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Example NFL Stats</h4>
                <Badge variant="secondary">NFL</Badge>
              </div>
              <div className="text-sm space-y-1">
                <div>Player: {exampleNFLStats.playerName}</div>
                <div>Pass Yards: {(exampleNFLStats.stats as NFLStats).passingYards}</div>
                <div>Pass TDs: {(exampleNFLStats.stats as NFLStats).passingTouchdowns}</div>
                <div>Interceptions: {(exampleNFLStats.stats as NFLStats).interceptions}</div>
                <div>Rush Yards: {(exampleNFLStats.stats as NFLStats).rushingYards}</div>
                <div>Rush TDs: {(exampleNFLStats.stats as NFLStats).rushingTouchdowns}</div>
              </div>
            </Card>
          </div>

          {/* Lineup Summary */}
          {lineupScore && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Lineup Total
                  </span>
                  <span className="text-3xl font-bold">{lineupScore.totalPoints}</span>
                </CardTitle>
                <CardDescription>
                  {lineupScore.playerScores.length} players • Calculated at {new Date(lineupScore.calculatedAt).toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Individual Player Breakdowns */}
          {calculatedScores.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Individual Player Breakdowns
              </h3>
              {calculatedScores.map((playerScore, index) => (
                <ScoringBreakdownComponent
                  key={index}
                  playerScore={playerScore}
                  showDetailed={true}
                />
              ))}
            </div>
          )}

          {/* Scoring Rules Reference */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Scoring Rules Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Badge variant="default">NBA</Badge>
                    Scoring Rules
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>Points: 1.0 per point</div>
                    <div>Rebounds: 1.2 per rebound</div>
                    <div>Assists: 1.5 per assist</div>
                    <div>Steals: 3.0 per steal</div>
                    <div>Blocks: 3.0 per block</div>
                    <div>Turnovers: -1.0 per turnover</div>
                    <div>3-Pointers Made: 0.5 bonus per 3PM</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Badge variant="secondary">NFL</Badge>
                    Scoring Rules
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>Passing Yards: 0.04 per yard (1 pt/25 yds)</div>
                    <div>Passing TDs: 4.0 per TD</div>
                    <div>Interceptions: -2.0 per INT</div>
                    <div>Rushing Yards: 0.1 per yard (1 pt/10 yds)</div>
                    <div>Rushing TDs: 6.0 per TD</div>
                    <div>Receiving Yards: 0.1 per yard</div>
                    <div>Receiving TDs: 6.0 per TD</div>
                    <div>Receptions: 0.5 per catch (PPR)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}