// Marketplace types and interfaces

export interface MarketplaceListing {
  id: string;
  sellerAddress: string;
  momentId: number;
  nftDetails: {
    playerName: string;
    team: string;
    sport: 'NBA' | 'NFL';
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    imageUrl: string;
    metadata: Record<string, any>;
  };
  price: number; // FLOW tokens
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  soldAt?: Date;
  buyerAddress?: string;
  transactionHash?: string;
  expiresAt?: Date;
}

export interface MarketplaceTransaction {
  id: string;
  listingId: string;
  sellerAddress: string;
  buyerAddress: string;
  momentId: number;
  price: number;
  marketplaceFee: number;
  treasuryAmount: number;
  rewardPoolAmount: number;
  transactionHash: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface MarketplaceFilters {
  sport?: 'NBA' | 'NFL' | 'all';
  rarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'all';
  priceMin?: number;
  priceMax?: number;
  team?: string;
  search?: string;
}

export interface MarketplaceSortOptions {
  sortBy: 'price' | 'rarity' | 'date' | 'player';
  sortOrder: 'asc' | 'desc';
}

export interface MarketplaceStats {
  totalListings: number;
  activeListings: number;
  totalVolume: number;
  averagePrice: number;
  topSale: number;
  recentSales: MarketplaceTransaction[];
}

export interface ListingRequest {
  momentId: number;
  price: number;
  expirationDays?: number;
}

export interface PurchaseRequest {
  listingId: string;
  buyerAddress: string;
}

export interface MarketplaceConfig {
  feePercentage: number; // 2-5%
  treasuryPercentage: number; // 30% of fees
  rewardPoolPercentage: number; // 70% of fees
  maxListingDuration: number; // days
  minPrice: number; // minimum FLOW price
  maxPrice: number; // maximum FLOW price
}

export interface MarketplaceAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedMarketplaceResponse<T = any> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
  currentPage: number;
  totalPages: number;
}

// Error types
export class MarketplaceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MarketplaceError';
  }
}

export class InsufficientFundsError extends MarketplaceError {
  constructor(required: number, available: number) {
    super(
      `Insufficient FLOW tokens. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_FUNDS',
      { required, available }
    );
  }
}

export class NFTNotOwnedError extends MarketplaceError {
  constructor(momentId: number, address: string) {
    super(
      `NFT ${momentId} is not owned by address ${address}`,
      'NFT_NOT_OWNED',
      { momentId, address }
    );
  }
}

export class ListingNotFoundError extends MarketplaceError {
  constructor(listingId: string) {
    super(
      `Listing ${listingId} not found`,
      'LISTING_NOT_FOUND',
      { listingId }
    );
  }
}

export class ListingExpiredError extends MarketplaceError {
  constructor(listingId: string) {
    super(
      `Listing ${listingId} has expired`,
      'LISTING_EXPIRED',
      { listingId }
    );
  }
}

export class InvalidPriceError extends MarketplaceError {
  constructor(price: number, min: number, max: number) {
    super(
      `Invalid price ${price}. Must be between ${min} and ${max} FLOW`,
      'INVALID_PRICE',
      { price, min, max }
    );
  }
}