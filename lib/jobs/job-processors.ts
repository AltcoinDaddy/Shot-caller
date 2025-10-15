import { Worker, Job } from 'bullmq';
import { supabase } from '@/lib/supabase';
import { cacheService } from '@/lib/cache/cache-service';
import { optimizedQueries } from '@/lib/database/optimized-queries';
import type { 
  StatsUpdateJob, 
  ScoringJob, 
  RewardDistributionJob, 
  CacheWarmupJob, 
  DatabaseCleanupJob,
  JobData 
} from './job-queue';

// Stats update processor
export class StatsProcessor {
  static async processStatsUpdate(job: Job<StatsUpdateJob>): Promise<void> {
    const { sport, date, players } = job.data.data;
    
    console.log(`Processing stats update for ${sport} on ${date}`);
    
    try {
      // Fetch stats from external API (NBA/NFL)
      const stats = await this.fetchStatsFromAPI(sport, date, players);
      
      if (stats.length === 0) {
        console.log(`No stats found for ${sport} on ${date}`);
        return;
      }

      // Batch update player stats
      const success = await optimizedQueries.batchUpdatePlayerStats(stats);
      
      if (success) {
        console.log(`Successfully updated ${stats.length} player stats for ${sport}`);
        
        // Invalidate related caches
        await cacheService.del('*', { prefix: 'player_stats' });
        await cacheService.invalidateLeaderboardCache();
        
        // Update job progress
        await job.updateProgress(100);
      } else {
        throw new Error('Failed to update player stats in database');
      }
    } catch (error) {
      console.error(`Error processing stats update:`, error);
      throw error;
    }
  }

  private static async fetchStatsFromAPI(
    sport: 'NBA' | 'NFL', 
    date: string, 
    players?: string[]
  ): Promise<any[]> {
    // This would integrate with actual sports data APIs
    // For now, return mock data
    const mockStats = [
      {
        playerName: 'LeBron James',
        gameDate: new Date(date),
        sport,
        stats: {
          points: 25,
          rebounds: 8,
          assists: 6,
          steals: 2,
          blocks: 1,
        },
        fantasyPoints: 42.5,
      },
      {
        playerName: 'Stephen Curry',
        gameDate: new Date(date),
        sport,
        stats: {
          points: 30,
          rebounds: 5,
          assists: 8,
          steals: 1,
          blocks: 0,
        },
        fantasyPoints: 44.0,
      },
    ];

    return players ? mockStats.filter(stat => players.includes(stat.playerName)) : mockStats;
  }
}

// Scoring calculation processor
export class ScoringProcessor {
  static async processScoring(job: Job<ScoringJob>): Promise<void> {
    const { weekId, contestId, lineupIds } = job.data.data;
    
    console.log(`Processing scoring for week ${weekId}, contest ${contestId}`);
    
    try {
      // Get lineups to score
      const lineups = await this.getLineupsToScore(weekId, contestId, lineupIds);
      
      if (lineups.length === 0) {
        console.log('No lineups found to score');
        return;
      }

      let processed = 0;
      
      for (const lineup of lineups) {
        await job.updateProgress((processed / lineups.length) * 100);
        
        // Calculate lineup score
        const totalPoints = await this.calculateLineupScore(lineup);
        
        // Update lineup in database
        await supabase
          .from('lineups')
          .update({ total_points: totalPoints })
          .eq('id', lineup.id);
        
        processed++;
      }

      // Invalidate leaderboard cache
      await cacheService.invalidateLeaderboardCache();
      
      console.log(`Successfully scored ${processed} lineups`);
      await job.updateProgress(100);
    } catch (error) {
      console.error('Error processing scoring:', error);
      throw error;
    }
  }

