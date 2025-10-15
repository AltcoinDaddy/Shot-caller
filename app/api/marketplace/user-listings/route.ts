// API route for user's marketplace listings

import { NextRequest, NextResponse } from 'next/server';
import { marketplaceService } from '@/lib/services/marketplace-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (!userAddress) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    const result = await marketplaceService.getUserListings(userAddress, includeInactive);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching user listings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}