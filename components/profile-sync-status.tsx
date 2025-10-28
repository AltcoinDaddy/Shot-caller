"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SyncStatusIndicator, SyncStatus } from "./sync-status-indicator";
import { SyncLoadingState } from "./sync-loading-state";
import { SyncErrorDisplay, SyncError } from "./sync-error-display";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Wallet, 
  Image as ImageIcon, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfileSyncData {
  walletAddress?: string;
  nftCount?: number;
  eligibleMoments?: number;
  lastNFTSync?: Date;
  lastStatsSync?: Date;
  profileStats?: {
    gamesPlayed: number;
    totalPoints: number;
    rank: number;
  };
}

export interface ProfileSyncStatusProps {
  syncStatus: SyncStatus;
  profileData: ProfileSyncData;
  errors?: SyncError[];
  onRefreshProfile?: () => void;
  onRefreshNFTs?: () => void;
  onRefreshStats?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ProfileSyncStatus({
  syncStatus,
  profileData,
  errors = [],
  onRefreshProfile,
  onRefreshNFTs,
  onRefreshStats,
  isLoading = false,
  className
}: ProfileSyncStatusProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const hasErrors = errors.length > 0;
  const recentError = errors[0];

  const getSyncSectionStatus = (lastSync?: Date) => {
    if (!lastSync) return "never";
    
    const timeSinceSync = Date.now() - lastSync.getTime();
    const minutes = Math.floor(timeSinceSync / 60000);
    
    if (minutes < 5) return "fresh";
    if (minutes < 30) return "recent";
    return "stale";
  };

  const formatSyncTime = (date?: Date) => {
    if (!date) return "Never synced";
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case "fresh": return "text-green-600";
      case "recent": return "text-blue-600";
      case "stale": return "text-orange-600";
      case "never": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const syncSections = [
    {
      id: "wallet",
      title: "Wallet Connection",
      icon: Wallet,
      status: profileData.walletAddress ? "connected" : "disconnected",
      lastSync: syncStatus.lastSync,
      data: profileData.walletAddress,
      onRefresh: onRefreshProfile
    },
    {
      id: "nfts",
      title: "NFT Collection",
      icon: ImageIcon,
      status: getSyncSectionStatus(profileData.lastNFTSync),
      lastSync: profileData.lastNFTSync,
      data: `${profileData.nftCount || 0} NFTs (${profileData.eligibleMoments || 0} eligible)`,
      onRefresh: onRefreshNFTs
    },
    {
      id: "stats",
      title: "Profile Stats",
      icon: TrendingUp,
      status: getSyncSectionStatus(profileData.lastStatsSync),
      lastSync: profileData.lastStatsSync,
      data: profileData.profileStats ? 
        `${profileData.profileStats.gamesPlayed} games, Rank #${profileData.profileStats.rank}` :
        "No stats available",
      onRefresh: onRefreshStats
    }
  ];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Profile Sync
            <SyncStatusIndicator status={syncStatus} variant="compact" />
          </CardTitle>
          {onRefreshProfile && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefreshProfile}
              disabled={syncStatus.isActive || isLoading}
            >
              <RefreshCw className={cn(
                "w-4 h-4 mr-2",
                (syncStatus.isActive || isLoading) && "animate-spin"
              )} />
              Refresh All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasErrors && recentError && (
          <SyncErrorDisplay
            error={recentError}
            onRetry={onRefreshProfile}
            variant="banner"
          />
        )}

        <SyncLoadingState
          isLoading={isLoading}
          variant="overlay"
        >
          <div className="space-y-3">
            {syncSections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.id;
              const statusColor = section.id === "wallet" 
                ? (section.status === "connected" ? "text-green-600" : "text-red-600")
                : getSyncStatusColor(section.status);

              return (
                <div
                  key={section.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="text-sm font-medium">{section.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {section.data}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className={cn("text-xs font-medium", statusColor)}>
                          {section.id === "wallet" 
                            ? (section.status === "connected" ? "Connected" : "Disconnected")
                            : section.status.charAt(0).toUpperCase() + section.status.slice(1)
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatSyncTime(section.lastSync)}
                        </div>
                      </div>
                      
                      {section.onRefresh && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={section.onRefresh}
                          disabled={syncStatus.isActive || isLoading}
                          className="h-8 w-8 p-0"
                        >
                          <RefreshCw className={cn(
                            "w-4 h-4",
                            (syncStatus.isActive || isLoading) && "animate-spin"
                          )} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SyncLoadingState>

        {syncStatus.currentOperation && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              {syncStatus.currentOperation}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>
              Last full sync: {formatSyncTime(syncStatus.lastSync)}
            </span>
          </div>
          
          {syncStatus.failureCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {syncStatus.failureCount} failed attempts
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}