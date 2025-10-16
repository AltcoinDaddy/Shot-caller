"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Wifi, WifiOff, RefreshCw, Clock, AlertCircle } from 'lucide-react'
import { useOfflineMode } from '@/lib/utils/offline-mode'
import { toast } from '@/hooks/use-toast'

interface NetworkStatusProps {
  className?: string
  showDetails?: boolean
}

export function NetworkStatus({ className = "", showDetails = false }: NetworkStatusProps) {
  const { 
    networkStatus, 
    pendingActions, 
    isOnline, 
    syncPendingActions,
    getCacheStats 
  } = useOfflineMode()
  
  const [syncing, setSyncing] = React.useState(false)
  const [cacheStats, setCacheStats] = React.useState({ total: 0, expired: 0, valid: 0, pendingActions: 0 })

  React.useEffect(() => {
    setCacheStats(getCacheStats())
  }, [getCacheStats])

  const handleSync = async () => {
    if (syncing || !isOnline) return
    
    setSyncing(true)
    try {
      await syncPendingActions()
      toast({
        title: 'Sync Complete',
        description: 'All pending actions have been synchronized.',
        duration: 3000
      })
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync some actions. They will be retried automatically.',
        variant: 'destructive'
      })
    } finally {
      setSyncing(false)
    }
  }

  if (!showDetails) {
    // Compact status indicator
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge 
          variant={isOnline ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Offline
            </>
          )}
        </Badge>
        
        {pendingActions > 0 && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {pendingActions} pending
          </Badge>
        )}
        
        {pendingActions > 0 && isOnline && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSync}
            disabled={syncing}
            className="h-6 px-2"
          >
            {syncing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
    )
  }

  // Detailed status card
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              Connected
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              Offline Mode
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isOnline 
            ? 'All features are available'
            : 'Limited functionality - actions will sync when reconnected'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">Status</div>
            <div className={isOnline ? "text-green-600" : "text-red-600"}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          
          {networkStatus.connectionType && (
            <div>
              <div className="font-medium">Connection</div>
              <div className="text-muted-foreground">
                {networkStatus.connectionType}
                {networkStatus.effectiveType && ` (${networkStatus.effectiveType})`}
              </div>
            </div>
          )}
        </div>

        {/* Pending actions */}
        {pendingActions > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">Pending Actions</div>
              <Badge variant="outline">{pendingActions}</Badge>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {isOnline 
                ? 'Actions will be synchronized automatically'
                : 'Actions will sync when connection is restored'
              }
            </div>
            
            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={syncing}
                className="w-full"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin mr-2" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Cache statistics */}
        <div className="space-y-2">
          <div className="font-medium text-sm">Offline Cache</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Valid entries</div>
              <div>{cacheStats.valid}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Expired entries</div>
              <div>{cacheStats.expired}</div>
            </div>
          </div>
          
          {cacheStats.total > 0 && (
            <Progress 
              value={(cacheStats.valid / cacheStats.total) * 100} 
              className="h-1"
            />
          )}
        </div>

        {/* Offline mode notice */}
        {!isOnline && (
          <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <div className="font-medium mb-1">Offline Mode Active</div>
              <div className="text-muted-foreground">
                You can continue using the app with cached data. 
                Any actions you take will be saved and synchronized when you're back online.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Global network status banner
 */
export function NetworkStatusBanner() {
  const { isOnline, pendingActions } = useOfflineMode()
  const [dismissed, setDismissed] = React.useState(false)

  // Show banner when offline or when there are pending actions
  const shouldShow = (!isOnline || pendingActions > 0) && !dismissed

  if (!shouldShow) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {!isOnline ? (
              <>
                <WifiOff className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Offline Mode</span>
                <span className="text-muted-foreground">
                  Actions will sync when connection is restored
                </span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-medium">{pendingActions} actions pending sync</span>
              </>
            )}
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for network status in components
 */
export function useNetworkStatus() {
  const { networkStatus, isOnline, pendingActions } = useOfflineMode()
  
  return {
    isOnline,
    connectionType: networkStatus.connectionType,
    effectiveType: networkStatus.effectiveType,
    pendingActions,
    hasOfflineData: pendingActions > 0
  }
}