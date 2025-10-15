// React Hook for Booster Management

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { boosterService } from '@/lib/services/booster-service';
import {
  Booster,
  BoosterInventory,
  BoosterMarketplaceItem,
  DisneyPinnacleBooster,
  BoosterActivationRequest,
  BoosterPurchaseRequest
} from '@/lib/types/booster';

export interface UseBoostersReturn {
  // Data
  inventory: BoosterInventory | null;
  marketplaceBoosters: BoosterMarketplaceItem[];
  disneyBoosters: DisneyPinnacleBooster[];
  activeBoosters: Booster[];
  availableBoosters: Booster[];
  
  // State
  isLoading: boolean;
  isActivating: boolean;
  isPurchasing: boolean;
  error: string | null;
  
  // Actions
  loadInventory: (force?: boolean) => Promise<void>;
  loadMarketplace: () => Promise<void>;
  loadDisneyBoosters: () => Promise<void>;
  activateBooster: (boosterId: string, lineupId: string) => Promise<boolean>;
  purchaseBooster: (marketplaceItemId: string, flowAmount: number) => Promise<boolean>;
  deactivateExpired: () => Promise<void>;
  refreshInventory: () => Promise<void>;
  
  // Utilities
  getBoosterEffects: (lineupId: string) => Promise<any[]>;
  getBoosterStats: () => Promise<any>;
  clearError: () => void;
}

