"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/hooks/use-toast";

export interface ProfileSyncState {
  isRefreshing: boolean;
  lastSyncSuccess: Date | null;
  showSyncSuccess: boolean;
  profileUpdateAnimation: boolean;
}

export interface ProfileSyncActions {
  handleRefreshProfile: () => Promise<void>;
  handleRefreshNFTs: () => Promise<void>;
  triggerUpdateAnimation: () => void;
  dismissSyncSuccess: () => void;
}

export function useProfileSync(): ProfileSyncState & ProfileSyncActions {
  const {
    isAuthenticated,
    syncStatus,
    forceSyncProfile,
    refreshNFTCollection,
    onSyncStatusChange,
    onProfileDataChange
  } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<Date | null>(null);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [profileUpdateAnimation, setProfileUpdateAnimation] = useState(false);

  // Handle manual profile refresh
  const handleRefreshProfile = useCallback(async () => {
    if (!isAuthenticated || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await forceSyncProfile();
      setLastSyncSuccess(new Date());
      setShowSyncSuccess(true);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully synchronized.",
      });

      // Hide success indicator after 3 seconds
      setTimeout(() => setShowSyncSuccess(false), 3000);
    } catch (error) {
      console.error('Profile refresh failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to refresh profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated, isRefreshing, forceSyncProfile]);

  // Handle NFT collection refresh
  const handleRefreshNFTs = useCallback(async () => {
    if (!isAuthenticated || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshNFTCollection();
      toast({
        title: "NFT Collection Updated",
        description: "Your NFT collection has been refreshed.",
      });
    } catch (error) {
      console.error('NFT refresh failed:', error);
      toast({
        title: "NFT Sync Failed",
        description: "Failed to refresh NFT collection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated, isRefreshing, refreshNFTCollection]);

  // Trigger update animation
  const triggerUpdateAnimation = useCallback(() => {
    setProfileUpdateAnimation(true);
    setTimeout(() => setProfileUpdateAnimation(false), 500);
  }, []);

  // Dismiss sync success notification
  const dismissSyncSuccess = useCallback(() => {
    setShowSyncSuccess(false);
  }, []);

  // Subscribe to sync events for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribeSyncStatus = onSyncStatusChange((status) => {
      // Handle sync status changes
      if (status.isActive) {
        setIsRefreshing(true);
      } else {
        setIsRefreshing(false);
        if (status.lastSync && status.lastSync > (lastSyncSuccess || new Date(0))) {
          setLastSyncSuccess(status.lastSync);
          setShowSyncSuccess(true);
          setTimeout(() => setShowSyncSuccess(false), 3000);
        }
      }
    });

    const unsubscribeProfileData = onProfileDataChange((data) => {
      // Trigger smooth animation when profile data changes
      if (data) {
        triggerUpdateAnimation();
      }
    });

    return () => {
      unsubscribeSyncStatus();
      unsubscribeProfileData();
    };
  }, [isAuthenticated, onSyncStatusChange, onProfileDataChange, lastSyncSuccess, triggerUpdateAnimation]);

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

  return {
    // State
    isRefreshing,
    lastSyncSuccess,
    showSyncSuccess,
    profileUpdateAnimation,
    
    // Actions
    handleRefreshProfile,
    handleRefreshNFTs,
    triggerUpdateAnimation,
    dismissSyncSuccess
  };
}