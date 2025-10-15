'use client';

import { useState, useMemo } from 'react';
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
  ComposedChart,
  Legend,
  PieChart,
  Pie,
  Cell,
  Treemap
} from 'recharts';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  BarChart3,
  Zap,
  Crown,
  Calendar,
  Award,
  Activity,
  Percent
} from 'lucide-react';
import { usePremium } from '@/hooks/use-premium';
import { useScoring } from '@/hooks/use-scoring';
import { PremiumFeatureLock } from '@/components/premium-badge';

interface TeamPerformanceData {
  weekId: number;
  totalPoints: number;
  rank: number;
  efficiency: number;
  consistency: number;
  playerContributions: Array<{
    playerId: string;
    playerName: string;
    points: number;
    percentage: number;
    efficiency: number;
  }>;
  sportBreakdown: Record<string, {
    players: number;
    points: number;
    percentage: number;
  }>;
  positionBreakdown: Record<string, {
    players: number;
    points: number;
    percentage: number;
  }>;
}

interface OptimizationSuggestion {
  type: 'lineup' | 'strategy' | 'player';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actionable: boolean;
}

interface PerformanceMetrics {
  totalPoints: number;
  averagePoints: number;
  bestWeek: { week: number; points: number };
  worstWeek: { week: number; points: number };
  consistency: number;
  efficiency: number;
  rankingTrend: 'improving' | 'declining' | 'stable';
  winRate: number;
  topPerformer: {
    name: string;
    contribution: number;
  };
}

