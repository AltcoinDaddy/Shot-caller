"use client";

import { useState, useEffect, useCallback } from "react";
import { walletProfileSyncManager } from "@/lib/services/wallet-profile-sync-manager";
import { syncActivityManager } from "@/lib/services/sync-activity-manager";
import { SyncConfiguration } from "@/lib/types/sync";

export interface SyncConfigState {
  autoSyncEnabled: boolean;
  syncInterval: number; // in milliseconds
  periodicSyncActive: boolean;
  activityTrackingEnabled: boolean;
  focusSyncEnabled: boolean;
}

export interface SyncConfigActions {
  updateSyncInterval: (interval: number) => void;
  toggleAutoSync: (enabled: boolean) => void;
  togglePeriodicSync: () => void;
  toggleActivityTracking: (enabled: boolean) => void;
  toggleFocusSync: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

export interface SyncConfigOptions {
  persistConfig: boolean;
  storageKey: string;
}

const DEFAULT_CONFIG: SyncConfigState = {
  autoSyncEnabled: true,
  syncInterval: 300000, // 5 minutes
  periodicSyncActive: false,
  activityTrackingEnabled: true,
  focusSyncEnabled: true
};

const SYNC_INTERVAL_OPTIONS = [
  { label: "1 minute", value: 60000 },
  { label: "2 minutes", value: 120000 },
  { label: "5 minutes", value: 300000 },
  { label: "10 minutes", value: 600000 },
  { label: "15 minutes", value: 900000 },
  { label: "30 minutes", value: 1800000 },
  { label: "1 hour", value: 3600000 }
];

export function useSyncConfig(options?: Partial<SyncConfigOptions>): SyncConfigState & SyncConfigActions & {
  intervalOptions: typeof SYNC_INTERVAL_OPTIONS;
  isValidInterval: (interval: number) => boolean;
} {
  const config = {
    persistConfig: true,
    storageKey: 'shotcaller-sync-config',
    ...options
  };

  const [syncConfig, setSyncConfig] = useState<SyncConfigState>(DEFAULT_CONFIG);

  // Load configuration from localStorage on mount
  useEffect(() => {
    if (!config.persistConfig || typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(config.storageKey);
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        setSyncConfig(prev => ({ ...prev, ...parsedConfig }));
      }
    } catch (error) {
      console.error('Failed to load sync config:', error);
    }
  }, [config.persistConfig, config.storageKey]);

  // Save configuration to localStorage when it changes
  useEffect(() => {
    if (!config.persistConfig || typeof window === 'undefined') return;

    try {
      localStorage.setItem(config.storageKey, JSON.stringify(syncConfig));
    } catch (error) {
      console.error('Failed to save sync config:', error);
    }
  }, [syncConfig, config.persistConfig, config.storageKey]);

  // Apply configuration to sync manager when it changes
  useEffect(() => {
    try {
      // Update sync manager configuration
      walletProfileSyncManager.setSyncInterval(syncConfig.syncInterval);
      walletProfileSyncManager.enableAutoSync(syncConfig.autoSyncEnabled);

      // Update periodic sync state
      const isPeriodicActive = walletProfileSyncManager.isPeriodicSyncActive();
      if (isPeriodicActive !== syncConfig.periodicSyncActive) {
        setSyncConfig(prev => ({ ...prev, periodicSyncActive: isPeriodicActive }));
      }

      // Update activity manager configuration
      syncActivityManager.updateConfig({
        enableActivityTracking: syncConfig.activityTrackingEnabled,
        enableFocusSync: syncConfig.focusSyncEnabled
      });
    } catch (error) {
      console.error('Failed to apply sync config:', error);
    }
  }, [syncConfig]);

  /**
   * Update sync interval
   */
  const updateSyncInterval = useCallback((interval: number) => {
    if (!isValidInterval(interval)) {
      console.warn('Invalid sync interval:', interval);
      return;
    }

    setSyncConfig(prev => ({ ...prev, syncInterval: interval }));
  }, []);

  /**
   * Toggle auto sync
   */
  const toggleAutoSync = useCallback((enabled: boolean) => {
    setSyncConfig(prev => ({ ...prev, autoSyncEnabled: enabled }));
    
    // Start or stop periodic sync based on auto sync setting
    if (enabled) {
      walletProfileSyncManager.startPeriodicSync();
    } else {
      walletProfileSyncManager.stopPeriodicSync();
    }
  }, []);

  /**
   * Toggle periodic sync
   */
  const togglePeriodicSync = useCallback(() => {
    const isActive = walletProfileSyncManager.isPeriodicSyncActive();
    
    if (isActive) {
      walletProfileSyncManager.stopPeriodicSync();
    } else {
      walletProfileSyncManager.startPeriodicSync();
    }
    
    setSyncConfig(prev => ({ ...prev, periodicSyncActive: !isActive }));
  }, []);

  /**
   * Toggle activity tracking
   */
  const toggleActivityTracking = useCallback((enabled: boolean) => {
    setSyncConfig(prev => ({ ...prev, activityTrackingEnabled: enabled }));
  }, []);

  /**
   * Toggle focus sync
   */
  const toggleFocusSync = useCallback((enabled: boolean) => {
    setSyncConfig(prev => ({ ...prev, focusSyncEnabled: enabled }));
  }, []);

  /**
   * Reset to default configuration
   */
  const resetToDefaults = useCallback(() => {
    setSyncConfig(DEFAULT_CONFIG);
    
    // Clear saved config
    if (config.persistConfig && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(config.storageKey);
      } catch (error) {
        console.error('Failed to clear saved config:', error);
      }
    }
  }, [config.persistConfig, config.storageKey]);

  /**
   * Validate sync interval
   */
  const isValidInterval = useCallback((interval: number): boolean => {
    return interval >= 60000 && interval <= 3600000; // 1 minute to 1 hour
  }, []);

  return {
    // State
    ...syncConfig,
    
    // Actions
    updateSyncInterval,
    toggleAutoSync,
    togglePeriodicSync,
    toggleActivityTracking,
    toggleFocusSync,
    resetToDefaults,
    
    // Utilities
    intervalOptions: SYNC_INTERVAL_OPTIONS,
    isValidInterval
  };
}