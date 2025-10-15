// Mock NFT Data Service for Development
// This provides realistic NBA Top Shot and NFL All Day data for testing

import { NFTMoment, NFTOwnership, NFTCollection } from '@/lib/types/nft';

export interface MockNFTData {
  topShotMoments: NFTMoment[];
  allDayMoments: NFTMoment[];
}

export class MockNFTDataService {
  private static instance: MockNFTDataService;
  private mockData: MockNFTData;

  private constructor() {
    this.mockData = this.generateMockData();
  }

  public static getInstance(): MockNFTDataService {
    if (!MockNFTDataService.instance) {
      MockNFTDataService.instance = new MockNFTDataService();
    }
    return MockNFTDataService.instance;
  }

  private generateMockData(): MockNFTData {
    return {
      topShotMoments: this.generateTopShotMoments(),
      allDayMoments: this.generateAllDayMoments(),
    };
  }

  private generateTopShotMoments(): NFTMoment[] {
    const players = [
      { name: 'LeBron James', team: 'Los Angeles Lakers', position: 'SF', image: '/lebron-james-nba-action.jpg' },
      { name: 'Stephen Curry', team: 'Golden State Warriors', position: 'PG', image: '/stephen-curry-nba-shooting.jpg' },
      { name: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', position: 'PF', image: '/giannis-antetokounmpo-nba-dunk.jpg' },
      { name: 'Luka Dončić', team: 'Dallas Mavericks', position: 'PG', image: '/luka-doncic-nba-basketball.jpg' }
    ];

    return players.map((player, index) => ({
      id: `nba_${index + 1}`,
      momentId: index + 1,
      playerName: player.name,
      team: player.team,
      position: player.position,
      sport: 'NBA' as const,
      rarity: (index === 0 ? 'Legendary' : index === 1 ? 'Epic' : 'Rare') as 'Common' | 'Rare' | 'Epic' | 'Legendary',
      ownerAddress: '0x1234567890abcdef',
      collectionName: 'NBA Top Shot',
      lastUpdated: new Date(),
      metadata: {
        playType: 'Dunk',
        gameDate: '2024-01-15',
        opponent: 'Various',
        description: `${player.name} highlight moment`
      },
      imageUrl: player.image
    }));
  }

  private generateAllDayMoments(): NFTMoment[] {
    const players = [
      { name: 'Patrick Mahomes', team: 'Kansas City Chiefs', position: 'QB', image: '/patrick-mahomes-nfl-throwing.jpg' },
      { name: 'Justin Jefferson', team: 'Minnesota Vikings', position: 'WR', image: '/justin-jefferson-nfl-catching.jpg' }
    ];

    return players.map((player, index) => ({
      id: `nfl_${index + 1}`,
      momentId: index + 100,
      playerName: player.name,
      team: player.team,
      position: player.position,
      sport: 'NFL' as const,
      rarity: (index === 0 ? 'Epic' : 'Rare') as 'Common' | 'Rare' | 'Epic' | 'Legendary',
      ownerAddress: '0x1234567890abcdef',
      collectionName: 'NFL All Day',
      lastUpdated: new Date(),
      metadata: {
        playType: index === 0 ? 'Touchdown Pass' : 'Touchdown Catch',
        gameDate: '2024-01-14',
        opponent: 'Various',
        description: `${player.name} highlight moment`
      },
      imageUrl: player.image
    }));
  }

  public getTopShotMoments(): NFTMoment[] {
    return this.mockData.topShotMoments;
  }

  public getAllDayMoments(): NFTMoment[] {
    return this.mockData.allDayMoments;
  }

  public getAllMoments(): NFTMoment[] {
    return [...this.mockData.topShotMoments, ...this.mockData.allDayMoments];
  }

  public getMomentById(id: string): NFTMoment | undefined {
    return this.getAllMoments().find(moment => moment.id === id);
  }

  public getMomentsByOwner(ownerAddress: string): NFTMoment[] {
    // Mock ownership - return all moments for any address
    return this.getAllMoments();
  }
}