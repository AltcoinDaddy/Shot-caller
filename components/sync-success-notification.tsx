"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, RefreshCw, X, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SyncSuccessNotificationProps {
  isVisible: boolean;
  syncProgress?: number;
  isRefreshing?: boolean;
  onDismiss?: () => void;
  title?: string;
  description?: string;
  showProgress?: boolean;
  variant?: "success" | "progress" | "collection-update";
  className?: string;
}

export function SyncSuccessNotification({
  isVisible,
  syncProgress = 0,
  isRefreshing = false,
  onDismiss,
  title = "Profile Synchronized",
  description = "Your profile has been updated successfully",
  showProgress = false,
  variant = "success",
  className
}: SyncSuccessNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Trigger animation after render
      setTimeout(() => setIsAnimating(true), 50);
    } else {
      setIsAnimating(false);
      // Remove from DOM after animation
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          bg: "bg-green-50 dark:bg-green-950/20",
          border: "border-green-200 dark:border-green-800",
          icon: CheckCircle,
          iconColor: "text-green-600 dark:text-green-400",
          textColor: "text-green-800 dark:text-green-200"
        };
      case "progress":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/20",
          border: "border-blue-200 dark:border-blue-800",
          icon: RefreshCw,
          iconColor: "text-blue-600 dark:text-blue-400",
          textColor: "text-blue-800 dark:text-blue-200"
        };
      case "collection-update":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/20",
          border: "border-purple-200 dark:border-purple-800",
          icon: Sparkles,
          iconColor: "text-purple-600 dark:text-purple-400",
          textColor: "text-purple-800 dark:text-purple-200"
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-950/20",
          border: "border-gray-200 dark:border-gray-800",
          icon: CheckCircle,
          iconColor: "text-gray-600 dark:text-gray-400",
          textColor: "text-gray-800 dark:text-gray-200"
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = styles.icon;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 transition-all duration-300 ease-out",
        isAnimating 
          ? "translate-x-0 opacity-100 scale-100" 
          : "translate-x-full opacity-0 scale-95",
        className
      )}
    >
      <Card className={cn(
        "p-4 shadow-lg backdrop-blur-sm min-w-[320px] max-w-[400px]",
        styles.bg,
        styles.border,
        "animate-in slide-in-from-right-2 fade-in duration-300"
      )}>
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex-shrink-0 p-1 rounded-full",
            variant === "success" && "bg-green-100 dark:bg-green-900/30",
            variant === "progress" && "bg-blue-100 dark:bg-blue-900/30",
            variant === "collection-update" && "bg-purple-100 dark:bg-purple-900/30"
          )}>
            <Icon className={cn(
              "w-5 h-5",
              styles.iconColor,
              isRefreshing && variant === "progress" && "animate-spin"
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={cn("text-sm font-semibold", styles.textColor)}>
                {title}
              </h4>
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            <p className={cn("text-xs", styles.textColor, "opacity-80")}>
              {description}
            </p>
            
            {showProgress && (
              <div className="mt-3 space-y-1">
                <Progress 
                  value={syncProgress} 
                  className="h-1.5"
                />
                <div className="flex justify-between text-xs opacity-60">
                  <span>Syncing...</span>
                  <span>{Math.round(syncProgress)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Animated border effect for success */}
        {variant === "success" && isAnimating && (
          <div className="absolute inset-0 rounded-lg border-2 border-green-400/50 animate-pulse" />
        )}
      </Card>
    </div>
  );
}

export interface CollectionUpdateNotificationProps {
  isVisible: boolean;
  changeType: 'added' | 'removed' | 'updated';
  count: number;
  onDismiss?: () => void;
  className?: string;
}

export function CollectionUpdateNotification({
  isVisible,
  changeType,
  count,
  onDismiss,
  className
}: CollectionUpdateNotificationProps) {
  const getChangeMessage = () => {
    const nftText = count === 1 ? 'NFT' : 'NFTs';
    switch (changeType) {
      case 'added':
        return `${count} ${nftText} added to your collection`;
      case 'removed':
        return `${count} ${nftText} removed from your collection`;
      case 'updated':
        return `${count} ${nftText} updated in your collection`;
      default:
        return `Collection updated`;
    }
  };

  const getIcon = () => {
    switch (changeType) {
      case 'added':
        return TrendingUp;
      case 'removed':
        return TrendingUp; // Could use a different icon
      case 'updated':
        return Sparkles;
      default:
        return Sparkles;
    }
  };

  return (
    <SyncSuccessNotification
      isVisible={isVisible}
      onDismiss={onDismiss}
      title="Collection Updated"
      description={getChangeMessage()}
      variant="collection-update"
      className={className}
    />
  );
}

export interface SyncProgressNotificationProps {
  isVisible: boolean;
  progress: number;
  currentOperation?: string;
  onDismiss?: () => void;
  className?: string;
}

export function SyncProgressNotification({
  isVisible,
  progress,
  currentOperation = "Synchronizing",
  onDismiss,
  className
}: SyncProgressNotificationProps) {
  const getOperationText = (operation: string) => {
    const operationMap: Record<string, string> = {
      'wallet_verification': 'Verifying wallet connection',
      'nft_collection_fetch': 'Fetching NFT collection',
      'profile_data_update': 'Updating profile data',
      'cache_invalidation': 'Refreshing cache',
      'eligibility_check': 'Checking eligibility'
    };
    
    return operationMap[operation] || operation.replace(/_/g, ' ');
  };

  return (
    <SyncSuccessNotification
      isVisible={isVisible}
      syncProgress={progress}
      isRefreshing={true}
      onDismiss={onDismiss}
      title="Syncing Profile"
      description={getOperationText(currentOperation)}
      showProgress={true}
      variant="progress"
      className={className}
    />
  );
}