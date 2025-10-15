'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target, 
  Users, 
  Trophy,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Zap,
  Crown
} from 'lucide-react';
import { usePremium } from '@/hooks/use-premium';
import { useScoring } from '@/hooks/use-scoring';
import { useSportsData } from '@/hooks/use-sports-data';
import { useAnalytics } from '@/hooks/use-analytics';
import { PremiumFeatureLock } from '@/components/premium-badge';

interface AnalyticsDashboardProps {
  userId?: string;
  timeframe?: 'week' | 'month' | 'season';
  showPremiumFeatures?: boolean;
}

interface PlayerAnalytics {
  playerId: string;
  playerName: string;
  sport: 'NBA' | 'NFL';
  averagePoints: number;
  consistency: number;
  trendDirection: 'up' | 'down' | 'stable';
  weeklyData: Array<{
    week: string;
    points: number;
    efficiency: number;
    usage: number;
  }>;
  statBreakdown: Array<{
    statName: string;
    value: number;
    contribution: number;
    trend: number;
  }>;
}

interface TeamAnalytics {
  totalPoints: number;
  averagePoints: number;
  consistency: number;
  bestWeek: { week: string; points: number };
  worstWeek: { week: string; points: number };
  sportDistribution: Record<string, number>;
  positionDistribution: Record<string, number>;
  weeklyTrends: Array<{
    week: string;
    points: number;
    rank: number;
    efficiency: number;
  }>;
}