export function TeamPerformanceAnalytics() {
  const { isPremium, hasAdvancedAnalytics } = usePremium();
  const { loading } = useScoring();
  
  const [selectedTimeframe, setSelectedTimeframe] = useState<'4weeks' | '8weeks' | 'season'>('8weeks');
  const [selectedView, setSelectedView] = useState<'overview' | 'breakdown' | 'optimization' | 'trends'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<'points' | 'efficiency' | 'consistency'>('points');

  // Mock data - in real implementation, this would come from APIs
  const mockPerformanceData: TeamPerformanceData[] = [
    {
      weekId: 1,
      totalPoints: 201,
      rank: 67,
      efficiency: 0.72,
      consistency: 0.68,
      playerContributions: [
        { playerId: '1', playerName: 'LeBron James', points: 42, percentage: 20.9, efficiency: 0.82 },
        { playerId: '2', playerName: 'Stephen Curry', points: 35, percentage: 17.4, efficiency: 0.75 },
        { playerId: '3', playerName: 'Patrick Mahomes', points: 48, percentage: 23.9, efficiency: 0.89 },
        { playerId: '4', playerName: 'Giannis Antetokounmpo', points: 38, percentage: 18.9, efficiency: 0.78 },
        { playerId: '5', playerName: 'Justin Jefferson', points: 38, percentage: 18.9, efficiency: 0.76 },
      ],
      sportBreakdown: {
        NBA: { players: 3, points: 115, percentage: 57.2 },
        NFL: { players: 2, points: 86, percentage: 42.8 }
      },
      positionBreakdown: {
        PG: { players: 1, points: 35, percentage: 17.4 },
        SF: { players: 1, points: 42, percentage: 20.9 },
        PF: { players: 1, points: 38, percentage: 18.9 },
        QB: { players: 1, points: 48, percentage: 23.9 },
        WR: { players: 1, points: 38, percentage: 18.9 }
      }
    },
    {
      weekId: 2,
      totalPoints: 245,
      rank: 45,
      efficiency: 0.78,
      consistency: 0.75,
      playerContributions: [
        { playerId: '1', playerName: 'LeBron James', points: 48, percentage: 19.6, efficiency: 0.89 },
        { playerId: '2', playerName: 'Stephen Curry', points: 42, percentage: 17.1, efficiency: 0.88 },
        { playerId: '3', playerName: 'Patrick Mahomes', points: 52, percentage: 21.2, efficiency: 0.92 },
        { playerId: '4', playerName: 'Giannis Antetokounmpo', points: 55, percentage: 22.4, efficiency: 0.95 },
        { playerId: '5', playerName: 'Justin Jefferson', points: 48, percentage: 19.6, efficiency: 0.85 },
      ],
      sportBreakdown: {
        NBA: { players: 3, points: 145, percentage: 59.2 },
        NFL: { players: 2, points: 100, percentage: 40.8 }
      },
      positionBreakdown: {
        PG: { players: 1, points: 42, percentage: 17.1 },
        SF: { players: 1, points: 48, percentage: 19.6 },
        PF: { players: 1, points: 55, percentage: 22.4 },
        QB: { players: 1, points: 52, percentage: 21.2 },
        WR: { players: 1, points: 48, percentage: 19.6 }
      }
    },
    // Add more weeks...
  ];

  const mockOptimizationSuggestions: OptimizationSuggestion[] = [
    {
      type: 'lineup',
      priority: 'high',
      title: 'Optimize NBA/NFL Balance',
      description: 'Consider adjusting your NBA to NFL player ratio for better consistency',
      impact: '+12-15 points per week',
      actionable: true
    },
    {
      type: 'player',
      priority: 'medium',
      title: 'Replace Underperforming Player',
      description: 'Player #2 has been below average for 3 consecutive weeks',
      impact: '+8-10 points per week',
      actionable: true
    },
    {
      type: 'strategy',
      priority: 'medium',
      title: 'Diversify Position Coverage',
      description: 'Adding more defensive players could improve consistency',
      impact: '+5-8% consistency',
      actionable: false
    }
  ];

  const performanceMetrics: PerformanceMetrics = useMemo(() => {
    const totalPoints = mockPerformanceData.reduce((sum, week) => sum + week.totalPoints, 0);
    const averagePoints = totalPoints / mockPerformanceData.length;
    const bestWeek = mockPerformanceData.reduce((best, week) => 
      week.totalPoints > best.totalPoints ? week : best
    );
    const worstWeek = mockPerformanceData.reduce((worst, week) => 
      week.totalPoints < worst.totalPoints ? week : worst
    );
    
    return {
      totalPoints,
      averagePoints,
      bestWeek: { week: bestWeek.weekId, points: bestWeek.totalPoints },
      worstWeek: { week: worstWeek.weekId, points: worstWeek.totalPoints },
      consistency: mockPerformanceData.reduce((sum, week) => sum + week.consistency, 0) / mockPerformanceData.length,
      efficiency: mockPerformanceData.reduce((sum, week) => sum + week.efficiency, 0) / mockPerformanceData.length,
      rankingTrend: 'improving' as const,
      winRate: 0.65,
      topPerformer: {
        name: 'Giannis Antetokounmpo',
        contribution: 21.2
      }
    };
  }, [mockPerformanceData]);

  const chartData = useMemo(() => {
    return mockPerformanceData.map(week => ({
      week: `W${week.weekId}`,
      points: week.totalPoints,
      rank: week.rank,
      efficiency: Math.round(week.efficiency * 100),
      consistency: Math.round(week.consistency * 100),
      rankInverted: 100 - week.rank // For better visualization
    }));
  }, [mockPerformanceData]);

  const sportDistributionData = useMemo(() => {
    if (mockPerformanceData.length === 0) return [];
    
    const latestWeek = mockPerformanceData[mockPerformanceData.length - 1];
    return Object.entries(latestWeek.sportBreakdown).map(([sport, data]) => ({
      name: sport,
      value: data.points,
      percentage: data.percentage,
      players: data.players
    }));
  }, [mockPerformanceData]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const renderOverviewCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Total Points</div>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold">{performanceMetrics.totalPoints}</div>
          <div className="text-sm text-muted-foreground">
            Avg: {performanceMetrics.averagePoints.toFixed(1)}/week
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
            {Math.round(performanceMetrics.consistency * 100)}%
          </div>
          <div className="text-sm text-muted-foreground">Performance stability</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Win Rate</div>
            <Award className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold">
            {Math.round(performanceMetrics.winRate * 100)}%
          </div>
          <div className="text-sm text-muted-foreground">Contest success rate</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Ranking Trend</div>
            {performanceMetrics.rankingTrend === 'improving' && <TrendingUp className="h-4 w-4 text-green-600" />}
            {performanceMetrics.rankingTrend === 'declining' && <TrendingDown className="h-4 w-4 text-red-600" />}
            {performanceMetrics.rankingTrend === 'stable' && <Activity className="h-4 w-4 text-blue-600" />}
          </div>
          <div className="text-2xl font-bold capitalize">{performanceMetrics.rankingTrend}</div>
          <div className="text-sm text-muted-foreground">Overall direction</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformanceTrends = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Points & Ranking Trends</CardTitle>
          <CardDescription>Weekly performance and ranking progression</CardDescription>
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
                    name === 'rankInverted' ? 'Rank' : 'Points'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="points" fill="#8884d8" name="Points" />
                <Line yAxisId="right" type="monotone" dataKey="rankInverted" stroke="#82ca9d" name="Rank" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Efficiency & Consistency</CardTitle>
          <CardDescription>Performance quality metrics over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                <Legend />
                <Area type="monotone" dataKey="efficiency" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Efficiency %" />
                <Area type="monotone" dataKey="consistency" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Consistency %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTeamBreakdown = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sport Distribution</CardTitle>
          <CardDescription>Points contribution by sport</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sportDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sportDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} pts`, 'Points']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Player Contributions</CardTitle>
          <CardDescription>Individual player impact on team performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPerformanceData[mockPerformanceData.length - 1]?.playerContributions
              .sort((a, b) => b.points - a.points)
              .map((player, index) => (
                <div key={player.playerId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{player.playerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{player.points} pts</span>
                      <Badge variant="outline" className="text-xs">
                        {player.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${player.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOptimizationSuggestions = () => {
    if (!isPremium || !hasAdvancedAnalytics) {
      return (
        <PremiumFeatureLock 
          feature="Team Optimization" 
          description="Get AI-powered suggestions to improve your team performance"
        >
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-full" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </PremiumFeatureLock>
      );
    }

    return (
      <div className="space-y-4">
        {mockOptimizationSuggestions.map((suggestion, index) => (
          <Card key={index} className={`border-l-4 ${
            suggestion.priority === 'high' ? 'border-l-red-500' :
            suggestion.priority === 'medium' ? 'border-l-yellow-500' :
            'border-l-blue-500'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <Badge variant={
                      suggestion.priority === 'high' ? 'destructive' :
                      suggestion.priority === 'medium' ? 'default' :
                      'secondary'
                    } className="text-xs">
                      {suggestion.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-green-600" />
                      <span className="text-green-600 font-medium">{suggestion.impact}</span>
                    </div>
                    {suggestion.actionable && (
                      <Badge variant="outline" className="text-xs">
                        Actionable
                      </Badge>
                    )}
                  </div>
                </div>
                {suggestion.actionable && (
                  <Button size="sm" variant="outline">
                    Apply
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Team Performance Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of your team's performance and optimization opportunities
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4weeks">4 Weeks</SelectItem>
              <SelectItem value="8weeks">8 Weeks</SelectItem>
              <SelectItem value="season">Full Season</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Main Analytics Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="optimization">
            Optimization
            {isPremium && <Crown className="ml-1 h-3 w-3" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderPerformanceTrends()}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          {renderTeamBreakdown()}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {renderPerformanceTrends()}
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Key metrics and trends analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {performanceMetrics.bestWeek.points}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Best Week (W{performanceMetrics.bestWeek.week})
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {Math.round(performanceMetrics.efficiency * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average Efficiency
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {performanceMetrics.topPerformer.contribution.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Top Contributor ({performanceMetrics.topPerformer.name})
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Optimization Suggestions
              </CardTitle>
              <CardDescription>
                AI-powered recommendations to improve your team performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderOptimizationSuggestions()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}