  private static async getLineupsToScore(
    weekId: number, 
    contestId?: string, 
    lineupIds?: string[]
  ): Promise<any[]> {
    let query = supabase
      .from('lineups')
      .select('*')
      .eq('week_id', weekId);

    if (contestId) {
      // Add contest filter if needed
      query = query.eq('contest_id', contestId);
    }

    if (lineupIds && lineupIds.length > 0) {
      query = query.in('id', lineupIds);
    }

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch lineups: ${error.message}`);
    }

    return data || [];
  }

  private static async calculateLineupScore(lineup: any): Promise<number> {
    let totalPoints = 0;

    for (const nftId of lineup.nft_ids) {
      // Get NFT details
      const { data: nft } = await supabase
        .from('nfts')
        .select('player_name, sport')
        .eq('moment_id', nftId)
        .single();

      if (!nft) continue;

      // Get player stats for the week
      const weekStart = this.getWeekStartDate(lineup.week_id);
      const weekEnd = this.getWeekEndDate(lineup.week_id);
      
      const stats = await optimizedQueries.getPlayerStats(
        nft.player_name,
        weekStart,
        weekEnd
      );

      // Sum fantasy points for the week
      const playerPoints = stats.reduce((sum, stat) => sum + stat.fantasyPoints, 0);
      totalPoints += playerPoints;
    }

    return totalPoints;
  }

  private static getWeekStartDate(weekId: number): string {
    // Calculate week start date based on weekId
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const weekStart = new Date(startOfYear.getTime() + (weekId - 1) * 7 * 24 * 60 * 60 * 1000);
    return weekStart.toISOString().split('T')[0];
  }

  private static getWeekEndDate(weekId: number): string {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const weekEnd = new Date(startOfYear.getTime() + weekId * 7 * 24 * 60 * 60 * 1000 - 1);
    return weekEnd.toISOString().split('T')[0];
  }
}

// Reward distribution processor
export class RewardProcessor {
  static async processRewardDistribution(job: Job<RewardDistributionJob>): Promise<void> {
    const { contestId, weekId } = job.data.data;
    
    console.log(`Processing reward distribution for contest ${contestId}, week ${weekId}`);
    
    try {
      // Get contest details
      const contest = await optimizedQueries.getContestById(contestId);
      if (!contest) {
        throw new Error(`Contest ${contestId} not found`);
      }

      // Get final leaderboard
      const leaderboard = await optimizedQueries.getWeeklyLeaderboard(weekId);
      
      if (leaderboard.length === 0) {
        console.log('No participants found for reward distribution');
        return;
      }

      // Calculate rewards based on prize pool and ranking
      const rewards = this.calculateRewards(contest.prizePool, leaderboard);
      
      let distributed = 0;
      
      for (const reward of rewards) {
        await job.updateProgress((distributed / rewards.length) * 100);
        
        // Distribute reward (this would interact with smart contract)
        await this.distributeReward(reward);
        
        // Record transaction
        await supabase
          .from('treasury_transactions')
          .insert({
            transaction_type: 'reward_distribution',
            amount: reward.amount,
            user_address: reward.address,
            transaction_hash: reward.transactionHash,
          });
        
        distributed++;
      }

      // Mark contest as rewards distributed
      await supabase
        .from('contests')
        .update({ rewards_distributed: true })
        .eq('id', contestId);

      console.log(`Successfully distributed rewards to ${distributed} winners`);
      await job.updateProgress(100);
    } catch (error) {
      console.error('Error processing reward distribution:', error);
      throw error;
    }
  }

  private static calculateRewards(prizePool: number, leaderboard: any[]): any[] {
    const rewards = [];
    const totalParticipants = leaderboard.length;

    // Reward structure: 1st: 25%, 2nd: 15%, 3rd: 10%, Top 10%: 30% shared, Platform: 20%
    const availableForDistribution = prizePool * 0.8; // 80% for winners, 20% for platform

    if (totalParticipants >= 1) {
      rewards.push({
        address: leaderboard[0].users.wallet_address,
        rank: 1,
        amount: availableForDistribution * 0.25,
        type: 'first_place',
      });
    }

    if (totalParticipants >= 2) {
      rewards.push({
        address: leaderboard[1].users.wallet_address,
        rank: 2,
        amount: availableForDistribution * 0.15,
        type: 'second_place',
      });
    }

    if (totalParticipants >= 3) {
      rewards.push({
        address: leaderboard[2].users.wallet_address,
        rank: 3,
        amount: availableForDistribution * 0.10,
        type: 'third_place',
      });
    }

    // Top 10% share 30%
    const top10PercentCount = Math.max(1, Math.floor(totalParticipants * 0.1));
    const top10PercentReward = (availableForDistribution * 0.30) / top10PercentCount;

    for (let i = 3; i < Math.min(top10PercentCount + 3, totalParticipants); i++) {
      rewards.push({
        address: leaderboard[i].users.wallet_address,
        rank: i + 1,
        amount: top10PercentReward,
        type: 'top_10_percent',
      });
    }

    return rewards;
  }

  private static async distributeReward(reward: any): Promise<void> {
    // This would interact with the smart contract to distribute FLOW tokens
    // For now, simulate the transaction
    reward.transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Cache warmup processor
export class CacheProcessor {
  static async processCacheWarmup(job: Job<CacheWarmupJob>): Promise<void> {
    const { cacheType, addresses } = job.data.data;
    
    console.log(`Processing cache warmup for ${cacheType}`);
    
    try {
      switch (cacheType) {
        case 'nfts':
          await this.warmupNFTCache(addresses);
          break;
        case 'marketplace':
          await this.warmupMarketplaceCache();
          break;
        case 'leaderboard':
          await this.warmupLeaderboardCache();
          break;
        case 'all':
          await this.warmupNFTCache(addresses);
          await this.warmupMarketplaceCache();
          await this.warmupLeaderboardCache();
          break;
      }

      console.log(`Cache warmup completed for ${cacheType}`);
      await job.updateProgress(100);
    } catch (error) {
      console.error('Error processing cache warmup:', error);
      throw error;
    }
  }

  private static async warmupNFTCache(addresses?: string[]): Promise<void> {
    if (addresses) {
      for (const address of addresses) {
        await optimizedQueries.getUserNFTs(address);
      }
    }
  }

  private static async warmupMarketplaceCache(): Promise<void> {
    await optimizedQueries.getMarketplaceListings();
  }

  private static async warmupLeaderboardCache(): Promise<void> {
    await optimizedQueries.getSeasonLeaderboard();
    
    // Warmup recent weekly leaderboards
    const currentWeek = Math.ceil(Date.now() / (7 * 24 * 60 * 60 * 1000));
    for (let i = 0; i < 4; i++) {
      await optimizedQueries.getWeeklyLeaderboard(currentWeek - i);
    }
  }
}

// Database cleanup processor
export class CleanupProcessor {
  static async processDatabaseCleanup(job: Job<DatabaseCleanupJob>): Promise<void> {
    const { tables, olderThan } = job.data.data;
    
    console.log(`Processing database cleanup for tables: ${tables.join(', ')}`);
    
    try {
      let totalCleaned = 0;
      
      for (const table of tables) {
        const cleaned = await this.cleanupTable(table, olderThan);
        totalCleaned += cleaned;
        
        await job.updateProgress((tables.indexOf(table) + 1) / tables.length * 100);
      }

      console.log(`Database cleanup completed. Cleaned ${totalCleaned} records`);
    } catch (error) {
      console.error('Error processing database cleanup:', error);
      throw error;
    }
  }

  private static async cleanupTable(table: string, olderThan: string): Promise<number> {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .lt('created_at', olderThan);

    if (error) {
      console.error(`Error cleaning up table ${table}:`, error);
      return 0;
    }

    return data?.length || 0;
  }
}

// Worker configuration
const workerConfig = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  concurrency: 5,
  removeOnComplete: 100,
  removeOnFail: 50,
};

// Create workers
export const statsWorker = new Worker(
  'stats-processing',
  async (job: Job<StatsUpdateJob>) => {
    await StatsProcessor.processStatsUpdate(job);
  },
  workerConfig
);

export const scoringWorker = new Worker(
  'scoring-processing',
  async (job: Job<ScoringJob>) => {
    await ScoringProcessor.processScoring(job);
  },
  workerConfig
);

export const rewardsWorker = new Worker(
  'rewards-processing',
  async (job: Job<RewardDistributionJob>) => {
    await RewardProcessor.processRewardDistribution(job);
  },
  workerConfig
);

export const maintenanceWorker = new Worker(
  'maintenance',
  async (job: Job<CacheWarmupJob | DatabaseCleanupJob>) => {
    if (job.data.type === 'cache_warmup') {
      await CacheProcessor.processCacheWarmup(job as Job<CacheWarmupJob>);
    } else if (job.data.type === 'database_cleanup') {
      await CleanupProcessor.processDatabaseCleanup(job as Job<DatabaseCleanupJob>);
    }
  },
  workerConfig
);

// Worker event handlers
const setupWorkerEvents = (worker: Worker, name: string) => {
  worker.on('completed', (job) => {
    console.log(`${name} job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`${name} job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    console.error(`${name} worker error:`, err);
  });
};

// Setup event handlers
setupWorkerEvents(statsWorker, 'Stats');
setupWorkerEvents(scoringWorker, 'Scoring');
setupWorkerEvents(rewardsWorker, 'Rewards');
setupWorkerEvents(maintenanceWorker, 'Maintenance');

// Graceful shutdown for workers
export const shutdownWorkers = async (): Promise<void> => {
  console.log('Shutting down workers...');
  
  const workers = [statsWorker, scoringWorker, rewardsWorker, maintenanceWorker];
  
  await Promise.all(workers.map(worker => worker.close()));
  
  console.log('Workers shut down successfully');
};