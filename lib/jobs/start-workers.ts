#!/usr/bin/env tsx

import { 
  statsWorker, 
  scoringWorker, 
  rewardsWorker, 
  maintenanceWorker,
  shutdownWorkers 
} from './job-processors';
import { redisCache } from '@/lib/cache/redis-client';

async function startWorkers() {
  console.log('Starting ShotCaller job workers...');

  try {
    // Connect to Redis
    await redisCache.connect();
    console.log('Connected to Redis');

    // Workers are already created and listening in job-processors.ts
    console.log('Job workers started successfully:');
    console.log('- Stats processing worker');
    console.log('- Scoring calculation worker');
    console.log('- Rewards distribution worker');
    console.log('- Maintenance worker');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      await shutdownWorkers();
      await redisCache.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      await shutdownWorkers();
      await redisCache.disconnect();
      process.exit(0);
    });

    // Keep the process alive
    console.log('Workers are running. Press Ctrl+C to stop.');
    
  } catch (error) {
    console.error('Failed to start workers:', error);
    process.exit(1);
  }
}

// Start workers if this script is run directly
if (require.main === module) {
  startWorkers();
}

export { startWorkers };