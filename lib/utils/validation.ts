import { z } from 'zod'

// Common validation schemas
export const WalletAddressSchema = z.string().regex(
  /^0x[a-fA-F0-9]{40}$/,
  'Invalid wallet address format'
)

export const UUIDSchema = z.string().uuid('Invalid UUID format')

export const FlowAmountSchema = z.number()
  .positive('Amount must be positive')
  .max(1000000, 'Amount too large')

export const TransactionHashSchema = z.string()
  .min(1, 'Transaction hash is required')
  .max(66, 'Transaction hash too long')

// NFT validation
export const MomentIdSchema = z.number()
  .int('Moment ID must be an integer')
  .positive('Moment ID must be positive')

export const SportSchema = z.enum(['NBA', 'NFL'])

export const RaritySchema = z.enum(['Common', 'Rare', 'Epic', 'Legendary'])

export const PositionSchema = z.string()
  .min(1, 'Position is required')
  .max(10, 'Position too long')

// Contest validation
export const ContestStatusSchema = z.enum(['upcoming', 'active', 'completed', 'cancelled'])

export const ContestTypeSchema = z.enum(['free', 'paid', 'premium', 'sponsored'])

// Marketplace validation
export const ListingStatusSchema = z.enum(['active', 'sold', 'cancelled', 'expired'])

export const PriceSchema = z.number()
  .positive('Price must be positive')
  .max(100000, 'Price too high')

// Booster validation
export const BoosterTypeSchema = z.enum([
  'disney_energy',
  'disney_luck', 
  'shotcaller_power',
  'shotcaller_multiplier'
])

export const EffectTypeSchema = z.enum([
  'score_multiplier',
  'random_bonus',
  'extra_points'
])

export const BoosterStatusSchema = z.enum(['available', 'active', 'expired', 'used'])

// Premium validation
export const AccessTypeSchema = z.enum(['season_pass', 'monthly_premium', 'tournament_vip'])

export const PremiumStatusSchema = z.enum(['active', 'expired', 'cancelled'])

// Treasury validation
export const TransactionTypeSchema = z.enum([
  'tournament_entry',
  'marketplace_sale',
  'booster_purchase',
  'season_pass',
  'reward_distribution'
])

// Lineup validation
export const LineupNFTsSchema = z.array(MomentIdSchema)
  .min(1, 'Lineup must have at least 1 NFT')
  .max(5, 'Lineup cannot have more than 5 NFTs')

// User validation
export const UsernameSchema = z.string()
  .min(1, 'Username is required')
  .max(50, 'Username too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')

export const PointsSchema = z.number()
  .min(0, 'Points cannot be negative')
  .max(10000, 'Points too high')

// Date validation
export const DateTimeSchema = z.string().datetime('Invalid datetime format')

export const FutureDateSchema = z.string()
  .datetime('Invalid datetime format')
  .refine(
    (date) => new Date(date) > new Date(),
    'Date must be in the future'
  )

// Pagination validation
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
})

// Sorting validation
export const SortOrderSchema = z.enum(['asc', 'desc']).default('desc')

// Complex validation schemas
export const CreateUserSchema = z.object({
  walletAddress: WalletAddressSchema,
  username: UsernameSchema.optional()
})

export const CreateNFTSchema = z.object({
  momentId: MomentIdSchema,
  playerName: z.string().min(1, 'Player name is required').max(100, 'Player name too long'),
  team: z.string().max(50, 'Team name too long').optional(),
  position: PositionSchema.optional(),
  sport: SportSchema,
  rarity: RaritySchema.optional(),
  metadata: z.record(z.any()).optional()
})

export const CreateLineupSchema = z.object({
  walletAddress: WalletAddressSchema,
  weekId: z.number().int().positive('Week ID must be positive'),
  nftIds: LineupNFTsSchema,
  contestId: UUIDSchema.optional()
})

export const CreateContestSchema = z.object({
  weekId: z.number().int().positive('Week ID must be positive'),
  startTime: FutureDateSchema,
  endTime: DateTimeSchema,
  entryFee: FlowAmountSchema.default(0),
  prizePool: FlowAmountSchema.default(0),
  maxParticipants: z.number().int().positive().optional(),
  contestType: ContestTypeSchema.default('free')
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'End time must be after start time',
    path: ['endTime']
  }
)

export const CreateMarketplaceListingSchema = z.object({
  sellerAddress: WalletAddressSchema,
  momentId: MomentIdSchema,
  price: PriceSchema,
  expirationDays: z.number().int().positive().max(30).optional()
})

export const PurchaseNFTSchema = z.object({
  listingId: UUIDSchema,
  buyerAddress: WalletAddressSchema,
  transactionHash: TransactionHashSchema,
  flowAmount: FlowAmountSchema
})

