import { PremiumAccess, PremiumPlan, PremiumFeatures, PremiumAnalytics, PremiumLineup, PlayerProjection, PerformanceTrend, MatchupAnalysis } from '@/lib/types/premium';

class PremiumService {
  private readonly PREMIUM_ACCESS_KEY = 'shotcaller_premium_access';
  private readonly PREMIUM_LINEUPS_KEY = 'shotcaller_premium_lineups';

  // Premium Plans Configuration
  private readonly plans: PremiumPlan[] = [
    {
      id: 'monthly',
      name: 'Monthly Premium',
      description: 'Perfect for trying premium features',
      price: 5,
      duration: 30,
      features: {
        advancedAnalytics: true,
        extraLineupSlots: 2,
        bonusRewardMultiplier: 1.0,
        exclusiveTournaments: false,
        prioritySupport: false,
        personalAnalyticsCoach: false,
      },
    },
    {
      id: 'season',
      name: 'Season Pass',
      description: 'Best value for serious competitors',
      price: 25,
      duration: 180, // ~6 months
      popular: true,
      features: {
        advancedAnalytics: true,
        extraLineupSlots: 3,
        bonusRewardMultiplier: 1.1,
        exclusiveTournaments: true,
        prioritySupport: true,
        personalAnalyticsCoach: false,
      },
    },
    {
      id: 'vip',
      name: 'VIP Access',
      description: 'Ultimate competitive advantage',
      price: 50,
      duration: 180,
      features: {
        advancedAnalytics: true,
        extraLineupSlots: 5,
        bonusRewardMultiplier: 1.2,
        exclusiveTournaments: true,
        prioritySupport: true,
        personalAnalyticsCoach: true,
      },
    },
  ];

  // Get available premium plans
  getPlans(): PremiumPlan[] {
    return this.plans;
  }

  getPlan(planId: string): PremiumPlan | null {
    return this.plans.find(plan => plan.id === planId) || null;
  }

