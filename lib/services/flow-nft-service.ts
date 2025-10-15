// Enhanced Flow Blockchain Queries for NFT Verification

import { fcl } from '@/lib/flow-config';
import {
  NFTMoment,
  NFTOwnership,
  NFTCollection,
  FlowNFTMoment,
  TopShotMoment,
  AllDayMoment,
  NFTVerificationResult,
  NFTAPIResponse,
  NFTError,
  NFTSport,
  NFTRarity
} from '@/lib/types/nft';

export class FlowNFTService {
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: {
    retryAttempts?: number;
    retryDelay?: number;
  } = {}) {
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  private async executeScript<T>(
    script: string,
    args: any[] = []
  ): Promise<NFTAPIResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await fcl.query({
          cadence: script,
          args: (arg: any, t: any) => args.map(a => arg(a.value, a.type)),
        });

        return {
          success: true,
          data: result,
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
      error: lastError?.message || 'Script execution failed',
      timestamp: Date.now(),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get all NBA Top Shot moments owned by an address
   */
  async getTopShotMoments(address: string): Promise<NFTAPIResponse<TopShotMoment[]>> {
    const script = `
      import TopShot from 0x877931736ee77cff

      pub fun main(address: Address): [TopShot.MomentData] {
        let account = getAccount(address)
        let collectionRef = account.getCapability(/public/MomentCollection)
          .borrow<&{TopShot.MomentCollectionPublic}>()
          ?? return []

        let moments: [TopShot.MomentData] = []
        let ids = collectionRef.getIDs()

        for id in ids {
          if let moment = collectionRef.borrowMoment(id: id) {
            let data = TopShot.getMomentData(id: id)
            moments.append(data)
          }
        }

        return moments
      }
    `;

    const args = [
      { value: address, type: fcl.t.Address }
    ];

    return this.executeScript<TopShotMoment[]>(script, args);
  }

  /**
   * Get all NFL All Day moments owned by an address
   */
  async getAllDayMoments(address: string): Promise<NFTAPIResponse<AllDayMoment[]>> {
    const script = `
      import AllDay from 0x4dfd62c88d1b6462

      pub fun main(address: Address): [AllDay.MomentNFTData] {
        let account = getAccount(address)
        let collectionRef = account.getCapability(/public/MomentCollection)
          .borrow<&{AllDay.MomentNFTCollectionPublic}>()
          ?? return []

        let moments: [AllDay.MomentNFTData] = []
        let ids = collectionRef.getIDs()

        for id in ids {
          if let moment = collectionRef.borrowMomentNFT(id: id) {
            let data = AllDay.getMomentNFTData(id: id)
            moments.append(data)
          }
        }

        return moments
      }
    `;

    const args = [
      { value: address, type: fcl.t.Address }
    ];

    return this.executeScript<AllDayMoment[]>(script, args);
  }

  /**
   * Verify ownership of a specific NFT moment
   */
  async verifyMomentOwnership(
    address: string,
    collection: 'TopShot' | 'AllDay',
    momentId: number
  ): Promise<NFTVerificationResult> {
    try {
      // In development mode, try real verification first, then fall back to mock
      if (process.env.NODE_ENV === 'development') {
        try {
          const realResult = await this.verifyRealMomentOwnership(address, collection, momentId);
          if (realResult.isValid) {
            return realResult;
          }
        } catch (error) {
          console.warn('Real verification failed, using mock data:', error);
        }
        
        // Fall back to mock verification
        return this.verifyMockMomentOwnership(address, collection, momentId);
      }

      // Production mode - only use real verification
      return this.verifyRealMomentOwnership(address, collection, momentId);
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Verify real moment ownership via blockchain
   */
  private async verifyRealMomentOwnership(
    address: string,
    collection: 'TopShot' | 'AllDay',
    momentId: number
  ): Promise<NFTVerificationResult> {
    const script = collection === 'TopShot' 
      ? this.getTopShotOwnershipScript()
      : this.getAllDayOwnershipScript();

    const args = [
      { value: address, type: fcl.t.Address },
      { value: momentId, type: fcl.t.UInt64 }
    ];

    const response = await this.executeScript<boolean>(script, args);

    if (!response.success) {
      return {
        isValid: false,
        error: response.error,
      };
    }

    return {
      isValid: response.data || false,
      owner: response.data ? address : undefined,
    };
  }

  /**
   * Verify mock moment ownership for development
   */
  private verifyMockMomentOwnership(
    address: string,
    collection: 'TopShot' | 'AllDay',
    momentId: number
  ): NFTVerificationResult {
    // Get mock data and check if the moment exists
    const mockData = this.getMockOwnershipData(address);
    
    if (!mockData.success || !mockData.data) {
      return {
        isValid: false,
        error: 'Mock data not available',
      };
    }

    const moment = mockData.data.moments.find(m => 
      m.momentId === momentId && 
      ((collection === 'TopShot' && m.sport === 'NBA') || 
       (collection === 'AllDay' && m.sport === 'NFL'))
    );

    return {
      isValid: !!moment,
      owner: moment ? address : undefined,
      metadata: moment?.metadata,
    };
  }

  private getTopShotOwnershipScript(): string {
    return `
      import TopShot from 0x877931736ee77cff

      pub fun main(address: Address, momentId: UInt64): Bool {
        let account = getAccount(address)
        let collectionRef = account.getCapability(/public/MomentCollection)
          .borrow<&{TopShot.MomentCollectionPublic}>()
          ?? return false

        return collectionRef.borrowMoment(id: momentId) != nil
      }
    `;
  }

  private getAllDayOwnershipScript(): string {
    return `
      import AllDay from 0x4dfd62c88d1b6462

      pub fun main(address: Address, momentId: UInt64): Bool {
        let account = getAccount(address)
        let collectionRef = account.getCapability(/public/MomentCollection)
          .borrow<&{AllDay.MomentNFTCollectionPublic}>()
          ?? return false

        return collectionRef.borrowMomentNFT(id: momentId) != nil
      }
    `;
  }

  /**
   * Get detailed moment metadata from Flow blockchain
   */
  async getMomentMetadata(
    collection: 'TopShot' | 'AllDay',
    momentId: number
  ): Promise<NFTAPIResponse<any>> {
    const script = collection === 'TopShot'
      ? this.getTopShotMetadataScript()
      : this.getAllDayMetadataScript();

    const args = [
      { value: momentId, type: fcl.t.UInt64 }
    ];

    return this.executeScript(script, args);
  }

  private getTopShotMetadataScript(): string {
    return `
      import TopShot from 0x877931736ee77cff

      pub fun main(momentId: UInt64): TopShot.MomentData? {
        return TopShot.getMomentData(id: momentId)
      }
    `;
  }

  private getAllDayMetadataScript(): string {
    return `
      import AllDay from 0x4dfd62c88d1b6462

      pub fun main(momentId: UInt64): AllDay.MomentNFTData? {
        return AllDay.getMomentNFTData(id: momentId)
      }
    `;
  }

  /**
   * Get comprehensive NFT ownership for an address
   */
  async getComprehensiveOwnership(address: string): Promise<NFTAPIResponse<NFTOwnership>> {
    try {
      // In development mode, use mock data if blockchain queries fail
      if (process.env.NODE_ENV === 'development') {
        try {
          const realData = await this.getRealBlockchainData(address);
          if (realData.success && realData.data && realData.data.moments.length > 0) {
            return realData;
          }
        } catch (error) {
          console.warn('Blockchain queries failed, falling back to mock data:', error);
        }
        
        // Fall back to mock data for development
        return this.getMockOwnershipData(address);
      }

      // Production mode - only use real blockchain data
      return this.getRealBlockchainData(address);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get ownership data',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get real blockchain data
   */
  private async getRealBlockchainData(address: string): Promise<NFTAPIResponse<NFTOwnership>> {
    // Fetch both TopShot and AllDay moments in parallel
    const [topShotResponse, allDayResponse] = await Promise.all([
      this.getTopShotMoments(address),
      this.getAllDayMoments(address)
    ]);

    const moments: NFTMoment[] = [];
    const collections: NFTCollection[] = [];

    // Process TopShot moments
    if (topShotResponse.success && topShotResponse.data) {
      const topShotMoments = topShotResponse.data.map(moment => 
        this.convertTopShotToNFTMoment(moment, address)
      );
      moments.push(...topShotMoments);

      if (topShotMoments.length > 0) {
        collections.push({
          contractName: 'TopShot',
          contractAddress: '0x877931736ee77cff',
          collectionName: 'NBA Top Shot',
          description: 'Officially licensed NBA collectible highlights',
          sport: 'NBA',
          totalSupply: topShotMoments.length,
        });
      }
    }

    // Process AllDay moments
    if (allDayResponse.success && allDayResponse.data) {
      const allDayMoments = allDayResponse.data.map(moment => 
        this.convertAllDayToNFTMoment(moment, address)
      );
      moments.push(...allDayMoments);

      if (allDayMoments.length > 0) {
        collections.push({
          contractName: 'AllDay',
          contractAddress: '0x4dfd62c88d1b6462',
          collectionName: 'NFL All Day',
          description: 'Officially licensed NFL collectible highlights',
          sport: 'NFL',
          totalSupply: allDayMoments.length,
        });
      }
    }

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
  }

  /**
   * Get mock ownership data for development
   */
  private getMockOwnershipData(address: string): NFTAPIResponse<NFTOwnership> {
    const mockMoments: NFTMoment[] = [
      // NBA Top Shot moments
      {
        id: '1',
        momentId: 1,
        playerName: 'LeBron James',
        team: 'Los Angeles Lakers',
        position: 'SF',
        sport: 'NBA',
        rarity: 'Legendary',
        metadata: {
          name: 'LeBron James - Dunk',
          description: 'Legendary dunk from the 2023 season',
          image: '/lebron-james-nba-action.jpg',
          attributes: [
            { trait_type: 'Points Per Game', value: 28.5 },
            { trait_type: 'Rebounds Per Game', value: 8.2 },
            { trait_type: 'Assists Per Game', value: 6.8 },
          ],
        },
        imageUrl: '/lebron-james-nba-action.jpg',
        ownerAddress: address,
        collectionName: 'NBA Top Shot',
        serialNumber: 123,
        lastUpdated: new Date(),
      },
      {
        id: '2',
        momentId: 2,
        playerName: 'Stephen Curry',
        team: 'Golden State Warriors',
        position: 'PG',
        sport: 'NBA',
        rarity: 'Rare',
        metadata: {
          name: 'Stephen Curry - 3-Pointer',
          description: 'Amazing 3-pointer from beyond the arc',
          image: '/stephen-curry-nba-shooting.jpg',
          attributes: [
            { trait_type: 'Points Per Game', value: 32.1 },
            { trait_type: 'Rebounds Per Game', value: 4.5 },
            { trait_type: 'Assists Per Game', value: 5.8 },
          ],
        },
        imageUrl: '/stephen-curry-nba-shooting.jpg',
        ownerAddress: address,
        collectionName: 'NBA Top Shot',
        serialNumber: 456,
        lastUpdated: new Date(),
      },
      {
        id: '3',
        momentId: 3,
        playerName: 'Giannis Antetokounmpo',
        team: 'Milwaukee Bucks',
        position: 'PF',
        sport: 'NBA',
        rarity: 'Epic',
        metadata: {
          name: 'Giannis Antetokounmpo - Dunk',
          description: 'Powerful dunk from the Greek Freak',
          image: '/giannis-antetokounmpo-nba-dunk.jpg',
          attributes: [
            { trait_type: 'Points Per Game', value: 31.2 },
            { trait_type: 'Rebounds Per Game', value: 11.8 },
            { trait_type: 'Assists Per Game', value: 5.7 },
          ],
        },
        imageUrl: '/giannis-antetokounmpo-nba-dunk.jpg',
        ownerAddress: address,
        collectionName: 'NBA Top Shot',
        serialNumber: 789,
        lastUpdated: new Date(),
      },
      // NFL All Day moments
      {
        id: '4',
        momentId: 4,
        playerName: 'Patrick Mahomes',
        team: 'Kansas City Chiefs',
        position: 'QB',
        sport: 'NFL',
        rarity: 'Legendary',
        metadata: {
          name: 'Patrick Mahomes - Touchdown Pass',
          description: 'Perfect touchdown pass from the MVP quarterback',
          image: '/patrick-mahomes-nfl-throwing.jpg',
          attributes: [
            { trait_type: 'Passing Yards', value: 4839 },
            { trait_type: 'Touchdowns', value: 37 },
            { trait_type: 'Passer Rating', value: 105.2 },
          ],
        },
        imageUrl: '/patrick-mahomes-nfl-throwing.jpg',
        ownerAddress: address,
        collectionName: 'NFL All Day',
        serialNumber: 101,
        lastUpdated: new Date(),
      },
      {
        id: '5',
        momentId: 5,
        playerName: 'Justin Jefferson',
        team: 'Minnesota Vikings',
        position: 'WR',
        sport: 'NFL',
        rarity: 'Rare',
        metadata: {
          name: 'Justin Jefferson - Touchdown Catch',
          description: 'Spectacular touchdown reception',
          image: '/justin-jefferson-nfl-catching.jpg',
          attributes: [
            { trait_type: 'Receiving Yards', value: 1809 },
            { trait_type: 'Touchdowns', value: 8 },
            { trait_type: 'Receptions', value: 128 },
          ],
        },
        imageUrl: '/justin-jefferson-nfl-catching.jpg',
        ownerAddress: address,
        collectionName: 'NFL All Day',
        serialNumber: 202,
        lastUpdated: new Date(),
      },
    ];

    const collections: NFTCollection[] = [
      {
        contractName: 'TopShot',
        contractAddress: '0x877931736ee77cff',
        collectionName: 'NBA Top Shot',
        description: 'Officially licensed NBA collectible highlights',
        sport: 'NBA',
        totalSupply: 3,
      },
      {
        contractName: 'AllDay',
        contractAddress: '0x4dfd62c88d1b6462',
        collectionName: 'NFL All Day',
        description: 'Officially licensed NFL collectible highlights',
        sport: 'NFL',
        totalSupply: 2,
      },
    ];

    const ownership: NFTOwnership = {
      address,
      moments: mockMoments,
      collections,
      totalCount: mockMoments.length,
      lastVerified: new Date(),
      isEligible: true,
      eligibilityReason: undefined,
    };

    return {
      success: true,
      data: ownership,
      timestamp: Date.now(),
    };
  }

  private convertTopShotToNFTMoment(moment: TopShotMoment, ownerAddress: string): NFTMoment {
    const metadata = moment.play.metadata;
    const playerName = `${metadata.PlayerFirstName} ${metadata.PlayerLastName}`;
    
    // Generate image URL based on NBA Top Shot patterns
    const imageUrl = this.generateTopShotImageUrl(moment.id, moment.play.id);
    
    return {
      id: moment.id.toString(),
      momentId: moment.id,
      playerName,
      team: metadata.TeamAtMoment,
      position: metadata.PlayerPosition,
      sport: 'NBA',
      rarity: this.mapTopShotRarity(moment.play.classification),
      metadata: {
        name: `${playerName} - ${metadata.PlayType}`,
        description: `${metadata.PlayCategory} from ${metadata.DateOfMoment}`,
        image: imageUrl,
        attributes: [
          { trait_type: 'Player', value: playerName },
          { trait_type: 'Team', value: metadata.TeamAtMoment },
          { trait_type: 'Position', value: metadata.PlayerPosition },
          { trait_type: 'Play Type', value: metadata.PlayType },
          { trait_type: 'Play Category', value: metadata.PlayCategory },
          { trait_type: 'Date', value: metadata.DateOfMoment },
          { trait_type: 'Serial Number', value: moment.serialNumber },
          { trait_type: 'Set', value: moment.set.name },
          { trait_type: 'Series', value: moment.set.series },
          { trait_type: 'Points Per Game', value: this.getRandomStat(15, 35) },
          { trait_type: 'Rebounds Per Game', value: this.getRandomStat(3, 12) },
          { trait_type: 'Assists Per Game', value: this.getRandomStat(2, 10) },
        ],
      },
      imageUrl,
      ownerAddress,
      collectionName: 'NBA Top Shot',
      serialNumber: moment.serialNumber,
      lastUpdated: new Date(),
    };
  }

  private convertAllDayToNFTMoment(moment: AllDayMoment, ownerAddress: string): NFTMoment {
    const metadata = moment.play.metadata;
    const playerName = `${metadata.PlayerFirstName} ${metadata.PlayerLastName}`;
    
    // Generate image URL based on NFL All Day patterns
    const imageUrl = this.generateAllDayImageUrl(moment.id, moment.play.id);
    
    return {
      id: moment.id.toString(),
      momentId: moment.id,
      playerName,
      team: metadata.TeamAtMoment,
      position: metadata.PlayerPosition,
      sport: 'NFL',
      rarity: this.mapAllDayRarity(moment.play.classification),
      metadata: {
        name: `${playerName} - ${metadata.PlayType}`,
        description: `${metadata.PlayCategory} from ${metadata.DateOfMoment}`,
        image: imageUrl,
        attributes: [
          { trait_type: 'Player', value: playerName },
          { trait_type: 'Team', value: metadata.TeamAtMoment },
          { trait_type: 'Position', value: metadata.PlayerPosition },
          { trait_type: 'Play Type', value: metadata.PlayType },
          { trait_type: 'Play Category', value: metadata.PlayCategory },
          { trait_type: 'Date', value: metadata.DateOfMoment },
          { trait_type: 'Serial Number', value: moment.serialNumber },
          { trait_type: 'Set', value: moment.set.name },
          { trait_type: 'Series', value: moment.set.series },
          { trait_type: 'Passing Yards', value: this.getRandomStat(200, 400) },
          { trait_type: 'Rushing Yards', value: this.getRandomStat(50, 150) },
          { trait_type: 'Touchdowns', value: this.getRandomStat(1, 4) },
        ],
      },
      imageUrl,
      ownerAddress,
      collectionName: 'NFL All Day',
      serialNumber: moment.serialNumber,
      lastUpdated: new Date(),
    };
  }

  private mapTopShotRarity(classification: string): NFTRarity {
    switch (classification) {
      case 'Ultimate': return 'Legendary';
      case 'Legendary': return 'Legendary';
      case 'Rare': return 'Rare';
      case 'Common': return 'Common';
      default: return 'Common';
    }
  }

  private mapAllDayRarity(classification: string): NFTRarity {
    switch (classification) {
      case 'Ultimate': return 'Legendary';
      case 'Elite': return 'Epic';
      case 'Rare': return 'Rare';
      case 'Common': return 'Common';
      default: return 'Common';
    }
  }

  /**
   * Batch verify multiple NFT ownerships
   */
  async batchVerifyOwnership(
    verifications: Array<{
      address: string;
      collection: 'TopShot' | 'AllDay';
      momentId: number;
    }>
  ): Promise<NFTAPIResponse<Record<string, boolean>>> {
    const results: Record<string, boolean> = {};
    const errors: string[] = [];

    // Process in batches to avoid overwhelming the network
    const batchSize = 10;
    for (let i = 0; i < verifications.length; i += batchSize) {
      const batch = verifications.slice(i, i + batchSize);
      
      const promises = batch.map(async (verification) => {
        const key = `${verification.address}:${verification.collection}:${verification.momentId}`;
        try {
          const result = await this.verifyMomentOwnership(
            verification.address,
            verification.collection,
            verification.momentId
          );
          results[key] = result.isValid;
        } catch (error) {
          errors.push(`Failed to verify ${key}: ${error}`);
          results[key] = false;
        }
      });

      await Promise.all(promises);
      
      // Add delay between batches
      if (i + batchSize < verifications.length) {
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
   * Get collection statistics
   */
  async getCollectionStats(collection: 'TopShot' | 'AllDay'): Promise<NFTAPIResponse<any>> {
    const script = collection === 'TopShot'
      ? this.getTopShotStatsScript()
      : this.getAllDayStatsScript();

    return this.executeScript(script, []);
  }

  private getTopShotStatsScript(): string {
    return `
      import TopShot from 0x877931736ee77cff

      pub fun main(): {String: UInt64} {
        return {
          "totalSupply": TopShot.totalSupply,
          "nextMomentID": TopShot.nextMomentID,
          "nextPlayID": TopShot.nextPlayID,
          "nextSetID": TopShot.nextSetID
        }
      }
    `;
  }

  private getAllDayStatsScript(): string {
    return `
      import AllDay from 0x4dfd62c88d1b6462

      pub fun main(): {String: UInt64} {
        return {
          "totalSupply": AllDay.totalSupply,
          "nextMomentNFTID": AllDay.nextMomentNFTID,
          "nextPlayID": AllDay.nextPlayID,
          "nextSeriesID": AllDay.nextSeriesID,
          "nextSetID": AllDay.nextSetID
        }
      }
    `;
  }

  /**
   * Generate TopShot image URL based on moment and play IDs
   */
  private generateTopShotImageUrl(momentId: number, playId: number): string {
    // Use placeholder images for development
    const images = [
      '/lebron-james-nba-action.jpg',
      '/stephen-curry-nba-shooting.jpg',
      '/giannis-antetokounmpo-nba-dunk.jpg',
      '/luka-doncic-nba-basketball.jpg',
      '/dramatic-nba-basketball-player-dunking-action-shot.jpg'
    ];
    return images[momentId % images.length];
  }

  /**
   * Generate AllDay image URL based on moment and play IDs
   */
  private generateAllDayImageUrl(momentId: number, playId: number): string {
    // Use placeholder images for development
    const images = [
      '/patrick-mahomes-nfl-throwing.jpg',
      '/justin-jefferson-nfl-catching.jpg',
      '/nfl-nba-sports-action-montage-athletes-competing.jpg'
    ];
    return images[momentId % images.length];
  }

  /**
   * Generate random stat for development purposes
   */
  private getRandomStat(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Default instance
export const flowNFTService = new FlowNFTService({
  retryAttempts: 3,
  retryDelay: 1000,
});