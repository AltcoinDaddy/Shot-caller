import { FantasyScoringEngine, LineupScore } from './fantasy-scoring-engine';
import { DataSyncService } from './data-sync-service';
import { leaderboardService } from './leaderboard-service';
import { PlayerStats } from '@/lib/types/player-stats';

export interface WeeklyScoringJob {
  id: string;
  weekId: number;
  sport: 'NBA' | 'NFL' | 'MIXED';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  lineupCount: number;
  processedCount: number;
  error?: string;
}

export interface WeeklyScoreUpdate {
  lineupId: string;
  userId: string;
  previousScore: number;
  newScore: number;
  scoreDifference: number;
  playerContributions: Array<{
    playerId: string;
    playerName: string;
    previousPoints: number;
    newPoints: number;
    pointsDifference: number;
  }>;
}

export class WeeklyScoringService {
  private scoringEngine: FantasyScoringEngine;
  private syncService: DataSyncService;
  private activeJobs: Map<string, WeeklyScoringJob> = new Map();

  constructor(scoringEngine: FantasyScoringEngine, syncService: DataSyncService) {
    this.scoringEngine = scoringEngine;
    this.syncService = syncService;
  }

  /**
   * Process weekly scoring for all active lineups
   */
  async processWeeklyScoring(weekId: number, targetDate: Date = new Date()): Promise<WeeklyScoringJob> {
    const jobId = this.generateJobId(weekId);
    const job: WeeklyScoringJob = {
      id: jobId,
      weekId,
      sport: 'MIXED',
      status: 'running',
      startedAt: new Date(),
      lineupCount: 0,
      processedCount: 0
    };

    this.activeJobs.set(jobId, job);

    try {
      // Get all active lineups for the week
      const activeLineups = await this.getActiveLineups(weekId);
      job.lineupCount = activeLineups.length;

      const scoreUpdates: WeeklyScoreUpdate[] = [];

      // Process each lineup
      for (const lineup of activeLineups) {
        try {
          const scoreUpdate = await this.processLineupScoring(lineup, targetDate);
          if (scoreUpdate) {
            scoreUpdates.push(scoreUpdate);
          }
          job.processedCount++;
        } catch (error) {
          console.error(`Error processing lineup ${lineup.id}:`, error);
        }
      }

      // Update leaderboard with new scores
      await this.updateLeaderboard(scoreUpdates, weekId);

      // Store weekly results
      await this.storeWeeklyResults(weekId, scoreUpdates);

      job.status = 'completed';
      job.completedAt = new Date();

      console.log(`Weekly scoring completed for week ${weekId}: ${job.processedCount}/${job.lineupCount} lineups processed`);

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      console.error(`Weekly scoring failed for week ${weekId}:`, error);
    } finally {
      this.activeJobs.delete(jobId);
    }

    return job;
  }

  /**
   * Process scoring for a single lineup
   */
  private async processLineupScoring(
    lineup: { id: string; userId: string; playerIds: string[] }, 
    targetDate: Date
  ): Promise<WeeklyScoreUpdate | null> {
    try {
      // Get current lineup score
      const currentScore = await this.getCurrentLineupScore(lineup.id);
      
      // Fetch latest player stats
      const playerStats: PlayerStats[] = [];
      const playerContributions = [];

      for (const playerId of lineup.playerIds) {
        const sport = this.determineSportFromPlayerId(playerId);
        const stats = await this.syncService.syncPlayerStats(playerId, sport, targetDate);
        
        if (stats) {
          playerStats.push(stats);
          
          // Calculate individual contribution
          const playerScore = this.scoringEngine.calculatePlayerScore(stats);
          const previousPlayerScore = await this.getPreviousPlayerScore(playerId, lineup.id);
          
          playerContributions.push({
            playerId,
            playerName: stats.playerName,
            previousPoints: previousPlayerScore,
            newPoints: playerScore.fantasyPoints,
            pointsDifference: playerScore.fantasyPoints - previousPlayerScore
          });
        }
      }

      // Calculate base lineup score
      const baseLineupScore = this.scoringEngine.calculateLineupScore(lineup.id, playerStats);
      
      // Apply booster effects if available
      let finalLineupScore = baseLineupScore;
      try {
        // Import booster service dynamically to avoid circular dependencies
        const { boosterService } = await import('./booster-service');
        
        // Get active booster effects for this user and lineup
        const boosterEffects = await boosterService.getBoosterEffectsForLineup(lineup.userId, lineup.id);
        
        if (boosterEffects.length > 0) {
          finalLineupScore = this.scoringEngine.applyBoosterEffects(baseLineupScore, boosterEffects);
          console.log(`Applied ${boosterEffects.length} booster effects to lineup ${lineup.id}: ${baseLineupScore.totalPoints} -> ${finalLineupScore.totalPoints}`);
        }
      } catch (error) {
        console.warn('Failed to apply booster effects:', error);
        // Continue with base score if booster application fails
      }
      
      // Create score update record
      const scoreUpdate: WeeklyScoreUpdate = {
        lineupId: lineup.id,
        userId: lineup.userId,
        previousScore: currentScore,
        newScore: finalLineupScore.totalPoints,
        scoreDifference: finalLineupScore.totalPoints - currentScore,
        playerContributions
      };

      // Store updated lineup score (with booster effects applied)
      await this.storeLineupScore(finalLineupScore);

      return scoreUpdate;

    } catch (error) {
      console.error(`Error processing lineup ${lineup.id}:`, error);
      return null;
    }
  }

