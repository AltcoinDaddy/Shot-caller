import { Queue, Worker, Job } from 'bullmq';
import { redisCache } from '@/lib/cache/redis-client';

// Job types
export interface StatsUpdateJob {
  type: 'stats_update';
  data: {
    sport: 'NBA' | 'NFL';
    date: string;
    players?: string[];
  };
}

export interface ScoringJob {
  type: 'scoring_calculation';
  data: {
    weekId: number;
    contestId?: string;
    lineupIds?: string[];
  };
}

export interface RewardDistributionJob {
  type: 'reward_distribution';
  data: {
    contestId: string;
    weekId: number;
    winners: Array<{
      address: string;
      rank: number;
      points: number;
      reward: number;
    }>;
  };
}

export interface CacheWarmupJob {
  type: 'cache_warmup';
  data: {
    cacheType: 'nfts' | 'marketplace' | 'leaderboard' | 'all';
    addresses?: string[];
  };
}

export interface DatabaseCleanupJob {
  type: 'database_cleanup';
  data: {
    tables: string[];
    olderThan: string; // ISO date string
  };
}

export type JobData = StatsUpdateJob | ScoringJob | RewardDistributionJob | CacheWarmupJob | DatabaseCleanupJob;

// Job queue configuration
const queueConfig = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Create job queues
export const statsQueue = new Queue('stats-processing', queueConfig);
export const scoringQueue = new Queue('scoring-processing', queueConfig);
export const rewardsQueue = new Queue('rewards-processing', queueConfig);
export const maintenanceQueue = new Queue('maintenance', queueConfig);

// Job scheduling utilities
export class JobScheduler {
  // Schedule daily stats updates
  static async scheduleDailyStatsUpdate(): Promise<void> {
    // NBA stats update (during season: Oct-Jun)
    await statsQueue.add(
      'daily-nba-stats',
      {
        type: 'stats_update',
        data: {
          sport: 'NBA',
          date: new Date().toISOString().split('T')[0],
        },
      } as StatsUpdateJob,
      {
        repeat: {
          pattern: '0 6 * * *', // 6 AM daily
          tz: 'America/New_York',
        },
        jobId: 'daily-nba-stats',
      }
    );

    // NFL stats update (during season: Sep-Feb)
    await statsQueue.add(
      'daily-nfl-stats',
      {
        type: 'stats_update',
        data: {
          sport: 'NFL',
          date: new Date().toISOString().split('T')[0],
        },
      } as StatsUpdateJob,
      {
        repeat: {
          pattern: '0 7 * * *', // 7 AM daily
          tz: 'America/New_York',
        },
        jobId: 'daily-nfl-stats',
      }
    );
  }

  // Schedule weekly scoring calculations
  static async scheduleWeeklyScoring(): Promise<void> {
    await scoringQueue.add(
      'weekly-scoring',
      {
        type: 'scoring_calculation',
        data: {
          weekId: this.getCurrentWeekId(),
        },
      } as ScoringJob,
      {
        repeat: {
          pattern: '0 2 * * 2', // 2 AM every Tuesday
          tz: 'America/New_York',
        },
        jobId: 'weekly-scoring',
      }
    );
  }

  // Schedule reward distribution
  static async scheduleRewardDistribution(contestId: string, weekId: number): Promise<void> {
    await rewardsQueue.add(
      `reward-distribution-${contestId}`,
      {
        type: 'reward_distribution',
        data: {
          contestId,
          weekId,
          winners: [], // Will be populated by the job processor
        },
      } as RewardDistributionJob,
      {
        delay: 1000 * 60 * 60, // 1 hour delay after contest ends
      }
    );
  }

  // Schedule cache warmup
  static async scheduleCacheWarmup(): Promise<void> {
    await maintenanceQueue.add(
      'cache-warmup',
      {
        type: 'cache_warmup',
        data: {
          cacheType: 'all',
        },
      } as CacheWarmupJob,
      {
        repeat: {
          pattern: '0 4 * * *', // 4 AM daily
          tz: 'America/New_York',
        },
        jobId: 'daily-cache-warmup',
      }
    );
  }

  // Schedule database cleanup
  static async scheduleDatabaseCleanup(): Promise<void> {
    await maintenanceQueue.add(
      'database-cleanup',
      {
        type: 'database_cleanup',
        data: {
          tables: ['player_stats', 'treasury_transactions', 'marketplace_listings'],
          olderThan: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
        },
      } as DatabaseCleanupJob,
      {
        repeat: {
          pattern: '0 3 * * 0', // 3 AM every Sunday
          tz: 'America/New_York',
        },
        jobId: 'weekly-database-cleanup',
      }
    );
  }

  // Utility methods
  private static getCurrentWeekId(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil(dayOfYear / 7);
  }

  // Initialize all scheduled jobs
  static async initializeScheduledJobs(): Promise<void> {
    try {
      await this.scheduleDailyStatsUpdate();
      await this.scheduleWeeklyScoring();
      await this.scheduleCacheWarmup();
      await this.scheduleDatabaseCleanup();
      console.log('All scheduled jobs initialized successfully');
    } catch (error) {
      console.error('Failed to initialize scheduled jobs:', error);
    }
  }

  // Clear all scheduled jobs (useful for development/testing)
  static async clearAllScheduledJobs(): Promise<void> {
    const queues = [statsQueue, scoringQueue, rewardsQueue, maintenanceQueue];
    
    for (const queue of queues) {
      const repeatableJobs = await queue.getRepeatableJobs();
      for (const job of repeatableJobs) {
        await queue.removeRepeatableByKey(job.key);
      }
    }
    
    console.log('All scheduled jobs cleared');
  }
}

// Job monitoring and metrics
export class JobMonitor {
  static async getQueueStats() {
    const queues = [
      { name: 'stats', queue: statsQueue },
      { name: 'scoring', queue: scoringQueue },
      { name: 'rewards', queue: rewardsQueue },
      { name: 'maintenance', queue: maintenanceQueue },
    ];

    const stats = {};

    for (const { name, queue } of queues) {
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();

      stats[name] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length,
      };
    }

    return stats;
  }

  static async getFailedJobs(queueName: string, limit: number = 10) {
    const queue = this.getQueueByName(queueName);
    if (!queue) return [];

    const failed = await queue.getFailed(0, limit - 1);
    return failed.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      attemptsMade: job.attemptsMade,
    }));
  }

  static async retryFailedJobs(queueName: string): Promise<number> {
    const queue = this.getQueueByName(queueName);
    if (!queue) return 0;

    const failed = await queue.getFailed();
    let retried = 0;

    for (const job of failed) {
      await job.retry();
      retried++;
    }

    return retried;
  }

  private static getQueueByName(name: string): Queue | null {
    switch (name) {
      case 'stats': return statsQueue;
      case 'scoring': return scoringQueue;
      case 'rewards': return rewardsQueue;
      case 'maintenance': return maintenanceQueue;
      default: return null;
    }
  }
}

// Graceful shutdown
export const gracefulShutdown = async (): Promise<void> => {
  console.log('Shutting down job queues...');
  
  const queues = [statsQueue, scoringQueue, rewardsQueue, maintenanceQueue];
  
  await Promise.all(queues.map(queue => queue.close()));
  
  console.log('Job queues shut down successfully');
};