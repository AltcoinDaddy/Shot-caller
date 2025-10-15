export interface PremiumAccess {
  id: string;
  userAddress: string;
  accessType: 'monthly' | 'season' | 'vip';
  purchasedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'cancelled';
  flowAmount: number;
  transactionHash?: string;
}

export interface PremiumFeatures {
  advancedAnalytics: boolean;
  extraLineupSlots: number;
  bonusRewardMultiplier: number;
  exclusiveTournaments: boolean;
  prioritySupport: boolean;
  personalAnalyticsCoach: boolean;
}

export interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number; // FLOW tokens
  duration: number; // days
  features: PremiumFeatures;
  popular?: boolean;
}

export interface PlayerProjection {
  playerName: string;
  momentId: number;
  projectedPoints: number;
  confidence: number;
  factors: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  opponent?: string;
}

export interface PerformanceTrend {
  week: string;
  points: number;
  rank: number;
  change: number;
}

export interface MatchupAnalysis {
  player: string;
  opponent: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  projectedPoints: number;
  factors: string[];
  recommendation: 'Start' | 'Sit' | 'Consider';
}

export interface PremiumAnalytics {
  playerProjections: PlayerProjection[];
  performanceTrends: PerformanceTrend[];
  matchupAnalysis: MatchupAnalysis[];
  accuracyScore: number;
  weeklyInsights: string[];
}

export interface PremiumLineup {
  id: string;
  name: string;
  nftIds: number[];
  projectedPoints: number;
  confidence: number;
  isActive: boolean;
  createdAt: Date;
}

export interface PremiumSubscription {
  access: PremiumAccess | null;
  features: PremiumFeatures;
  isActive: boolean;
  daysRemaining: number;
  canRenew: boolean;
}