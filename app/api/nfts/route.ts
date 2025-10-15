import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'
import { z } from 'zod'

const CreateNFTSchema = z.object({
  momentId: z.number().int().positive('Moment ID must be positive'),
  playerName: z.string().min(1, 'Player name is required'),
  team: z.string().optional(),
  position: z.string().optional(),
  sport: z.enum(['NBA', 'NFL']),
  rarity: z.enum(['Common', 'Rare', 'Epic', 'Legendary']).optional(),
  metadata: z.record(z.any()).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const momentId = searchParams.get('momentId')
    const playerName = searchParams.get('playerName')
    const team = searchParams.get('team')
    const rarity = searchParams.get('rarity')

    // If momentId is provided, get specific NFT
    if (momentId) {
      const nft = await enhancedDatabaseService.getNFTByMomentId(parseInt(momentId))
      
      if (!nft) {
        return NextResponse.json(
          { success: false, error: 'NFT not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        nft: {
          id: nft.id,
          momentId: nft.moment_id,
          playerName: nft.player_name,
          team: nft.team,
          position: nft.position,
          sport: nft.sport,
          rarity: nft.rarity,
          metadata: nft.metadata,
          lastUpdated: nft.last_updated
        }
      })
    }

    // Get NFTs by sport or all NFTs
    let nfts = []
    if (sport) {
      nfts = await enhancedDatabaseService.getNFTsBySport(sport)
    } else {
      // Get all NFTs (would need to add this method to enhanced service)
      const nbaNfts = await enhancedDatabaseService.getNFTsBySport('NBA')
      const nflNfts = await enhancedDatabaseService.getNFTsBySport('NFL')
      nfts = [...nbaNfts, ...nflNfts]
    }

    // Apply additional filters
    let filteredNfts = nfts

    if (playerName) {
      filteredNfts = filteredNfts.filter(nft => 
        nft.player_name.toLowerCase().includes(playerName.toLowerCase())
      )
    }

    if (team) {
      filteredNfts = filteredNfts.filter(nft => 
        nft.team?.toLowerCase().includes(team.toLowerCase())
      )
    }

    if (rarity) {
      filteredNfts = filteredNfts.filter(nft => nft.rarity === rarity)
    }

    // Format response
    const formattedNfts = filteredNfts.map(nft => ({
      id: nft.id,
      momentId: nft.moment_id,
      playerName: nft.player_name,
      team: nft.team,
      position: nft.position,
      sport: nft.sport,
      rarity: nft.rarity,
      metadata: nft.metadata,
      lastUpdated: nft.last_updated
    }))

    return NextResponse.json({
      success: true,
      nfts: formattedNfts,
      count: formattedNfts.length
    })

  } catch (error) {
    console.error('Get NFTs error:', error)

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
    const nftData = CreateNFTSchema.parse(body)

    // Check if NFT with this moment ID already exists
    const existingNft = await enhancedDatabaseService.getNFTByMomentId(nftData.momentId)
    
    if (existingNft) {
      return NextResponse.json(
        { success: false, error: 'NFT with this moment ID already exists' },
        { status: 409 }
      )
    }

    // Create NFT
    const nft = await enhancedDatabaseService.createNFT({
      moment_id: nftData.momentId,
      player_name: nftData.playerName,
      team: nftData.team,
      position: nftData.position,
      sport: nftData.sport,
      rarity: nftData.rarity,
      metadata: nftData.metadata
    })

    return NextResponse.json({
      success: true,
      nft: {
        id: nft.id,
        momentId: nft.moment_id,
        playerName: nft.player_name,
        team: nft.team,
        position: nft.position,
        sport: nft.sport,
        rarity: nft.rarity,
        metadata: nft.metadata,
        lastUpdated: nft.last_updated
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create NFT error:', error)

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