  // Premium Access Management
  async purchasePremium(userAddress: string, planId: string, transactionHash?: string): Promise<PremiumAccess> {
    const plan = this.getPlan(planId);
    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    const access: PremiumAccess = {
      id: `premium_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userAddress,
      accessType: planId as 'monthly' | 'season' | 'vip',
      purchasedAt: now,
      expiresAt,
      status: 'active',
      flowAmount: plan.price,
      transactionHash,
    };

    // Store premium access
    const existingAccess = this.getPremiumAccess();
    const userAccessIndex = existingAccess.findIndex(a => a.userAddress === userAddress);
    
    if (userAccessIndex !== -1) {
      existingAccess[userAccessIndex] = access;
    } else {
      existingAccess.push(access);
    }

    localStorage.setItem(this.PREMIUM_ACCESS_KEY, JSON.stringify(existingAccess));
    return access;
  }

  async getUserPremiumAccess(userAddress: string): Promise<PremiumAccess | null> {
    const allAccess = this.getPremiumAccess();
    const userAccess = allAccess.find(access => 
      access.userAddress === userAddress && 
      access.status === 'active' && 
      new Date(access.expiresAt) > new Date()
    );

    return userAccess || null;
  }

  async renewPremium(userAddress: string, planId: string, transactionHash?: string): Promise<PremiumAccess> {
    const currentAccess = await this.getUserPremiumAccess(userAddress);
    const plan = this.getPlan(planId);
    
    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    const now = new Date();
    const startDate = currentAccess && new Date(currentAccess.expiresAt) > now 
      ? new Date(currentAccess.expiresAt) 
      : now;
    
    const expiresAt = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    return this.purchasePremium(userAddress, planId, transactionHash);
  }

  getUserFeatures(userAddress: string): PremiumFeatures {
    const access = this.getPremiumAccess().find(a => 
      a.userAddress === userAddress && 
      a.status === 'active' && 
      new Date(a.expiresAt) > new Date()
    );

    if (!access) {
      return {
        advancedAnalytics: false,
        extraLineupSlots: 0,
        bonusRewardMultiplier: 1.0,
        exclusiveTournaments: false,
        prioritySupport: false,
        personalAnalyticsCoach: false,
      };
    }

    const plan = this.getPlan(access.accessType);
    return plan?.features || {
      advancedAnalytics: false,
      extraLineupSlots: 0,
      bonusRewardMultiplier: 1.0,
      exclusiveTournaments: false,
      prioritySupport: false,
      personalAnalyticsCoach: false,
    };
  }

  getDaysRemaining(userAddress: string): number {
    const access = this.getPremiumAccess().find(a => 
      a.userAddress === userAddress && 
      a.status === 'active'
    );

    if (!access) return 0;

    const now = new Date();
    const expiresAt = new Date(access.expiresAt);
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  // Premium Analytics
  async getPremiumAnalytics(userAddress: string): Promise<PremiumAnalytics | null> {
    const features = this.getUserFeatures(userAddress);
    
    if (!features.advancedAnalytics) {
      return null;
    }

    // Mock analytics data - in production, this would fetch real data
    return {
      playerProjections: this.generatePlayerProjections(),
      performanceTrends: this.generatePerformanceTrends(),
      matchupAnalysis: this.generateMatchupAnalysis(),
      accuracyScore: 87.5,
      weeklyInsights: [
        "Your lineup scored 15% above average this week",
        "Consider starting more NBA players - they're trending up",
        "Your QB selection has been 92% accurate this season"
      ],
    };
  }

  // Premium Lineup Management
  async savePremiumLineup(userAddress: string, lineup: Omit<PremiumLineup, 'id' | 'createdAt'>): Promise<string> {
    const features = this.getUserFeatures(userAddress);
    const existingLineups = this.getUserPremiumLineups(userAddress);
    
    const maxLineups = 1 + features.extraLineupSlots; // Base 1 + extra slots
    
    if (existingLineups.length >= maxLineups) {
      throw new Error(`Maximum ${maxLineups} lineups allowed for your plan`);
    }

    const id = `lineup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newLineup: PremiumLineup = {
      ...lineup,
      id,
      createdAt: new Date(),
    };

    const allLineups = this.getAllPremiumLineups();
    allLineups.push({ ...newLineup, userAddress });
    
    localStorage.setItem(this.PREMIUM_LINEUPS_KEY, JSON.stringify(allLineups));
    return id;
  }

  getUserPremiumLineups(userAddress: string): PremiumLineup[] {
    const allLineups = this.getAllPremiumLineups();
    return allLineups
      .filter(lineup => lineup.userAddress === userAddress)
      .map(({ userAddress, ...lineup }) => lineup);
  }

  async updatePremiumLineup(userAddress: string, lineupId: string, updates: Partial<PremiumLineup>): Promise<void> {
    const allLineups = this.getAllPremiumLineups();
    const index = allLineups.findIndex(lineup => 
      lineup.id === lineupId && lineup.userAddress === userAddress
    );

    if (index !== -1) {
      allLineups[index] = { ...allLineups[index], ...updates };
      localStorage.setItem(this.PREMIUM_LINEUPS_KEY, JSON.stringify(allLineups));
    }
  }

  async deletePremiumLineup(userAddress: string, lineupId: string): Promise<void> {
    const allLineups = this.getAllPremiumLineups();
    const filtered = allLineups.filter(lineup => 
      !(lineup.id === lineupId && lineup.userAddress === userAddress)
    );
    
    localStorage.setItem(this.PREMIUM_LINEUPS_KEY, JSON.stringify(filtered));
  }

  // Helper methods
  private getPremiumAccess(): PremiumAccess[] {
    try {
      const stored = localStorage.getItem(this.PREMIUM_ACCESS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse premium access:', error);
      return [];
    }
  }

  private getAllPremiumLineups(): (PremiumLineup & { userAddress: string })[] {
    try {
      const stored = localStorage.getItem(this.PREMIUM_LINEUPS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse premium lineups:', error);
      return [];
    }
  }

  // Mock data generators
  private generatePlayerProjections(): PlayerProjection[] {
    return [
      {
        playerName: "LeBron James",
        momentId: 12345,
        projectedPoints: 45.2,
        confidence: 85,
        factors: ["Lakers vs Warriors - high pace game", "LeBron averages 48.5 vs GSW"],
        difficulty: "Easy",
        opponent: "vs Warriors"
      },
      {
        playerName: "Stephen Curry",
        momentId: 12346,
        projectedPoints: 38.5,
        confidence: 78,
        factors: ["Warriors allow 2nd most points to PG", "Back-to-back game fatigue"],
        difficulty: "Medium",
        opponent: "@ Lakers"
      },
      {
        playerName: "Patrick Mahomes",
        momentId: 12347,
        projectedPoints: 22.8,
        confidence: 92,
        factors: ["Chiefs vs Broncos - division rivalry", "Mahomes 85% TD rate vs DEN"],
        difficulty: "Easy",
        opponent: "vs Broncos"
      },
      {
        playerName: "Josh Allen",
        momentId: 12348,
        projectedPoints: 21.5,
        confidence: 76,
        factors: ["Buffalo @ Miami - weather concerns", "Allen struggles in heat"],
        difficulty: "Hard",
        opponent: "@ Dolphins"
      }
    ];
  }

  private generatePerformanceTrends(): PerformanceTrend[] {
    return [
      { week: "W11", points: 156.2, rank: 45, change: 12 },
      { week: "W12", points: 178.5, rank: 23, change: -22 },
      { week: "W13", points: 142.8, rank: 67, change: 44 },
      { week: "W14", points: 189.3, rank: 12, change: -55 },
      { week: "W15", points: 165.7, rank: 34, change: 22 }
    ];
  }

  private generateMatchupAnalysis(): MatchupAnalysis[] {
    return [
      {
        player: "LeBron James",
        opponent: "vs Warriors",
        difficulty: "Easy",
        projectedPoints: 45.2,
        factors: ["Warriors allow 2nd most points to SF", "LeBron averages 48.5 vs GSW"],
        recommendation: "Start"
      },
      {
        player: "Patrick Mahomes",
        opponent: "@ Broncos", 
        difficulty: "Hard",
        projectedPoints: 18.5,
        factors: ["Denver defense ranks 3rd vs QB", "Cold weather game"],
        recommendation: "Consider"
      }
    ];
  }

  // Clear all premium data (for development/testing)
  async clearAllPremiumData(): Promise<void> {
    localStorage.removeItem(this.PREMIUM_ACCESS_KEY);
    localStorage.removeItem(this.PREMIUM_LINEUPS_KEY);
  }
}

// Export singleton instance
export const premiumService = new PremiumService();