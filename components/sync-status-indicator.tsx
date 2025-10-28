"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SyncStatus {
  isActive: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  failureCount: number;
  currentOperation?: string;
}

export interface SyncStatusIndicatorProps {
  status: SyncStatus;
  variant?: "compact" | "detailed";
  showLastSync?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function SyncStatusIndicator({
  status,
  variant = "compact",
  showLastSync = false,
  onRetry,
  className
}: SyncStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getSyncStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        label: "Offline",
        color: "bg-gray-500",
        textColor: "text-gray-600",
        description: "No internet connection"
      };
    }

    if (status.isActive) {
      return {
        icon: Spinner,
        label: "Syncing",
        color: "bg-blue-500",
        textColor: "text-blue-600",
        description: status.currentOperation || "Synchronizing data..."
      };
    }

    if (status.failureCount > 0) {
      return {
        icon: AlertCircle,
        label: "Sync Failed",
        color: "bg-red-500",
        textColor: "text-red-600",
        description: `Sync failed (${status.failureCount} attempts)`
      };
    }

    if (status.lastSync) {
      return {
        icon: CheckCircle,
        label: "Synced",
        color: "bg-green-500",
        textColor: "text-green-600",
        description: `Last synced ${formatRelativeTime(status.lastSync)}`
      };
    }

    return {
      icon: RefreshCw,
      label: "Not Synced",
      color: "bg-gray-500",
      textColor: "text-gray-600",
      description: "Sync not started"
    };
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
  };

  const syncInfo = getSyncStatusInfo();
  const Icon = syncInfo.icon;

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1", className)}>
              <div className={cn("w-2 h-2 rounded-full", syncInfo.color)} />
              {status.isActive && <Icon className="w-3 h-3 animate-spin" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{syncInfo.label}</div>
              <div className="text-muted-foreground">{syncInfo.description}</div>
              {showLastSync && status.lastSync && (
                <div className="text-xs mt-1">
                  Last sync: {status.lastSync.toLocaleTimeString()}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon className={cn("w-4 h-4", syncInfo.textColor, status.isActive && "animate-spin")} />
      <Badge variant="outline" className={cn("text-xs", syncInfo.textColor)}>
        {syncInfo.label}
      </Badge>
      {status.failureCount > 0 && onRetry && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRetry}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
      {showLastSync && status.lastSync && (
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(status.lastSync)}
        </span>
      )}
    </div>
  );
}