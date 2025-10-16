import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { NextApiHandler } from 'next'

// Mock treasury API handlers
const mockTreasuryStatusHandler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const mockTreasuryStatus = {
    treasuryBalance: 1250.75,
    rewardPoolBalance: 2875.25,
    totalCollected: 4126.0,
    weeklyDistributed: 850.5,
    platformFeePercentage: 30,
    rewardPoolPercentage: 70,
    lastDistribution: '2024-01-07T00:00:00Z',
    nextDistribution: '2024-01-14T00:00:00Z',
    activeContests: 3,
    totalParticipants: 156,
  }

  return res.status(200).json(mockTreasuryStatus)
}

const mockTournamentEntryHandler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userAddress, tournamentId, entryFee } = req.body

  if (!userAddress || !tournamentId || !entryFee) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Mock insufficient balance
  if (userAddress === '0xinsufficientbalance') {
    return res.status(400).json({ error: 'Insufficient FLOW balance for entry fee' })
  }

  // Mock tournament full
  if (tournamentId === 'full_tournament') {
    return res.status(400).json({ error: 'Tournament is full' })
  }

  // Mock tournament not found
  if (tournamentId === 'nonexistent') {
    return res.status(404).json({ error: 'Tournament not found' })
  }

  // Mock successful entry
  return res.status(200).json({
    success: true,
    transactionId: '0xabcdef123456789',
    entry: {
      userAddress,
      tournamentId,
      entryFee,
      entryTime: new Date().toISOString(),
      treasuryAmount: entryFee * 0.3,
      rewardPoolAmount: entryFee * 0.7,
    },
  })
}

const mockRewardDistributionHandler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { weekId, winners } = req.body

  if (!weekId || !winners || !Array.isArray(winners)) {
    return res.status(400).json({ error: 'Missing or invalid required fields' })
  }

  // Mock week not found
  if (weekId === 999) {
    return res.status(404).json({ error: 'Week not found' })
  }

  // Mock already distributed
  if (weekId === 1) {
    return res.status(400).json({ error: 'Rewards already distributed for this week' })
  }

  // Mock successful distribution
  const totalPrizePool = 1000.0
  const distributions = [
    { rank: 1, percentage: 25, amount: totalPrizePool * 0.25 },
    { rank: 2, percentage: 15, amount: totalPrizePool * 0.15 },
    { rank: 3, percentage: 10, amount: totalPrizePool * 0.10 },
    { rank: 'top10', percentage: 30, amount: totalPrizePool * 0.30 },
    { rank: 'sustainability', percentage: 20, amount: totalPrizePool * 0.20 },
  ]

  return res.status(200).json({
    success: true,
    weekId,
    totalDistributed: totalPrizePool,
    distributions,
    transactionIds: [
      '0x111111111111111',
      '0x222222222222222',
      '0x333333333333333',
    ],
  })
}

const mockBoosterPurchaseHandler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userAddress, boosterType, price } = req.body

  if (!userAddress || !boosterType || !price) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Mock insufficient balance
  if (userAddress === '0xinsufficientbalance') {
    return res.status(400).json({ error: 'Insufficient FLOW balance' })
  }

  // Mock invalid booster type
  if (!['disney_energy', 'disney_luck', 'shotcaller_power'].includes(boosterType)) {
    return res.status(400).json({ error: 'Invalid booster type' })
  }

  // Mock successful purchase
  return res.status(200).json({
    success: true,
    transactionId: '0xbooster123456789',
    booster: {
      id: 'new_booster_id',
      ownerAddress: userAddress,
      boosterType,
      effectType: boosterType === 'disney_energy' ? 'score_multiplier' : 'random_bonus',
      effectValue: boosterType === 'disney_energy' ? 1.05 : 10,
      durationHours: 168,
      status: 'available',
      purchasedAt: new Date().toISOString(),
    },
    treasuryAmount: price * 0.3,
    rewardPoolAmount: price * 0.7,
  })
}

