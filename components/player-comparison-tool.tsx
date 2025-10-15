'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  Search, 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Target,
  BarChart3,
  Zap,
  Users
} from 'lucide-react';
import { usePremium } from '@/hooks/use-premium';
import { useSportsData } from '@/hooks/use-sports-data';
import { PremiumFeatureLock } from '@/components/premium-badge';

interface PlayerData {
  id: string;
  name: string;
  sport: 'NBA' | 'NFL';
  team: string;
  position: string;
  averagePoints: number;
  consistency: number;
  trend: 'up' | 'down' | 'stable';
  weeklyStats: Array<{
    week: string;
    points: number;
    efficiency: number;
  }>;
  statProfile: {
    offense: number;
    defense: number;
    efficiency: number;
    consistency: number;
    clutch: number;
    durability: number;
  };
  recentStats: Record<string, number>;
}

interface ComparisonMetric {
  name: string;
  key: string;
  format: 'number' | 'percentage' | 'decimal';
  higherIsBetter: boolean;
}

const NBA_METRICS: ComparisonMetric[] = [
  { name: 'Fantasy Points', key: 'averagePoints', format: 'decimal', higherIsBetter: true },
  { name: 'Consistency', key: 'consistency', format: 'percentage', higherIsBetter: true },
  { name: 'Points Per Game', key: 'ppg', format: 'decimal', higherIsBetter: true },
  { name: 'Rebounds Per Game', key: 'rpg', format: 'decimal', higherIsBetter: true },
  { name: 'Assists Per Game', key: 'apg', format: 'decimal', higherIsBetter: true },
  { name: 'Field Goal %', key: 'fgp', format: 'percentage', higherIsBetter: true },
  { name: 'Three Point %', key: 'tpp', format: 'percentage', higherIsBetter: true },
  { name: 'Usage Rate', key: 'usage', format: 'percentage', higherIsBetter: true },
];

const NFL_METRICS: ComparisonMetric[] = [
  { name: 'Fantasy Points', key: 'averagePoints', format: 'decimal', higherIsBetter: true },
  { name: 'Consistency', key: 'consistency', format: 'percentage', higherIsBetter: true },
  { name: 'Passing Yards', key: 'passingYards', format: 'number', higherIsBetter: true },
  { name: 'Passing TDs', key: 'passingTDs', format: 'number', higherIsBetter: true },
  { name: 'Rushing Yards', key: 'rushingYards', format: 'number', higherIsBetter: true },
  { name: 'Receiving Yards', key: 'receivingYards', format: 'number', higherIsBetter: true },
  { name: 'Completion %', key: 'completionPct', format: 'percentage', higherIsBetter: true },
  { name: 'Targets', key: 'targets', format: 'number', higherIsBetter: true },
];

