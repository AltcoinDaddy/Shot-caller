"use client";

import { HelpCircle, Info, AlertCircle, CheckCircle, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SyncHelpTooltipProps {
  type: "status" | "refresh" | "error" | "offline" | "info";
  status?: "synced" | "syncing" | "error" | "offline";
  message?: string;
  className?: string;
  children?: React.ReactNode;
}

const syncStatusMessages = {
  synced: "Your profile is up-to-date with your wallet",
  syncing: "Synchronizing your NFT collection and profile data",
  error: "Sync failed - click to retry or see troubleshooting tips",
  offline: "You're offline - showing cached data from your last sync"
};

const syncHelpContent = {
  status: {
    title: "Sync Status",
    content: "Shows the current synchronization state between your wallet and profile. Green means up-to-date, yellow means syncing, red means error."
  },
  refresh: {
    title: "Manual Refresh",
    content: "Click to immediately sync your wallet data with your profile. This checks for new NFTs and updates your collection."
  },
  error: {
    title: "Sync Error",
    content: "Synchronization failed. Try refreshing manually, check your internet connection, or reconnect your wallet."
  },
  offline: {
    title: "Offline Mode",
    content: "You're currently offline. The app is showing your last synced data. Sync will resume when you're back online."
  },
  info: {
    title: "Sync Information",
    content: "Your wallet and profile data are automatically synchronized every 5 minutes and when you return to the app."
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case "synced":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "syncing":
      return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "offline":
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case "synced":
      return "bg-green-500";
    case "syncing":
      return "bg-yellow-500";
    case "error":
      return "bg-red-500";
    case "offline":
      return "bg-gray-500";
    default:
      return "bg-blue-500";
  }
};

export function SyncHelpTooltip({ 
  type, 
  status, 
  message, 
  className,
  children 
}: SyncHelpTooltipProps) {
  const helpContent = syncHelpContent[type];
  const statusMessage = status ? syncStatusMessages[status] : message;

  if (children) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("cursor-help", className)}>
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <div className="font-semibold">{helpContent.title}</div>
              <div className="text-sm">{helpContent.content}</div>
              {statusMessage && (
                <div className="text-xs text-muted-foreground border-t pt-2">
                  {statusMessage}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={cn("inline-flex items-center gap-1", className)}>
            {type === "status" && status ? (
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))} />
                {getStatusIcon(status)}
              </div>
            ) : (
              <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">{helpContent.title}</div>
            <div className="text-sm">{helpContent.content}</div>
            {statusMessage && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                {statusMessage}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Specialized components for common use cases
export function SyncStatusIndicator({ 
  status, 
  showText = false,
  className 
}: { 
  status: "synced" | "syncing" | "error" | "offline";
  showText?: boolean;
  className?: string;
}) {
  return (
    <SyncHelpTooltip type="status" status={status} className={className}>
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))} />
        {getStatusIcon(status)}
        {showText && (
          <span className="text-sm capitalize">{status}</span>
        )}
      </div>
    </SyncHelpTooltip>
  );
}

export function SyncRefreshButton({ 
  onClick,
  isLoading = false,
  className 
}: { 
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <SyncHelpTooltip type="refresh" className={className}>
      <button
        onClick={onClick}
        disabled={isLoading}
        className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
      >
        <Clock className={cn("h-3 w-3", isLoading && "animate-spin")} />
        {isLoading ? "Syncing..." : "Refresh"}
      </button>
    </SyncHelpTooltip>
  );
}

export function SyncErrorBadge({ 
  error,
  onRetry,
  className 
}: { 
  error: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <SyncHelpTooltip type="error" message={error} className={className}>
      <Badge 
        variant="destructive" 
        className="cursor-pointer hover:bg-destructive/90"
        onClick={onRetry}
      >
        <AlertCircle className="h-3 w-3 mr-1" />
        Sync Error
      </Badge>
    </SyncHelpTooltip>
  );
}

export function SyncOfflineIndicator({ className }: { className?: string }) {
  return (
    <SyncHelpTooltip type="offline" className={className}>
      <Badge variant="secondary" className="cursor-help">
        <AlertCircle className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    </SyncHelpTooltip>
  );
}

export function SyncInfoIcon({ className }: { className?: string }) {
  return (
    <SyncHelpTooltip type="info" className={className} />
  );
}