export const useBoosters = (): UseBoostersReturn => {
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [inventory, setInventory] = useState<BoosterInventory | null>(null);
  const [marketplaceBoosters, setMarketplaceBoosters] = useState<BoosterMarketplaceItem[]>([]);
  const [disneyBoosters, setDisneyBoosters] = useState<DisneyPinnacleBooster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const activeBoosters = inventory?.activeBoosters || [];
  const availableBoosters = inventory?.availableBoosters || [];

  /**
   * Load user's booster inventory
   */
  const loadInventory = useCallback(async (force: boolean = false) => {
    if (!isAuthenticated || !user.addr) {
      setInventory(null);
      return;
    }

    if (isLoading && !force) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await boosterService.getBoosterInventory(user.addr);
      
      if (response.success && response.data) {
        setInventory(response.data);
      } else {
        setError(response.error || 'Failed to load booster inventory');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user.addr, isLoading]);

  /**
   * Load marketplace boosters
   */
  const loadMarketplace = useCallback(async () => {
    try {
      const response = boosterService.getMarketplaceBoosters();
      
      if (response.success && response.data) {
        setMarketplaceBoosters(response.data);
      } else {
        console.warn('Failed to load marketplace boosters:', response.error);
      }
    } catch (err) {
      console.warn('Failed to load marketplace boosters:', err);
    }
  }, []);

  /**
   * Load Disney Pinnacle boosters
   */
  const loadDisneyBoosters = useCallback(async () => {
    if (!isAuthenticated || !user.addr) {
      setDisneyBoosters([]);
      return;
    }

    try {
      const response = await boosterService.getDisneyPinnacleBoosters(user.addr);
      
      if (response.success && response.data) {
        setDisneyBoosters(response.data);
      } else {
        console.warn('Failed to load Disney boosters:', response.error);
        setDisneyBoosters([]);
      }
    } catch (err) {
      console.warn('Failed to load Disney boosters:', err);
      setDisneyBoosters([]);
    }
  }, [isAuthenticated, user.addr]);

  /**
   * Activate a booster
   */
  const activateBooster = useCallback(async (boosterId: string, lineupId: string): Promise<boolean> => {
    if (!isAuthenticated || !user.addr) {
      setError('User not authenticated');
      return false;
    }

    setIsActivating(true);
    setError(null);

    try {
      const request: BoosterActivationRequest = {
        boosterId,
        lineupId,
        userAddress: user.addr
      };

      const result = await boosterService.activateBooster(request);
      
      if (result.success) {
        // Refresh inventory to show updated status
        await loadInventory(true);
        return true;
      } else {
        setError(result.error || 'Failed to activate booster');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Activation failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsActivating(false);
    }
  }, [isAuthenticated, user.addr, loadInventory]);

  /**
   * Purchase a booster from marketplace
   */
  const purchaseBooster = useCallback(async (marketplaceItemId: string, flowAmount: number): Promise<boolean> => {
    if (!isAuthenticated || !user.addr) {
      setError('User not authenticated');
      return false;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      const request: BoosterPurchaseRequest = {
        marketplaceItemId,
        userAddress: user.addr,
        flowAmount
      };

      const result = await boosterService.purchaseBooster(request);
      
      if (result.success) {
        // Refresh inventory to show new booster
        await loadInventory(true);
        return true;
      } else {
        setError(result.error || 'Failed to purchase booster');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [isAuthenticated, user.addr, loadInventory]);

  /**
   * Deactivate expired boosters
   */
  const deactivateExpired = useCallback(async () => {
    if (!isAuthenticated || !user.addr) return;

    try {
      await boosterService.deactivateExpiredBoosters(user.addr);
      // Refresh inventory to show updated statuses
      await loadInventory(true);
    } catch (err) {
      console.warn('Failed to deactivate expired boosters:', err);
    }
  }, [isAuthenticated, user.addr, loadInventory]);

  /**
   * Refresh inventory (force reload)
   */
  const refreshInventory = useCallback(async () => {
    await loadInventory(true);
  }, [loadInventory]);

  /**
   * Get booster effects for scoring
   */
  const getBoosterEffects = useCallback(async (lineupId: string) => {
    if (!isAuthenticated || !user.addr) return [];

    try {
      return await boosterService.getBoosterEffectsForLineup(user.addr, lineupId);
    } catch (err) {
      console.warn('Failed to get booster effects:', err);
      return [];
    }
  }, [isAuthenticated, user.addr]);

  /**
   * Get booster statistics
   */
  const getBoosterStats = useCallback(async () => {
    if (!isAuthenticated || !user.addr) return null;

    try {
      const response = await boosterService.getBoosterStats(user.addr);
      return response.success ? response.data : null;
    } catch (err) {
      console.warn('Failed to get booster stats:', err);
      return null;
    }
  }, [isAuthenticated, user.addr]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load data on mount and auth changes
  useEffect(() => {
    if (isAuthenticated && user.addr) {
      loadInventory();
      loadDisneyBoosters();
    } else {
      setInventory(null);
      setDisneyBoosters([]);
      setError(null);
    }
  }, [isAuthenticated, user.addr, loadInventory, loadDisneyBoosters]);

  // Load marketplace data on mount
  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  // Auto-refresh every 5 minutes to check for expired boosters
  useEffect(() => {
    if (!isAuthenticated || !user.addr) return;

    const interval = setInterval(() => {
      deactivateExpired();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, user.addr, deactivateExpired]);

  return {
    // Data
    inventory,
    marketplaceBoosters,
    disneyBoosters,
    activeBoosters,
    availableBoosters,
    
    // State
    isLoading,
    isActivating,
    isPurchasing,
    error,
    
    // Actions
    loadInventory,
    loadMarketplace,
    loadDisneyBoosters,
    activateBooster,
    purchaseBooster,
    deactivateExpired,
    refreshInventory,
    
    // Utilities
    getBoosterEffects,
    getBoosterStats,
    clearError
  };
};

// Hook for just active boosters (lighter weight)
export const useActiveBoosters = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeBoosters, setActiveBoosters] = useState<Booster[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadActiveBoosters = useCallback(async () => {
    if (!isAuthenticated || !user.addr) {
      setActiveBoosters([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await boosterService.getActiveBoosters(user.addr);
      if (response.success && response.data) {
        setActiveBoosters(response.data);
      }
    } catch (err) {
      console.warn('Failed to load active boosters:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user.addr]);

  useEffect(() => {
    loadActiveBoosters();
  }, [loadActiveBoosters]);

  return {
    activeBoosters,
    isLoading,
    refresh: loadActiveBoosters
  };
};