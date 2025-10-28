"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  RefreshCw, 
  Settings, 
  Wallet, 
  Image as ImageIcon, 
  User, 
  Clock,
  Activity,
  Eye,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useManualSync } from "@/hooks/use-manual-sync";
import { useSyncConfig } from "@/hooks/use-sync-config";
import { cn } from "@/lib/utils";

interface SyncControlsProps {
  variant?: "compact" | "full";
  showConfig?: boolean;
  className?: string;
}

export function SyncControls({ 
  variant = "full", 
  showConfig = true,
  className 
}: SyncControlsProps) {
  const { isAuthenticated, syncStatus } = useAuth();
  const {
    isManualSyncing,
    lastManualSync,
    syncError,
    triggerManualSync,
    triggerNFTSync,
    triggerProfileSync,
    clearSyncError
  } = useManualSync();

  const {
    autoSyncEnabled,
    syncInterval,
    periodicSyncActive,
    activityTrackingEnabled,
    focusSyncEnabled,
    intervalOptions,
    updateSyncInterval,
    toggleAutoSync,
    togglePeriodicSync,
    toggleActivityTracking,
    toggleFocusSync,
    resetToDefaults
  } = useSyncConfig();

  if (!isAuthenticated) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center text-muted-foreground">
            <Wallet className="h-4 w-4 mr-2" />
            Connect wallet to access sync controls
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatInterval = (ms: number) => {
    const minutes = ms / 60000;
    if (minutes < 60) {
      return `${minutes}m`;
    }
    return `${minutes / 60}h`;
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return "Never";
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => triggerManualSync()}
          disabled={isManualSyncing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isManualSyncing && "animate-spin")} />
          Sync
        </Button>
        
        {syncStatus.isActive && (
          <Badge variant="secondary" className="animate-pulse">
            <Activity className="h-3 w-3 mr-1" />
            Syncing...
          </Badge>
        )}
        
        {syncError && (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sync Controls
        </CardTitle>
        <CardDescription>
          Manage wallet and profile synchronization settings
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Sync Error Alert */}
        {syncError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{syncError}</span>
              <Button variant="ghost" size="sm" onClick={clearSyncError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Sync Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Manual Sync</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last: {formatLastSync(lastManualSync || syncStatus.lastSync)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => triggerManualSync()}
              disabled={isManualSyncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isManualSyncing && "animate-spin")} />
              Full Sync
            </Button>
            
            <Button
              variant="outline"
              onClick={triggerNFTSync}
              disabled={isManualSyncing}
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              NFTs Only
            </Button>
            
            <Button
              variant="outline"
              onClick={triggerProfileSync}
              disabled={isManualSyncing}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Profile Only
            </Button>
          </div>
        </div>

        {showConfig && (
          <>
            <Separator />
            
            {/* Auto Sync Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Auto Sync Settings
                </h4>
                <Button variant="ghost" size="sm" onClick={resetToDefaults}>
                  Reset
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Auto Sync Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-sync">Auto Sync</Label>
                    <div className="text-xs text-muted-foreground">
                      Automatically sync wallet and profile data
                    </div>
                  </div>