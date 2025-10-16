// Marketplace Service for NFT Trading

import { 
  MarketplaceListing, 
  MarketplaceTransaction, 
  MarketplaceFilters, 
  MarketplaceSortOptions, 
  MarketplaceStats,
  ListingRequest,
  PurchaseRequest,
  MarketplaceConfig,
  MarketplaceAPIResponse,
  PaginatedMarketplaceResponse,
  MarketplaceError,
  InsufficientFundsError,
  NFTNotOwnedError,
  ListingNotFoundError,
  ListingExpiredError,
  InvalidPriceError
} from '@/lib/types/marketplace';
import { NFTMoment } from '@/lib/types/nft';
import { flowNFTService } from './flow-nft-service';
import { enhancedDatabaseService, DatabaseError, ValidationError } from './enhanced-database-service';

export class MarketplaceService {
  private config: MarketplaceConfig;
  private readonly LISTINGS_KEY = 'shotcaller_marketplace_listings';
  private readonly TRANSACTIONS_KEY = 'shotcaller_marketplace_transactions';

  constructor(config?: Partial<MarketplaceConfig>) {
    this.config = {
      feePercentage: 3, // 3% marketplace fee
      treasuryPercentage: 30, // 30% of fees to treasury
      rewardPoolPercentage: 70, // 70% of fees to reward pool
      maxListingDuration: 30, // 30 days max
      minPrice: 0.1, // 0.1 FLOW minimum
      maxPrice: 10000, // 10,000 FLOW maximum
      ...config
    };
  }

