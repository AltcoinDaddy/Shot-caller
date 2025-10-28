import { useState, useEffect, useCallback } from 'react';
import { networkResilienceManager } from '@/lib/services/network-resilience-manager';
import { ConnectionQuality, RetryPolicy } from '@/lib/types/sync';

/**
 * Hook for network resilience functionality
 * 
 * Provides access to network status, connection quality, and retry operations
 * with React state management integration.
 */
export function useNetworkResilience() {
  const [isOnline, setIsOnline] = useState(networkResilienceManager.isOnline());
  const [connectionQuality, setConnectionQuality] = useState(networkResilienceManager.getConnectionQuality());
  const [offlineQueueStatus, setOfflineQueueStatus] = useState(networkResilienceManager.getOfflineQueueStatus());

  // Update offline queue status periodically
  useEffect(() => {
    const updateQueueStatus = () => {
      setOfflineQueueStatus(networkResilienceManager.getOfflineQueueStatus());
    };

    const interval = setInterval(updateQueueStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to network status changes
  useEffect(() => {
    const unsubscribeConnection = networkResilienceManager.onConnectionChange(setIsOnline);
    const unsubscribeQuality = networkResilienceManager.onQualityChange(setConnectionQuality);

    return () => {
      unsubscribeConnection();
      unsubscribeQuality();
    };
  }, []);

  // Execute operation with retry logic
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    policyName?: string
  ): Promise<T> => {
    return networkResilienceManager.executeWithRetry(operation, policyName);
  }, []);

  // Queue operation for offline execution
  const queueOfflineOperation = useCallback((
    operation: () => Promise<any>,
    priority: number = 1
  ) => {
    networkResilienceManager.queueOfflineOperation({
      operation,
      priority
    });
    setOfflineQueueStatus(networkResilienceManager.getOfflineQueueStatus());
  }, []);

  // Process offline queue manually
  const processOfflineQueue = useCallback(async () => {
    await networkResilienceManager.processOfflineQueue();
    setOfflineQueueStatus(networkResilienceManager.getOfflineQueueStatus());
  }, []);

  // Set custom retry policy
  const setRetryPolicy = useCallback((name: string, policy: RetryPolicy) => {
    networkResilienceManager.setRetryPolicy(name, policy);
  }, []);

  // Get fallback data
  const getFallbackData = useCallback((key: string) => {
    return networkResilienceManager.getFallbackData(key);
  }, []);

  // Set fallback data
  const setCachedFallback = useCallback((key: string, data: any) => {
    networkResilienceManager.setCachedFallback(key, data);
  }, []);

  // Clear offline queue
  const clearOfflineQueue = useCallback(() => {
    networkResilienceManager.clearOfflineQueue();
    setOfflineQueueStatus(networkResilienceManager.getOfflineQueueStatus());
  }, []);

  return {
    // Status
    isOnline,
    connectionQuality,
    offlineQueueStatus,
    
    // Operations
    executeWithRetry,
    queueOfflineOperation,
    processOfflineQueue,
    
    // Configuration
    setRetryPolicy,
    
    // Fallback data
    getFallbackData,
    setCachedFallback,
    
    // Queue management
    clearOfflineQueue,
    
    // Utility
    isConnectionGood: connectionQuality === ConnectionQuality.EXCELLENT || connectionQuality === ConnectionQuality.GOOD,
    isConnectionPoor: connectionQuality === ConnectionQuality.POOR || connectionQuality === ConnectionQuality.OFFLINE,
    hasOfflineOperations: offlineQueueStatus.count > 0
  };
}