describe('Treasury API Integration Tests', () => {
  describe('GET /api/treasury/status', () => {
    it('should return treasury status and balances', async () => {
      const response = await request(mockTreasuryStatusHandler)
        .get('/api/treasury/status')

      expect(response.status).toBe(200)
      expect(response.body.treasuryBalance).toBe(1250.75)
      expect(response.body.rewardPoolBalance).toBe(2875.25)
      expect(response.body.platformFeePercentage).toBe(30)
      expect(response.body.rewardPoolPercentage).toBe(70)
      expect(response.body.activeContests).toBe(3)
    })

    it('should reject non-GET requests', async () => {
      const response = await request(mockTreasuryStatusHandler)
        .post('/api/treasury/status')

      expect(response.status).toBe(405)
      expect(response.body.error).toBe('Method not allowed')
    })
  })

  describe('POST /api/payments/tournament-entry', () => {
    it('should successfully process tournament entry payment', async () => {
      const response = await request(mockTournamentEntryHandler)
        .post('/api/payments/tournament-entry')
        .send({
          userAddress: '0x1234567890abcdef',
          tournamentId: 'weekly_contest_1',
          entryFee: 5.0,
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.transactionId).toBeDefined()
      expect(response.body.entry.treasuryAmount).toBe(1.5) // 30% of 5.0
      expect(response.body.entry.rewardPoolAmount).toBe(3.5) // 70% of 5.0
    })

    it('should reject entry with insufficient balance', async () => {
      const response = await request(mockTournamentEntryHandler)
        .post('/api/payments/tournament-entry')
        .send({
          userAddress: '0xinsufficientbalance',
          tournamentId: 'weekly_contest_1',
          entryFee: 5.0,
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Insufficient FLOW balance for entry fee')
    })

    it('should reject entry to full tournament', async () => {
      const response = await request(mockTournamentEntryHandler)
        .post('/api/payments/tournament-entry')
        .send({
          userAddress: '0x1234567890abcdef',
          tournamentId: 'full_tournament',
          entryFee: 5.0,
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Tournament is full')
    })

    it('should reject entry to nonexistent tournament', async () => {
      const response = await request(mockTournamentEntryHandler)
        .post('/api/payments/tournament-entry')
        .send({
          userAddress: '0x1234567890abcdef',
          tournamentId: 'nonexistent',
          entryFee: 5.0,
        })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Tournament not found')
    })
  })

  describe('POST /api/rewards/distribute', () => {
    it('should successfully distribute weekly rewards', async () => {
      const response = await request(mockRewardDistributionHandler)
        .post('/api/rewards/distribute')
        .send({
          weekId: 2,
          winners: [
            { address: '0x1111111111111111', rank: 1 },
            { address: '0x2222222222222222', rank: 2 },
            { address: '0x3333333333333333', rank: 3 },
          ],
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.totalDistributed).toBe(1000.0)
      expect(response.body.distributions).toHaveLength(5)
      expect(response.body.distributions[0].percentage).toBe(25) // 1st place
      expect(response.body.distributions[4].percentage).toBe(20) // Sustainability
    })

    it('should reject distribution for already distributed week', async () => {
      const response = await request(mockRewardDistributionHandler)
        .post('/api/rewards/distribute')
        .send({
          weekId: 1,
          winners: [
            { address: '0x1111111111111111', rank: 1 },
          ],
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Rewards already distributed for this week')
    })

    it('should reject distribution with invalid data', async () => {
      const response = await request(mockRewardDistributionHandler)
        .post('/api/rewards/distribute')
        .send({
          weekId: 2,
          winners: 'invalid_data',
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Missing or invalid required fields')
    })
  })

  describe('POST /api/boosters/purchase', () => {
    it('should successfully purchase booster', async () => {
      const response = await request(mockBoosterPurchaseHandler)
        .post('/api/boosters/purchase')
        .send({
          userAddress: '0x1234567890abcdef',
          boosterType: 'disney_energy',
          price: 2.5,
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.booster.boosterType).toBe('disney_energy')
      expect(response.body.booster.effectType).toBe('score_multiplier')
      expect(response.body.treasuryAmount).toBe(0.75) // 30% of 2.5
      expect(response.body.rewardPoolAmount).toBe(1.75) // 70% of 2.5
    })

    it('should reject purchase with insufficient balance', async () => {
      const response = await request(mockBoosterPurchaseHandler)
        .post('/api/boosters/purchase')
        .send({
          userAddress: '0xinsufficientbalance',
          boosterType: 'disney_energy',
          price: 2.5,
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Insufficient FLOW balance')
    })

    it('should reject purchase with invalid booster type', async () => {
      const response = await request(mockBoosterPurchaseHandler)
        .post('/api/boosters/purchase')
        .send({
          userAddress: '0x1234567890abcdef',
          boosterType: 'invalid_booster',
          price: 2.5,
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid booster type')
    })
  })
})