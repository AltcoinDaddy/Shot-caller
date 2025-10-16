import { NextRequest, NextResponse } from 'next/server';
import { productionMonitor } from '@/lib/monitoring/production-monitor';

export async function GET(request: NextRequest) {
  try {
    // In production, you'd want to add authentication here
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get monitoring metrics
    const metrics = productionMonitor.getMetrics();
    
    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
          platform: process.platform,
        },
      },
    });
  } catch (error) {
    productionMonitor.logError('Failed to get monitoring metrics', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { error: 'Failed to get monitoring metrics' },
      { status: 500 }
    );
  }
}