export const CreateBoosterSchema = z.object({
  walletAddress: WalletAddressSchema,
  boosterType: BoosterTypeSchema,
  flowAmount: FlowAmountSchema,
  transactionHash: TransactionHashSchema
})

export const CreatePremiumAccessSchema = z.object({
  userAddress: WalletAddressSchema,
  accessType: AccessTypeSchema,
  flowAmount: FlowAmountSchema,
  transactionHash: TransactionHashSchema,
  durationDays: z.number().int().positive().default(90)
})

export const DistributeRewardsSchema = z.object({
  contestId: UUIDSchema,
  winners: z.array(z.object({
    walletAddress: WalletAddressSchema,
    rank: z.number().int().positive('Rank must be positive'),
    totalPoints: PointsSchema,
    rewardAmount: FlowAmountSchema
  })).min(1, 'At least one winner is required'),
  transactionHash: TransactionHashSchema
})

// Validation helper functions
export function validateWalletAddress(address: string): boolean {
  return WalletAddressSchema.safeParse(address).success
}

export function validateUUID(id: string): boolean {
  return UUIDSchema.safeParse(id).success
}

export function validateFlowAmount(amount: number): boolean {
  return FlowAmountSchema.safeParse(amount).success
}

export function validateMomentId(id: number): boolean {
  return MomentIdSchema.safeParse(id).success
}

// Error formatting helper
export function formatZodError(error: z.ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : ''
    return `${path}${err.message}`
  })
}

// Sanitization helpers
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function sanitizeNumber(input: any): number | null {
  const num = parseFloat(input)
  return isNaN(num) ? null : num
}

export function sanitizeInteger(input: any): number | null {
  const num = parseInt(input)
  return isNaN(num) ? null : num
}

// Business rule validation
export function validateLineupNFTs(nftIds: number[]): { valid: boolean; error?: string } {
  if (nftIds.length === 0) {
    return { valid: false, error: 'Lineup must contain at least 1 NFT' }
  }
  
  if (nftIds.length > 5) {
    return { valid: false, error: 'Lineup cannot contain more than 5 NFTs' }
  }
  
  // Check for duplicates
  const uniqueIds = new Set(nftIds)
  if (uniqueIds.size !== nftIds.length) {
    return { valid: false, error: 'Lineup cannot contain duplicate NFTs' }
  }
  
  return { valid: true }
}

export function validateContestTiming(startTime: string, endTime: string): { valid: boolean; error?: string } {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const now = new Date()
  
  if (start <= now) {
    return { valid: false, error: 'Contest start time must be in the future' }
  }
  
  if (end <= start) {
    return { valid: false, error: 'Contest end time must be after start time' }
  }
  
  const duration = end.getTime() - start.getTime()
  const minDuration = 24 * 60 * 60 * 1000 // 24 hours
  const maxDuration = 7 * 24 * 60 * 60 * 1000 // 7 days
  
  if (duration < minDuration) {
    return { valid: false, error: 'Contest must run for at least 24 hours' }
  }
  
  if (duration > maxDuration) {
    return { valid: false, error: 'Contest cannot run for more than 7 days' }
  }
  
  return { valid: true }
}

export function validatePriceRange(price: number, minPrice: number = 0.1, maxPrice: number = 10000): { valid: boolean; error?: string } {
  if (price < minPrice) {
    return { valid: false, error: `Price must be at least ${minPrice} FLOW` }
  }
  
  if (price > maxPrice) {
    return { valid: false, error: `Price cannot exceed ${maxPrice} FLOW` }
  }
  
  return { valid: true }
}

export function validateRewardDistribution(winners: Array<{ rank: number; rewardAmount: number }>, totalPrizePool: number): { valid: boolean; error?: string } {
  const totalRewards = winners.reduce((sum, winner) => sum + winner.rewardAmount, 0)
  
  if (totalRewards > totalPrizePool) {
    return { valid: false, error: 'Total reward amount exceeds available prize pool' }
  }
  
  // Check for duplicate ranks
  const ranks = winners.map(w => w.rank)
  const uniqueRanks = new Set(ranks)
  if (uniqueRanks.size !== ranks.length) {
    return { valid: false, error: 'Duplicate ranks found in winner list' }
  }
  
  // Validate rank order
  const sortedWinners = [...winners].sort((a, b) => a.rank - b.rank)
  for (let i = 0; i < sortedWinners.length; i++) {
    if (sortedWinners[i].rank !== i + 1) {
      return { valid: false, error: 'Winner ranks must be consecutive starting from 1' }
    }
  }
  
  return { valid: true }
}