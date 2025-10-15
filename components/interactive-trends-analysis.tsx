'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
  ScatterChart,
  Scatter,
  ReferenceLine,
  Brush
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  Filter,
  Eye,
  EyeOff,
  Download,
  Maximize2,
  Crown,
  Calendar,
  Target
} from 'lucide-react';
import { usePremium } from '@/hooks/use-premium';
import { PremiumFeatureLock } from '@/components/premium-badge';

interface TrendDataPoint {
  week: string;
  weekNumber: number;
  date: string;
  totalPoints: number;
  rank: number;
  efficiency: number;
  consistency: number;
  playerCount: number;
  nbaPoints: number;
  nflPoints: number;
  avgPlayerPoints: number;
  topPlayerPoints: number;
  bottomPlayerPoints: number;
  volatility: number;
}

interface PlayerTrendData {
  playerId: string;
  playerName: string;
  sport: 'NBA' | 'NFL';
  weeklyData: Array<{
    week: string;
    points: number;
    efficiency: number;
    usage: number;
    rank: number;
  }>;
  trendMetrics: {
    slope: number;
    correlation: number;
    volatility: number;
    momentum: number;
  };
}

interface TrendAnalysisProps {
  timeframe?: 'month' | 'season' | 'all';
  showPremiumFeatures?: boolean;
}

