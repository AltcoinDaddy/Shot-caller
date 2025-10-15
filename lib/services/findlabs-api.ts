// Find Labs API Integration for NFT Metadata and Ownership Queries

import { 
  FindLabsNFT, 
  FindLabsResponse, 
  NFTMoment, 
  NFTMetadata, 
  NFTAttribute,
  NFTAPIResponse,
  PaginatedNFTResponse,
  FindLabsAPIError,
  NFTSport,
  NFTRarity
} from '@/lib/types/nft';

export class FindLabsAPI {
  private baseUrl: string;
  private apiKey?: string;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: {
    baseUrl?: string;
    apiKey?: string;
    retryAttempts?: number;
    retryDelay?: number;
  } = {}) {
    this.baseUrl = config.baseUrl || 'https://api.find.xyz';
    this.apiKey = config.apiKey;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<NFTAPIResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (!response.ok) {
          throw new FindLabsAPIError(
            `API request failed: ${response.status} ${response.statusText}`,
            {
              status: response.status,
              statusText: response.statusText,
              url,
            }
          );
        }

        const data = await response.json();
        return {
          success: true,
          data,
          timestamp: Date.now(),
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error occurred',
      timestamp: Date.now(),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get all NFTs owned by a specific address
   */
  async getNFTsByAddress(address: string): Promise<NFTAPIResponse<FindLabsResponse>> {
    if (!address) {
      return {
        success: false,
        error: 'Address is required',
        timestamp: Date.now(),
      };
    }

    return this.makeRequest<FindLabsResponse>(`/nfts/${address}`);
  }

  /**
   * Get specific NFT by collection and ID
   */
  async getNFTById(
    collection: string,
    tokenId: string
  ): Promise<NFTAPIResponse<FindLabsNFT>> {
    if (!collection || !tokenId) {
      return {
        success: false,
        error: 'Collection and token ID are required',
        timestamp: Date.now(),
      };
    }

    return this.makeRequest<FindLabsNFT>(`/nfts/${collection}/${tokenId}`);
  }

  /**
   * Get NFTs from specific collections (NBA Top Shot, NFL All Day)
   */
  async getNFTsByCollections(
    address: string,
    collections: string[] = ['TopShot', 'AllDay']
  ): Promise<NFTAPIResponse<FindLabsNFT[]>> {
    const response = await this.getNFTsByAddress(address);
    
    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to fetch NFTs',
        timestamp: Date.now(),
      };
    }

    const filteredNFTs = response.data.items.filter(nft =>
      collections.some(collection => 
        nft.collectionName.toLowerCase().includes(collection.toLowerCase())
      )
    );

    return {
      success: true,
      data: filteredNFTs,
      timestamp: Date.now(),
    };
  }

  /**
   * Convert Find Labs NFT to our NFTMoment format
   */
  convertToNFTMoment(findLabsNFT: FindLabsNFT, ownerAddress: string): NFTMoment {
    const metadata = this.parseNFTMetadata(findLabsNFT);
    const sport = this.determineSport(findLabsNFT.collectionName);
    const rarity = this.determineRarity(findLabsNFT.metadata);

    return {
      id: findLabsNFT.id,
      momentId: parseInt(findLabsNFT.id) || 0,
      playerName: this.extractPlayerName(findLabsNFT.metadata),
      team: this.extractTeam(findLabsNFT.metadata),
      position: this.extractPosition(findLabsNFT.metadata),
      sport,
      rarity,
      metadata,
      imageUrl: findLabsNFT.thumbnail,
      videoUrl: findLabsNFT.externalURL,
      ownerAddress,
      collectionName: findLabsNFT.collectionName,
      serialNumber: this.extractSerialNumber(findLabsNFT.metadata),
      totalSupply: this.extractTotalSupply(findLabsNFT.metadata),
      lastUpdated: new Date(),
    };
  }

  private parseNFTMetadata(findLabsNFT: FindLabsNFT): NFTMetadata {
    const attributes: NFTAttribute[] = [];

    // Convert metadata to attributes
    if (findLabsNFT.metadata) {
      Object.entries(findLabsNFT.metadata).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          attributes.push({
            trait_type: key,
            value: String(value),
          });
        }
      });
    }

    return {
      name: findLabsNFT.name,
      description: findLabsNFT.description,
      image: findLabsNFT.thumbnail,
      video: findLabsNFT.externalURL,
      attributes,
      externalUrl: findLabsNFT.externalURL,
    };
  }

  private determineSport(collectionName: string): NFTSport {
    const lowerName = collectionName.toLowerCase();
    if (lowerName.includes('topshot') || lowerName.includes('nba')) {
      return 'NBA';
    }
    if (lowerName.includes('allday') || lowerName.includes('nfl')) {
      return 'NFL';
    }
    return 'NBA'; // Default fallback
  }

  private determineRarity(metadata: Record<string, any>): NFTRarity {
    const rarity = metadata.rarity || metadata.Rarity || metadata.tier || metadata.Tier;
    
    if (typeof rarity === 'string') {
      const lowerRarity = rarity.toLowerCase();
      if (lowerRarity.includes('legendary')) return 'Legendary';
      if (lowerRarity.includes('epic')) return 'Epic';
      if (lowerRarity.includes('rare')) return 'Rare';
      if (lowerRarity.includes('ultimate')) return 'Legendary';
      if (lowerRarity.includes('elite')) return 'Epic';
    }

    return 'Common'; // Default fallback
  }

  private extractPlayerName(metadata: Record<string, any>): string {
    const firstName = metadata.PlayerFirstName || metadata.playerFirstName || '';
    const lastName = metadata.PlayerLastName || metadata.playerLastName || '';
    const fullName = metadata.PlayerName || metadata.playerName || '';
    
    if (fullName) return fullName;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    
    return metadata.name || 'Unknown Player';
  }

  private extractTeam(metadata: Record<string, any>): string {
    return metadata.TeamAtMoment || 
           metadata.teamAtMoment || 
           metadata.Team || 
           metadata.team || 
           'Unknown Team';
  }

  private extractPosition(metadata: Record<string, any>): string {
    return metadata.PlayerPosition || 
           metadata.playerPosition || 
           metadata.Position || 
           metadata.position || 
           'Unknown';
  }

  private extractSerialNumber(metadata: Record<string, any>): number | undefined {
    const serial = metadata.SerialNumber || 
                  metadata.serialNumber || 
                  metadata.serial || 
                  metadata.Serial;
    
    return serial ? parseInt(String(serial)) : undefined;
  }

  private extractTotalSupply(metadata: Record<string, any>): number | undefined {
    const supply = metadata.TotalSupply || 
                  metadata.totalSupply || 
                  metadata.supply || 
                  metadata.Supply;
    
    return supply ? parseInt(String(supply)) : undefined;
  }

  /**
   * Batch fetch NFTs for multiple addresses
   */
  async batchGetNFTs(
    addresses: string[],
    collections?: string[]
  ): Promise<NFTAPIResponse<Record<string, FindLabsNFT[]>>> {
    if (!addresses.length) {
      return {
        success: false,
        error: 'No addresses provided',
        timestamp: Date.now(),
      };
    }

    const results: Record<string, FindLabsNFT[]> = {};
    const errors: string[] = [];

    // Process addresses in parallel with rate limiting
    const batchSize = 5; // Limit concurrent requests
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      
      const promises = batch.map(async (address) => {
        try {
          const response = collections 
            ? await this.getNFTsByCollections(address, collections)
            : await this.getNFTsByAddress(address);
          
          if (response.success && response.data) {
            results[address] = Array.isArray(response.data) 
              ? response.data 
              : response.data.items || [];
          } else {
            errors.push(`Failed to fetch NFTs for ${address}: ${response.error}`);
            results[address] = [];
          }
        } catch (error) {
          errors.push(`Error fetching NFTs for ${address}: ${error}`);
          results[address] = [];
        }
      });

      await Promise.all(promises);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < addresses.length) {
        await this.delay(500);
      }
    }

    return {
      success: errors.length === 0,
      data: results,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      timestamp: Date.now(),
    };
  }

  /**
   * Search NFTs by player name or team
   */
  async searchNFTs(
    query: string,
    sport?: NFTSport,
    limit: number = 50
  ): Promise<NFTAPIResponse<PaginatedNFTResponse<FindLabsNFT>>> {
    // This would typically use a search endpoint
    // For now, we'll implement a basic search by fetching and filtering
    // In a real implementation, this would use Find Labs search API
    
    return {
      success: false,
      error: 'Search functionality not yet implemented',
      timestamp: Date.now(),
    };
  }

  /**
   * Get collection information
   */
  async getCollectionInfo(collectionName: string): Promise<NFTAPIResponse<any>> {
    return this.makeRequest(`/collections/${collectionName}`);
  }

  /**
   * Verify NFT ownership
   */
  async verifyOwnership(
    address: string,
    collection: string,
    tokenId: string
  ): Promise<NFTAPIResponse<boolean>> {
    const response = await this.getNFTsByAddress(address);
    
    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to verify ownership',
        timestamp: Date.now(),
      };
    }

    const ownsNFT = response.data.items.some(nft => 
      nft.collectionName === collection && nft.id === tokenId
    );

    return {
      success: true,
      data: ownsNFT,
      timestamp: Date.now(),
    };
  }
}

// Default instance
export const findLabsAPI = new FindLabsAPI({
  baseUrl: process.env.NEXT_PUBLIC_FINDLABS_API_URL || 'https://api.find.xyz',
  apiKey: process.env.FINDLABS_API_KEY,
  retryAttempts: 3,
  retryDelay: 1000,
});

// Utility functions
export const isTopShotNFT = (nft: FindLabsNFT): boolean => {
  return nft.collectionName.toLowerCase().includes('topshot') ||
         nft.collectionName.toLowerCase().includes('nba');
};

export const isAllDayNFT = (nft: FindLabsNFT): boolean => {
  return nft.collectionName.toLowerCase().includes('allday') ||
         nft.collectionName.toLowerCase().includes('nfl');
};

export const isGameEligibleNFT = (nft: FindLabsNFT): boolean => {
  return isTopShotNFT(nft) || isAllDayNFT(nft);
};