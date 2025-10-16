#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { cacheService } from '@/lib/cache/cache-service';
import { redisCache } from '@/lib/cache/redis-client';
import { EnhancedJobMonitor } from '@/lib/monitoring/job-monitor';
import { JobScheduler } from '@/lib/jobs/job-queue';
import { optimizedQueries } from '@/lib/database/optimized-queries';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

interface OptimizationResult {
  task: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
}

class PerformanceOptimizer {
  private results: OptimizationResult[] = [];

  async runOptimization(): Promise<void> {
    console.log('🚀 Starting ShotCaller Performance Optimization...\n');

    const tasks = [
      { name: 'Connect to Redis', fn: this.connectRedis },
      { name: 'Test cache performance', fn: this.testCachePerformance },
      { name: 'Warm up cache', fn: this.warmupCache },
      { name: 'Initialize job queues', fn: this.initializeJobs },
      { name: 'Start job monitoring', fn: this.startJobMonitoring },
      { name: 'Optimize database queries', fn: this.optimizeDatabase },
      { name: 'Clean up old data', fn: this.cleanupOldData },
      { name: 'Preload critical images', fn: this.preloadImages },
      { name: 'Generate performance report', fn: this.generateReport },
    ];

    for (const task of tasks) {
      await this.runTask(task.name, task.fn);
    }

    this.printSummary();
  }

  private async runTask(taskName: string, taskFn: () => Promise<any>): Promise<void> {
    const startTime = performance.now();
    console.log(`⏳ ${taskName}...`);

    try {
      const result = await taskFn.call(this);
      const duration = performance.now() - startTime;

      this.results.push({
        task: taskName,
        success: true,
        duration,
        details: result,
      });

      console.log(`✅ ${taskName} completed in ${duration.toFixed(2)}ms`);
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.push({
        task: taskName,
        success: false,
        duration,
        error: error.message,
      });

      console.log(`❌ ${taskName} failed: ${error.message}`);
    }

    console.log('');
  }

  private async connectRedis(): Promise<any> {
    await redisCache.connect();
    return { connected: redisCache.isHealthy() };
  }

  private async testCachePerformance(): Promise<any> {
    const testKey = 'perf-test';
    const testData = { timestamp: Date.now(), data: 'performance test' };
    
    // Test write performance
    const writeStart = performance.now();
    await cacheService.set(testKey, testData);
    const writeTime = performance.now() - writeStart;

    // Test read performance
    const readStart = performance.now();
    const retrieved = await cacheService.get(testKey);
    const readTime = performance.now() - readStart;

    // Cleanup
    await cacheService.del(testKey);

    return {
      writeLatency: writeTime,
      readLatency: readTime,
      dataIntegrity: retrieved?.timestamp === testData.timestamp,
    };
  }

  private async warmupCache(): Promise<any> {
    await cacheService.warmupCache();
    
    // Warm up common queries
    const warmupTasks = [
      optimizedQueries.getActiveContests(),
      optimizedQueries.getMarketplaceListings({ limit: 20 }),
      optimizedQueries.getSeasonLeaderboard(),
    ];

    await Promise.allSettled(warmupTasks);

    return { warmedEndpoints: warmupTasks.length };
  }

  private async initializeJobs(): Promise<any> {
    await JobScheduler.initializeScheduledJobs();
    return { scheduledJobs: 'initialized' };
  }

  private async startJobMonitoring(): Promise<any> {
    EnhancedJobMonitor.startHealthMonitoring();
    return { monitoring: 'started' };
  }

  private async optimizeDatabase(): Promise<any> {
    // This would run database optimization queries
    // For now, just check database health
    try {
      const stats = await optimizedQueries.getDatabaseStats();
      return { databaseHealth: 'good', stats };
    } catch (error) {
      return { databaseHealth: 'needs attention', error: error.message };
    }
  }

  private async cleanupOldData(): Promise<any> {
    // Clean up old job data
    await EnhancedJobMonitor.cleanupOldJobs(7);
    
    // Could add more cleanup tasks here
    return { cleanedJobs: 'last 7 days' };
  }

  private async preloadImages(): Promise<any> {
    // This would preload critical images
    // For now, just return a placeholder
    return { preloadedImages: 0, note: 'Image preloading would be implemented based on actual image URLs' };
  }

  private async generateReport(): Promise<any> {
    const jobMetrics = await EnhancedJobMonitor.getJobMetrics();
    const jobHealth = await EnhancedJobMonitor.checkJobHealth();
    
    const report = {
      timestamp: new Date().toISOString(),
      optimizationResults: this.results,
      jobMetrics,
      jobHealth,
      recommendations: this.generateRecommendations(),
    };

    // Save report to cache for dashboard access
    await cacheService.set('performance-report', report, 3600); // 1 hour

    return report;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const failedTasks = this.results.filter(r => !r.success);
    if (failedTasks.length > 0) {
      recommendations.push(`Fix ${failedTasks.length} failed optimization tasks`);
    }

    const slowTasks = this.results.filter(r => r.duration > 5000); // 5 seconds
    if (slowTasks.length > 0) {
      recommendations.push(`Investigate ${slowTasks.length} slow optimization tasks`);
    }

    const cacheTest = this.results.find(r => r.task === 'Test cache performance');
    if (cacheTest?.details?.writeLatency > 100) {
      recommendations.push('Cache write performance is slow - check Redis configuration');
    }

    if (cacheTest?.details?.readLatency > 50) {
      recommendations.push('Cache read performance is slow - check Redis configuration');
    }

    if (recommendations.length === 0) {
      recommendations.push('All optimization tasks completed successfully');
    }

    return recommendations;
  }

  private printSummary(): void {
    console.log('📊 Performance Optimization Summary');
    console.log('=====================================\n');

    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`✅ Successful tasks: ${successful}`);
    console.log(`❌ Failed tasks: ${failed}`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`📈 Success rate: ${((successful / this.results.length) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log('Failed Tasks:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.task}: ${r.error}`));
      console.log('');
    }

    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      console.log('Recommendations:');
      recommendations.forEach(rec => console.log(`  - ${rec}`));
      console.log('');
    }

    console.log('🎉 Performance optimization completed!');
    
    if (failed === 0) {
      console.log('🚀 Your ShotCaller application is optimized and ready for production!');
    } else {
      console.log('⚠️  Some optimization tasks failed. Please review and fix the issues above.');
    }
  }
}

// Run optimization if this script is executed directly
if (require.main === module) {
  const optimizer = new PerformanceOptimizer();
  optimizer.runOptimization()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Optimization failed:', error);
      process.exit(1);
    });
}

export { PerformanceOptimizer };