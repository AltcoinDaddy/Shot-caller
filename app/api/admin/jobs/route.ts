import { NextRequest, NextResponse } from 'next/server';
import { JobScheduler, JobMonitor } from '@/lib/jobs/job-queue';
import { 
  statsQueue, 
  scoringQueue, 
  rewardsQueue, 
  maintenanceQueue 
} from '@/lib/jobs/job-queue';

// GET /api/admin/jobs - Get job queue statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const queue = searchParams.get('queue');

    switch (action) {
      case 'stats':
        const stats = await JobMonitor.getQueueStats();
        return NextResponse.json({ success: true, data: stats });

      case 'failed':
        if (!queue) {
          return NextResponse.json(
            { success: false, error: 'Queue parameter required for failed jobs' },
            { status: 400 }
          );
        }
        const failedJobs = await JobMonitor.getFailedJobs(queue);
        return NextResponse.json({ success: true, data: failedJobs });

      default:
        const allStats = await JobMonitor.getQueueStats();
        return NextResponse.json({ success: true, data: allStats });
    }
  } catch (error) {
    console.error('Error fetching job stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job statistics' },
      { status: 500 }
    );
  }
}

// POST /api/admin/jobs - Manage jobs (schedule, retry, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, queue, data } = body;

    switch (action) {
      case 'schedule_stats_update':
        await statsQueue.add('manual-stats-update', {
          type: 'stats_update',
          data: {
            sport: data.sport,
            date: data.date || new Date().toISOString().split('T')[0],
            players: data.players,
          },
        });
        return NextResponse.json({ success: true, message: 'Stats update job scheduled' });

      case 'schedule_scoring':
        await scoringQueue.add('manual-scoring', {
          type: 'scoring_calculation',
          data: {
            weekId: data.weekId,
            contestId: data.contestId,
            lineupIds: data.lineupIds,
          },
        });
        return NextResponse.json({ success: true, message: 'Scoring job scheduled' });

      case 'schedule_reward_distribution':
        await rewardsQueue.add('manual-reward-distribution', {
          type: 'reward_distribution',
          data: {
            contestId: data.contestId,
            weekId: data.weekId,
            winners: data.winners || [],
          },
        });
        return NextResponse.json({ success: true, message: 'Reward distribution job scheduled' });

      case 'schedule_cache_warmup':
        await maintenanceQueue.add('manual-cache-warmup', {
          type: 'cache_warmup',
          data: {
            cacheType: data.cacheType || 'all',
            addresses: data.addresses,
          },
        });
        return NextResponse.json({ success: true, message: 'Cache warmup job scheduled' });

      case 'retry_failed':
        if (!queue) {
          return NextResponse.json(
            { success: false, error: 'Queue parameter required' },
            { status: 400 }
          );
        }
        const retriedCount = await JobMonitor.retryFailedJobs(queue);
        return NextResponse.json({ 
          success: true, 
          message: `Retried ${retriedCount} failed jobs` 
        });

      case 'initialize_scheduled_jobs':
        await JobScheduler.initializeScheduledJobs();
        return NextResponse.json({ success: true, message: 'Scheduled jobs initialized' });

      case 'clear_scheduled_jobs':
        await JobScheduler.clearAllScheduledJobs();
        return NextResponse.json({ success: true, message: 'Scheduled jobs cleared' });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage jobs' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/jobs - Clear job queues
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queue = searchParams.get('queue');

    if (!queue) {
      return NextResponse.json(
        { success: false, error: 'Queue parameter required' },
        { status: 400 }
      );
    }

    let targetQueue;
    switch (queue) {
      case 'stats':
        targetQueue = statsQueue;
        break;
      case 'scoring':
        targetQueue = scoringQueue;
        break;
      case 'rewards':
        targetQueue = rewardsQueue;
        break;
      case 'maintenance':
        targetQueue = maintenanceQueue;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid queue name' },
          { status: 400 }
        );
    }

    await targetQueue.obliterate({ force: true });
    
    return NextResponse.json({ 
      success: true, 
      message: `Queue ${queue} cleared successfully` 
    });
  } catch (error) {
    console.error('Error clearing queue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear queue' },
      { status: 500 }
    );
  }
}