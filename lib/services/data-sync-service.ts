import { SportsDataService } from './sports-data-service';
import { PlayerStatsCache } from './player-stats-cache';
import { FantasyScoringEngine, LineupScore } from './fantasy-scoring-engine';
import { PlayerStats } from '@/lib/types/player-stats';

export interface SyncJob {
  id: string;
  type: 'daily_sync' | 'player_sync' | 'scoring_update';
  sport: 'NBA' | 'NFL';
  date: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  playersProcessed?: number;
  totalPlayers?: number;
}

export interface SyncResult {
  success: boolean;
  playersUpdated: number;
  errors: string[];
  duration: number;
}

export class DataSyncService {
  private sportsDataService: SportsDataService;
  private cache: PlayerStatsCache;
  private scoringEngine: FantasyScoringEngine;
  private activeJobs: Map<string, SyncJob> = new Map();

  constructor(
    sportsDataService: SportsDataService,
    cache: PlayerStatsCache,
    scoringEngine: FantasyScoringEngine
  ) {
    this.sportsDataService = sportsDataService;
    this.cache = cache;
    this.scoringEngine = scoringEngine;
  }

  /**
   * Sync daily stats for all players
   */
  async syncDailyStats(sport: 'NBA' | 'NFL', date: Date = new Date()): Promise<SyncResult> {
    const jobId = this.generateJobId('daily_sync', sport, date);
    const job: SyncJob = {
      id: jobId,
      type: 'daily_sync',
      sport,
      date,
      status: 'running',
      startedAt: new Date()
    };

    this.activeJobs.set(jobId, job);
    const startTime = Date.now();

    try {
      // Check cache first
      const cachedStats = this.cache.getDailyStats(sport, date);
      if (cachedStats.length > 0) {
        console.log(`Using cached daily stats for ${sport} on ${date.toDateString()}`);
        job.status = 'completed';
        job.completedAt = new Date();
        job.playersProcessed = cachedStats.length;
        
        return {
          success: true,
          playersUpdated: cachedStats.length,
          errors: [],
          duration: Date.now() - startTime
        };
      }

      // Fetch fresh data from API
      const playerStats = await this.sportsDataService.fetchDailyStats(sport, date);
      
      if (playerStats.length === 0) {
        throw new Error(`No stats found for ${sport} on ${date.toDateString()}`);
      }

      // Cache the results
      this.cache.setDailyStats(sport, date, playerStats);

      // Store in database (would integrate with Supabase here)
      await this.storeDailyStats(playerStats);

      job.status = 'completed';
      job.completedAt = new Date();
      job.playersProcessed = playerStats.length;
      job.totalPlayers = playerStats.length;

      return {
        success: true,
        playersUpdated: playerStats.length,
        errors: [],
        duration: Date.now() - startTime
      };

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();

      return {
        success: false,
        playersUpdated: 0,
        errors: [job.error],
        duration: Date.now() - startTime
      };
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Sync specific player stats
   */
  async syncPlayerStats(playerId: string, sport: 'NBA' | 'NFL', date: Date): Promise<PlayerStats | null> {
    // Check cache first
    const cachedStats = this.cache.get(playerId, date);
    if (cachedStats) {
      return cachedStats;
    }

    try {
      const playerStats = await this.sportsDataService.fetchPlayerStats(playerId, sport, date);
      
      if (playerStats) {
        // Cache the result
        this.cache.set(playerStats);
        
        // Store in database
        await this.storePlayerStats(playerStats);
      }

      return playerStats;
    } catch (error) {
      console.error(`Error syncing player ${playerId} stats:`, error);
      return null;
    }
  }

  /**
   * Update lineup scores based on latest player stats
   */
  async updateLineupScores(lineupIds: string[], date: Date): Promise<LineupScore[]> {
    const jobId = this.generateJobId('scoring_update', 'NBA', date);
    const job: SyncJob = {
      id: jobId,
      type: 'scoring_update',
      sport: 'NBA', // Mixed sport lineups handled separately
      date,
      status: 'running',
      startedAt: new Date()
    };

    this.activeJobs.set(jobId, job);

    try {
      const lineupScores: LineupScore[] = [];

      for (const lineupId of lineupIds) {
        // Get lineup player IDs (would fetch from database)
        const playerIds = await this.getLineupPlayerIds(lineupId);
        const playerStats: PlayerStats[] = [];

        // Fetch stats for each player in lineup
        for (const playerId of playerIds) {
          const sport = this.determineSportFromPlayerId(playerId);
          const stats = await this.syncPlayerStats(playerId, sport, date);
          if (stats) {
            playerStats.push(stats);
          }
        }

        // Calculate lineup score
        const lineupScore = this.scoringEngine.calculateLineupScore(lineupId, playerStats);
        lineupScores.push(lineupScore);

        // Store updated score (would integrate with database)
        await this.storeLineupScore(lineupScore);
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.playersProcessed = lineupScores.length;

      return lineupScores;

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      throw error;
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Schedule automatic daily sync jobs
   */
  scheduleAutomaticSync(): void {
    // Schedule NBA sync for 2 AM EST (after games typically end)
    this.scheduleJob('NBA', '02:00');
    
    // Schedule NFL sync for 1 AM EST on Mondays and Tuesdays (after games)
    this.scheduleJob('NFL', '01:00', [1, 2]); // Monday and Tuesday
  }

  /**
   * Get active sync jobs
   */
  getActiveJobs(): SyncJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): SyncJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  private generateJobId(type: string, sport: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    return `${type}_${sport}_${dateStr}_${Date.now()}`;
  }

  private async storeDailyStats(playerStats: PlayerStats[]): Promise<void> {
    // This would integrate with Supabase to store stats
    // For now, just log the operation
    console.log(`Storing ${playerStats.length} player stats in database`);
  }

  private async storePlayerStats(playerStats: PlayerStats): Promise<void> {
    // This would integrate with Supabase to store individual player stats
    console.log(`Storing stats for ${playerStats.playerName} in database`);
  }

  private async storeLineupScore(lineupScore: LineupScore): Promise<void> {
    // This would integrate with Supabase to store lineup scores
    console.log(`Storing lineup score ${lineupScore.totalPoints} for lineup ${lineupScore.lineupId}`);
  }

  private async getLineupPlayerIds(lineupId: string): Promise<string[]> {
    // This would fetch from database - returning mock data for now
    return ['player1', 'player2', 'player3', 'player4', 'player5'];
  }

  private determineSportFromPlayerId(playerId: string): 'NBA' | 'NFL' {
    // This would determine sport based on player ID format or database lookup
    // For now, assume NBA if no clear indicator
    return playerId.includes('nfl') ? 'NFL' : 'NBA';
  }

  private scheduleJob(sport: 'NBA' | 'NFL', time: string, daysOfWeek?: number[]): void {
    // This would integrate with a job scheduler like node-cron
    console.log(`Scheduling ${sport} sync job for ${time}${daysOfWeek ? ` on days ${daysOfWeek.join(', ')}` : ' daily'}`);
  }
}