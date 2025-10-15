import { useState, useEffect, useCallback } from 'react';
import { PlayerStats } from '@/lib/types/player-stats';
import { LineupScore } from '@/lib/services/fantasy-scoring-engine';

interface SyncStatus {
  activeJobs: number;
  jobs: any[];
  cache: {
    totalEntries: number;
    hitRate: number;
    missRate: number;
    lastCleanup: Date;
  };
  timestamp: string;
}

export function useSportsData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyStats = useCallback(async (sport: 'NBA' | 'NFL', date?: Date) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        sport,
        ...(date && { date: date.toISOString().split('T')[0] })
      });

      const response = await fetch(`/api/sports-data/daily-stats?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch daily stats');
      }

      return data.data as PlayerStats[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlayerStats = useCallback(async (playerId: string, sport: 'NBA' | 'NFL', date?: Date) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        playerId,
        sport,
        ...(date && { date: date.toISOString().split('T')[0] })
      });

      const response = await fetch(`/api/sports-data/player-stats?${params}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(data.error || 'Failed to fetch player stats');
      }

      return data.data as PlayerStats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateLineupScores = useCallback(async (
    lineups: Array<{ id: string; playerIds: string[] }>,
    date?: Date
  ) => {
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
          ...(date && { date: date.toISOString().split('T')[0] })
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate lineup scores');
      }

      return data.data as LineupScore[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const syncDailyStats = useCallback(async (sport: 'NBA' | 'NFL', date?: Date, force = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sports-data/daily-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport,
          ...(date && { date: date.toISOString().split('T')[0] }),
          force
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync daily stats');
      }

      return {
        success: data.success,
        playersUpdated: data.playersUpdated,
        errors: data.errors,
        duration: data.duration
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSyncStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sports-data/sync-status');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sync status');
      }

      return data as SyncStatus;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sports-data/sync-status?clearCache=true', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear cache');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchDailyStats,
    fetchPlayerStats,
    calculateLineupScores,
    syncDailyStats,
    getSyncStatus,
    clearCache
  };
}

export function usePlayerStats(playerId: string, sport: 'NBA' | 'NFL', date?: Date) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { fetchPlayerStats } = useSportsData();

  useEffect(() => {
    if (!playerId || !sport) return;

    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const playerStats = await fetchPlayerStats(playerId, sport, date);
        setStats(playerStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load player stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [playerId, sport, date, fetchPlayerStats]);

  return { stats, loading, error };
}

export function useDailyStats(sport: 'NBA' | 'NFL', date?: Date) {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { fetchDailyStats } = useSportsData();

  useEffect(() => {
    if (!sport) return;

    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const dailyStats = await fetchDailyStats(sport, date);
        setStats(dailyStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load daily stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [sport, date, fetchDailyStats]);

  return { stats, loading, error };
}