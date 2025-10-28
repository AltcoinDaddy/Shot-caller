"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { walletProfileSyncManager } from "@/lib/services/wallet-profile-sync-manager";
import { toast } from "@/hooks/use-toast";

export interface ManualSyncState {
  isManualSyncing: boolean;
  lastManualSync: Date | null;
  syncError: string | null;
}

export interface ManualSyncActions {
  triggerManualSync: (force?: boolean) => Promise<void>;
  triggerNFTSync: () => Promise<void>;
  triggerProfileSync: () => Promise<void>;
  clearSyncError: () => void;
}

export interface ManualSyncConfig {
  showSuccessToast: boolean;
  showErrorToast: boolean;
  autoRetry: boolean;
  retryDelay: number;
}

export function useManualSync(config?: Partial<ManualSyncConfig>): ManualSyncState & ManualSyncActions {
  const { isAuthenticated, user, syncStatus } = useAuth();
  
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastManualSync, setLastManualSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const defaultConfig: ManualSyncConfig = {
    showSuccessToast: true,
    showErrorToast: true,
    autoRetry: false,
    retryDelay: 3000,
    ...config
  };

  /**
   * Trigger manual full sync
   */
  const triggerManualSync = useCallback(async (force = true) => {
    if (!isAuthenticated || !user.addr || isManualSyncing) {
      return;
    }

    setIsManualSyncing(true);
    setSyncError(null);

    try {
      const result = await walletProfileSyncManager.manualSync(force);
      
      if (result.success) {
        setLastManualSync(new Date());
        
        if (defaultConfig.showSuccessToast) {
          toast({
            title: "Sync Complete",
            description: `Profile synchronized successfully in ${result.duration}ms`,
          });
        }
      } else {
        throw new Error('Sync completed but reported failure');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      setSyncError(errorMessage);
      
      if (defaultConfig.showErrorToast) {
        toast({
          title: "Sync Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }

      // Auto-retry if configured
      if (defaultConfig.autoRetry) {
        setTimeout(() => {
          triggerManualSync(force);
        }, defaultConfig.retryDelay);
      }
    } finally {
      setIsManualSyncing(false);
    }
  }, [isAuthenticated, user.addr, isManualSyncing, defaultConfig]);

  /**
   * Trigger NFT collection sync only
   */
  const triggerNFTSync = useCallback(async () => {
    if (!isAuthenticated || !user.addr || isManualSyncing) {
      return;
    }

    setIsManualSyncing(true);
    setSyncError(null);

    try {
      const result = await walletProfileSyncManager.syncNFTCollection(user.addr);
      
      if (result.success) {
        setLastManualSync(new Date());
        
        if (defaultConfig.showSuccessToast) {
          toast({
            title: "NFT Collection Updated",
            description: `Found ${result.collectionCount} NFTs (${result.eligibleMoments} eligible)`,
          });
        }
      } else {
        throw new Error('NFT sync completed but reported failure');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'NFT sync error';
      setSyncError(errorMessage);
      
      if (defaultConfig.showErrorToast) {
        toast({
          title: "NFT Sync Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsManualSyncing(false);
    }
  }, [isAuthenticated, user.addr, isManualSyncing, defaultConfig]);

  /**
   * Trigger profile stats sync only
   */
  const triggerProfileSync = useCallback(async () => {
    if (!isAuthenticated || !user.addr || isManualSyncing) {
      return;
    }

    setIsManualSyncing(true);
    setSyncError(null);

    try {
      const result = await walletProfileSyncManager.syncProfileStats(user.addr);
      
      if (result.success) {
        setLastManualSync(new Date());
        
        if (defaultConfig.showSuccessToast) {
          toast({
            title: "Profile Updated",
            description: "Profile statistics synchronized successfully",
          });
        }
      } else {
        throw new Error('Profile sync completed but reported failure');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile sync error';
      setSyncError(errorMessage);
      
      if (defaultConfig.showErrorToast) {
        toast({
          title: "Profile Sync Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsManualSyncing(false);
    }
  }, [isAuthenticated, user.addr, isManualSyncing, defaultConfig]);

  /**
   * Clear sync error
   */
  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  return {
    // State
    isManualSyncing: isManualSyncing || syncStatus.isActive,
    lastManualSync,
    syncError,
    
    // Actions
    triggerManualSync,
    triggerNFTSync,
    triggerProfileSync,
    clearSyncError
  };
}