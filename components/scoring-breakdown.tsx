'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Trophy, Target } from 'lucide-react';
import { PlayerScore, ScoreBreakdown } from '@/lib/services/fantasy-scoring-engine';

interface ScoringBreakdownProps {
  playerScore: PlayerScore;
  showDetailed?: boolean;
}

export function ScoringBreakdownComponent({ playerScore, showDetailed = false }: ScoringBreakdownProps) {
  const { playerName, sport, fantasyPoints, breakdown } = playerScore;
  const maxPoints = Math.max(...breakdown.map(b => b.totalPoints));

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{playerName}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant={sport === 'NBA' ? 'default' : 'secondary'}>
                {sport}
              </Badge>
              <span className="text-sm text-muted-foreground">Fantasy Points Breakdown</span>
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold">{fantasyPoints}</span>
            </div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {breakdown.map((stat, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stat.description}</span>
                  {stat.totalPoints > 0 && (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  )}
                  {stat.totalPoints < 0 && (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {stat.statValue} × {stat.pointsPerUnit} =
                  </span>
                  <span className={`font-bold ${
                    stat.totalPoints > 0 ? 'text-green-600' : 
                    stat.totalPoints < 0 ? 'text-red-600' : 
                    'text-muted-foreground'
                  }`}>
                    {stat.totalPoints > 0 ? '+' : ''}{stat.totalPoints}
                  </span>
                </div>
              </div>
              
              {showDetailed && maxPoints > 0 && (
                <div className="space-y-1">
                  <Progress 
                    value={Math.abs(stat.totalPoints) / maxPoints * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{stat.statName}: {stat.statValue}</span>
                    <span>{Math.round((Math.abs(stat.totalPoints) / fantasyPoints) * 100)}% of total</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {showDetailed && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Performance Rating</span>
              </div>
              <Badge variant={fantasyPoints >= 50 ? 'default' : fantasyPoints >= 30 ? 'secondary' : 'outline'}>
                {fantasyPoints >= 50 ? 'Excellent' : fantasyPoints >= 30 ? 'Good' : 'Average'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface LineupScoringBreakdownProps {
  playerScores: PlayerScore[];
  totalPoints: number;
  lineupId: string;
}

export function LineupScoringBreakdown({ playerScores, totalPoints, lineupId }: LineupScoringBreakdownProps) {
  const topPerformer = playerScores.reduce((prev, current) => 
    prev.fantasyPoints > current.fantasyPoints ? prev : current
  );
  
  const averagePoints = totalPoints / playerScores.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lineup Performance Summary</span>
            <div className="flex items-center gap-1">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">{totalPoints}</span>
            </div>
          </CardTitle>
          <CardDescription>
            Lineup ID: {lineupId} • {playerScores.length} players
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{topPerformer.fantasyPoints}</div>
              <div className="text-sm text-muted-foreground">Top Performer</div>
              <div className="text-xs font-medium">{topPerformer.playerName}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{averagePoints.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Average Points</div>
              <div className="text-xs">Per Player</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {playerScores.filter(p => p.fantasyPoints > averagePoints).length}
              </div>
              <div className="text-sm text-muted-foreground">Above Average</div>
              <div className="text-xs">Players</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {playerScores
          .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
          .map((playerScore, index) => (
            <ScoringBreakdownComponent 
              key={`${playerScore.playerId}-${index}`}
              playerScore={playerScore} 
              showDetailed={true}
            />
          ))}
      </div>
    </div>
  );
}