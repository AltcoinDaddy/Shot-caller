// Leaderboard Service for managing rankings and prize pools
import { 
  LeaderboardEntry, 
  PrizePool, 
  UserRankingHistory, 
  LeaderboardStats,
  ContestLeaderboard,
  LeaderboardTimeframe,
  PrizeDistribution
} from '@/lib/types/leaderboard';

export class LeaderboardService {
  private readonly LEADERBOARD_KEY = 'shotcaller_leaderboard';
  private readonly PRIZE_POOLS_KEY = 'shotcaller_prize_pools';
  private readonly RANKING_HISTORY_KEY = 'shotcaller_ranking_history';
  private readonly STATS_KEY = 'shotcaller_leaderboard_stats';

  // Get current leaderboard
  async getLeaderboard(timeframe: LeaderboardTimeframe = 'season', limit: number = 100): Promise<LeaderboardEntry[]> {
    const entries = this.getStoredLeaderboard();
    
    // Sort by total points (season) or weekly points (weekly)
    const sortedEntries = entries.sort((a, b) => {
      const pointsA = timeframe === 'weekly' ? a.weeklyPoints : a.totalPoints;
      const pointsB = timeframe === 'weekly' ? b.weeklyPoints : b.totalPoints;
      return pointsB - pointsA;
    });

    // Update ranks based on current sorting
    const rankedEntries = sortedEntries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      rankChange: entry.previousRank ? entry.previousRank - (index + 1) : 0
    }));

    return rankedEntries.slice(0, limit);
  }

  // Get user's ranking and stats
  async getUserRanking(userId: string, timeframe: LeaderboardTimeframe = 'season'): Promise<LeaderboardEntry | null> {
    const leaderboard = await this.getLeaderboard(timeframe);
    return leaderboard.find(entry => entry.userId === userId) || null;
  }

  // Update user points and recalculate rankings
  async updateUserPoints(userId: string, weeklyPoints: number, totalPoints: number): Promise<void> {
    const entries = this.getStoredLeaderboard();
    const existingIndex = entries.findIndex(entry => entry.userId === userId);

    if (existingIndex !== -1) {
      // Update existing entry
      const currentEntry = entries[existingIndex];
      entries[existingIndex] = {
        ...currentEntry,
        previousRank: currentEntry.rank,
        weeklyPoints,
        totalPoints,
        lastUpdated: new Date()
      };
    } else {
      // Create new entry (this would typically come from user service)
      const newEntry: LeaderboardEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        rank: 0, // Will be calculated
        userId,
        username: `User${userId.slice(-4)}`,
        walletAddress: `0x${userId}`,
        totalPoints,
        weeklyPoints,
        rankChange: 0,
        nftsUsed: 5,
        wins: 0,
        losses: 0,
        weeklyWins: 0,
        weeklyLosses: 0,
        lastUpdated: new Date()
      };
      entries.push(newEntry);
    }

    this.saveLeaderboard(entries);
    await this.recalculateRankings();
  }

  // Recalculate all rankings
  private async recalculateRankings(): Promise<void> {
    const entries = this.getStoredLeaderboard();
    
    // Sort by total points
    const sorted = entries.sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Update ranks
    const updated = sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      rankChange: entry.previousRank ? entry.previousRank - (index + 1) : 0
    }));

    this.saveLeaderboard(updated);
  }

  // Get prize pool for contest
  async getPrizePool(contestId: string): Promise<PrizePool | null> {
    const prizePools = this.getStoredPrizePools();
    return prizePools.find(pool => pool.contestId === contestId) || null;
  }

  // Create or update prize pool
  async createPrizePool(prizePool: Omit<PrizePool, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const prizePools = this.getStoredPrizePools();
    const id = `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newPrizePool: PrizePool = {
      ...prizePool,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    prizePools.push(newPrizePool);
    this.savePrizePools(prizePools);
    
    return id;
  }

  // Get user ranking history
  async getUserRankingHistory(userId: string, limit: number = 10): Promise<UserRankingHistory[]> {
    const history = this.getStoredRankingHistory();
    return history
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.weekId - a.weekId)
      .slice(0, limit);
  }

  // Add ranking history entry
  async addRankingHistory(entry: Omit<UserRankingHistory, 'id' | 'createdAt'>): Promise<void> {
    const history = this.getStoredRankingHistory();
    const id = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newEntry: UserRankingHistory = {
      ...entry,
      id,
      createdAt: new Date()
    };

    history.push(newEntry);
    this.saveRankingHistory(history);
  }

  // Get leaderboard statistics
  async getLeaderboardStats(): Promise<LeaderboardStats> {
    const entries = this.getStoredLeaderboard();
    const prizePools = this.getStoredPrizePools();
    
    const totalUsers = entries.length;
    const averagePoints = totalUsers > 0 ? entries.reduce((sum, entry) => sum + entry.totalPoints, 0) / totalUsers : 0;
    const topScore = totalUsers > 0 ? Math.max(...entries.map(entry => entry.totalPoints)) : 0;
    const totalPrizePool = prizePools.reduce((sum, pool) => sum + pool.totalPool, 0);
    const activeContests = prizePools.length; // Simplified for now
    const weeklyParticipants = entries.filter(entry => entry.weeklyPoints > 0).length;

    return {
      totalUsers,
      averagePoints: Math.round(averagePoints),
      topScore,
      totalPrizePool,
      activeContests,
      weeklyParticipants
    };
  }

  // Get contest leaderboard with prize pool
  async getContestLeaderboard(contestId: string): Promise<ContestLeaderboard | null> {
    const prizePool = await this.getPrizePool(contestId);
    if (!prizePool) return null;

    const entries = await this.getLeaderboard('weekly');
    
    // Mock contest data - in real implementation, this would come from contest service
    return {
      contestId,
      contestName: `Week ${Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))} Contest`,
      weekId: Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)),
      startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: 'active',
      entries,
      prizePool,
      totalParticipants: entries.length,
      entryFee: 10
    };
  }

  // Initialize with mock data
  async initializeMockData(): Promise<void> {
    const entries = this.getStoredLeaderboard();
    
    if (entries.length === 0) {
      const mockEntries: LeaderboardEntry[] = [
        {
          id: 'entry_1',
          rank: 1,
          userId: 'user_1',
          username: 'CryptoKing23',
          walletAddress: '0x1234567890abcdef',
          totalPoints: 1847,
          weeklyPoints: 342,
          rankChange: 2,
          nftsUsed: 5,
          wins: 12,
          losses: 3,
          weeklyWins: 3,
          weeklyLosses: 0,
          lastUpdated: new Date()
        },
        {
          id: 'entry_2',
          rank: 2,
          userId: 'user_2',
          username: 'NFTCollector',
          walletAddress: '0x2234567890abcdef',
          totalPoints: 1823,
          weeklyPoints: 298,
          rankChange: -1,
          nftsUsed: 5,
          wins: 11,
          losses: 4,
          weeklyWins: 2,
          weeklyLosses: 1,
          lastUpdated: new Date()
        },
        {
          id: 'entry_3',
          rank: 3,
          userId: 'user_3',
          username: 'SportsGuru',
          walletAddress: '0x3234567890abcdef',
          totalPoints: 1789,
          weeklyPoints: 315,
          rankChange: 1,
          nftsUsed: 5,
          wins: 10,
          losses: 5,
          weeklyWins: 3,
          weeklyLosses: 0,
          lastUpdated: new Date()
        },
        {
          id: 'entry_4',
          rank: 4,
          userId: 'user_4',
          username: 'BlockchainBaller',
          walletAddress: '0x4234567890abcdef',
          totalPoints: 1756,
          weeklyPoints: 289,
          rankChange: 0,
          nftsUsed: 5,
          wins: 9,
          losses: 6,
          weeklyWins: 2,
          weeklyLosses: 1,
          lastUpdated: new Date()
        },
        {
          id: 'entry_5',
          rank: 5,
          userId: 'user_5',
          username: 'TopShotPro',
          walletAddress: '0x5234567890abcdef',
          totalPoints: 1734,
          weeklyPoints: 327,
          rankChange: 3,
          nftsUsed: 5,
          wins: 8,
          losses: 7,
          weeklyWins: 3,
          weeklyLosses: 0,
          lastUpdated: new Date()
        }
      ];

      // Add more entries for a fuller leaderboard
      for (let i = 6; i <= 50; i++) {
        mockEntries.push({
          id: `entry_${i}`,
          rank: i,
          userId: `user_${i}`,
          username: `Player${i}`,
          walletAddress: `0x${i}234567890abcdef`,
          totalPoints: Math.max(1000, 1800 - (i * 15) + Math.floor(Math.random() * 100)),
          weeklyPoints: Math.floor(Math.random() * 400) + 200,
          rankChange: Math.floor(Math.random() * 6) - 3,
          nftsUsed: Math.floor(Math.random() * 5) + 1,
          wins: Math.floor(Math.random() * 15),
          losses: Math.floor(Math.random() * 10),
          weeklyWins: Math.floor(Math.random() * 4),
          weeklyLosses: Math.floor(Math.random() * 3),
          lastUpdated: new Date()
        });
      }

      this.saveLeaderboard(mockEntries);
    }

    // Initialize mock prize pools
    const prizePools = this.getStoredPrizePools();
    if (prizePools.length === 0) {
      const mockPrizePool: PrizePool = {
        id: 'pool_1',
        contestId: 'contest_1',
        totalPool: 10000,
        currency: 'FLOW',
        distribution: [
          {
            rank: 1,
            percentage: 25,
            amount: 2500,
            currency: 'FLOW',
            nftReward: {
              collection: 'ShotCaller Legends',
              rarity: 'Legendary',
              description: 'Exclusive Champion NFT'
            }
          },
          {
            rank: 2,
            percentage: 15,
            amount: 1500,
            currency: 'FLOW',
            nftReward: {
              collection: 'ShotCaller Elite',
              rarity: 'Epic',
              description: 'Runner-up NFT'
            }
          },
          {
            rank: 3,
            percentage: 10,
            amount: 1000,
            currency: 'FLOW',
            nftReward: {
              collection: 'ShotCaller Elite',
              rarity: 'Rare',
              description: 'Third place NFT'
            }
          },
          {
            rankRange: { min: 4, max: 10 },
            percentage: 30,
            amount: 3000,
            currency: 'FLOW'
          },
          {
            rankRange: { min: 11, max: 50 },
            percentage: 20,
            amount: 2000,
            currency: 'FLOW'
          }
        ],
        sponsored: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prizePools.push(mockPrizePool);
      this.savePrizePools(prizePools);
    }
  }

  // Storage helpers
  private getStoredLeaderboard(): LeaderboardEntry[] {
    try {
      const stored = localStorage.getItem(this.LEADERBOARD_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse stored leaderboard:', error);
      return [];
    }
  }

  private saveLeaderboard(entries: LeaderboardEntry[]): void {
    localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(entries));
  }

  private getStoredPrizePools(): PrizePool[] {
    try {
      const stored = localStorage.getItem(this.PRIZE_POOLS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse stored prize pools:', error);
      return [];
    }
  }

  private savePrizePools(pools: PrizePool[]): void {
    localStorage.setItem(this.PRIZE_POOLS_KEY, JSON.stringify(pools));
  }

  private getStoredRankingHistory(): UserRankingHistory[] {
    try {
      const stored = localStorage.getItem(this.RANKING_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse stored ranking history:', error);
      return [];
    }
  }

  private saveRankingHistory(history: UserRankingHistory[]): void {
    localStorage.setItem(this.RANKING_HISTORY_KEY, JSON.stringify(history));
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();

// Initialize mock data on first load
if (typeof window !== 'undefined') {
  leaderboardService.initializeMockData().catch(console.error);
}