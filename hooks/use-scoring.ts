'use client';

import { useState, useCallback } from 'react';
import { LineupScore, PlayerScore } from '@/lib/services/fantasy-scoring-engine';

interface ScoringBreakdownData {
  lineupScore: LineupScore;
  analytics: {
    topPerformer: {
      playerId: string;
      playerName: string;
      points: number;
      sport: string;
    };
    averagePoints: number;
    aboveAverageCount: number;
    sportDistribution: Record<string, number>;
    scoringEfficiency: Array<{
      playerId: string;
      playerName: string;
      efficiency: number;
    }>;
  };
  metadata: {
    lineupId: string;
    calculatedAt: string;
    playerCount: number;
    date: string;
  };
}

interface PlayerScoringData {
  playerScore: PlayerScore;
  analytics: {
    performanceRating: string;
    dominantStat: any;
    negativeStats: any[];
    positiveStats: any[];
  };
  metadata: {
    playerId: string;
    sport: string;
    date: string;
    gameStatus: string;
    opponent: string;
  };
}

interface WeeklyScoringJob {
  id: string;
  weekId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  lineupCount: number;
  processedCount: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export function useScoring() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateLineupBreakdown = useCallback(async (
    lineupId: string, 
    playerIds: string[], 
    date?: Date
  ): Promise<ScoringBreakdownData | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scoring/breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineupId,
          playerIds,
          date: date?.toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate lineup breakdown');
      }

      const result = await response.json();
      return result.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error calculating lineup breakdown:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPlayerBreakdown = useCallback(async (
    playerId: string,
    sport: 'NBA' | 'NFL',
    date?: Date
  ): Promise<PlayerScoringData | null> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        playerId,
        sport,
        ...(date && { date: date.toISOString().split('T')[0] })
      });

      const response = await fetch(`/api/scoring/breakdown?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get player breakdown');
      }

      const result = await response.json();
      return result.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting player breakdown:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerWeeklyUpdate = useCallback(async (
    weekId: number,
    targetDate?: Date,
    force = false
  ): Promise<WeeklyScoringJob | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scoring/weekly-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekId,
          targetDate: targetDate?.toISOString(),
          force
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger weekly update');
      }

      const result = await response.json();
      return result.job;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error triggering weekly update:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getWeeklyScoringStatus = useCallback(async (
    jobId?: string
  ): Promise<{ activeJobs: WeeklyScoringJob[]; count: number } | WeeklyScoringJob | null> => {
    setLoading(true);
    setError(null);

    try {
      const params = jobId ? new URLSearchParams({ jobId }) : '';
      const response = await fetch(`/api/scoring/weekly-update?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get weekly scoring status');
      }

      const result = await response.json();
      return jobId ? result.job : { activeJobs: result.activeJobs, count: result.count };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting weekly scoring status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateLineupScores = useCallback(async (
    lineups: Array<{ id: string; playerIds: string[] }>,
    date?: Date
  ): Promise<LineupScore[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sports-data/lineup-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineups,
          date: date?.toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate lineup scores');
      }

      const result = await response.json();
      return result.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error calculating lineup scores:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    calculateLineupBreakdown,
    getPlayerBreakdown,
    triggerWeeklyUpdate,
    getWeeklyScoringStatus,
    calculateLineupScores
  };
}

export default useScoring;