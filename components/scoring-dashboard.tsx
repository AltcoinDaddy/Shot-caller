'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Calendar,
  Target,
  Users,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useScoring } from '@/hooks/use-scoring';
import { ScoringBreakdownComponent } from './scoring-breakdown';
import { ActiveBoosterEffects } from './active-booster-effects';

interface ScoringDashboardProps {
  lineupId?: string;
  playerIds?: string[];
  weekId?: number;
  showWeeklyControls?: boolean;
}

export function ScoringDashboard({ 
  lineupId = 'current_lineup', 
  playerIds = [], 
  weekId = 8,
  showWeeklyControls = false 
}: ScoringDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lineupBreakdown, setLineupBreakdown] = useState<any>(null);
  const [weeklyJobStatus, setWeeklyJobStatus] = useState<any>(null);
  
  const { 
    calculateLineupBreakdown, 
    triggerWeeklyUpdate, 
    getWeeklyScoringStatus,
    loading,
    error 
  } = useScoring();

  // Load lineup breakdown on component mount
  useEffect(() => {
    if (playerIds.length > 0) {
      loadLineupBreakdown();
    }
  }, [playerIds, selectedDate]);

  const loadLineupBreakdown = async () => {
    if (playerIds.length === 0) return;
    
    const breakdown = await calculateLineupBreakdown(lineupId, playerIds, selectedDate);
    if (breakdown) {
      setLineupBreakdown(breakdown);
    }
  };

  const handleWeeklyUpdate = async (force = false) => {
    const job = await triggerWeeklyUpdate(weekId, selectedDate, force);
    if (job) {
      setWeeklyJobStatus(job);
      // Reload breakdown after update
      setTimeout(() => loadLineupBreakdown(), 2000);
    }
  };

  const checkWeeklyStatus = async () => {
    const status = await getWeeklyScoringStatus();
    if (status && 'activeJobs' in status) {
      setWeeklyJobStatus(status.activeJobs[0] || null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const renderSummaryStats = () => {
    if (!lineupBreakdown) return null;

    const { lineupScore, analytics } = lineupBreakdown;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Total Points</div>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold">{lineupScore.totalPoints}</div>
          <div className="text-sm text-muted-foreground">
            {analytics.playerCount} players
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Top Performer</div>
            <Target className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-3xl font-bold">{analytics.topPerformer.points}</div>
          <div className="text-sm text-muted-foreground truncate">
            {analytics.topPerformer.playerName}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Average</div>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold">{analytics.averagePoints}</div>
          <div className="text-sm text-muted-foreground">Per player</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Above Average</div>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-3xl font-bold">{analytics.aboveAverageCount}</div>
          <div className="text-sm text-muted-foreground">
            of {analytics.playerCount} players
          </div>
        </Card>
      </div>
    );
  };

  const renderSportDistribution = () => {
    if (!lineupBreakdown?.analytics.sportDistribution) return null;

    const { sportDistribution } = lineupBreakdown.analytics;
    const total = Object.values(sportDistribution).reduce((sum: number, count: any) => sum + count, 0);

    return (
      <Card className="p-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Sport Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(sportDistribution).map(([sport, count]: [string, any]) => (
              <div key={sport} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={sport === 'NBA' ? 'default' : 'secondary'}>
                      {sport}
                    </Badge>
                    <span>{count} players</span>
                  </div>
                  <span className="text-muted-foreground">
                    {Math.round((count / total) * 100)}%
                  </span>
                </div>
                <Progress value={(count / total) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEfficiencyRankings = () => {
    if (!lineupBreakdown?.analytics.scoringEfficiency) return null;

    const { scoringEfficiency } = lineupBreakdown.analytics;

    return (
      <Card className="p-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Scoring Efficiency</CardTitle>
          <CardDescription>Points per stat contribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scoringEfficiency.slice(0, 5).map((player: any, index: number) => (
              <div key={player.playerId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium truncate">
                    {player.playerName}
                  </span>
                </div>
                <div className="text-sm font-bold">
                  {player.efficiency.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Scoring Dashboard</h2>
          <p className="text-muted-foreground">
            Detailed performance analysis and scoring breakdown
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={formatDate(selectedDate)}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 border rounded-md text-sm"
          />
          <Button
            onClick={loadLineupBreakdown}
            disabled={loading || playerIds.length === 0}
            size="sm"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-red-700">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Controls */}
      {showWeeklyControls && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Scoring Management
            </CardTitle>
            <CardDescription>
              Trigger weekly scoring updates and view job status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Button
                onClick={() => handleWeeklyUpdate(false)}
                disabled={loading}
              >
                Update Week {weekId}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleWeeklyUpdate(true)}
                disabled={loading}
              >
                Force Recalculate
              </Button>
              <Button
                variant="outline"
                onClick={checkWeeklyStatus}
                disabled={loading}
              >
                Check Status
              </Button>
            </div>

            {weeklyJobStatus && (
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Job Status</span>
                  <Badge variant={
                    weeklyJobStatus.status === 'completed' ? 'default' :
                    weeklyJobStatus.status === 'failed' ? 'destructive' :
                    'secondary'
                  }>
                    {weeklyJobStatus.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Processed: {weeklyJobStatus.processedCount}/{weeklyJobStatus.lineupCount}
                </div>
                {weeklyJobStatus.error && (
                  <div className="text-sm text-red-600 mt-1">
                    Error: {weeklyJobStatus.error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {lineupBreakdown ? (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="breakdown">Player Breakdown</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            {renderSummaryStats()}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ActiveBoosterEffects lineupId={lineupId} showInScoring={true} />
              {renderSportDistribution()}
              {renderEfficiencyRankings()}
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            {lineupBreakdown.lineupScore.playerScores.map((playerScore: any, index: number) => (
              <ScoringBreakdownComponent
                key={`${playerScore.playerId}-${index}`}
                playerScore={playerScore}
                showDetailed={true}
              />
            ))}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderSportDistribution()}
              {renderEfficiencyRankings()}
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span>Lineup Efficiency Score</span>
                    <span className="font-bold">
                      {(lineupBreakdown.lineupScore.totalPoints / lineupBreakdown.analytics.playerCount).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span>Best Performing Sport</span>
                    <Badge variant="default">
                      {lineupBreakdown.analytics.topPerformer.sport}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span>Consistency Rating</span>
                    <span className="font-bold">
                      {lineupBreakdown.analytics.aboveAverageCount >= 3 ? 'High' : 
                       lineupBreakdown.analytics.aboveAverageCount >= 2 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              {playerIds.length === 0 
                ? 'No players selected. Add players to your lineup to see scoring breakdown.'
                : loading 
                ? 'Loading scoring breakdown...'
                : 'Click refresh to load scoring data.'
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}