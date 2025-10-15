#!/usr/bin/env tsx

import { JobScheduler } from './job-queue';
import { redisCache } from '@/lib/cache/redis-client';

async function scheduleJobs() {
  console.log('Scheduling ShotCaller background jobs...');

  try {
    // Connect to Redis
    await redisCache.connect();
    console.log('Connected to Redis');

    // Initialize all scheduled jobs
    await JobScheduler.initializeScheduledJobs();
    
    console.log('Successfully scheduled all background jobs:');
    console.log('- Daily NBA stats update (6 AM EST)');
    console.log('- Daily NFL stats update (7 AM EST)');
    console.log('- Weekly scoring calculation (2 AM Tuesday)');
    console.log('- Daily cache warmup (4 AM EST)');
    console.log('- Weekly database cleanup (3 AM Sunday)');

    await redisCache.disconnect();
    console.log('Job scheduling completed');
    
  } catch (error) {
    console.error('Failed to schedule jobs:', error);
    process.exit(1);
  }
}

// Schedule jobs if this script is run directly
if (require.main === module) {
  scheduleJobs();
}

export { scheduleJobs };