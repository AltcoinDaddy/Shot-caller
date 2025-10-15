import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const PurchaseNFTSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID'),
  buyerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  transactionHash: z.string().min(1, 'Transaction hash is required'),
  flowAmount: z.number().positive('Flow amount must be positive')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, buyerAddress, transactionHash, flowAmount } = PurchaseNFTSchema.parse(body)

    // Get the listing
    const userListings = await enhancedDatabaseService.getUserMarketplaceListings('')
    const allListings = await enhancedDatabaseService.getActiveMarketplaceListings()
    const listing = allListings.find(l => l.id === listingId)

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Listing is not active' },
        { status: 400 }
      )
    }

    // Prevent self-purchase
    if (listing.seller_address === buyerAddress) {
      return NextResponse.json(
        { success: false, error: 'Cannot purchase your own NFT' },
        { status: 400 }
      )
    }

    // Verify the flow amount matches the listing price
    if (Math.abs(flowAmount - listing.price) > 0.001) {
      return NextResponse.json(
        { success: false, error: 'Flow amount does not match listing price' },
        { status: 400 }
      )
    }

    // Calculate marketplace fees (2-5%)
    const feePercentage = 0.03 // 3%
    const marketplaceFee = listing.price * feePercentage
    const treasuryAmount = marketplaceFee * 0.30 // 30% to treasury
    const rewardPoolAmount = marketplaceFee * 0.70 // 70% to reward pool

    // Update listing status to sold
    await enhancedDatabaseService.updateMarketplaceListing(listingId, {
      status: 'sold',
      buyer_address: buyerAddress,
      sold_at: new Date().toISOString()
    })

    // Create treasury transaction for marketplace fee
    await enhancedDatabaseService.createTreasuryTransaction({
      transaction_hash: transactionHash,
      transaction_type: 'marketplace_sale',
      amount: listing.price,
      fee_amount: marketplaceFee,
      reward_pool_amount: rewardPoolAmount,
      treasury_amount: treasuryAmount,
      user_address: listing.seller_address
    })

    // Get NFT details for response
    const nft = await enhancedDatabaseService.getNFTByMomentId(listing.moment_id)

    return NextResponse.json({
      success: true,
      transaction: {
        id: transactionHash,
        listingId: listing.id,
        sellerAddress: listing.seller_address,
        buyerAddress: buyerAddress,
        momentId: listing.moment_id,
        price: listing.price,
        marketplaceFee: marketplaceFee,
        treasuryAmount: treasuryAmount,
        rewardPoolAmount: rewardPoolAmount,
        transactionHash: transactionHash,
        completedAt: new Date().toISOString(),
        nftDetails: nft ? {
          playerName: nft.player_name,
          team: nft.team,
          sport: nft.sport,
          rarity: nft.rarity,
          metadata: nft.metadata
        } : null
      }
    })

  } catch (error) {
    console.error('Purchase NFT error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { success: false, error: 'Database error occurred' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}