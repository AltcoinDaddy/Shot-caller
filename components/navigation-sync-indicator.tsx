"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SyncStatusIndicator, SyncStatus } from "./sync-status-indicator";
import { SyncErrorDisplay, SyncError } from "./sync-error-display";
import { InlineSyncLoading } from "./sync-loading-state";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavigationSyncIndicatorProps {
  syncStatus: SyncStatus;
  errors?: SyncError[];
  onRetrySync?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function NavigationSyncIndicator({
  syncStatus,
  errors = [],
  onRetrySync,
  onViewDetails,
  className
}: NavigationSyncIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasErrors = errors.length > 0;
  const recentError = errors[0];

  const getSyncStatusSummary = () => {
    if (hasErrors) {
      return {
        icon: AlertTriangle,
        color: "text-red-500",
        label: "Sync Error",
        description: `${errors.length} error(s) occurred`
      };
    }

    if (syncStatus.isActive) {
      return {
        icon: RefreshCw,
        color: "text-blue-500",
        label: "Syncing",
        description: syncStatus.currentOperation || "Synchronizing..."
      };
    }

    if (syncStatus.lastSync) {
      const timeSinceSync = Date.now() - syncStatus.lastSync.getTime();
      const isRecent = timeSinceSync < 5 * 60 * 1000; // 5 minutes

      return {
        icon: CheckCircle,
        color: isRecent ? "text-green-500" : "text-gray-500",
        label: isRecent ? "Synced" : "Sync Stale",
        description: `Last synced ${formatRelativeTime(syncStatus.lastSync)}`
      };
    }

    return {
      icon: RefreshCw,
      color: "text-gray-500",
      label: "Not Synced",
      description: "Sync not started"
    };
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
  };

  const statusInfo = getSyncStatusSummary();
  const Icon = statusInfo.icon;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex items-center gap-2 h-8 px-2",
            hasErrors && "text-red-500 hover:text-red-600",
            className
          )}
        >
          <Icon className={cn(
            "w-4 h-4",
            statusInfo.color,
            syncStatus.isActive && "animate-spin"
          )} />
          <SyncStatusIndicator
            status={syncStatus}
            variant="compact"
            className="hidden sm:flex"
          />
          {hasErrors && (
            <Badge variant="destructive" className="text-xs h-4 px-1">
              {errors.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Sync Status</h4>
            {onViewDetails && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onViewDetails();
                  setIsOpen(false);
                }}
                className="text-xs"
              >
                View Details
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className={cn(
                "w-4 h-4",
                statusInfo.color,
                syncStatus.isActive && "animate-spin"
              )} />
              <span className="text-sm font-medium">{statusInfo.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {statusInfo.description}
            </p>
          </div>

          {syncStatus.isActive && (
            <InlineSyncLoading
              isLoading={true}
              text={syncStatus.currentOperation || "Syncing"}
            />
          )}

          {hasErrors && recentError && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-red-600">Recent Error</h5>
              <SyncErrorDisplay
                error={recentError}
                onRetry={onRetrySync}
                variant="inline"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              {syncStatus.lastSync ? (
                `Last sync: ${formatRelativeTime(syncStatus.lastSync)}`
              ) : (
                "Never synced"
              )}
            </div>
            {onRetrySync && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onRetrySync();
                  setIsOpen(false);
                }}
                disabled={syncStatus.isActive}
                className="h-6 px-2 text-xs"
              >
                {syncStatus.isActive ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Sync
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}