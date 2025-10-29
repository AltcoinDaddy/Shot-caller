"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useProfileSync } from "@/hooks/use-profile-sync";
import { toast } from "@/hooks/use-toast";

export interface RealTimeSyncListenerProps {
  onCollectionChange?: (changeType: 'added' | 'removed' | 'updated', count: number) => void;
  onProfileUpdate?: (profileData: any) => void;
  onSyncComplete?: (success: boolean) => void;
  autoRefreshInterval?: number;
  enableVisibilitySync?: boolean;
}

export function RealTimeSyncListener({
  onCollectionChange,
  onProfileUpdate,
  onSyncComplete,
  autoRefreshInterval = 5 * 60 * 1000, // 5 minutes
  enableVisibilitySync = true
}: RealTimeSyncListenerProps) {
  const {
    isAuthenticated,
    nftCollection,
    profileData,
    syncStatus,
    onSyncStatusChange,
    onProfileDataChange,
    refreshNFTCollection
  } = useAuth();

  const { 
    handleRefreshProfile,
    enableAutoRefresh,
    autoRefreshEnabled
  } = useProfileSync();

  // Track previous states for change detection
  const previousCollectionRef = useRef<any[]>([]);
  const previousProfileRef = useRef<any>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout>();
  const visibilityTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle collection changes
  const handleCollectionChange = useCallback((newCollection: any[], previousCollection: any[]) => {
    if (previousCollection.length === 0) return; // Skip initial load

    const newCount = newCollection.length;
    const previousCount = previousCollection.length;
    
    if (newCount !== previousCount) {
      const changeType: 'added' | 'removed' | 'updated' = 
        newCount > previousCount ? 'added' : 
        newCount < previousCount ? 'removed' : 'updated';
      
      const changeCount = Math.abs(newCount - previousCount);
      
      // Notify parent component
      onCollectionChange?.(changeType, changeCount);
      
      // Show toast notification
      toast({
        title: "Collection Updated",
        description: `${changeCount} NFT${changeCount !== 1 ? 's' : ''} ${changeType} ${changeType === 'added' ? 'to' : changeType === 'removed' ? 'from' : 'in'} your collection`,
        duration: 4000,
      });
    }
  }, [onCollectionChange]);

  // Handle profile data changes
  const handleProfileDataChange = useCallback((newProfileData: any, previousProfileData: any) => {
    if (!previousProfileData) return; // Skip initial load

    // Check for meaningful changes
    const hasChanges = 
      newProfileData?.stats?.totalNFTs !== previousProfileData?.stats?.totalNFTs ||
      newProfileData?.stats?.eligibleMoments !== previousProfileData?.stats?.eligibleMoments ||
      newProfileData?.stats?.seasonRank !== previousProfileData?.stats?.seasonRank;

    if (hasChanges) {
      onProfileUpdate?.(newProfileData);
      
      toast({
        title: "Profile Updated",
        description: "Your profile statistics have been refreshed",
        duration: 3000,
      });
    }
  }, [onProfileUpdate]);

  // Set up automatic refresh interval
  useEffect(() => {
    if (!isAuthenticated || !autoRefreshEnabled) {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
      return;
    }

    autoRefreshIntervalRef.current = setInterval(async () => {
      try {
        await refreshNFTCollection?.();
      } catch (error) {
        console.warn('Auto-refresh failed:', error);
      }
    }, autoRefreshInterval);

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [isAuthenticated, autoRefreshEnabled, autoRefreshInterval, refreshNFTCollection]);

  // Handle page visibility changes for sync
  useEffect(() => {
    if (!enableVisibilitySync || !isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Clear any existing timeout
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }

        // Debounce the sync to avoid excessive calls
        visibilityTimeoutRef.current = setTimeout(async () => {
          try {
            await handleRefreshProfile();
          } catch (error) {
            console.warn('Visibility sync failed:', error);
          }
        }, 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [enableVisibilitySync, isAuthenticated, handleRefreshProfile]);

  // Monitor NFT collection changes
  useEffect(() => {
    if (!isAuthenticated || !nftCollection) return;

    const previousCollection = previousCollectionRef.current;
    
    if (previousCollection.length > 0) {
      handleCollectionChange(nftCollection, previousCollection);
    }
    
    previousCollectionRef.current = [...nftCollection];
  }, [isAuthenticated, nftCollection, handleCollectionChange]);

  // Monitor profile data changes
  useEffect(() => {
    if (!isAuthenticated || !profileData) return;

    const previousProfile = previousProfileRef.current;
    
    if (previousProfile) {
      handleProfileDataChange(profileData, previousProfile);
    }
    
    previousProfileRef.current = { ...profileData };
  }, [isAuthenticated, profileData, handleProfileDataChange]);

  // Subscribe to sync events
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribeSyncStatus = onSyncStatusChange?.((status) => {
      // Handle sync completion
      if (!status.isActive && status.lastSync) {
        const success = status.failureCount === 0;
        onSyncComplete?.(success);
        
        if (!success) {
          toast({
            title: "Sync Failed",
            description: "Failed to synchronize profile data. Please try again.",
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    });

    const unsubscribeProfileData = onProfileDataChange?.((data) => {
      // This is handled by the profile data effect above
    });

    return () => {
      unsubscribeSyncStatus?.();
      unsubscribeProfileData?.();
    };
  }, [isAuthenticated, onSyncStatusChange, onProfileDataChange, onSyncComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}

export interface SyncEventListenerProps {
  onSyncStart?: () => void;
  onSyncProgress?: (progress: number, operation?: string) => void;
  onSyncComplete?: (success: boolean, duration?: number) => void;
  onSyncError?: (error: any) => void;
}

export function SyncEventListener({
  onSyncStart,
  onSyncProgress,
  onSyncComplete,
  onSyncError
}: SyncEventListenerProps) {
  const { isAuthenticated, syncStatus, onSyncStatusChange } = useAuth();
  const syncStartTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onSyncStatusChange?.((status) => {
      if (status.isActive && !syncStartTimeRef.current) {
        // Sync started
        syncStartTimeRef.current = new Date();
        onSyncStart?.();
      } else if (!status.isActive && syncStartTimeRef.current) {
        // Sync completed
        const duration = Date.now() - syncStartTimeRef.current.getTime();
        const success = status.failureCount === 0;
        
        onSyncComplete?.(success, duration);
        syncStartTimeRef.current = null;
        
        if (!success) {
          onSyncError?.(new Error(`Sync failed after ${status.failureCount} attempts`));
        }
      }
      
      // Progress updates
      if (status.isActive && status.currentOperation) {
        const operationProgress = {
          'wallet_verification': 25,
          'nft_collection_fetch': 50,
          'profile_data_update': 75,
          'cache_invalidation': 90,
          'eligibility_check': 95
        };
        
        const progress = operationProgress[status.currentOperation as keyof typeof operationProgress] || 50;
        onSyncProgress?.(progress, status.currentOperation);
      }
    });

    return unsubscribe;
  }, [isAuthenticated, onSyncStatusChange, onSyncStart, onSyncProgress, onSyncComplete, onSyncError]);

  return null;
}