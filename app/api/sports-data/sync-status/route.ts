import { NextRequest, NextResponse } from 'next/server';
import { sportsDataIntegration } from '@/lib/services/sports-data-integration';

export async function GET(request: NextRequest) {
  try {
    // Ensure the integration is initialized
    const initialized = await sportsDataIntegration.initialize();
    if (!initialized) {
      return NextResponse.json(
        { error: 'Sports data integration failed to initialize' },
        { status: 500 }
      );
    }

    const activeJobs = sportsDataIntegration.getActiveSyncJobs();
    const cacheStats = sportsDataIntegration.getCacheStats();

    return NextResponse.json({
      success: true,
      activeJobs: activeJobs.length,
      jobs: activeJobs,
      cache: cacheStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clearCache = searchParams.get('clearCache') === 'true';

    if (clearCache) {
      sportsDataIntegration.clearCache();
      
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    }

    return NextResponse.json(
      { error: 'No action specified' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}