export function PlayerComparisonTool() {
  const { isPremium, hasAdvancedAnalytics } = usePremium();
  const { loading } = useSportsData();
  
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<'NBA' | 'NFL'>('NBA');
  const [comparisonView, setComparisonView] = useState<'radar' | 'trends' | 'stats' | 'scatter'>('radar');
  const [selectedMetric, setSelectedMetric] = useState('averagePoints');

  // Mock player data - in real implementation, this would come from API
  const mockPlayers: PlayerData[] = [
    {
      id: '1',
      name: 'LeBron James',
      sport: 'NBA',
      team: 'Lakers',
      position: 'SF',
      averagePoints: 45.2,
      consistency: 0.85,
      trend: 'up',
      weeklyStats: [
        { week: 'W1', points: 42, efficiency: 0.82 },
        { week: 'W2', points: 48, efficiency: 0.89 },
        { week: 'W3', points: 44, efficiency: 0.78 },
        { week: 'W4', points: 51, efficiency: 0.92 },
        { week: 'W5', points: 46, efficiency: 0.85 },
      ],
      statProfile: {
        offense: 95,
        defense: 78,
        efficiency: 88,
        consistency: 85,
        clutch: 92,
        durability: 89
      },
      recentStats: {
        ppg: 28.5,
        rpg: 8.2,
        apg: 7.8,
        fgp: 0.512,
        tpp: 0.356,
        usage: 0.31
      }
    },
    {
      id: '2',
      name: 'Stephen Curry',
      sport: 'NBA',
      team: 'Warriors',
      position: 'PG',
      averagePoints: 38.7,
      consistency: 0.72,
      trend: 'stable',
      weeklyStats: [
        { week: 'W1', points: 35, efficiency: 0.75 },
        { week: 'W2', points: 42, efficiency: 0.88 },
        { week: 'W3', points: 31, efficiency: 0.68 },
        { week: 'W4', points: 45, efficiency: 0.91 },
        { week: 'W5', points: 40, efficiency: 0.82 },
      ],
      statProfile: {
        offense: 98,
        defense: 65,
        efficiency: 91,
        consistency: 72,
        clutch: 95,
        durability: 82
      },
      recentStats: {
        ppg: 31.2,
        rpg: 5.4,
        apg: 6.7,
        fgp: 0.487,
        tpp: 0.423,
        usage: 0.33
      }
    },
    {
      id: '3',
      name: 'Giannis Antetokounmpo',
      sport: 'NBA',
      team: 'Bucks',
      position: 'PF',
      averagePoints: 52.1,
      consistency: 0.88,
      trend: 'up',
      weeklyStats: [
        { week: 'W1', points: 48, efficiency: 0.85 },
        { week: 'W2', points: 55, efficiency: 0.92 },
        { week: 'W3', points: 49, efficiency: 0.81 },
        { week: 'W4', points: 58, efficiency: 0.95 },
        { week: 'W5', points: 51, efficiency: 0.87 },
      ],
      statProfile: {
        offense: 96,
        defense: 85,
        efficiency: 89,
        consistency: 88,
        clutch: 87,
        durability: 91
      },
      recentStats: {
        ppg: 33.1,
        rpg: 12.5,
        apg: 6.2,
        fgp: 0.578,
        tpp: 0.289,
        usage: 0.36
      }
    }
  ];

  const availablePlayers = useMemo(() => {
    return mockPlayers.filter(player => 
      player.sport === selectedSport &&
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedPlayers.find(p => p.id === player.id)
    );
  }, [mockPlayers, selectedSport, searchQuery, selectedPlayers]);

  const currentMetrics = selectedSport === 'NBA' ? NBA_METRICS : NFL_METRICS;

  const addPlayer = (player: PlayerData) => {
    if (selectedPlayers.length < 4) {
      setSelectedPlayers([...selectedPlayers, player]);
      setSearchQuery('');
    }
  };

  const removePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  };

  const formatValue = (value: number, format: 'number' | 'percentage' | 'decimal') => {
    switch (format) {
      case 'percentage':
        return `${Math.round(value * 100)}%`;
      case 'decimal':
        return value.toFixed(1);
      default:
        return Math.round(value).toString();
    }
  };

  const getComparisonColor = (index: number) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];
    return colors[index % colors.length];
  };

  const renderRadarComparison = () => {
    if (selectedPlayers.length === 0) return null;

    const radarData = Object.keys(selectedPlayers[0].statProfile).map(key => {
      const dataPoint: any = { stat: key };
      selectedPlayers.forEach((player, index) => {
        dataPoint[player.name] = player.statProfile[key as keyof typeof player.statProfile];
      });
      return dataPoint;
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Profile Comparison</CardTitle>
          <CardDescription>
            Multi-dimensional performance analysis across key attributes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="stat" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                {selectedPlayers.map((player, index) => (
                  <Radar
                    key={player.id}
                    name={player.name}
                    dataKey={player.name}
                    stroke={getComparisonColor(index)}
                    fill={getComparisonColor(index)}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTrendComparison = () => {
    if (selectedPlayers.length === 0) return null;

    const trendData = selectedPlayers[0].weeklyStats.map(week => {
      const dataPoint: any = { week: week.week };
      selectedPlayers.forEach(player => {
        const weekData = player.weeklyStats.find(w => w.week === week.week);
        dataPoint[player.name] = weekData?.points || 0;
      });
      return dataPoint;
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance Trends</CardTitle>
          <CardDescription>
            Fantasy points progression over recent weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedPlayers.map((player, index) => (
                  <Line
                    key={player.id}
                    type="monotone"
                    dataKey={player.name}
                    stroke={getComparisonColor(index)}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStatComparison = () => {
    if (selectedPlayers.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistical Comparison</CardTitle>
          <CardDescription>
            Head-to-head comparison across key performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Metric</th>
                  {selectedPlayers.map(player => (
                    <th key={player.id} className="text-center p-2">
                      <div className="space-y-1">
                        <div className="font-medium">{player.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {player.team} {player.position}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentMetrics.map(metric => (
                  <tr key={metric.key} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{metric.name}</td>
                    {selectedPlayers.map(player => {
                      const value = metric.key === 'averagePoints' || metric.key === 'consistency' 
                        ? player[metric.key as keyof PlayerData] as number
                        : player.recentStats[metric.key] || 0;
                      
                      const isHighest = selectedPlayers.every(p => {
                        const pValue = metric.key === 'averagePoints' || metric.key === 'consistency'
                          ? p[metric.key as keyof PlayerData] as number
                          : p.recentStats[metric.key] || 0;
                        return value >= pValue;
                      });

                      return (
                        <td key={player.id} className="p-2 text-center">
                          <div className={`font-medium ${isHighest && metric.higherIsBetter ? 'text-green-600' : ''}`}>
                            {formatValue(value, metric.format)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderScatterPlot = () => {
    if (selectedPlayers.length === 0) return null;

    const scatterData = selectedPlayers.map(player => ({
      name: player.name,
      x: player.averagePoints,
      y: player.consistency * 100,
      z: player.statProfile.efficiency
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance vs Consistency</CardTitle>
          <CardDescription>
            Fantasy points (X) vs consistency percentage (Y) with efficiency as bubble size
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={scatterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name="Fantasy Points" />
                <YAxis dataKey="y" name="Consistency %" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'x' ? `${value} pts` : `${value}%`,
                    name === 'x' ? 'Fantasy Points' : 'Consistency'
                  ]}
                  labelFormatter={(label) => `Player: ${label}`}
                />
                {selectedPlayers.map((player, index) => (
                  <Scatter
                    key={player.id}
                    name={player.name}
                    data={[scatterData[index]]}
                    fill={getComparisonColor(index)}
                  />
                ))}
                <Legend />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAdvancedComparison = () => {
    if (!isPremium || !hasAdvancedAnalytics) {
      return (
        <PremiumFeatureLock 
          feature="Advanced Player Comparison" 
          description="Unlock detailed statistical analysis, projections, and advanced metrics"
        >
          <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Advanced comparison tools</p>
            </div>
          </div>
        </PremiumFeatureLock>
      );
    }

    return (
      <div className="space-y-6">
        {comparisonView === 'radar' && renderRadarComparison()}
        {comparisonView === 'trends' && renderTrendComparison()}
        {comparisonView === 'stats' && renderStatComparison()}
        {comparisonView === 'scatter' && renderScatterPlot()}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Player Comparison Tool</h2>
          <p className="text-muted-foreground">
            Compare up to 4 players across multiple performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedSport} onValueChange={(value: 'NBA' | 'NFL') => setSelectedSport(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NBA">NBA</SelectItem>
              <SelectItem value="NFL">NFL</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={comparisonView} onValueChange={setComparisonView}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="radar">Radar</SelectItem>
              <SelectItem value="trends">Trends</SelectItem>
              <SelectItem value="stats">Statistics</SelectItem>
              <SelectItem value="scatter">Scatter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Player Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selected Players ({selectedPlayers.length}/4)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${selectedSport} players...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchQuery && availablePlayers.length > 0 && (
              <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                {availablePlayers.slice(0, 5).map(player => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => addPlayer(player)}
                  >
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {player.team} {player.position} • {player.averagePoints} avg pts
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Players */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedPlayers.map((player, index) => (
                <div key={player.id} className="border rounded-lg p-3 relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removePlayer(player.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="font-medium text-sm">{player.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {player.team} {player.position}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Avg Points</span>
                        <span className="font-medium">{player.averagePoints}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Consistency</span>
                        <span className="font-medium">{Math.round(player.consistency * 100)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Trend</span>
                        <div className="flex items-center gap-1">
                          {player.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                          {player.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                          {player.trend === 'stable' && <Target className="h-3 w-3 text-blue-600" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Player Placeholder */}
              {selectedPlayers.length < 4 && (
                <div className="border-2 border-dashed rounded-lg p-3 flex items-center justify-center min-h-[120px]">
                  <div className="text-center text-muted-foreground">
                    <Plus className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm">Add Player</div>
                    <div className="text-xs">Search above</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedPlayers.length > 0 && renderAdvancedComparison()}
    </div>
  );
}