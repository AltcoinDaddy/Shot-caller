/**
 * React Hook for Sync Performance Optimization
 * Provides access to performance metrics and optimization controls
 */

import { useState, useEffect, useCallback } from 'react';
import { enhancedWalletProfileSyncManager } from '@/lib/services/enhanced-wallet-profile-sync-manager';
import { syncPerformanceMonitor } from '@/lib/services/sync-performance-monitor';
import { 
  PerformanceMetrics, 
  PerformanceSnapshot, 
  PerformanceTrend, 
  PerformanceAlert 
} from '@/lib/services/sync-performance-monitor';

export interface SyncPerformanceState {
  metrics: PerformanceMetrics | null;
  snapshot: PerformanceSnapshot | null;
  trends: PerformanceTrend[];
  alerts: PerformanceAlert[];
  isOptimizing: boolean;
  optimizationConfig: {
    batchingEnabled: boolean;
    deduplicationEnabled: boolean;
    incrementalSyncEnabled: boolean;
    cacheOptimizationEnabled: boolean;
  };
}

export interface SyncPerformanceActions {
  refreshMetrics: () => void;
  optimizeForUser: (address: string) => Promise<void>;
  configureOptimization: (config: Partial<SyncPerformanceState['optimizationConfig']>) => void;
  clearPerformanceData: () => void;
  exportPerformanceData: () => any;
  getPerformanceReport: () => any;
}

export function useSyncPerformance(): SyncPerformanceState & SyncPerformanceActions {
  const [state, setState] = useState<SyncPerformanceState>({
    metrics: null,
    snapshot: null,
    trends: [],
    alerts: [],
    isOptimizing: false,
    optimizationConfig: {
      batchingEnabled: true,
      deduplicationEnabled: true,
      incrementalSyncEnabled: true,
      cacheOptimizationEnabled: true
    }
  });

  // Refresh performance metrics
  const refreshMetrics = useCallback(() => {
    try {
      const metrics = enhancedWalletProfileSyncManager.getPerformanceMetrics();
      const snapshot = syncPerformanceMonitor.getCurrentSnapshot();
      const trends = syncPerformanceMonitor.getPerformanceTrends();
      const alerts = syncPerformanceMonitor.getActiveAlerts();
      const optimizationConfig = enhancedWalletProfileSyncManager.getOptimizationConfig();

      setState(prev => ({
        ...prev,
        metrics,
        snapshot,
        trends,
        alerts,
        optimizationConfig
      }));
    } catch (error) {
      console.error('Failed to refresh performance metrics:', error);
    }
  }, []);

  // Optimize cache for specific user
  const optimizeForUser = useCallback(async (address: string) => {
    setState(prev => ({ ...prev, isOptimizing: true }));
    
    try {
      await enhancedWalletProfileSyncManager.optimizeCacheForUser(address);
      refreshMetrics();
    } catch (error) {
      console.error('Failed to optimize cache for user:', error);
    } finally {
      setState(prev => ({ ...prev, isOptimizing: false }));
    }
  }, [refreshMetrics]);

  // Configure optimization settings
  const configureOptimization = useCallback((
    config: Partial<SyncPerformanceState['optimizationConfig']>
  ) => {
    try {
      enhancedWalletProfileSyncManager.configurePerformanceOptimization(config);
      
      setState(prev => ({
        ...prev,
        optimizationConfig: {
          ...prev.optimizationConfig,
          ...config
        }
      }));
    } catch (error) {
      console.error('Failed to configure optimization:', error);
    }
  }, []);

  // Clear performance data
  const clearPerformanceData = useCallback(() => {
    try {
      syncPerformanceMonitor.clearData();
      enhancedWalletProfileSyncManager.clearOptimizationCaches();
      refreshMetrics();
    } catch (error) {
      console.error('Failed to clear performance data:', error);
    }
  }, [refreshMetrics]);

  // Export performance data
  const exportPerformanceData = useCallback(() => {
    try {
      return syncPerformanceMonitor.exportData();
    } catch (error) {
      console.error('Failed to export performance data:', error);
      return null;
    }
  }, []);

  // Get comprehensive performance report
  const getPerformanceReport = useCallback(() => {
    try {
      return syncPerformanceMonitor.getPerformanceReport();
    } catch (error) {
      console.error('Failed to get performance report:', error);
      return null;
    }
  }, []);

  // Initialize and set up periodic refresh
  useEffect(() => {
    // Initial load
    refreshMetrics();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [refreshMetrics]);

  // Monitor sync events for real-time updates
  useEffect(() => {
    const handleSyncEvent = (event: any) => {
      syncPerformanceMonitor.recordSyncEvent(event);
      // Refresh metrics after sync events
      setTimeout(refreshMetrics, 1000);
    };

    // Subscribe to sync events if available
    const unsubscribe = enhancedWalletProfileSyncManager.subscribe?.(
      'profile_sync_completed' as any,
      handleSyncEvent
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [refreshMetrics]);

  return {
    ...state,
    refreshMetrics,
    optimizeForUser,
    configureOptimization,
    clearPerformanceData,
    exportPerformanceData,
    getPerformanceReport
  };
}

// Additional hook for performance monitoring in components
export function useSyncPerformanceMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastOperation, setLastOperation] = useState<{
    type: string;
    duration: number;
    success: boolean;
    timestamp: Date;
  } | null>(null);

  const recordOperation = useCallback((
    operationType: string,
    duration: number,
    success: boolean,
    cacheHit?: boolean
  ) => {
    syncPerformanceMonitor.recordOperation(operationType, duration, success, cacheHit);
    
    setLastOperation({
      type: operationType,
      duration,
      success,
      timestamp: new Date()
    });
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  return {
    isMonitoring,
    lastOperation,
    recordOperation,
    startMonitoring,
    stopMonitoring
  };
}

// Hook for performance alerts
export function useSyncPerformanceAlerts() {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshAlerts = useCallback(() => {
    const activeAlerts = syncPerformanceMonitor.getActiveAlerts();
    setAlerts(activeAlerts);
    
    // Count alerts from last hour as "unread"
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAlerts = activeAlerts.filter(alert => alert.timestamp > oneHourAgo);
    setUnreadCount(recentAlerts.length);
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    refreshAlerts();
    
    // Refresh alerts every 5 minutes
    const interval = setInterval(refreshAlerts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refreshAlerts]);

  return {
    alerts,
    unreadCount,
    refreshAlerts,
    dismissAlert,
    markAllAsRead
  };
}