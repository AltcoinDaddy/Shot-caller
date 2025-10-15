// Leaderboard and ranking types

export interface LeaderboardEntry {
  id: string;
  rank: number;
  userId: string;
  username: string;
  walletAddress: string;
  avatar?: string;
  totalPoints: number;
  weeklyPoints: number;
  previousRank?: number;
  rankChange: number;
  nftsUsed: number;
  wins: number;
  losses: number;
  weeklyWins: number;
  weeklyLosses: number;
  lastUpdated: Date;
}

export interface PrizePool {
  id: string;
  contestId: string;
  totalPool: number;
  currency: 'FLOW' | 'USD';
  distribution: PrizeDistribution[];
  sponsored: boolean;
  sponsorName?: string;
  sponsorLogo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrizeDistribution {
  rank: number;
  rankRange?: { min: number; max: number };
  percentage: number;
  amount: number;
  currency: 'FLOW' | 'USD';
  nftReward?: {
    collection: string;
    rarity: string;
    description: string;
  };
}

export interface UserRankingHistory {
  id: string;
  userId: string;
  weekId: number;
  rank: number;
  points: number;
  nftsUsed: number;
  contestsEntered: number;
  contestsWon: number;
  rewardsEarned: number;
  createdAt: Date;
}

export interface LeaderboardStats {
  totalUsers: number;
  averagePoints: number;
  topScore: number;
  totalPrizePool: number;
  activeContests: number;
  weeklyParticipants: number;
}

export interface ContestLeaderboard {
  contestId: string;
  contestName: string;
  weekId: number;
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'active' | 'completed';
  entries: LeaderboardEntry[];
  prizePool: PrizePool;
  totalParticipants: number;
  entryFee: number;
}

export type LeaderboardTimeframe = 'weekly' | 'season' | 'all-time';
export type LeaderboardSortBy = 'points' | 'rank' | 'wins' | 'winRate';