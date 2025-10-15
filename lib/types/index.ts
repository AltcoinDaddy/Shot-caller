// Re-export all types from individual type files
export * from './nft';
export * from './marketplace';
export * from './leaderboard';
export * from './booster';
export * from './premium';
export * from './sponsorship';
export * from './player-stats';

// Additional shared types for caching
export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  totalPoints: number;
  seasonRank?: number;
  wins: number;
  losses: number;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Contest {
  id: string;
  weekId: number;
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'active' | 'completed';
  totalParticipants: number;
  rewardsDistributed: boolean;
  entryFee: number;
  prizePool: number;
  maxParticipants?: number;
  contestType: 'free' | 'paid' | 'premium' | 'sponsored';
}

export interface PlayerStats {
  playerName: string;
  gameDate: Date;
  sport: 'NBA' | 'NFL';
  stats: Record<string, number>;
  fantasyPoints: number;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  averageResponseTime: number;
  cacheSize: number;
  memoryUsage: number;
}