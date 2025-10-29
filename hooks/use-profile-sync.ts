"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/hooks/use-toast";

export interface ProfileSyncState {
  isRefreshing: boolean;
  lastSyncSuccess: Date | null;
  showSyncSuccess: boolean;
  profileUpdateAnimation: boolean;
  collectionChangeDetected: boolean;
  syncProgress: number;
  autoRefreshEnabled: boolean;
}

export interface ProfileSyncActions {
  handleRefreshProfile: () => Promise<void>;
  handleRefreshNFTs: () => Promise<void>;
  triggerUpdateAnimation: () => void;
  dismissSyncSuccess: () => void;
  enableAutoRefresh: (enabled: boolean) => void;
  detectCollectionChanges: () => void;
}

export interface CollectionChangeEvent {
  type: 'added' | 'removed' | 'updated';
  count: number;
  previousCount: number;
  timestamp: Date;
}

export function useProfileSync(): ProfileSyncState & ProfileSyncActions {
  const {
    isAuthenticated,
    syncStatus,
    forceSyncProfile,
    refreshNFTCollection,
    onSyncStatusChange,
    onProfileDataChange,
    nftCollection
  } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<Date | null>(null);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [profileUpdateAnimation, setProfileUpdateAnimation] = useState(false);
  const [collectionChangeDetected, setCollectionChangeDetected] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  // Track collection changes
  const previousCollectionRef = useRef<any[]>([]);
  const collectionChangeTimeoutRef = useRef<NodeJS.Timeout>();
  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout>();

  // Detect collection changes and trigger automatic refresh
  const detectCollectionChanges = useCallback(() => {
    if (!isAuthenticated || !nftCollection) return;

    const currentCount = nftCollection.length;
    const previousCount = previousCollectionRef.current.length;

    if (previousCount > 0 && currentCount !== previousCount) {
      const changeType: 'added' | 'removed' | 'updated' = 
        currentCount > previousCount ? 'added' : 
        currentCount < previousCount ? 'removed' : 'updated';

      setCollectionChangeDetected(true);
      
      // Show visual feedback for collection changes
      toast({
        title: "Collection Updated",
        description: `${Math.abs(currentCount - previousCount)} NFT${Math.abs(currentCount - previousCount) !== 1 ? 's' : ''} ${changeType === 'added' ? 'added to' : changeType === 'removed' ? 'removed from' : 'updated in'} your collection.`,
      });

      // Trigger update animation
      triggerUpdateAnimation();

      // Auto-refresh if enabled
      if (autoRefreshEnabled) {
        // Clear any existing timeout
        if (autoRefreshTimeoutRef.current) {
          clearTimeout(autoRefreshTimeoutRef.current);
        }

        // Debounce auto-refresh to avoid excessive API calls
        autoRefreshTimeoutRef.current = setTimeout(() => {
          handleRefreshProfile();
        }, 2000);
      }

      // Hide change indicator after 5 seconds
      setTimeout(() => setCollectionChangeDetected(false), 5000);
    }

    previousCollectionRef.current = [...nftCollection];
  }, [isAuthenticated, nftCollection, autoRefreshEnabled]);

  // Handle manual profile refresh with progress tracking
  const handleRefreshProfile = useCallback(async () => {
    if (!isAuthenticated || isRefreshing) return;

    setIsRefreshing(true);
    setSyncProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await forceSyncProfile();
      
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      setLastSyncSuccess(new Date());
      setShowSyncSuccess(true);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully synchronized.",
      });

      // Hide success indicator after 4 seconds
      setTimeout(() => {
        setShowSyncSuccess(false);
        setSyncProgress(0);
      }, 4000);
    } catch (error) {
      console.error('Profile refresh failed:', error);
      setSyncProgress(0);
      toast({
        title: "Sync Failed",
        description: "Failed to refresh profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated, isRefreshing, forceSyncProfile]);

  // Handle NFT collection refresh with enhanced feedback
  const handleRefreshNFTs = useCallback(async () => {
    if (!isAuthenticated || isRefreshing) return;

    setIsRefreshing(true);
    setSyncProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 15, 85));
      }, 300);

      await refreshNFTCollection();
      
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      toast({
        title: "NFT Collection Updated",
        description: "Your NFT collection has been refreshed.",
      });

      // Trigger collection change detection
      setTimeout(() => {
        detectCollectionChanges();
        setSyncProgress(0);
      }, 1000);
    } catch (error) {
      console.error('NFT refresh failed:', error);
      setSyncProgress(0);
      toast({
        title: "NFT Sync Failed",
        description: "Failed to refresh NFT collection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated, isRefreshing, refreshNFTCollection, detectCollectionChanges]);

  // Trigger update animation with enhanced effects
  const triggerUpdateAnimation = useCallback(() => {
    setProfileUpdateAnimation(true);
    setTimeout(() => setProfileUpdateAnimation(false), 800);
  }, []);

  // Dismiss sync success notification
  const dismissSyncSuccess = useCallback(() => {
    setShowSyncSuccess(false);
    setSyncProgress(0);
  }, []);

  // Enable/disable auto-refresh
  const enableAutoRefresh = useCallback((enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    if (!enabled && autoRefreshTimeoutRef.current) {
      clearTimeout(autoRefreshTimeoutRef.current);
    }
  }, []);

  // Subscribe to sync events for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribeSyncStatus = onSyncStatusChange((status) => {
      // Handle sync status changes with progress tracking
      if (status.isActive) {
        setIsRefreshing(true);
        // Update progress based on current operation
        if (status.currentOperation) {
          const operationProgress = {
            'wallet_verification': 20,
            'nft_collection_fetch': 60,
            'profile_data_update': 80,
            'cache_invalidation': 95
          };
          setSyncProgress(operationProgress[status.currentOperation as keyof typeof operationProgress] || 50);
        }
      } else {
        setIsRefreshing(false);
        setSyncProgress(100);
        
        if (status.lastSync && status.lastSync > (lastSyncSuccess || new Date(0))) {
          setLastSyncSuccess(status.lastSync);
          setShowSyncSuccess(true);
          triggerUpdateAnimation();
          
          // Hide success indicator after 4 seconds
          setTimeout(() => {
            setShowSyncSuccess(false);
            setSyncProgress(0);
          }, 4000);
        }
      }
    });

    const unsubscribeProfileData = onProfileDataChange((data) => {
      // Trigger smooth animation when profile data changes
      if (data) {
        triggerUpdateAnimation();
        
        // Show brief success feedback
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 3000);
      }
    });

    return () => {
      unsubscribeSyncStatus();
      unsubscribeProfileData();
    };
  }, [isAuthenticated, onSyncStatusChange, onProfileDataChange, lastSyncSuccess, triggerUpdateAnimation]);

  // Monitor NFT collection changes for automatic refresh
  useEffect(() => {
    if (!isAuthenticated || !nftCollection) return;

    // Initialize previous collection on first load
    if (previousCollectionRef.current.length === 0 && nftCollection.length > 0) {
      previousCollectionRef.current = [...nftCollection];
      return;
    }

    // Detect changes and trigger auto-refresh
    detectCollectionChanges();
  }, [isAuthenticated, nftCollection, detectCollectionChanges]);

  // Auto-refresh animation when sync completes
  useEffect(() => {
    if (isAuthenticated && syncStatus.lastSync) {
      // Check if sync completed recently
      const timeSinceLastSync = Date.now() - syncStatus.lastSync.getTime();
      if (timeSinceLastSync < 30000) { // Within last 30 seconds
        triggerUpdateAnimation();
      }
    }
  }, [isAuthenticated, syncStatus.lastSync, triggerUpdateAnimation]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (collectionChangeTimeoutRef.current) {
        clearTimeout(collectionChangeTimeoutRef.current);
      }
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isRefreshing,
    lastSyncSuccess,
    showSyncSuccess,
    profileUpdateAnimation,
    collectionChangeDetected,
    syncProgress,
    autoRefreshEnabled,
    
    // Actions
    handleRefreshProfile,
    handleRefreshNFTs,
    triggerUpdateAnimation,
    dismissSyncSuccess,
    enableAutoRefresh,
    detectCollectionChanges
  };
}