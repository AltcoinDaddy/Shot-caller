// Main NFT Ownership Verification Service

import {
  NFTMoment,
  NFTOwnership,
  NFTVerificationResult,
  NFTAPIResponse,
  NFTServiceConfig,
  NFTError,
  DisneyPinnacleNFT
} from '@/lib/types/nft';
import { findLabsAPI, FindLabsAPI } from './findlabs-api';
import { flowNFTService, FlowNFTService } from './flow-nft-service';
import { nftCache, NFTCacheService } from './nft-cache';

export class NFTOwnershipService {
  private findLabsAPI: FindLabsAPI;
  private flowService: FlowNFTService;
  private cache: NFTCacheService;
  private config: NFTServiceConfig;

  constructor(config?: Partial<NFTServiceConfig>) {
    this.config = {
      findLabsApiUrl: process.env.NEXT_PUBLIC_FINDLABS_API_URL || 'https://api.find.xyz',
      findLabsApiKey: process.env.FINDLABS_API_KEY,
      cacheStrategy: 'localStorage',
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      maxCacheSize: 1000,
      enableBatchRequests: true,
      batchSize: 10,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.findLabsAPI = findLabsAPI;
    this.flowService = flowNFTService;
    this.cache = nftCache;
  }

  /**
   * Get comprehensive NFT ownership for an address
   * Uses cache first, then falls back to blockchain queries
   */
  async getOwnership(address: string, useCache: boolean = true): Promise<NFTAPIResponse<NFTOwnership>> {
    try {
      // Validate address format first
      if (!this.validateFlowAddress(address)) {
        return {
          success: false,
          error: 'Invalid Flow address format',
          timestamp: Date.now(),
        };
      }

      // Check cache first if enabled
      if (useCache) {
        const cached = this.cache.getCachedOwnership(address);
        if (cached) {
          // Check if cached data is still fresh (less than 2 minutes old for real-time accuracy)
          const cacheAge = Date.now() - cached.lastVerified.getTime();
          if (cacheAge < 2 * 60 * 1000) {
            return {
              success: true,
              data: cached,
              timestamp: Date.now(),
            };
          }
        }
      }

      // Try direct Flow blockchain queries first for most accurate data
      const flowResponse = await this.flowService.getComprehensiveOwnership(address);
      if (flowResponse.success && flowResponse.data) {
        // Enhance with additional verification
        const enhancedOwnership = await this.enhanceWithDapperVerification(flowResponse.data);
        
        if (useCache) {
          this.cache.cacheOwnership(address, enhancedOwnership);
        }
        
        return {
          success: true,
          data: enhancedOwnership,
          timestamp: Date.now(),
        };
      }

      // Fallback to Find Labs API
      const findLabsResponse = await this.getOwnershipFromFindLabs(address);
      if (findLabsResponse.success && findLabsResponse.data) {
        // Still enhance with verification
        const enhancedOwnership = await this.enhanceWithDapperVerification(findLabsResponse.data);
        
        if (useCache) {
          this.cache.cacheOwnership(address, enhancedOwnership);
        }
        
        return {
          success: true,
          data: enhancedOwnership,
          timestamp: Date.now(),
        };
      }

      // If both sources fail, return cached data if available (even if stale)
      if (useCache) {
        const cached = this.cache.getCachedOwnership(address);
        if (cached) {
          return {
            success: true,
            data: {
              ...cached,
              eligibilityReason: 'Using cached data - unable to verify current ownership',
            },
            timestamp: Date.now(),
          };
        }
      }

      return {
        success: false,
        error: 'Failed to retrieve NFT ownership from all sources',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get ownership data from Find Labs API
   */
  private async getOwnershipFromFindLabs(address: string): Promise<NFTAPIResponse<NFTOwnership>> {
    try {
      const response = await this.findLabsAPI.getNFTsByCollections(address, ['TopShot', 'AllDay']);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to fetch from Find Labs',
          timestamp: Date.now(),
        };
      }

      const moments = response.data.map(nft => 
        this.findLabsAPI.convertToNFTMoment(nft, address)
      );

      const collections = this.extractCollections(moments);

      const ownership: NFTOwnership = {
        address,
        moments,
        collections,
        totalCount: moments.length,
        lastVerified: new Date(),
        isEligible: moments.length > 0,
        eligibilityReason: moments.length === 0 
          ? 'No NBA Top Shot or NFL All Day moments found'
          : undefined,
      };

      return {
        success: true,
        data: ownership,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Find Labs API error',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Verify ownership with Dapper Wallet integration
   * This method specifically checks for Dapper Wallet connection and verifies NFT ownership
   */
  async verifyDapperWalletOwnership(address: string): Promise<NFTAPIResponse<NFTOwnership>> {
    try {
      // Validate Flow address format
      if (!this.validateFlowAddress(address)) {
        return {
          success: false,
          error: 'Invalid Flow address format',
          timestamp: Date.now(),
        };
      }

      // Get comprehensive ownership from Flow blockchain (primary source)
      const flowResponse = await this.flowService.getComprehensiveOwnership(address);
      
      if (flowResponse.success && flowResponse.data) {
        // Enhance with additional verification for Dapper Wallet specific collections
        const enhancedOwnership = await this.enhanceWithDapperVerification(flowResponse.data);
        
        // Cache the verified ownership
        this.cache.cacheOwnership(address, enhancedOwnership);
        
        return {
          success: true,
          data: enhancedOwnership,
          timestamp: Date.now(),
        };
      }

      // Fallback to Find Labs API if Flow queries fail
      const findLabsResponse = await this.getOwnershipFromFindLabs(address);
      
      if (findLabsResponse.success && findLabsResponse.data) {
        // Still enhance with Dapper-specific verification
        const enhancedOwnership = await this.enhanceWithDapperVerification(findLabsResponse.data);
        this.cache.cacheOwnership(address, enhancedOwnership);
        
        return {
          success: true,
          data: enhancedOwnership,
          timestamp: Date.now(),
        };
      }

      return {
        success: false,
        error: 'Unable to verify NFT ownership from any source',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Dapper Wallet verification failed',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Enhance ownership data with Dapper Wallet specific verification
   */
  private async enhanceWithDapperVerification(ownership: NFTOwnership): Promise<NFTOwnership> {
    // Add additional verification for NBA Top Shot and NFL All Day moments
    const verifiedMoments: NFTMoment[] = [];
    
    for (const moment of ownership.moments) {
      try {
        // Verify each moment individually for extra security
        const collection = moment.sport === 'NBA' ? 'TopShot' : 'AllDay';
        const verification = await this.flowService.verifyMomentOwnership(
          ownership.address,
          collection,
          moment.momentId
        );
        
        if (verification.isValid) {
          verifiedMoments.push({
            ...moment,
            // Add verification timestamp
            lastUpdated: new Date(),
          });
        }
      } catch (error) {
        // Log error but don't fail the entire process
        console.warn(`Failed to verify moment ${moment.momentId}:`, error);
        // Include moment anyway if it came from primary source
        verifiedMoments.push(moment);
      }
    }

    return {
      ...ownership,
      moments: verifiedMoments,
      totalCount: verifiedMoments.length,
      lastVerified: new Date(),
      isEligible: verifiedMoments.length > 0,
      eligibilityReason: verifiedMoments.length === 0 
        ? 'No verified NBA Top Shot or NFL All Day moments found'
        : undefined,
    };
  }

  /**
   * Validate Flow address format
   */
  private validateFlowAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{16}$/.test(address);
  }

  private extractCollections(moments: NFTMoment[]) {
    const collectionMap = new Map();

    moments.forEach(moment => {
      if (!collectionMap.has(moment.collectionName)) {
        collectionMap.set(moment.collectionName, {
          contractName: moment.sport === 'NBA' ? 'TopShot' : 'AllDay',
          contractAddress: moment.sport === 'NBA' ? '0x877931736ee77cff' : '0x4dfd62c88d1b6462',
          collectionName: moment.collectionName,
          description: moment.sport === 'NBA' 
            ? 'Officially licensed NBA collectible highlights'
            : 'Officially licensed NFL collectible highlights',
          sport: moment.sport,
          totalSupply: 0,
        });
      }
      
      const collection = collectionMap.get(moment.collectionName);
      collection.totalSupply++;
    });

    return Array.from(collectionMap.values());
  }

  /**
   * Verify ownership of a specific NFT moment
   */
  async verifyMomentOwnership(
    address: string,
    collection: 'TopShot' | 'AllDay',
    momentId: number,
    useCache: boolean = true
  ): Promise<NFTVerificationResult> {
    try {
      const cacheKey = `${address}:${collection}:${momentId}`;
      
      // Check cache first
      if (useCache) {
        const cached = this.cache.getCachedMoment(cacheKey);
        if (cached && cached.ownerAddress === address) {
          return {
            isValid: true,
            owner: address,
            metadata: cached.metadata,
          };
        }
      }

      // Verify through Flow blockchain
      const result = await this.flowService.verifyMomentOwnership(address, collection, momentId);
      
      if (result.isValid) {
        // Fetch and cache the moment metadata
        const metadataResponse = await this.flowService.getMomentMetadata(collection, momentId);
        if (metadataResponse.success && metadataResponse.data) {
          const moment = this.convertFlowMomentToNFTMoment(
            metadataResponse.data,
            address,
            collection
          );
          
          if (useCache) {
            this.cache.cacheMoment(cacheKey, moment);
          }
          
          return {
            isValid: true,
            owner: address,
            metadata: moment.metadata,
          };
        }
      }

      return result;
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  private convertFlowMomentToNFTMoment(
    flowData: any,
    ownerAddress: string,
    collection: 'TopShot' | 'AllDay'
  ): NFTMoment {
    // This would need to be implemented based on the actual Flow data structure
    // For now, return a basic structure
    return {
      id: flowData.id?.toString() || '0',
      momentId: flowData.id || 0,
      playerName: 'Unknown Player',
      team: 'Unknown Team',
      position: 'Unknown',
      sport: collection === 'TopShot' ? 'NBA' : 'NFL',
      rarity: 'Common',
      metadata: {
        name: 'Unknown Moment',
        description: 'Moment data from Flow blockchain',
        image: '',
        attributes: [],
      },
      ownerAddress,
      collectionName: collection === 'TopShot' ? 'NBA Top Shot' : 'NFL All Day',
      lastUpdated: new Date(),
    };
  }

  /**
   * Get Disney Pinnacle NFTs for booster functionality
   */
  async getDisneyPinnacleNFTs(address: string): Promise<NFTAPIResponse<DisneyPinnacleNFT[]>> {
    try {
      // Mock Disney Pinnacle NFTs for demonstration
      // In production, this would integrate with Disney Pinnacle API
      const mockDisneyNFTs: DisneyPinnacleNFT[] = [
        {
          id: "disney_1",
          name: "Mickey Mouse Energy",
          description: "Classic Mickey Mouse NFT that provides energy boost",
          image: "/placeholder.jpg",
          rarity: "Rare",
          collection: "Disney Pinnacle Classic",
          attributes: [
            { trait_type: "Character", value: "Mickey Mouse" },
            { trait_type: "Booster Type", value: "Energy" },
            { trait_type: "Power Level", value: 5 }
          ],
          boosterType: "energy"
        },
        {
          id: "disney_2", 
          name: "Donald Duck Luck",
          description: "Lucky Donald Duck NFT that provides random bonuses",
          image: "/placeholder.jpg",
          rarity: "Epic",
          collection: "Disney Pinnacle Classic",
          attributes: [
            { trait_type: "Character", value: "Donald Duck" },
            { trait_type: "Booster Type", value: "Luck" },
            { trait_type: "Power Level", value: 7 }
          ],
          boosterType: "luck"
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        data: mockDisneyNFTs,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Disney Pinnacle NFTs',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Batch verify ownership for multiple addresses and moments
   */
  async batchVerifyOwnership(
    verifications: Array<{
      address: string;
      collection: 'TopShot' | 'AllDay';
      momentId: number;
    }>
  ): Promise<NFTAPIResponse<Record<string, boolean>>> {
    try {
      const results: Record<string, boolean> = {};
      const uncachedVerifications: typeof verifications = [];

      // Check cache first
      for (const verification of verifications) {
        const key = `${verification.address}:${verification.collection}:${verification.momentId}`;
        const cached = this.cache.getCachedMoment(key);
        
        if (cached && cached.ownerAddress === verification.address) {
          results[key] = true;
        } else {
          uncachedVerifications.push(verification);
        }
      }

      // Batch verify uncached items
      if (uncachedVerifications.length > 0) {
        const batchResponse = await this.flowService.batchVerifyOwnership(uncachedVerifications);
        
        if (batchResponse.success && batchResponse.data) {
          Object.assign(results, batchResponse.data);
        }
      }

      return {
        success: true,
        data: results,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch verification failed',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Refresh ownership data for an address
   */
  async refreshOwnership(address: string): Promise<NFTAPIResponse<NFTOwnership>> {
    // Invalidate cache first
    this.cache.invalidateOwnership(address);
    
    // Fetch fresh data
    return this.getOwnership(address, false);
  }

  /**
   * Get eligible moments for gameplay
   */
  async getEligibleMoments(address: string): Promise<NFTAPIResponse<NFTMoment[]>> {
    const ownershipResponse = await this.getOwnership(address);
    
    if (!ownershipResponse.success || !ownershipResponse.data) {
      return {
        success: false,
        error: ownershipResponse.error || 'Failed to get ownership data',
        timestamp: Date.now(),
      };
    }

    // Filter for game-eligible moments (NBA Top Shot and NFL All Day)
    const eligibleMoments = ownershipResponse.data.moments.filter(moment =>
      moment.sport === 'NBA' || moment.sport === 'NFL'
    );

    return {
      success: true,
      data: eligibleMoments,
      timestamp: Date.now(),
    };
  }

  /**
   * Search moments by player name or team
   */
  async searchMoments(
    address: string,
    query: string,
    sport?: 'NBA' | 'NFL'
  ): Promise<NFTAPIResponse<NFTMoment[]>> {
    const ownershipResponse = await this.getOwnership(address);
    
    if (!ownershipResponse.success || !ownershipResponse.data) {
      return {
        success: false,
        error: ownershipResponse.error || 'Failed to get ownership data',
        timestamp: Date.now(),
      };
    }

    const lowerQuery = query.toLowerCase();
    const filteredMoments = ownershipResponse.data.moments.filter(moment => {
      const matchesQuery = 
        moment.playerName.toLowerCase().includes(lowerQuery) ||
        moment.team.toLowerCase().includes(lowerQuery);
      
      const matchesSport = !sport || moment.sport === sport;
      
      return matchesQuery && matchesSport;
    });

    return {
      success: true,
      data: filteredMoments,
      timestamp: Date.now(),
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getCacheStats();
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clearCache();
  }

  /**
   * Preload ownership data for multiple addresses
   */
  async preloadOwnership(addresses: string[]): Promise<void> {
    await this.cache.preloadOwnership(addresses, (address) => 
      this.getOwnership(address, false)
    );
  }
}

// Default service instance
export const nftOwnershipService = new NFTOwnershipService({
  findLabsApiUrl: process.env.NEXT_PUBLIC_FINDLABS_API_URL,
  findLabsApiKey: process.env.FINDLABS_API_KEY,
  cacheStrategy: 'localStorage',
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 1000,
  enableBatchRequests: true,
  batchSize: 10,
  retryAttempts: 3,
  retryDelay: 1000,
});

// Utility functions
export const validateAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{16}$/.test(address);
};

export const formatMomentId = (momentId: number): string => {
  return `#${momentId.toString().padStart(6, '0')}`;
};

export const getMomentDisplayName = (moment: NFTMoment): string => {
  return `${moment.playerName} - ${moment.team}`;
};

export const getMomentRarityColor = (rarity: string): string => {
  switch (rarity.toLowerCase()) {
    case 'legendary': return 'text-yellow-500';
    case 'epic': return 'text-purple-500';
    case 'rare': return 'text-blue-500';
    case 'common': return 'text-gray-500';
    default: return 'text-gray-500';
  }
};