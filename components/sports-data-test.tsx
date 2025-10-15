'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { useSportsData, useDailyStats } from '@/hooks/use-sports-data';
import { PlayerStats } from '@/lib/types/player-stats';

export function SportsDataTest() {
  const [selectedSport, setSelectedSport] = useState<'NBA' | 'NFL'>('NBA');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [syncResult, setSyncResult] = useState<any>(null);

  const { 
    loading, 
    error, 
    syncDailyStats, 
    getSyncStatus, 
    clearCache 
  } = useSportsData();

  const { 
    stats: dailyStats, 
    loading: dailyLoading, 
    error: dailyError 
  } = useDailyStats(selectedSport, selectedDate);

  const handleSync = async (force = false) => {
    try {
      const result = await syncDailyStats(selectedSport, selectedDate, force);
      setSyncResult(result);
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      setSyncResult({ message: 'Cache cleared successfully' });
    } catch (err) {
      console.error('Clear cache failed:', err);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const renderPlayerStats = (stats: PlayerStats) => {
    const isNBA = stats.sport === 'NBA';
    
    return (
      <Card key={stats.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{stats.playerName}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isNBA ? "default" : "secondary"}>
                {stats.sport}
              </Badge>
              <Badge variant="outline">
                {stats.team} vs {stats.opponent}
              </Badge>
            </div>
          </div>
          <CardDescription>
            {formatDate(stats.gameDate)} • {stats.gameStatus}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-lg">{stats.fantasyPoints} pts</span>
            </div>
          </div>
          
          {isNBA ? (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Points:</span>
                <span className="ml-1 font-medium">{(stats.stats as any).points}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Rebounds:</span>
                <span className="ml-1 font-medium">{(stats.stats as any).rebounds}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Assists:</span>
                <span className="ml-1 font-medium">{(stats.stats as any).assists}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Steals:</span>
                <span className="ml-1 font-medium">{(stats.stats as any).steals}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Blocks:</span>
                <span className="ml-1 font-medium">{(stats.stats as any).blocks}</span>
              </div>
              <div>
                <span className="text-muted-foreground">3PM:</span>
                <span className="ml-1 font-medium">{(stats.stats as any).threePointersMade}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Pass Yds:</span>
                <span className="ml-1 font-medium">{(stats.stats as any).passingYards}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Pass TD:</span>
                <span className="ml-1 font-medium">{(stats.stats as any).passingTouchdowns}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Rush Yds:</span>
                <span className="ml-1 font-medium">{(stats.stats as any).rushingYards}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Rush TD:</span>
                <span className="ml-1 font-medium">{(stats.stats as any).rushingTouchdowns}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Rec Yds:</span>
                <span className="ml-1 font-medium">{(stats.stats as any).receivingYards}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Rec TD:</span>
                <span className="ml-1 font-medium">{(stats.stats as any).receivingTouchdowns}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sports Data Integration Test</CardTitle>
          <CardDescription>
            Test the real-world sports data integration system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={selectedSport === 'NBA' ? 'default' : 'outline'}
                onClick={() => setSelectedSport('NBA')}
              >
                NBA
              </Button>
              <Button
                variant={selectedSport === 'NFL' ? 'default' : 'outline'}
                onClick={() => setSelectedSport('NFL')}
              >
                NFL
              </Button>
            </div>
            
            <input
              type="date"
              value={formatDate(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 border rounded-md"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleSync(false)}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sync Stats
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleSync(true)}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Force Sync
            </Button>
            
            <Button
              variant="outline"
              onClick={handleClearCache}
              disabled={loading}
            >
              Clear Cache
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              Error: {error}
            </div>
          )}

          {syncResult && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
              {syncResult.message || `Sync completed: ${syncResult.playersUpdated} players updated in ${syncResult.duration}ms`}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Stats - {selectedSport}</CardTitle>
              <CardDescription>
                {formatDate(selectedDate)} • {dailyStats.length} players
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{dailyStats.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dailyLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading daily stats...</span>
            </div>
          )}

          {dailyError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              Error loading daily stats: {dailyError}
            </div>
          )}

          {!dailyLoading && !dailyError && dailyStats.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No stats available for {selectedSport} on {formatDate(selectedDate)}
            </div>
          )}

          {!dailyLoading && dailyStats.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {dailyStats.slice(0, 10).map(renderPlayerStats)}
              {dailyStats.length > 10 && (
                <div className="text-center text-muted-foreground">
                  ... and {dailyStats.length - 10} more players
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}