  /**
   * Update leaderboard with new scores
   */
  private async updateLeaderboard(scoreUpdates: WeeklyScoreUpdate[], weekId: number): Promise<void> {
    for (const update of scoreUpdates) {
      try {
        // Get user's total season points
        const userRanking = await leaderboardService.getUserRanking(update.userId, 'season');
        const newTotalPoints = (userRanking?.totalPoints || 0) + update.scoreDifference;
        
        // Update leaderboard
        await leaderboardService.updateUserPoints(
          update.userId,
          update.newScore, // weekly points
          newTotalPoints   // total season points
        );

        // Add to ranking history
        await leaderboardService.addRankingHistory({
          userId: update.userId,
          weekId,
          weeklyPoints: update.newScore,
          totalPoints: newTotalPoints,
          rank: 0, // Will be calculated by leaderboard service
          pointsChange: update.scoreDifference
        });

      } catch (error) {
        console.error(`Error updating leaderboard for user ${update.userId}:`, error);
      }
    }
  }

  /**
   * Schedule automatic weekly scoring jobs
   */
  scheduleWeeklyJobs(): void {
    // Schedule NBA scoring for Tuesday 3 AM EST (after Monday games)
    this.scheduleJob('NBA', 'Tuesday', '03:00');
    
    // Schedule NFL scoring for Tuesday 2 AM EST (after Monday Night Football)
    this.scheduleJob('NFL', 'Tuesday', '02:00');
    
    // Schedule mixed sport scoring for Tuesday 4 AM EST (after both)
    this.scheduleJob('MIXED', 'Tuesday', '04:00');
  }

  /**
   * Get active scoring jobs
   */
  getActiveJobs(): WeeklyScoringJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): WeeklyScoringJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Force recalculate scores for a specific week
   */
  async recalculateWeeklyScores(weekId: number, targetDate?: Date): Promise<WeeklyScoringJob> {
    console.log(`Force recalculating scores for week ${weekId}`);
    return this.processWeeklyScoring(weekId, targetDate || new Date());
  }

  // Private helper methods
  private generateJobId(weekId: number): string {
    return `weekly_scoring_${weekId}_${Date.now()}`;
  }

  private async getActiveLineups(weekId: number): Promise<Array<{ id: string; userId: string; playerIds: string[] }>> {
    // This would fetch from database - returning mock data for now
    return [
      { id: 'lineup_1', userId: 'user_1', playerIds: ['nba_player_1', 'nba_player_2', 'nfl_player_1', 'nba_player_3', 'nfl_player_2'] },
      { id: 'lineup_2', userId: 'user_2', playerIds: ['nba_player_4', 'nba_player_5', 'nfl_player_3', 'nba_player_6', 'nfl_player_4'] },
      { id: 'lineup_3', userId: 'user_3', playerIds: ['nba_player_7', 'nba_player_8', 'nfl_player_5', 'nba_player_9', 'nfl_player_6'] }
    ];
  }

  private async getCurrentLineupScore(lineupId: string): Promise<number> {
    // This would fetch from database - returning mock data for now
    return Math.floor(Math.random() * 300) + 200;
  }

  private async getPreviousPlayerScore(playerId: string, lineupId: string): Promise<number> {
    // This would fetch from database - returning mock data for now
    return Math.floor(Math.random() * 80) + 20;
  }

  private async storeLineupScore(lineupScore: LineupScore): Promise<void> {
    // This would integrate with Supabase to store lineup scores
    console.log(`Storing lineup score: ${lineupScore.totalPoints} for lineup ${lineupScore.lineupId}`);
  }

  private async storeWeeklyResults(weekId: number, scoreUpdates: WeeklyScoreUpdate[]): Promise<void> {
    // This would integrate with Supabase to store weekly results
    console.log(`Storing weekly results for week ${weekId}: ${scoreUpdates.length} updates`);
  }

  private determineSportFromPlayerId(playerId: string): 'NBA' | 'NFL' {
    return playerId.includes('nfl') ? 'NFL' : 'NBA';
  }

  private scheduleJob(sport: string, day: string, time: string): void {
    // This would integrate with a job scheduler like node-cron
    console.log(`Scheduling ${sport} weekly scoring job for ${day} at ${time}`);
  }
}

// Export singleton instance
export const weeklyScoringService = new WeeklyScoringService(
  new FantasyScoringEngine(),
  // DataSyncService would be injected here in real implementation
  {} as DataSyncService
);