  /**
   * Create a new NFT listing
   */
  async createListing(
    sellerAddress: string,
    request: ListingRequest
  ): Promise<MarketplaceAPIResponse<MarketplaceListing>> {
    try {
      // Validate price
      if (request.price < this.config.minPrice || request.price > this.config.maxPrice) {
        throw new InvalidPriceError(request.price, this.config.minPrice, this.config.maxPrice);
      }

      // Verify NFT ownership
      const ownershipResult = await this.verifyNFTOwnership(sellerAddress, request.momentId);
      if (!ownershipResult.success || !ownershipResult.data) {
        throw new NFTNotOwnedError(request.momentId, sellerAddress);
      }

      const nftMoment = ownershipResult.data;

      // Check if NFT is already listed
      const existingListing = await this.getActiveListingByMomentId(request.momentId);
      if (existingListing.success && existingListing.data) {
        throw new MarketplaceError(
          `NFT ${request.momentId} is already listed for sale`,
          'ALREADY_LISTED',
          { momentId: request.momentId }
        );
      }

      // Create listing
      const listing: MarketplaceListing = {
        id: this.generateListingId(),
        sellerAddress,
        momentId: request.momentId,
        nftDetails: {
          playerName: nftMoment.playerName,
          team: nftMoment.team,
          sport: nftMoment.sport,
          rarity: nftMoment.rarity,
          imageUrl: nftMoment.imageUrl || '',
          metadata: nftMoment.metadata
        },
        price: request.price,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: request.expirationDays 
          ? new Date(Date.now() + request.expirationDays * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + this.config.maxListingDuration * 24 * 60 * 60 * 1000)
      };

      // Save listing
      await this.saveListing(listing);

      return {
        success: true,
        data: listing,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create listing',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Purchase an NFT from marketplace
   */
  async purchaseNFT(request: PurchaseRequest): Promise<MarketplaceAPIResponse<MarketplaceTransaction>> {
    try {
      // Get listing
      const listingResult = await this.getListing(request.listingId);
      if (!listingResult.success || !listingResult.data) {
        throw new ListingNotFoundError(request.listingId);
      }

      const listing = listingResult.data;

      // Validate listing status
      if (listing.status !== 'active') {
        throw new MarketplaceError(
          `Listing ${request.listingId} is not active`,
          'LISTING_NOT_ACTIVE',
          { status: listing.status }
        );
      }

      // Check if listing has expired
      if (listing.expiresAt && new Date() > listing.expiresAt) {
        await this.updateListingStatus(request.listingId, 'expired');
        throw new ListingExpiredError(request.listingId);
      }

      // Prevent self-purchase
      if (listing.sellerAddress === request.buyerAddress) {
        throw new MarketplaceError(
          'Cannot purchase your own NFT',
          'SELF_PURCHASE',
          { listingId: request.listingId }
        );
      }

      // Calculate fees
      const marketplaceFee = listing.price * (this.config.feePercentage / 100);
      const treasuryAmount = marketplaceFee * (this.config.treasuryPercentage / 100);
      const rewardPoolAmount = marketplaceFee * (this.config.rewardPoolPercentage / 100);

      // In a real implementation, we would:
      // 1. Check buyer's FLOW balance
      // 2. Execute smart contract transaction
      // 3. Transfer NFT ownership
      // 4. Distribute payments
      
      // For now, simulate the transaction
      const transaction: MarketplaceTransaction = {
        id: this.generateTransactionId(),
        listingId: request.listingId,
        sellerAddress: listing.sellerAddress,
        buyerAddress: request.buyerAddress,
        momentId: listing.momentId,
        price: listing.price,
        marketplaceFee,
        treasuryAmount,
        rewardPoolAmount,
        transactionHash: this.generateTransactionHash(),
        status: 'completed', // In real implementation, this would start as 'pending'
        createdAt: new Date(),
        completedAt: new Date()
      };

      // Update listing status
      await this.updateListingStatus(request.listingId, 'sold', {
        buyerAddress: request.buyerAddress,
        soldAt: new Date(),
        transactionHash: transaction.transactionHash
      });

      // Save transaction
      await this.saveTransaction(transaction);

      return {
        success: true,
        data: transaction,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to purchase NFT',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Cancel a listing
   */
  async cancelListing(
    listingId: string,
    sellerAddress: string
  ): Promise<MarketplaceAPIResponse<boolean>> {
    try {
      const listingResult = await this.getListing(listingId);
      if (!listingResult.success || !listingResult.data) {
        throw new ListingNotFoundError(listingId);
      }

      const listing = listingResult.data;

      // Verify ownership
      if (listing.sellerAddress !== sellerAddress) {
        throw new MarketplaceError(
          'Only the seller can cancel this listing',
          'UNAUTHORIZED_CANCEL',
          { listingId, sellerAddress }
        );
      }

      // Update listing status
      await this.updateListingStatus(listingId, 'cancelled');

      return {
        success: true,
        data: true,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel listing',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get marketplace listings with filters and pagination
   */
  async getListings(
    filters?: MarketplaceFilters,
    sort?: MarketplaceSortOptions,
    page: number = 1,
    limit: number = 20
  ): Promise<MarketplaceAPIResponse<PaginatedMarketplaceResponse<MarketplaceListing>>> {
    try {
      let listings = await this.getAllListings();

      // Filter active listings only
      listings = listings.filter(listing => listing.status === 'active');

      // Check for expired listings and update them
      const now = new Date();
      for (const listing of listings) {
        if (listing.expiresAt && now > listing.expiresAt) {
          await this.updateListingStatus(listing.id, 'expired');
          listing.status = 'expired';
        }
      }

      // Re-filter after expiration check
      listings = listings.filter(listing => listing.status === 'active');

      // Apply filters
      if (filters) {
        listings = this.applyFilters(listings, filters);
      }

      // Apply sorting
      if (sort) {
        listings = this.applySorting(listings, sort);
      }

      // Apply pagination
      const totalCount = listings.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedListings = listings.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          items: paginatedListings,
          totalCount,
          hasMore: page < totalPages,
          currentPage: page,
          totalPages
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get listings',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get user's listings
   */
  async getUserListings(
    userAddress: string,
    includeInactive: boolean = false
  ): Promise<MarketplaceAPIResponse<MarketplaceListing[]>> {
    try {
      let listings = await this.getAllListings();
      
      // Filter by user
      listings = listings.filter(listing => listing.sellerAddress === userAddress);

      // Filter by status if needed
      if (!includeInactive) {
        listings = listings.filter(listing => listing.status === 'active');
      }

      // Sort by creation date (newest first)
      listings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        success: true,
        data: listings,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user listings',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<MarketplaceAPIResponse<MarketplaceStats>> {
    try {
      const listings = await this.getAllListings();
      const transactions = await this.getAllTransactions();

      const activeListings = listings.filter(l => l.status === 'active');
      const completedTransactions = transactions.filter(t => t.status === 'completed');

      const totalVolume = completedTransactions.reduce((sum, t) => sum + t.price, 0);
      const averagePrice = completedTransactions.length > 0 
        ? totalVolume / completedTransactions.length 
        : 0;
      const topSale = completedTransactions.length > 0
        ? Math.max(...completedTransactions.map(t => t.price))
        : 0;

      // Get recent sales (last 10)
      const recentSales = completedTransactions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);

      const stats: MarketplaceStats = {
        totalListings: listings.length,
        activeListings: activeListings.length,
        totalVolume,
        averagePrice,
        topSale,
        recentSales
      };

      return {
        success: true,
        data: stats,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get marketplace stats',
        timestamp: Date.now()
      };
    }
  }

  // Private helper methods

  private async verifyNFTOwnership(address: string, momentId: number): Promise<MarketplaceAPIResponse<NFTMoment>> {
    try {
      const ownershipResult = await flowNFTService.getComprehensiveOwnership(address);
      
      if (!ownershipResult.success || !ownershipResult.data) {
        return {
          success: false,
          error: 'Failed to verify NFT ownership',
          timestamp: Date.now()
        };
      }

      const moment = ownershipResult.data.moments.find(m => m.momentId === momentId);
      
      return {
        success: !!moment,
        data: moment,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ownership verification failed',
        timestamp: Date.now()
      };
    }
  }

  private async getListing(listingId: string): Promise<MarketplaceAPIResponse<MarketplaceListing>> {
    try {
      const listings = await this.getAllListings();
      const listing = listings.find(l => l.id === listingId);
      
      return {
        success: !!listing,
        data: listing,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get listing',
        timestamp: Date.now()
      };
    }
  }

  private async getActiveListingByMomentId(momentId: number): Promise<MarketplaceAPIResponse<MarketplaceListing>> {
    try {
      const listings = await this.getAllListings();
      const listing = listings.find(l => l.momentId === momentId && l.status === 'active');
      
      return {
        success: !!listing,
        data: listing,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get listing by moment ID',
        timestamp: Date.now()
      };
    }
  }

  private async saveListing(listing: MarketplaceListing): Promise<void> {
    try {
      await enhancedDatabaseService.createMarketplaceListing({
        seller_address: listing.sellerAddress,
        moment_id: listing.momentId,
        price: listing.price,
        status: listing.status,
        created_at: listing.createdAt.toISOString()
      });
    } catch (error) {
      throw new DatabaseError('Failed to save marketplace listing');
    }
  }

  private async updateListingStatus(
    listingId: string, 
    status: MarketplaceListing['status'],
    updates?: Partial<MarketplaceListing>
  ): Promise<void> {
    try {
      const updateData: any = { status };
      
      if (updates?.buyerAddress) {
        updateData.buyer_address = updates.buyerAddress;
      }
      if (updates?.soldAt) {
        updateData.sold_at = updates.soldAt.toISOString();
      }
      
      await enhancedDatabaseService.updateMarketplaceListing(listingId, updateData);
    } catch (error) {
      throw new DatabaseError('Failed to update marketplace listing');
    }
  }

  private async saveTransaction(transaction: MarketplaceTransaction): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    
    const transactions = await this.getAllTransactions();
    transactions.push(transaction);
    localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions, this.dateReplacer));
  }

  private async getAllListings(): Promise<MarketplaceListing[]> {
    try {
      const dbListings = await enhancedDatabaseService.getActiveMarketplaceListings();
      
      // Convert database format to marketplace format
      const listings: MarketplaceListing[] = [];
      
      for (const dbListing of dbListings) {
        // Get NFT details
        const nft = await enhancedDatabaseService.getNFTByMomentId(dbListing.moment_id);
        
        if (nft) {
          listings.push({
            id: dbListing.id,
            sellerAddress: dbListing.seller_address,
            momentId: dbListing.moment_id,
            nftDetails: {
              playerName: nft.player_name,
              team: nft.team || '',
              sport: nft.sport,
              rarity: nft.rarity || 'Common',
              imageUrl: '', // Would be populated from metadata
              metadata: nft.metadata || {}
            },
            price: dbListing.price,
            status: dbListing.status as MarketplaceListing['status'],
            createdAt: new Date(dbListing.created_at),
            updatedAt: new Date(dbListing.created_at),
            expiresAt: undefined // Could be added to database schema if needed
          });
        }
      }
      
      return listings;
    } catch (error) {
      console.error('Failed to get marketplace listings:', error);
      return [];
    }
  }

  private async getAllTransactions(): Promise<MarketplaceTransaction[]> {
    try {
      // Check if we're in a browser environment
      if (typeof localStorage === 'undefined') {
        // Return empty array for server-side rendering
        return [];
      }
      
      const stored = localStorage.getItem(this.TRANSACTIONS_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored, this.dateReviver);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to parse stored transactions:', error);
      return [];
    }
  }

  private applyFilters(listings: MarketplaceListing[], filters: MarketplaceFilters): MarketplaceListing[] {
    return listings.filter(listing => {
      // Sport filter
      if (filters.sport && filters.sport !== 'all' && listing.nftDetails.sport !== filters.sport) {
        return false;
      }

      // Rarity filter
      if (filters.rarity && filters.rarity !== 'all' && listing.nftDetails.rarity !== filters.rarity) {
        return false;
      }

      // Price range filter
      if (filters.priceMin !== undefined && listing.price < filters.priceMin) {
        return false;
      }
      if (filters.priceMax !== undefined && listing.price > filters.priceMax) {
        return false;
      }

      // Team filter
      if (filters.team && !listing.nftDetails.team.toLowerCase().includes(filters.team.toLowerCase())) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          listing.nftDetails.playerName,
          listing.nftDetails.team,
          listing.nftDetails.sport,
          listing.nftDetails.rarity
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }

  private applySorting(listings: MarketplaceListing[], sort: MarketplaceSortOptions): MarketplaceListing[] {
    return listings.sort((a, b) => {
      let comparison = 0;

      switch (sort.sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'rarity':
          const rarityOrder = { 'Common': 1, 'Rare': 2, 'Epic': 3, 'Legendary': 4 };
          comparison = (rarityOrder[a.nftDetails.rarity] || 0) - (rarityOrder[b.nftDetails.rarity] || 0);
          break;
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'player':
          comparison = a.nftDetails.playerName.localeCompare(b.nftDetails.playerName);
          break;
        default:
          comparison = 0;
      }

      return sort.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  private generateListingId(): string {
    return `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTransactionHash(): string {
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }

  // JSON serialization helpers for dates
  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }

  /**
   * Initialize with mock data for development
   */
  async initializeMockData(): Promise<void> {
    const listings = await this.getAllListings();
    
    if (listings.length === 0) {
      // Create some mock listings
      const mockListings: MarketplaceListing[] = [
        {
          id: 'listing_1',
          sellerAddress: '0x1234567890abcdef',
          momentId: 12345,
          nftDetails: {
            playerName: 'LeBron James',
            team: 'Lakers',
            sport: 'NBA',
            rarity: 'Legendary',
            imageUrl: '/lebron-james-nba-action.jpg',
            metadata: { points: 28.5, rebounds: 8.2, assists: 6.8 }
          },
          price: 25.5,
          status: 'active',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'listing_2',
          sellerAddress: '0x9876543210fedcba',
          momentId: 67890,
          nftDetails: {
            playerName: 'Patrick Mahomes',
            team: 'Chiefs',
            sport: 'NFL',
            rarity: 'Epic',
            imageUrl: '/patrick-mahomes-nfl-throwing.jpg',
            metadata: { passingYards: 4839, touchdowns: 41, completionPct: 69.3 }
          },
          price: 18.0,
          status: 'active',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'listing_3',
          sellerAddress: '0x5555999944442222',
          momentId: 11111,
          nftDetails: {
            playerName: 'Stephen Curry',
            team: 'Warriors',
            sport: 'NBA',
            rarity: 'Rare',
            imageUrl: '/stephen-curry-nba-shooting.jpg',
            metadata: { points: 26.4, threePointers: 4.8, assists: 5.1 }
          },
          price: 12.8,
          status: 'active',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000)
        }
      ];

      for (const listing of mockListings) {
        await this.saveListing(listing);
      }
    }
  }

  /**
   * Clear all marketplace data
   */
  async clearAllData(): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    
    localStorage.removeItem(this.LISTINGS_KEY);
    localStorage.removeItem(this.TRANSACTIONS_KEY);
  }
}

// Export singleton instance
export const marketplaceService = new MarketplaceService();

// Initialize mock data on first load
if (typeof window !== 'undefined') {
  marketplaceService.initializeMockData().catch(console.error);
}