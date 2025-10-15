// API route for marketplace statistics

import { NextRequest, NextResponse } from 'next/server';
import { marketplaceService } from '@/lib/services/marketplace-service';

export async function GET(request: NextRequest) {
  try {
    const result = await marketplaceService.getMarketplaceStats();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}