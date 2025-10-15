#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { cacheService } from './cache-service';
import { redisCache } from './redis-client';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Check if required environment variables are available
function checkEnvironment(): boolean {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
    console.warn('Running in mock mode - only Redis cache will be tested');
    return false;
  }
  
  console.log('✓ Environment variables loaded successfully');
  return true;
}

async function warmupCacheBasic() {
  console.log('Starting basic cache warmup (Redis only)...');
  
  try {
    // Connect to Redis
    await redisCache.connect();
    console.log('✓ Connected to Redis');

    // Test basic cache operations
    const testKey = 'warmup:test';
    const testData = { timestamp: Date.now(), message: 'Cache warmup test' };
    
    await cacheService.set(testKey, testData);
    const retrieved = await cacheService.get(testKey);
    
    if (retrieved && retrieved.timestamp === testData.timestamp) {
      console.log('✓ Basic cache operations working');
    } else {
      throw new Error('Cache test failed');
    }
    
    // Clean up test data
    await cacheService.del(testKey);
    
    console.log('✓ Basic cache warmup completed successfully');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠ Redis server is not running');
      console.log('');
      console.log('🔧 To start Redis:');
      console.log('Option 1 - Docker: docker run -d -p 6379:6379 --name redis redis:alpine');
      console.log('Option 2 - Local: redis-server (if installed)');
      console.log('Option 3 - Ubuntu: sudo apt install redis-server && sudo systemctl start redis');
      console.log('Option 4 - macOS: brew install redis && brew services start redis');
      console.log('');
      console.log('Then run: pnpm test:redis to verify connection');
      return;
    }
    console.error('Failed to warmup basic cache:', error);
    throw error;
  }
}

async function warmupCacheFull() {
  console.log('Starting full cache warmup...');
  
  try {
    // Import optimized queries only when we have database access
    const { optimizedQueries } = await import('@/lib/database/optimized-queries');
    
    // Connect to Redis
    await redisCache.connect();
    console.log('✓ Connected to Redis');

    // Warmup marketplace listings
    console.log('Warming up marketplace cache...');
    try {
      await optimizedQueries.getMarketplaceListings();
      console.log('✓ Marketplace cache warmed up');
    } catch (error) {
      console.warn('⚠ Marketplace cache warmup failed:', error.message);
    }
    
    // Warmup active contests
    console.log('Warming up contests cache...');
    try {
      await optimizedQueries.getActiveContests();
      console.log('✓ Contests cache warmed up');
    } catch (error) {
      console.warn('⚠ Contests cache warmup failed:', error.message);
    }
    
    // Warmup leaderboards
    console.log('Warming up leaderboard cache...');
    try {
      await optimizedQueries.getSeasonLeaderboard();
      console.log('✓ Season leaderboard cache warmed up');
      
      // Warmup recent weekly leaderboards
      const currentWeek = Math.ceil(Date.now() / (7 * 24 * 60 * 60 * 1000));
      for (let i = 0; i < 4; i++) {
        await optimizedQueries.getWeeklyLeaderboard(currentWeek - i);
      }
      console.log('✓ Weekly leaderboards cache warmed up');
    } catch (error) {
      console.warn('⚠ Leaderboard cache warmup failed:', error.message);
    }

    // Warmup treasury status
    console.log('Warming up treasury cache...');
    try {
      await optimizedQueries.getTreasuryStatus();
      console.log('✓ Treasury cache warmed up');
    } catch (error) {
      console.warn('⚠ Treasury cache warmup failed:', error.message);
    }

    console.log('✓ Full cache warmup completed');
    
  } catch (error) {
    console.error('Failed to warmup full cache:', error);
    throw error;
  }
}

async function warmupCache() {
  const hasDatabase = checkEnvironment();
  
  try {
    if (hasDatabase) {
      await warmupCacheFull();
    } else {
      await warmupCacheBasic();
    }
    
    if (redisCache.isHealthy()) {
      console.log('🚀 Cache warmup process completed successfully!');
    } else {
      console.log('⚠ Cache warmup completed with warnings (Redis not available)');
      console.log('The application will work without Redis, but performance may be reduced.');
    }
    
  } catch (error) {
    // Don't exit with error if it's just Redis connection issues
    if (error.code === 'ECONNREFUSED') {
      console.log('ℹ Cache warmup skipped - Redis not available');
      console.log('This is normal for development without Redis setup.');
    } else {
      console.error('❌ Cache warmup failed:', error);
      process.exit(1);
    }
  } finally {
    try {
      if (redisCache.isHealthy()) {
        await redisCache.disconnect();
        console.log('✓ Disconnected from Redis');
      }
    } catch (error) {
      // Ignore disconnect errors
    }
  }
}

// Warmup cache if this script is run directly
if (require.main === module) {
  warmupCache();
}

export { warmupCache };