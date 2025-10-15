// API route for cancelling marketplace listings

import { NextRequest, NextResponse } from 'next/server';
import { marketplaceService } from '@/lib/services/marketplace-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, sellerAddress } = body;

    if (!listingId || !sellerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, sellerAddress' },
        { status: 400 }
      );
    }

    const result = await marketplaceService.cancelListing(listingId, sellerAddress);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}