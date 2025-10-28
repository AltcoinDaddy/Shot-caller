'use client';

import { useNetworkResilience } from '@/hooks/use-network-resilience';
import { ConnectionQuality } from '@/lib/types/sync';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Network Status Indicator Component
 * 
 * Displays current network status and connection quality to users.
 * Provides visual feedback about network resilience state.
 */
export function NetworkStatusIndicator() {
  const { 
    isOnline, 
    connectionQuality, 
    offlineQueueStatus,
    isConnectionGood,
    isConnectionPoor,
    hasOfflineOperations 
  } = useNetworkResilience();

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    
    if (isConnectionPoor) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (!isOnline) return 'destructive';
    if (isConnectionPoor) return 'secondary';
    if (isConnectionGood) return 'default';
    return 'secondary';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    
    switch (connectionQuality) {
      case ConnectionQuality.EXCELLENT:
        return 'Excellent';
      case ConnectionQuality.GOOD:
        return 'Good';
      case ConnectionQuality.FAIR:
        return 'Fair';
      case ConnectionQuality.POOR:
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </Badge>
      
      {hasOfflineOperations && (
        <Badge variant="outline" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span className="text-xs">
            {offlineQueueStatus.count} queued
          </span>
        </Badge>
      )}
    </div>
  );
}

/**
 * Network-Aware Operation Button
 * 
 * Example component showing how to use network resilience in operations
 */
interface NetworkAwareButtonProps {
  onOperation: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function NetworkAwareButton({ 
  onOperation, 
  children, 
  disabled = false 
}: NetworkAwareButtonProps) {
  const { executeWithRetry, isOnline, queueOfflineOperation } = useNetworkResilience();

  const handleClick = async () => {
    if (isOnline) {
      try {
        await executeWithRetry(onOperation);
      } catch (error) {
        console.error('Operation failed:', error);
      }
    } else {
      // Queue for offline execution
      queueOfflineOperation(onOperation, 1);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {children}
      {!isOnline && <span className="ml-2 text-xs">(will queue)</span>}
    </button>
  );
}