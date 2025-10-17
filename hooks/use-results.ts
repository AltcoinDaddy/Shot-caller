'use client';

import { useState, useCallback } from 'react';

export interface ContestResult {
  id: string;
  weekId: number;
  rank: number;
  totalPoints: number;
  totalParticipants: number;
  prizeWon?: number;
  status: 'completed' | 'active' | 'upcoming';
  endTime: string;
}

export interface UpcomingContest {
  id: string;
  weekId: number;
  startTime: string;
  endTime: string;
  entryFee: number;
  prizePool: number;
  totalParticipants: number;
  maxParticipants?: number;
  contestType: string;
  status: 'upcoming' | 'active';
}

export interface WeeklyStats {
  currentWeekPoints: number;
  rankChange: number;
  bestWeekRank: number;
  averageRank: number;
}

export interface ResultsData {
  latestResult?: ContestResult;
  upcomingContests: UpcomingContest[];
  weeklyStats: WeeklyStats;
  recentResults: ContestResult[];
}

export function useResults() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAvailableContests = useCallback(async (
    contestType?: string,
    status?: string
  ): Promise<UpcomingContest[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (contestType) params.append('type', contestType);
      if (status) params.append('status', status);

      const response = await fetch(`/api/contests/available?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch contests');
      }

      const result = await response.json();
      return result.contests || [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching contests:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getContestResults = useCallback(async (
    weekId?: number,
    userId?: string
  ): Promise<ContestResult[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (weekId) params.append('weekId', weekId.toString());
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/results/history?${params}`);

      if (!response.ok) {
        // If endpoint doesn't exist, return mock data for development
        if (response.status === 404) {
          return getMockResults();
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch results');
      }

      const result = await response.json();
      return result.results || [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching results:', err);
      
      // Return mock data for development
      return getMockResults();
    } finally {
      setLoading(false);
    }
  }, []);

  const getWeeklyStats = useCallback(async (
    userId?: string
  ): Promise<WeeklyStats | null> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/results/stats?${params}`);

      if (!response.ok) {
        // If endpoint doesn't exist, return mock data for development
        if (response.status === 404) {
          return getMockWeeklyStats();
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch weekly stats');
      }

      const result = await response.json();
      return result.stats;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching weekly stats:', err);
      
      // Return mock data for development
      return getMockWeeklyStats();
    } finally {
      setLoading(false);
    }
  }, []);

  const joinContest = useCallback(async (
    contestId: string,
    walletAddress: string,
    transactionHash?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contests/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestId,
          walletAddress,
          transactionHash
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join contest');
      }

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error joining contest:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAvailableContests,
    getContestResults,
    getWeeklyStats,
    joinContest
  };
}

// Mock data functions for development
function getMockResults(): ContestResult[] {
  return [
    {
      id: 'result_1',
      weekId: 14,
      rank: 3,
      totalPoints: 1456,
      totalParticipants: 247,
      prizeWon: 25.5,
      status: 'completed',
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'result_2',
      weekId: 13,
      rank: 8,
      totalPoints: 1289,
      totalParticipants: 198,
      status: 'completed',
      endTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'result_3',
      weekId: 12,
      rank: 1,
      totalPoints: 1678,
      totalParticipants: 156,
      prizeWon: 125.0,
      status: 'completed',
      endTime: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}

function getMockWeeklyStats(): WeeklyStats {
  return {
    currentWeekPoints: 1456,
    rankChange: 13,
    bestWeekRank: 1,
    averageRank: 8.5
  };
}

export default useResults;