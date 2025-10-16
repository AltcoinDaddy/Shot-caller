import { NextRequest, NextResponse } from 'next/server';
import { EnhancedJobMonitor } from '@/lib/monitoring/job-monitor';
import { cacheService } from '@/lib/cache/cache-service';
import { optimizedQueries } from '@/lib/database/optimized-queries';
import { redisCache } from '@/lib/cache/redis-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');
    const queue = searchParams.get('queue');
    const hours = parseInt(searchParams.get('hours') || '24');

    switch (metric) {
      case 'jobs':
        return NextResponse.json(await EnhancedJobMonitor.getJobMetrics());

      case 'health':
        return NextResponse.json(await EnhancedJobMonitor.checkJobHealth());

      case 'analytics':
        if (!queue) {
          return NextResponse.json({ error: 'Queue parameter required' }, { status: 400 });
        }
        return NextResponse.json(
          await EnhancedJobMonitor.getPerformanceAnalytics(queue, hours)
        );

      case 'logs':
        if (!queue) {
          return NextResponse.json({ error: 'Queue parameter required' }, { status: 400 });
        }
        const limit = parseInt(searchParams.get('limit') || '50');
        return NextResponse.json(
          await EnhancedJobMonitor.getJobLogs(queue, limit)
        );

      case 'cache':
        return NextResponse.json(await getCacheMetrics());

      case 'database':
        return NextResponse.json(await getDatabaseMetrics());

      case 'system':
        return NextResponse.json(await getSystemMetrics());

      case 'prometheus':
        const prometheusMetrics = await EnhancedJobMonitor.exportMetrics();
        return new NextResponse(prometheusMetrics, {
          headers: {
            'Content-Type': 'text/plain',
          },
        });

      default:
        return NextResponse.json(await getOverallPerformance());
    }
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, queue, jobId } = await request.json();

    switch (action) {
      case 'retry_failed':
        if (!queue) {
          return NextResponse.json({ error: 'Queue parameter required' }, { status: 400 });
        }
        const retried = await EnhancedJobMonitor.retryFailedJobs(queue);
        return NextResponse.json({ retried });

      case 'cleanup_jobs':
        const days = parseInt(request.headers.get('days') || '7');
        await EnhancedJobMonitor.cleanupOldJobs(days);
        return NextResponse.json({ success: true });

      case 'clear_cache':
        await cacheService.clearAllCache();
        return NextResponse.json({ success: true });

      case 'warmup_cache':
        await cacheService.warmupCache();
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}

async function getCacheMetrics() {
  const isHealthy = cacheService.isHealthy();
  
  if (!isHealthy) {
    return {
      healthy: false,
      error: 'Redis not connected',
    };
  }

  // Test cache performance
  const testKey = 'perf-test';
  const testData = { timestamp: Date.now() };
  
  const writeStart = performance.now();
  await cacheService.set(testKey, testData);
  const writeTime = performance.now() - writeStart;

  const readStart = performance.now();
  await cacheService.get(testKey);
  const readTime = performance.now() - readStart;

  await cacheService.del(testKey);

  return {
    healthy: true,
    writeLatency: writeTime,
    readLatency: readTime,
    connected: redisCache.isHealthy(),
  };
}

async function getDatabaseMetrics() {
  try {
    const stats = await optimizedQueries.getDatabaseStats();
    const slowQueries = await optimizedQueries.getSlowQueries(5);

    return {
      healthy: true,
      stats,
      slowQueries,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
}

async function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

async function getOverallPerformance() {
  const [jobMetrics, jobHealth, cacheMetrics, systemMetrics] = await Promise.all([
    EnhancedJobMonitor.getJobMetrics(),
    EnhancedJobMonitor.checkJobHealth(),
    getCacheMetrics(),
    getSystemMetrics(),
  ]);

  return {
    timestamp: new Date().toISOString(),
    jobs: {
      metrics: jobMetrics,
      health: jobHealth,
    },
    cache: cacheMetrics,
    system: systemMetrics,
    overall: {
      healthy: jobHealth.isHealthy && cacheMetrics.healthy,
      issues: jobHealth.issues,
      recommendations: jobHealth.recommendations,
    },
  };
}