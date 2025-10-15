import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { premiumService } from '@/lib/services/premium-service';
import { PremiumAccess, PremiumFeatures, PremiumPlan, PremiumAnalytics, PremiumLineup, PremiumSubscription } from '@/lib/types/premium';

export const usePremium = () => {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<PremiumSubscription>({
    access: null,
    features: {
      advancedAnalytics: false,
      extraLineupSlots: 0,
      bonusRewardMultiplier: 1.0,
      exclusiveTournaments: false,
      prioritySupport: false,
      personalAnalyticsCoach: false,
    },
    isActive: false,
    daysRemaining: 0,
    canRenew: false,
  });
  
  const [analytics, setAnalytics] = useState<PremiumAnalytics | null>(null);
  const [lineups, setLineups] = useState<PremiumLineup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load premium data when user changes
  useEffect(() => {
    if (isAuthenticated && user.addr) {
      loadPremiumData();
    } else {
      resetPremiumData();
    }
  }, [isAuthenticated, user.addr]);

  const loadPremiumData = async () => {
    if (!user.addr) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load premium access
      const access = await premiumService.getUserPremiumAccess(user.addr);
      const features = premiumService.getUserFeatures(user.addr);
      const daysRemaining = premiumService.getDaysRemaining(user.addr);

      setSubscription({
        access,
        features,
        isActive: !!access,
        daysRemaining,
        canRenew: daysRemaining <= 30, // Allow renewal 30 days before expiry
      });

      // Load analytics if premium
      if (features.advancedAnalytics) {
        const analyticsData = await premiumService.getPremiumAnalytics(user.addr);
        setAnalytics(analyticsData);
      }

      // Load premium lineups
      const userLineups = premiumService.getUserPremiumLineups(user.addr);
      setLineups(userLineups);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load premium data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPremiumData = () => {
    setSubscription({
      access: null,
      features: {
        advancedAnalytics: false,
        extraLineupSlots: 0,
        bonusRewardMultiplier: 1.0,
        exclusiveTournaments: false,
        prioritySupport: false,
        personalAnalyticsCoach: false,
      },
      isActive: false,
      daysRemaining: 0,
      canRenew: false,
    });
    setAnalytics(null);
    setLineups([]);
    setError(null);
  };

  // Purchase premium
  const purchasePremium = useCallback(async (planId: string, transactionHash?: string): Promise<PremiumAccess> => {
    if (!user.addr) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would integrate with Flow wallet
      // For now, we'll use the service directly
      const access = await premiumService.purchasePremium(user.addr, planId, transactionHash);
      await loadPremiumData(); // Reload data after purchase
      return access;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to purchase premium';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user.addr]);

  // Renew premium
  const renewPremium = useCallback(async (planId: string, transactionHash?: string): Promise<PremiumAccess> => {
    if (!user.addr) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const access = await premiumService.renewPremium(user.addr, planId, transactionHash);
      await loadPremiumData(); // Reload data after renewal
      return access;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to renew premium';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user.addr]);

  // Premium lineup management
  const createLineup = useCallback(async (lineup: Omit<PremiumLineup, 'id' | 'createdAt'>): Promise<string> => {
    if (!user.addr) {
      throw new Error('User not authenticated');
    }

    try {
      const lineupId = await premiumService.savePremiumLineup(user.addr, lineup);
      await loadPremiumData(); // Reload lineups
      return lineupId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create lineup';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user.addr]);

  const updateLineup = useCallback(async (lineupId: string, updates: Partial<PremiumLineup>): Promise<void> => {
    if (!user.addr) {
      throw new Error('User not authenticated');
    }

    try {
      await premiumService.updatePremiumLineup(user.addr, lineupId, updates);
      await loadPremiumData(); // Reload lineups
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update lineup';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user.addr]);

  const deleteLineup = useCallback(async (lineupId: string): Promise<void> => {
    if (!user.addr) {
      throw new Error('User not authenticated');
    }

    try {
      await premiumService.deletePremiumLineup(user.addr, lineupId);
      await loadPremiumData(); // Reload lineups
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete lineup';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user.addr]);

  // Refresh data
  const refresh = useCallback(async () => {
    if (isAuthenticated && user.addr) {
      await loadPremiumData();
    }
  }, [isAuthenticated, user.addr]);

  // Get available plans
  const getPlans = useCallback((): PremiumPlan[] => {
    return premiumService.getPlans();
  }, []);

  const getPlan = useCallback((planId: string): PremiumPlan | null => {
    return premiumService.getPlan(planId);
  }, []);

  // Helper methods
  const canCreateLineup = subscription.features.extraLineupSlots > lineups.length;
  const maxLineups = 1 + subscription.features.extraLineupSlots;
  const isExpiringSoon = subscription.daysRemaining <= 7 && subscription.daysRemaining > 0;

  return {
    // Subscription data
    subscription,
    analytics,
    lineups,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    purchasePremium,
    renewPremium,
    createLineup,
    updateLineup,
    deleteLineup,
    refresh,
    
    // Plan information
    getPlans,
    getPlan,
    
    // Helper properties
    isPremium: subscription.isActive,
    features: subscription.features,
    daysRemaining: subscription.daysRemaining,
    canRenew: subscription.canRenew,
    canCreateLineup,
    maxLineups,
    isExpiringSoon,
    
    // Quick feature checks
    hasAdvancedAnalytics: subscription.features.advancedAnalytics,
    hasExtraLineups: subscription.features.extraLineupSlots > 0,
    hasBonusRewards: subscription.features.bonusRewardMultiplier > 1.0,
    hasExclusiveTournaments: subscription.features.exclusiveTournaments,
    hasPrioritySupport: subscription.features.prioritySupport,
    hasPersonalCoach: subscription.features.personalAnalyticsCoach,
  };
};