import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { NextApiHandler } from 'next'

// Mock marketplace API handlers
const mockListingsHandler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const mockListings = [
    {
      id: '1',
      sellerAddress: '0xabcdef1234567890',
      momentId: 12345,
      price: 10.5,
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      nft: {
        id: '1',
        momentId: 12345,
        playerName: 'LeBron James',
        team: 'Lakers',
        position: 'SF',
        sport: 'NBA',
        rarity: 'Legendary',
        metadata: {},
        imageUrl: 'https://example.com/lebron.jpg',
      },
    },
    {
      id: '2',
      sellerAddress: '0x9876543210fedcba',
      momentId: 67890,
      price: 5.25,
      status: 'active',
      createdAt: '2024-01-02T00:00:00Z',
      nft: {
        id: '2',
        momentId: 67890,
        playerName: 'Stephen Curry',
        team: 'Warriors',
        position: 'PG',
        sport: 'NBA',
        rarity: 'Epic',
        metadata: {},
        imageUrl: 'https://example.com/curry.jpg',
      },
    },
  ]

  return res.status(200).json({ listings: mockListings })
}

const mockPurchaseHandler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { listingId, buyerAddress } = req.body

  if (!listingId || !buyerAddress) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Mock insufficient balance
  if (buyerAddress === '0xinsufficientbalance') {
    return res.status(400).json({ error: 'Insufficient FLOW balance' })
  }

  // Mock listing not found
  if (listingId === 'nonexistent') {
    return res.status(404).json({ error: 'Listing not found' })
  }

  // Mock successful purchase
  return res.status(200).json({
    success: true,
    transactionId: '0x123456789abcdef',
    listing: {
      id: listingId,
      status: 'sold',
      soldAt: new Date().toISOString(),
      buyerAddress,
    },
  })
}

const mockListNFTHandler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { sellerAddress, momentId, price } = req.body

  if (!sellerAddress || !momentId || !price) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (price <= 0) {
    return res.status(400).json({ error: 'Price must be greater than 0' })
  }

  // Mock NFT not owned
  if (momentId === 999999) {
    return res.status(403).json({ error: 'You do not own this NFT' })
  }

  // Mock successful listing
  return res.status(201).json({
    success: true,
    listing: {
      id: 'new_listing_id',
      sellerAddress,
      momentId,
      price,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  })
}

const mockCancelHandler: NextApiHandler = async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { listingId } = req.query
  const { sellerAddress } = req.body

  if (!listingId || !sellerAddress) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Mock listing not found
  if (listingId === 'nonexistent') {
    return res.status(404).json({ error: 'Listing not found' })
  }

  // Mock unauthorized cancellation
  if (sellerAddress === '0xunauthorized') {
    return res.status(403).json({ error: 'You can only cancel your own listings' })
  }

  // Mock successful cancellation
  return res.status(200).json({
    success: true,
    listing: {
      id: listingId,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    },
  })
}

describe('Marketplace API Integration Tests', () => {
  describe('GET /api/marketplace/listings', () => {
    it('should return all active marketplace listings', async () => {
      const response = await request(mockListingsHandler)
        .get('/api/marketplace/listings')

      expect(response.status).toBe(200)
      expect(response.body.listings).toHaveLength(2)
      expect(response.body.listings[0].playerName).toBe('LeBron James')
      expect(response.body.listings[1].playerName).toBe('Stephen Curry')
    })

    it('should reject non-GET requests', async () => {
      const response = await request(mockListingsHandler)
        .post('/api/marketplace/listings')

      expect(response.status).toBe(405)
      expect(response.body.error).toBe('Method not allowed')
    })
  })

  describe('POST /api/marketplace/purchase', () => {
    it('should successfully purchase NFT with valid data', async () => {
      const response = await request(mockPurchaseHandler)
        .post('/api/marketplace/purchase')
        .send({
          listingId: 'valid_listing',
          buyerAddress: '0x1234567890abcdef',
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.transactionId).toBeDefined()
      expect(response.body.listing.status).toBe('sold')
    })

    it('should reject purchase with insufficient balance', async () => {
      const response = await request(mockPurchaseHandler)
        .post('/api/marketplace/purchase')
        .send({
          listingId: 'valid_listing',
          buyerAddress: '0xinsufficientbalance',
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Insufficient FLOW balance')
    })

    it('should reject purchase of nonexistent listing', async () => {
      const response = await request(mockPurchaseHandler)
        .post('/api/marketplace/purchase')
        .send({
          listingId: 'nonexistent',
          buyerAddress: '0x1234567890abcdef',
        })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Listing not found')
    })

    it('should reject purchase with missing fields', async () => {
      const response = await request(mockPurchaseHandler)
        .post('/api/marketplace/purchase')
        .send({
          listingId: 'valid_listing',
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Missing required fields')
    })
  })

  describe('POST /api/marketplace/list-nft', () => {
    it('should successfully create NFT listing', async () => {
      const response = await request(mockListNFTHandler)
        .post('/api/marketplace/list-nft')
        .send({
          sellerAddress: '0x1234567890abcdef',
          momentId: 12345,
          price: 15.75,
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.listing.price).toBe(15.75)
      expect(response.body.listing.status).toBe('active')
    })

    it('should reject listing with invalid price', async () => {
      const response = await request(mockListNFTHandler)
        .post('/api/marketplace/list-nft')
        .send({
          sellerAddress: '0x1234567890abcdef',
          momentId: 12345,
          price: -5,
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Price must be greater than 0')
    })

    it('should reject listing of unowned NFT', async () => {
      const response = await request(mockListNFTHandler)
        .post('/api/marketplace/list-nft')
        .send({
          sellerAddress: '0x1234567890abcdef',
          momentId: 999999,
          price: 10,
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('You do not own this NFT')
    })
  })

  describe('DELETE /api/marketplace/cancel/:listingId', () => {
    it('should successfully cancel own listing', async () => {
      const response = await request(mockCancelHandler)
        .delete('/api/marketplace/cancel/valid_listing')
        .send({
          sellerAddress: '0x1234567890abcdef',
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.listing.status).toBe('cancelled')
    })

    it('should reject cancellation of nonexistent listing', async () => {
      const response = await request(mockCancelHandler)
        .delete('/api/marketplace/cancel/nonexistent')
        .send({
          sellerAddress: '0x1234567890abcdef',
        })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Listing not found')
    })

    it('should reject unauthorized cancellation', async () => {
      const response = await request(mockCancelHandler)
        .delete('/api/marketplace/cancel/valid_listing')
        .send({
          sellerAddress: '0xunauthorized',
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('You can only cancel your own listings')
    })
  })
})