export function AnalyticsDashboard({ 
  userId, 
  timeframe = 'season',
  showPremiumFeatures = true 
}: AnalyticsDashboardProps) {
  const { isPremium, hasAdvancedAnalytics, analytics } = usePremium();
  const { loading: scoringLoading } = useScoring();
  const { loading: sportsLoading } = useSportsData();
  const { 
    analyticsData, 
    loading: analyticsLoading, 
    error: analyticsError,
    insights,
    exportAnalyticsData 
  } = useAnalytics(userId, timeframe);
  
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedSport, setSelectedSport] = useState<'all' | 'NBA' | 'NFL'>('all');
  const [selectedMetric, setSelectedMetric] = useState<'points' | 'efficiency' | 'consistency'>('points');
  const [playerAnalytics, setPlayerAnalytics] = useState<PlayerAnalytics[]>([]);
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  // Use real analytics data when available, fallback to mock data
  const mockPlayerAnalytics: PlayerAnalytics[] = analyticsData?.playerAnalytics.map(player => ({
    ...player,
    weeklyData: player.weeklyData.map(week => ({
      ...week,
      usage: 0.3 + Math.random() * 0.1 // Mock usage data
    })),
    statBreakdown: [
      { statName: 'Points', value: 28.5, contribution: 0.35, trend: 0.05 },
      { statName: 'Rebounds', value: 8.2, contribution: 0.25, trend: 0.02 },
      { statName: 'Assists', value: 7.8, contribution: 0.30, trend: 0.08 },
      { statName: 'Steals', value: 1.2, contribution: 0.10, trend: -0.02 },
    ]
  })) || [
    {
      playerId: '1',
      playerName: 'LeBron James',
      sport: 'NBA',
      averagePoints: 45.2,
      consistency: 0.85,
      trendDirection: 'up',
      weeklyData: [
        { week: 'W1', points: 42, efficiency: 0.82, usage: 0.28 },
        { week: 'W2', points: 48, efficiency: 0.89, usage: 0.31 },
        { week: 'W3', points: 44, efficiency: 0.78, usage: 0.29 },
        { week: 'W4', points: 51, efficiency: 0.92, usage: 0.33 },
        { week: 'W5', points: 46, efficiency: 0.85, usage: 0.30 },
      ],
      statBreakdown: [
        { statName: 'Points', value: 28.5, contribution: 0.35, trend: 0.05 },
        { statName: 'Rebounds', value: 8.2, contribution: 0.25, trend: 0.02 },
        { statName: 'Assists', value: 7.8, contribution: 0.30, trend: 0.08 },
        { statName: 'Steals', value: 1.2, contribution: 0.10, trend: -0.02 },
      ]
    },
    {
      playerId: '2',
      playerName: 'Stephen Curry',
      sport: 'NBA',
      averagePoints: 38.7,
      consistency: 0.72,
      trendDirection: 'stable',
      weeklyData: [
        { week: 'W1', points: 35, efficiency: 0.75, usage: 0.32 },
        { week: 'W2', points: 42, efficiency: 0.88, usage: 0.35 },
        { week: 'W3', points: 31, efficiency: 0.68, usage: 0.29 },
        { week: 'W4', points: 45, efficiency: 0.91, usage: 0.38 },
        { week: 'W5', points: 40, efficiency: 0.82, usage: 0.33 },
      ],
      statBreakdown: [
        { statName: 'Points', value: 31.2, contribution: 0.45, trend: 0.03 },
        { statName: 'Rebounds', value: 5.4, contribution: 0.15, trend: -0.01 },
        { statName: 'Assists', value: 6.7, contribution: 0.25, trend: 0.04 },
        { statName: '3-Pointers', value: 4.2, contribution: 0.15, trend: 0.02 },
      ]
    }
  ];

  const mockTeamAnalytics: TeamAnalytics = analyticsData ? {
    totalPoints: analyticsData.performanceMetrics.totalPoints,
    averagePoints: analyticsData.performanceMetrics.averagePoints,
    consistency: analyticsData.performanceMetrics.consistency,
    bestWeek: { 
      week: analyticsData.weeklyTrends.reduce((best, week) => 
        week.totalPoints > best.totalPoints ? week : best
      ).week, 
      points: Math.max(...analyticsData.weeklyTrends.map(w => w.totalPoints))
    },
    worstWeek: { 
      week: analyticsData.weeklyTrends.reduce((worst, week) => 
        week.totalPoints < worst.totalPoints ? week : worst
      ).week, 
      points: Math.min(...analyticsData.weeklyTrends.map(w => w.totalPoints))
    },
    sportDistribution: analyticsData.teamComposition.sportDistribution,
    positionDistribution: analyticsData.teamComposition.positionDistribution,
    weeklyTrends: analyticsData.weeklyTrends.map(week => ({
      week: week.week,
      points: week.totalPoints,
      rank: week.rank,
      efficiency: week.efficiency
    }))
  } : {
    totalPoints: 1247,
    averagePoints: 249.4,
    consistency: 0.78,
    bestWeek: { week: 'W4', points: 289 },
    worstWeek: { week: 'W1', points: 201 },
    sportDistribution: { NBA: 3, NFL: 2 },
    positionDistribution: { PG: 1, SG: 1, SF: 1, QB: 1, RB: 1 },
    weeklyTrends: [
      { week: 'W1', points: 201, rank: 67, efficiency: 0.72 },
      { week: 'W2', points: 245, rank: 45, efficiency: 0.78 },
      { week: 'W3', points: 234, rank: 52, efficiency: 0.75 },
      { week: 'W4', points: 289, rank: 23, efficiency: 0.89 },
      { week: 'W5', points: 278, rank: 31, efficiency: 0.85 },
    ]
  };

  useEffect(() => {
    // In real implementation, fetch analytics data based on userId and timeframe
    setPlayerAnalytics(mockPlayerAnalytics);
    setTeamAnalytics(mockTeamAnalytics);
  }, [userId, selectedTimeframe, selectedSport]);

  const filteredPlayerAnalytics = useMemo(() => {
    if (selectedSport === 'all') return playerAnalytics;
    return playerAnalytics.filter(player => player.sport === selectedSport);
  }, [playerAnalytics, selectedSport]);

  const chartData = useMemo(() => {
    if (!teamAnalytics) return [];
    return teamAnalytics.weeklyTrends.map(week => ({
      ...week,
      efficiency: Math.round(week.efficiency * 100),
      rankInverted: 100 - week.rank // For better visualization
    }));
  }, [teamAnalytics]);

  const playerComparisonData = useMemo(() => {
    return filteredPlayerAnalytics.map(player => ({
      name: player.playerName.split(' ').pop(), // Last name only for chart
      avgPoints: player.averagePoints,
      consistency: Math.round(player.consistency * 100),
      efficiency: Math.round(player.weeklyData.reduce((sum, week) => sum + week.efficiency, 0) / player.weeklyData.length * 100)
    }));
  }, [filteredPlayerAnalytics]);

  const renderOverviewCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Total Points</div>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold">{teamAnalytics?.totalPoints || 0}</div>
          <div className="text-sm text-muted-foreground">
            Avg: {teamAnalytics?.averagePoints.toFixed(1) || 0}/week
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Consistency</div>
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold">
            {Math.round((teamAnalytics?.consistency || 0) * 100)}%
          </div>
          <div className="text-sm text-muted-foreground">Performance stability</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Best Week</div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold">{teamAnalytics?.bestWeek.points || 0}</div>
          <div className="text-sm text-muted-foreground">
            {teamAnalytics?.bestWeek.week || 'N/A'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Active Players</div>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold">{filteredPlayerAnalytics.length}</div>
          <div className="text-sm text-muted-foreground">
            {selectedSport === 'all' ? 'All sports' : selectedSport}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformanceTrends = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Trends
        </CardTitle>
        <CardDescription>
          Weekly points, ranking, and efficiency over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'rankInverted' ? `#${100 - Number(value)}` : value,
                  name === 'rankInverted' ? 'Rank' : 
                  name === 'efficiency' ? 'Efficiency %' : 'Points'
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="points" fill="#8884d8" name="Points" />
              <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#82ca9d" name="Efficiency %" />
              <Line yAxisId="right" type="monotone" dataKey="rankInverted" stroke="#ffc658" name="Rank" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderPlayerComparison = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Player Comparison
        </CardTitle>
        <CardDescription>
          Compare average points, consistency, and efficiency across your roster
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={playerComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgPoints" fill="#8884d8" name="Avg Points" />
              <Bar dataKey="consistency" fill="#82ca9d" name="Consistency %" />
              <Bar dataKey="efficiency" fill="#ffc658" name="Efficiency %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderAdvancedAnalytics = () => {
    if (!isPremium || !hasAdvancedAnalytics) {
      return (
        <PremiumFeatureLock 
          feature="Advanced Analytics" 
          description="Unlock detailed player projections, matchup analysis, and performance insights"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Player Projections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <div className="h-4 bg-muted animate-pulse rounded w-24" />
                        <div className="h-3 bg-muted animate-pulse rounded w-16" />
                      </div>
                      <div className="h-6 bg-muted animate-pulse rounded w-12" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Matchup Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Crown className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Premium Feature</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </PremiumFeatureLock>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Player Projections
            </CardTitle>
            <CardDescription>AI-powered performance predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.playerProjections?.slice(0, 5).map((projection, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{projection.playerName}</p>
                    <p className="text-sm text-muted-foreground">
                      vs {projection.opponent} • {projection.difficulty}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{projection.projectedPoints} pts</div>
                    <Badge variant="outline" className="text-xs">
                      {projection.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-muted-foreground">
                  No projections available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Matchup Analysis
            </CardTitle>
            <CardDescription>Detailed opponent analysis and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.matchupAnalysis?.slice(0, 3).map((matchup, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{matchup.player}</h4>
                    <Badge variant={
                      matchup.recommendation === 'Start' ? 'default' :
                      matchup.recommendation === 'Consider' ? 'secondary' : 'outline'
                    }>
                      {matchup.recommendation}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    vs {matchup.opponent} • {matchup.projectedPoints} projected pts
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {matchup.factors.slice(0, 2).map((factor, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-muted-foreground">
                  No matchup data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPlayerDetails = () => (
    <div className="space-y-6">
      {filteredPlayerAnalytics.map((player) => (
        <Card key={player.playerId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {player.playerName}
                  <Badge variant={player.sport === 'NBA' ? 'default' : 'secondary'}>
                    {player.sport}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Avg: {player.averagePoints} pts • Consistency: {Math.round(player.consistency * 100)}%
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                {player.trendDirection === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                {player.trendDirection === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                {player.trendDirection === 'stable' && <div className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Weekly Performance</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={player.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="points" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Stat Contributions</h4>
                <div className="space-y-3">
                  {player.statBreakdown.map((stat, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{stat.statName}</span>
                        <div className="flex items-center gap-2">
                          <span>{stat.value}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(stat.contribution * 100)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${stat.contribution * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive performance analysis and insights
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="season">Full Season</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="NBA">NBA</SelectItem>
              <SelectItem value="NFL">NFL</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportAnalyticsData('csv')}
            disabled={!analyticsData}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="advanced">
            Advanced
            {isPremium && <Crown className="ml-1 h-3 w-3" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderPerformanceTrends()}
            {renderPlayerComparison()}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {renderPerformanceTrends()}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sport Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(teamAnalytics?.sportDistribution || {}).map(([sport, count]) => ({ sport, count }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sport" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficiency Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Efficiency']} />
                      <Line type="monotone" dataKey="efficiency" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="players" className="space-y-6">
          {renderPlayerDetails()}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          {renderAdvancedAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  );
}