export function InteractiveTrendsAnalysis({ 
  timeframe = 'season',
  showPremiumFeatures = true 
}: TrendAnalysisProps) {
  const { isPremium, hasAdvancedAnalytics } = usePremium();
  
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['totalPoints', 'rank']);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [movingAveragePeriod, setMovingAveragePeriod] = useState(3);
  const [showTrendLines, setShowTrendLines] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'area' | 'composed' | 'scatter'>('line');

  // Mock trend data
  const mockTrendData: TrendDataPoint[] = [
    {
      week: 'W1', weekNumber: 1, date: '2024-01-07',
      totalPoints: 201, rank: 67, efficiency: 0.72, consistency: 0.68,
      playerCount: 5, nbaPoints: 115, nflPoints: 86,
      avgPlayerPoints: 40.2, topPlayerPoints: 48, bottomPlayerPoints: 35,
      volatility: 0.15
    },
    {
      week: 'W2', weekNumber: 2, date: '2024-01-14',
      totalPoints: 245, rank: 45, efficiency: 0.78, consistency: 0.75,
      playerCount: 5, nbaPoints: 145, nflPoints: 100,
      avgPlayerPoints: 49.0, topPlayerPoints: 55, bottomPlayerPoints: 42,
      volatility: 0.12
    },
    {
      week: 'W3', weekNumber: 3, date: '2024-01-21',
      totalPoints: 234, rank: 52, efficiency: 0.75, consistency: 0.71,
      playerCount: 5, nbaPoints: 138, nflPoints: 96,
      avgPlayerPoints: 46.8, topPlayerPoints: 52, bottomPlayerPoints: 38,
      volatility: 0.18
    },
    {
      week: 'W4', weekNumber: 4, date: '2024-01-28',
      totalPoints: 289, rank: 23, efficiency: 0.89, consistency: 0.85,
      playerCount: 5, nbaPoints: 168, nflPoints: 121,
      avgPlayerPoints: 57.8, topPlayerPoints: 65, bottomPlayerPoints: 48,
      volatility: 0.09
    },
    {
      week: 'W5', weekNumber: 5, date: '2024-02-04',
      totalPoints: 278, rank: 31, efficiency: 0.85, consistency: 0.82,
      playerCount: 5, nbaPoints: 162, nflPoints: 116,
      avgPlayerPoints: 55.6, topPlayerPoints: 62, bottomPlayerPoints: 46,
      volatility: 0.11
    },
    {
      week: 'W6', weekNumber: 6, date: '2024-02-11',
      totalPoints: 267, rank: 38, efficiency: 0.81, consistency: 0.78,
      playerCount: 5, nbaPoints: 155, nflPoints: 112,
      avgPlayerPoints: 53.4, topPlayerPoints: 59, bottomPlayerPoints: 44,
      volatility: 0.13
    },
    {
      week: 'W7', weekNumber: 7, date: '2024-02-18',
      totalPoints: 301, rank: 19, efficiency: 0.92, consistency: 0.88,
      playerCount: 5, nbaPoints: 178, nflPoints: 123,
      avgPlayerPoints: 60.2, topPlayerPoints: 68, bottomPlayerPoints: 51,
      volatility: 0.08
    },
    {
      week: 'W8', weekNumber: 8, date: '2024-02-25',
      totalPoints: 342, rank: 12, efficiency: 0.95, consistency: 0.91,
      playerCount: 5, nbaPoints: 198, nflPoints: 144,
      avgPlayerPoints: 68.4, topPlayerPoints: 78, bottomPlayerPoints: 58,
      volatility: 0.07
    }
  ];

  const mockPlayerTrends: PlayerTrendData[] = [
    {
      playerId: '1',
      playerName: 'LeBron James',
      sport: 'NBA',
      weeklyData: [
        { week: 'W1', points: 42, efficiency: 0.82, usage: 0.28, rank: 3 },
        { week: 'W2', points: 48, efficiency: 0.89, usage: 0.31, rank: 2 },
        { week: 'W3', points: 44, efficiency: 0.78, usage: 0.29, rank: 3 },
        { week: 'W4', points: 51, efficiency: 0.92, usage: 0.33, rank: 1 },
        { week: 'W5', points: 46, efficiency: 0.85, usage: 0.30, rank: 2 },
        { week: 'W6', points: 49, efficiency: 0.88, usage: 0.32, rank: 2 },
        { week: 'W7', points: 55, efficiency: 0.94, usage: 0.35, rank: 1 },
        { week: 'W8', points: 62, efficiency: 0.97, usage: 0.38, rank: 1 },
      ],
      trendMetrics: {
        slope: 2.8,
        correlation: 0.85,
        volatility: 0.12,
        momentum: 0.78
      }
    },
    {
      playerId: '2',
      playerName: 'Stephen Curry',
      sport: 'NBA',
      weeklyData: [
        { week: 'W1', points: 35, efficiency: 0.75, usage: 0.32, rank: 5 },
        { week: 'W2', points: 42, efficiency: 0.88, usage: 0.35, rank: 3 },
        { week: 'W3', points: 31, efficiency: 0.68, usage: 0.29, rank: 5 },
        { week: 'W4', points: 45, efficiency: 0.91, usage: 0.38, rank: 2 },
        { week: 'W5', points: 40, efficiency: 0.82, usage: 0.33, rank: 4 },
        { week: 'W6', points: 38, efficiency: 0.79, usage: 0.31, rank: 4 },
        { week: 'W7', points: 47, efficiency: 0.89, usage: 0.36, rank: 3 },
        { week: 'W8', points: 52, efficiency: 0.93, usage: 0.39, rank: 2 },
      ],
      trendMetrics: {
        slope: 1.9,
        correlation: 0.72,
        volatility: 0.18,
        momentum: 0.65
      }
    }
  ];

  const availableMetrics = [
    { key: 'totalPoints', label: 'Total Points', color: '#8884d8' },
    { key: 'rank', label: 'Rank (Inverted)', color: '#82ca9d' },
    { key: 'efficiency', label: 'Efficiency %', color: '#ffc658' },
    { key: 'consistency', label: 'Consistency %', color: '#ff7c7c' },
    { key: 'nbaPoints', label: 'NBA Points', color: '#8dd1e1' },
    { key: 'nflPoints', label: 'NFL Points', color: '#d084d0' },
    { key: 'volatility', label: 'Volatility', color: '#ffb347' }
  ];

  const chartData = useMemo(() => {
    let data = mockTrendData.map(point => ({
      ...point,
      rankInverted: 100 - point.rank,
      efficiencyPercent: Math.round(point.efficiency * 100),
      consistencyPercent: Math.round(point.consistency * 100),
      volatilityPercent: Math.round(point.volatility * 100)
    }));

    // Add moving averages if enabled
    if (showMovingAverage) {
      data = data.map((point, index) => {
        const start = Math.max(0, index - movingAveragePeriod + 1);
        const slice = data.slice(start, index + 1);
        
        return {
          ...point,
          totalPointsMA: slice.reduce((sum, p) => sum + p.totalPoints, 0) / slice.length,
          rankInvertedMA: slice.reduce((sum, p) => sum + (100 - p.rank), 0) / slice.length,
          efficiencyMA: slice.reduce((sum, p) => sum + p.efficiency * 100, 0) / slice.length
        };
      });
    }

    return data;
  }, [mockTrendData, showMovingAverage, movingAveragePeriod]);

  const playerChartData = useMemo(() => {
    if (selectedPlayers.length === 0) return [];
    
    const weeks = mockPlayerTrends[0]?.weeklyData.map(w => w.week) || [];
    return weeks.map(week => {
      const dataPoint: any = { week };
      
      mockPlayerTrends
        .filter(player => selectedPlayers.includes(player.playerId))
        .forEach(player => {
          const weekData = player.weeklyData.find(w => w.week === week);
          if (weekData) {
            dataPoint[player.playerName] = weekData.points;
            dataPoint[`${player.playerName}_efficiency`] = Math.round(weekData.efficiency * 100);
          }
        });
      
      return dataPoint;
    });
  }, [selectedPlayers, mockPlayerTrends]);

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey) 
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    );
  };

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId)
        ? prev.filter(p => p !== playerId)
        : [...prev, playerId]
    );
  };

  const getMetricColor = (metricKey: string) => {
    return availableMetrics.find(m => m.key === metricKey)?.color || '#8884d8';
  };

  const renderMetricControls = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Trend Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Metric Selection */}
          <div>
            <h4 className="font-medium mb-2">Metrics to Display</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableMetrics.map(metric => (
                <div key={metric.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={metric.key}
                    checked={selectedMetrics.includes(metric.key)}
                    onCheckedChange={() => toggleMetric(metric.key)}
                  />
                  <label htmlFor={metric.key} className="text-sm flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: metric.color }}
                    />
                    {metric.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Chart Type</label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="composed">Composed Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Timeframe</label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="season">Full Season</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="moving-average"
                  checked={showMovingAverage}
                  onCheckedChange={setShowMovingAverage}
                />
                <label htmlFor="moving-average" className="text-sm">Moving Average</label>
              </div>
              {showMovingAverage && (
                <Select value={movingAveragePeriod.toString()} onValueChange={(v) => setMovingAveragePeriod(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 weeks</SelectItem>
                    <SelectItem value="3">3 weeks</SelectItem>
                    <SelectItem value="4">4 weeks</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMainChart = () => {
    const ChartComponent = chartType === 'area' ? AreaChart : 
                          chartType === 'composed' ? ComposedChart :
                          chartType === 'scatter' ? ScatterChart : LineChart;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance Trends</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Interactive analysis of your performance metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ChartComponent data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name?.includes('rank')) return [`#${100 - Number(value)}`, 'Rank'];
                    if (name?.includes('efficiency') || name?.includes('consistency')) return [`${value}%`, name];
                    return [value, name];
                  }}
                />
                <Legend />
                
                {selectedMetrics.map(metricKey => {
                  const dataKey = metricKey === 'rank' ? 'rankInverted' :
                                 metricKey === 'efficiency' ? 'efficiencyPercent' :
                                 metricKey === 'consistency' ? 'consistencyPercent' :
                                 metricKey === 'volatility' ? 'volatilityPercent' :
                                 metricKey;
                  
                  const color = getMetricColor(metricKey);
                  const label = availableMetrics.find(m => m.key === metricKey)?.label || metricKey;

                  if (chartType === 'area') {
                    return (
                      <Area
                        key={metricKey}
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        fill={color}
                        fillOpacity={0.3}
                        name={label}
                      />
                    );
                  } else if (chartType === 'composed') {
                    return metricKey === 'totalPoints' ? (
                      <Bar key={metricKey} dataKey={dataKey} fill={color} name={label} />
                    ) : (
                      <Line key={metricKey} type="monotone" dataKey={dataKey} stroke={color} name={label} />
                    );
                  } else {
                    return (
                      <Line
                        key={metricKey}
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name={label}
                      />
                    );
                  }
                })}

                {/* Moving averages */}
                {showMovingAverage && selectedMetrics.includes('totalPoints') && (
                  <Line
                    type="monotone"
                    dataKey="totalPointsMA"
                    stroke="#ff0000"
                    strokeDasharray="5 5"
                    name="Points MA"
                  />
                )}

                {/* Trend lines */}
                {showTrendLines && (
                  <ReferenceLine 
                    segment={[
                      { x: chartData[0]?.week, y: chartData[0]?.totalPoints },
                      { x: chartData[chartData.length - 1]?.week, y: chartData[chartData.length - 1]?.totalPoints }
                    ]}
                    stroke="#ff0000"
                    strokeDasharray="3 3"
                  />
                )}

                <Brush dataKey="week" height={30} stroke="#8884d8" />
              </ChartComponent>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPlayerComparison = () => {
    if (!isPremium || !hasAdvancedAnalytics) {
      return (
        <PremiumFeatureLock 
          feature="Player Trend Analysis" 
          description="Compare individual player performance trends and momentum"
        >
          <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <Activity className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Player trend comparison</p>
            </div>
          </div>
        </PremiumFeatureLock>
      );
    }

    return (
      <div className="space-y-4">
        {/* Player Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Player Trend Comparison</CardTitle>
            <CardDescription>Select players to compare their performance trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockPlayerTrends.map(player => (
                <div key={player.playerId} className="flex items-center space-x-2">
                  <Checkbox
                    id={player.playerId}
                    checked={selectedPlayers.includes(player.playerId)}
                    onCheckedChange={() => togglePlayer(player.playerId)}
                  />
                  <label htmlFor={player.playerId} className="flex-1 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{player.playerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {player.sport} • Slope: {player.trendMetrics.slope.toFixed(1)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {player.trendMetrics.slope > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {Math.round(player.trendMetrics.momentum * 100)}%
                      </Badge>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Player Trends Chart */}
        {selectedPlayers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Players Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={playerChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {mockPlayerTrends
                      .filter(player => selectedPlayers.includes(player.playerId))
                      .map((player, index) => (
                        <Line
                          key={player.playerId}
                          type="monotone"
                          dataKey={player.playerName}
                          stroke={getMetricColor(availableMetrics[index % availableMetrics.length].key)}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderTrendInsights = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Trend Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">+18.2%</div>
            <div className="text-sm text-muted-foreground">Points Growth</div>
            <div className="text-xs text-muted-foreground mt-1">Last 4 weeks</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Activity className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">0.85</div>
            <div className="text-sm text-muted-foreground">Consistency Score</div>
            <div className="text-xs text-muted-foreground mt-1">Above average</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">92%</div>
            <div className="text-sm text-muted-foreground">Peak Efficiency</div>
            <div className="text-xs text-muted-foreground mt-1">Week 8 performance</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Interactive Trends Analysis</h2>
          <p className="text-muted-foreground">
            Deep dive into performance patterns and trends with interactive visualizations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isPremium && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      {renderMetricControls()}

      {/* Main Chart */}
      {renderMainChart()}

      {/* Insights */}
      {renderTrendInsights()}

      {/* Player Comparison */}
      {showPremiumFeatures && renderPlayerComparison()}
    </div>
  );
}