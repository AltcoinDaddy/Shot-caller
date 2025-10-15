import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const CreateListingSchema = z.object({
  sellerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  momentId: z.number().int().positive('Moment ID must be positive'),
  price: z.number().positive('Price must be positive'),
  expirationDays: z.number().int().positive().max(30).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const sport = searchParams.get('sport')
    const rarity = searchParams.get('rarity')
    const priceMin = searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : undefined
    const priceMax = searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : undefined
    const team = searchParams.get('team')
    const search = searchParams.get('search')
    
    // Parse sorting and pagination
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get active marketplace listings with NFT details
    const dbListings = await enhancedDatabaseService.getActiveMarketplaceListings()
    
    // Convert to API format with NFT details
    let listings = []
    
    for (const dbListing of dbListings) {
      const nft = await enhancedDatabaseService.getNFTByMomentId(dbListing.moment_id)
      
      if (nft) {
        const listing = {
          id: dbListing.id,
          sellerAddress: dbListing.seller_address,
          momentId: dbListing.moment_id,
          price: dbListing.price,
          status: dbListing.status,
          createdAt: dbListing.created_at,
          soldAt: dbListing.sold_at,
          buyerAddress: dbListing.buyer_address,
          nftDetails: {
            playerName: nft.player_name,
            team: nft.team,
            position: nft.position,
            sport: nft.sport,
            rarity: nft.rarity,
            metadata: nft.metadata
          }
        }
        
        // Apply filters
        let includeItem = true
        
        if (sport && sport !== 'all' && nft.sport !== sport) includeItem = false
        if (rarity && rarity !== 'all' && nft.rarity !== rarity) includeItem = false
        if (priceMin !== undefined && dbListing.price < priceMin) includeItem = false
        if (priceMax !== undefined && dbListing.price > priceMax) includeItem = false
        if (team && !nft.team?.toLowerCase().includes(team.toLowerCase())) includeItem = false
        if (search) {
          const searchTerm = search.toLowerCase()
          const searchableText = [nft.player_name, nft.team, nft.sport, nft.rarity].join(' ').toLowerCase()
          if (!searchableText.includes(searchTerm)) includeItem = false
        }
        
        if (includeItem) {
          listings.push(listing)
        }
      }
    }
    
    // Apply sorting
    listings.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price
          break
        case 'created_at':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'player':
          comparison = a.nftDetails.playerName.localeCompare(b.nftDetails.playerName)
          break
        default:
          comparison = 0
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
    
    // Apply pagination
    const totalCount = listings.length
    const totalPages = Math.ceil(totalCount / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedListings = listings.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      listings: paginatedListings,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasMore: page < totalPages
      }
    })

  } catch (error) {
    console.error('Get marketplace listings error:', error)

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sellerAddress, momentId, price, expirationDays } = CreateListingSchema.parse(body)

    // Verify NFT exists
    const nft = await enhancedDatabaseService.getNFTByMomentId(momentId)
    if (!nft) {
      return NextResponse.json(
        { success: false, error: 'NFT not found' },
        { status: 404 }
      )
    }

    // Check if NFT is already listed
    const existingListings = await enhancedDatabaseService.getActiveMarketplaceListings()
    const existingListing = existingListings.find(l => l.moment_id === momentId && l.status === 'active')
    
    if (existingListing) {
      return NextResponse.json(
        { success: false, error: 'NFT is already listed for sale' },
        { status: 409 }
      )
    }

    // Create marketplace listing
    const listing = await enhancedDatabaseService.createMarketplaceListing({
      seller_address: sellerAddress,
      moment_id: momentId,
      price: price,
      status: 'active'
    })

    return NextResponse.json({
      success: true,
      listing: {
        id: listing.id,
        sellerAddress: listing.seller_address,
        momentId: listing.moment_id,
        price: listing.price,
        status: listing.status,
        createdAt: listing.created_at,
        nftDetails: {
          playerName: nft.player_name,
          team: nft.team,
          position: nft.position,
          sport: nft.sport,
          rarity: nft.rarity,
          metadata: nft.metadata
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create marketplace listing error:', error)

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