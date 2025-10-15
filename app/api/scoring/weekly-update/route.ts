import { NextRequest, NextResponse } from 'next/server';
import { weeklyScoringService } from '@/lib/services/weekly-scoring-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekId, targetDate, force = false } = body;

    if (!weekId || typeof weekId !== 'number') {
      return NextResponse.json(
        { error: 'Week ID is required and must be a number' },
        { status: 400 }
      );
    }

    const date = targetDate ? new Date(targetDate) : new Date();

    // Check if there's already an active job for this week
    const activeJobs = weeklyScoringService.getActiveJobs();
    const existingJob = activeJobs.find(job => job.weekId === weekId && job.status === 'running');

    if (existingJob && !force) {
      return NextResponse.json(
        { 
          error: 'Weekly scoring job already running for this week',
          jobId: existingJob.id,
          status: existingJob.status
        },
        { status: 409 }
      );
    }

    // Start weekly scoring process
    const job = force 
      ? await weeklyScoringService.recalculateWeeklyScores(weekId, date)
      : await weeklyScoringService.processWeeklyScoring(weekId, date);

    return NextResponse.json({
      success: true,
      message: `Weekly scoring ${force ? 'recalculation' : 'update'} completed for week ${weekId}`,
      job: {
        id: job.id,
        weekId: job.weekId,
        status: job.status,
        lineupCount: job.lineupCount,
        processedCount: job.processedCount,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error
      }
    });

  } catch (error) {
    console.error('Error in weekly scoring update:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process weekly scoring update',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Get specific job status
      const job = weeklyScoringService.getJobStatus(jobId);
      
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        job
      });
    } else {
      // Get all active jobs
      const activeJobs = weeklyScoringService.getActiveJobs();
      
      return NextResponse.json({
        success: true,
        activeJobs,
        count: activeJobs.length
      });
    }

  } catch (error) {
    console.error('Error getting weekly scoring status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get weekly scoring status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}