import { useState, useEffect, useCallback } from 'react';
import { 
  LeaderboardEntry, 
  LeaderboardStats, 
  LeaderboardTimeframe,
  PrizePool,
  UserRankingHistory,
  ContestLeaderboard
} from '@/lib/types/leaderboard';

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  stats: LeaderboardStats | null;
  loading: boolean;
  error: string | null;
  refreshLeaderboard: () => Promise<void>;
  updateUserPoints: (userId: string, weeklyPoints: number, totalPoints: number) => Promise<void>;
}

export function useLeaderboard(timeframe: LeaderboardTimeframe = 'season', limit: number = 100): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leaderboard?timeframe=${timeframe}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeframe, limit]);

  const updateUserPoints = useCallback(async (userId: string, weeklyPoints: number, totalPoints: number) => {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          weeklyPoints,
          totalPoints
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user points: ${response.statusText}`);
      }

      // Refresh leaderboard after update
      await fetchLeaderboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user points');
      console.error('Update user points error:', err);
      throw err;
    }
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    stats,
    loading,
    error,
    refreshLeaderboard: fetchLeaderboard,
    updateUserPoints
  };
}

interface UseUserRankingReturn {
  ranking: LeaderboardEntry | null;
  history: UserRankingHistory[];
  loading: boolean;
  error: string | null;
  refreshRanking: () => Promise<void>;
}

export function useUserRanking(userId: string | null, timeframe: LeaderboardTimeframe = 'season'): UseUserRankingReturn {
  const [ranking, setRanking] = useState<LeaderboardEntry | null>(null);
  const [history, setHistory] = useState<UserRankingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRanking = useCallback(async () => {
    if (!userId) {
      setRanking(null);
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch current ranking
      const rankingResponse = await fetch(`/api/leaderboard?userId=${userId}&timeframe=${timeframe}`);
      if (rankingResponse.ok) {
        const rankingData = await rankingResponse.json();
        setRanking(rankingData);
      } else {
        setRanking(null);
      }

      // Fetch ranking history
      const historyResponse = await fetch(`/api/leaderboard/history?userId=${userId}&limit=10`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistory(historyData.history || []);
      } else {
        setHistory([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user ranking');
      console.error('User ranking fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, timeframe]);

  useEffect(() => {
    fetchUserRanking();
  }, [fetchUserRanking]);

  return {
    ranking,
    history,
    loading,
    error,
    refreshRanking: fetchUserRanking
  };
}

interface UsePrizePoolReturn {
  prizePool: PrizePool | null;
  loading: boolean;
  error: string | null;
  refreshPrizePool: () => Promise<void>;
}

export function usePrizePool(contestId: string | null): UsePrizePoolReturn {
  const [prizePool, setPrizePool] = useState<PrizePool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrizePool = useCallback(async () => {
    if (!contestId) {
      setPrizePool(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leaderboard/prize-pools?contestId=${contestId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prize pool: ${response.statusText}`);
      }

      const data = await response.json();
      setPrizePool(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prize pool');
      console.error('Prize pool fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    fetchPrizePool();
  }, [fetchPrizePool]);

  return {
    prizePool,
    loading,
    error,
    refreshPrizePool: fetchPrizePool
  };
}

interface UseContestLeaderboardReturn {
  contestLeaderboard: ContestLeaderboard | null;
  loading: boolean;
  error: string | null;
  refreshContestLeaderboard: () => Promise<void>;
}

export function useContestLeaderboard(contestId: string | null): UseContestLeaderboardReturn {
  const [contestLeaderboard, setContestLeaderboard] = useState<ContestLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContestLeaderboard = useCallback(async () => {
    if (!contestId) {
      setContestLeaderboard(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leaderboard/contest?contestId=${contestId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contest leaderboard: ${response.statusText}`);
      }

      const data = await response.json();
      setContestLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contest leaderboard');
      console.error('Contest leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    fetchContestLeaderboard();
  }, [fetchContestLeaderboard]);

  return {
    contestLeaderboard,
    loading,
    error,
    refreshContestLeaderboard: fetchContestLeaderboard
  };
}