import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor';
import { cacheService } from '@/lib/cache/cache-service';

// GET /api/admin/performance - Get performance metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const timeRange = parseInt(searchParams.get('timeRange') || '3600000'); // Default 1 hour

    switch (action) {
      case 'summary':
        const summary = PerformanceMonitor.getPerformanceSummary(timeRange);
        return NextResponse.json({ success: true, data: summary });

      case 'health':
        const health = PerformanceMonitor.getHealthStatus();
        return NextResponse.json({ success: true, data: health });

      case 'cache-status':
        const cacheStatus = {
          isHealthy: cacheService.isHealthy(),
          timestamp: Date.now(),
        };
        return NextResponse.json({ success: true, data: cacheStatus });

      default:
        const defaultSummary = PerformanceMonitor.getPerformanceSummary(timeRange);
        return NextResponse.json({ success: true, data: defaultSummary });
    }
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

// POST /api/admin/performance - Record custom metrics or manage monitoring
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'record_metric':
        PerformanceMonitor.recordMetric(data.name, data.value, data.tags);
        return NextResponse.json({ success: true, message: 'Metric recorded' });

      case 'clear_metrics':
        PerformanceMonitor.clearAllMetrics();
        return NextResponse.json({ success: true, message: 'All metrics cleared' });

      case 'warmup_cache':
        await cacheService.warmupCache();
        return NextResponse.json({ success: true, message: 'Cache warmup initiated' });

      case 'clear_cache':
        await cacheService.clearAllCache();
        return NextResponse.json({ success: true, message: 'Cache cleared' });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing performance monitoring:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage performance monitoring' },
      { status: 500 }
    );
  }
}