import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePremium } from '@/hooks/use-premium';
import { useScoring } from '@/hooks/use-scoring';
import { useSportsData } from '@/hooks/use-sports-data';

interface AnalyticsData {
  performanceMetrics: {
    totalPoints: number;
    averagePoints: number;
    consistency: number;
    efficiency: number;
    rankingTrend: 'improving' | 'declining' | 'stable';
    winRate: number;
  };
  weeklyTrends: Array<{
    week: string;
    weekNumber: number;
    totalPoints: number;
    rank: number;
    efficiency: number;
    consistency: number;
  }>;
  playerAnalytics: Array<{
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
    }>;
  }>;
  teamComposition: {
    sportDistribution: Record<string, number>;
    positionDistribution: Record<string, number>;
    playerContributions: Array<{
      playerId: string;
      playerName: string;
      points: number;
      percentage: number;
    }>;
  };
  insights: {
    topPerformer: {
      name: string;
      contribution: number;
    };
    improvementAreas: string[];
    recommendations: string[];
  };
}

interface ComparisonData {
  players: Array<{
    id: string;
    name: string;
    sport: 'NBA' | 'NFL';
    team: string;
    position: string;
    stats: Record<string, number>;
    trends: Array<{
      week: string;
      points: number;
      efficiency: number;
    }>;
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

export function useAnalytics(userId?: string, timeframe: 'week' | 'month' | 'season' = 'season') {
  const { user, isAuthenticated } = useAuth();
  const { isPremium, hasAdvancedAnalytics } = usePremium();
  const { calculateLineupBreakdown } = useScoring();
  const { fetchDailyStats } = useSportsData();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalyticsData = useCallback(async () => {
    if (!isAuthenticated || !user.addr) return;

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, these would be actual API calls
      // For now, we'll use mock data that matches the component interfaces

      const mockAnalyticsData: AnalyticsData = {
        performanceMetrics: {
          totalPoints: 1247,
          averagePoints: 249.4,
          consistency: 0.78,
          efficiency: 0.85,
          rankingTrend: 'improving',
          winRate: 0.65
        },
        weeklyTrends: [
          { week: 'W1', weekNumber: 1, totalPoints: 201, rank: 67, efficiency: 0.72, consistency: 0.68 },
          { week: 'W2', weekNumber: 2, totalPoints: 245, rank: 45, efficiency: 0.78, consistency: 0.75 },
          { week: 'W3', weekNumber: 3, totalPoints: 234, rank: 52, efficiency: 0.75, consistency: 0.71 },
          { week: 'W4', weekNumber: 4, totalPoints: 289, rank: 23, efficiency: 0.89, consistency: 0.85 },
          { week: 'W5', weekNumber: 5, totalPoints: 278, rank: 31, efficiency: 0.85, consistency: 0.82 },
        ],
        playerAnalytics: [
          {
            playerId: '1',
            playerName: 'LeBron James',
            sport: 'NBA',
            averagePoints: 45.2,
            consistency: 0.85,
            trendDirection: 'up',
            weeklyData: [
              { week: 'W1', points: 42, efficiency: 0.82 },
              { week: 'W2', points: 48, efficiency: 0.89 },
              { week: 'W3', points: 44, efficiency: 0.78 },
              { week: 'W4', points: 51, efficiency: 0.92 },
              { week: 'W5', points: 46, efficiency: 0.85 },
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
              { week: 'W1', points: 35, efficiency: 0.75 },
              { week: 'W2', points: 42, efficiency: 0.88 },
              { week: 'W3', points: 31, efficiency: 0.68 },
              { week: 'W4', points: 45, efficiency: 0.91 },
              { week: 'W5', points: 40, efficiency: 0.82 },
            ]
          }
        ],
        teamComposition: {
          sportDistribution: { NBA: 3, NFL: 2 },
          positionDistribution: { PG: 1, SG: 1, SF: 1, QB: 1, RB: 1 },
          playerContributions: [
            { playerId: '1', playerName: 'LeBron James', points: 226, percentage: 18.1 },
            { playerId: '2', playerName: 'Stephen Curry', points: 194, percentage: 15.6 },
            { playerId: '3', playerName: 'Patrick Mahomes', points: 248, percentage: 19.9 },
            { playerId: '4', playerName: 'Giannis Antetokounmpo', points: 261, percentage: 20.9 },
            { playerId: '5', playerName: 'Justin Jefferson', points: 218, percentage: 17.5 },
          ]
        },
        insights: {
          topPerformer: {
            name: 'Giannis Antetokounmpo',
            contribution: 20.9
          },
          improvementAreas: [
            'Consistency in NBA player selection',
            'Better matchup analysis for NFL players',
            'Diversify position coverage'
          ],
          recommendations: [
            'Consider adding more defensive players',
            'Monitor player injury reports more closely',
            'Optimize NBA/NFL balance based on schedule'
          ]
        }
      };

      setAnalyticsData(mockAnalyticsData);

      // Load optimization suggestions if premium
      if (isPremium && hasAdvancedAnalytics) {
        const mockSuggestions: OptimizationSuggestion[] = [
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
          }
        ];
        setOptimizationSuggestions(mockSuggestions);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user.addr, timeframe, isPremium, hasAdvancedAnalytics]);

  const loadComparisonData = useCallback(async (playerIds: string[]) => {
    if (playerIds.length === 0) {
      setComparisonData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock comparison data
      const mockComparisonData: ComparisonData = {
        players: playerIds.map(id => ({
          id,
          name: `Player ${id}`,
          sport: 'NBA' as const,
          team: 'Team',
          position: 'PG',
          stats: {
            averagePoints: 40 + Math.random() * 20,
            consistency: 0.7 + Math.random() * 0.3,
            ppg: 25 + Math.random() * 10,
            rpg: 5 + Math.random() * 5,
            apg: 4 + Math.random() * 6
          },
          trends: [
            { week: 'W1', points: 35 + Math.random() * 20, efficiency: 0.7 + Math.random() * 0.3 },
            { week: 'W2', points: 35 + Math.random() * 20, efficiency: 0.7 + Math.random() * 0.3 },
            { week: 'W3', points: 35 + Math.random() * 20, efficiency: 0.7 + Math.random() * 0.3 },
            { week: 'W4', points: 35 + Math.random() * 20, efficiency: 0.7 + Math.random() * 0.3 },
            { week: 'W5', points: 35 + Math.random() * 20, efficiency: 0.7 + Math.random() * 0.3 },
          ]
        }))
      };

      setComparisonData(mockComparisonData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  }, []);

  const calculatePlayerTrends = useCallback(async (playerId: string, weeks: number = 8) => {
    setLoading(true);
    setError(null);

    try {
      // In real implementation, this would calculate actual trends from historical data
      const mockTrend = {
        slope: (Math.random() - 0.5) * 5, // -2.5 to +2.5 points per week
        correlation: 0.6 + Math.random() * 0.4, // 0.6 to 1.0
        volatility: 0.05 + Math.random() * 0.2, // 0.05 to 0.25
        momentum: Math.random() // 0 to 1
      };

      return mockTrend;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate player trends');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPerformanceInsights = useCallback(() => {
    if (!analyticsData) return [];

    const insights = [];

    // Performance trend analysis
    const recentWeeks = analyticsData.weeklyTrends.slice(-3);
    const avgRecentPoints = recentWeeks.reduce((sum, week) => sum + week.totalPoints, 0) / recentWeeks.length;
    
    if (avgRecentPoints > analyticsData.performanceMetrics.averagePoints * 1.1) {
      insights.push({
        type: 'positive',
        title: 'Strong Recent Performance',
        description: `Your last 3 weeks averaged ${avgRecentPoints.toFixed(1)} points, 10% above your season average.`
      });
    }

    // Consistency analysis
    if (analyticsData.performanceMetrics.consistency > 0.8) {
      insights.push({
        type: 'positive',
        title: 'High Consistency',
        description: `Your consistency score of ${Math.round(analyticsData.performanceMetrics.consistency * 100)}% is excellent.`
      });
    } else if (analyticsData.performanceMetrics.consistency < 0.6) {
      insights.push({
        type: 'warning',
        title: 'Consistency Opportunity',
        description: `Consider strategies to improve your consistency score of ${Math.round(analyticsData.performanceMetrics.consistency * 100)}%.`
      });
    }

    // Player contribution analysis
    const topContributor = analyticsData.teamComposition.playerContributions[0];
    if (topContributor && topContributor.percentage > 25) {
      insights.push({
        type: 'warning',
        title: 'Over-reliance on Single Player',
        description: `${topContributor.playerName} contributes ${topContributor.percentage.toFixed(1)}% of your points. Consider diversifying.`
      });
    }

    return insights;
  }, [analyticsData]);

  const exportAnalyticsData = useCallback((format: 'csv' | 'json' = 'csv') => {
    if (!analyticsData) return;

    if (format === 'json') {
      const dataStr = JSON.stringify(analyticsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } else {
      // CSV export for weekly trends
      const csvHeader = 'Week,Total Points,Rank,Efficiency,Consistency\n';
      const csvData = analyticsData.weeklyTrends
        .map(week => `${week.week},${week.totalPoints},${week.rank},${week.efficiency},${week.consistency}`)
        .join('\n');
      
      const dataBlob = new Blob([csvHeader + csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  }, [analyticsData]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  return {
    // Data
    analyticsData,
    comparisonData,
    optimizationSuggestions,
    
    // Loading states
    loading,
    error,
    
    // Actions
    loadAnalyticsData,
    loadComparisonData,
    calculatePlayerTrends,
    exportAnalyticsData,
    
    // Computed values
    insights: getPerformanceInsights(),
    
    // Helper methods
    refresh: loadAnalyticsData,
    hasData: !!analyticsData,
    isPremiumUser: isPremium,
    hasAdvancedFeatures: hasAdvancedAnalytics
  };
}

export default useAnalytics;