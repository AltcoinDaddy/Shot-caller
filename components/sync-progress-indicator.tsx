"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

export enum SyncOperationType {
  WALLET_VERIFICATION = 'wallet_verification',
  NFT_COLLECTION_FETCH = 'nft_collection_fetch',
  PROFILE_DATA_UPDATE = 'profile_data_update',
  CACHE_INVALIDATION = 'cache_invalidation',
  ELIGIBILITY_CHECK = 'eligibility_check'
}

export enum OperationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  status: OperationStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  retryCount: number;
  progress?: number;
  message?: string;
  metadata?: Record<string, any>;
}

export interface SyncProgressIndicatorProps {
  operations: SyncOperation[];
  onCancel?: () => void;
  onRetry?: (operationId: string) => void;
  variant?: "compact" | "detailed" | "modal";
  showEstimatedTime?: boolean;
  className?: string;
}

export function SyncProgressIndicator({
  operations,
  onCancel,
  onRetry,
  variant = "detailed",
  showEstimatedTime = true,
  className
}: SyncProgressIndicatorProps) {
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  const activeOperations = operations.filter(op => 
    op.status === OperationStatus.IN_PROGRESS || op.status === OperationStatus.RETRYING
  );
  const completedOperations = operations.filter(op => op.status === OperationStatus.COMPLETED);
  const failedOperations = operations.filter(op => op.status === OperationStatus.FAILED);

  const totalProgress = operations.length > 0 
    ? (completedOperations.length / operations.length) * 100 
    : 0;

  const getOperationLabel = (type: SyncOperationType) => {
    switch (type) {
      case SyncOperationType.WALLET_VERIFICATION:
        return "Verifying wallet";
      case SyncOperationType.NFT_COLLECTION_FETCH:
        return "Fetching NFT collection";
      case SyncOperationType.PROFILE_DATA_UPDATE:
        return "Updating profile data";
      case SyncOperationType.CACHE_INVALIDATION:
        return "Refreshing cache";
      case SyncOperationType.ELIGIBILITY_CHECK:
        return "Checking eligibility";
      default:
        return "Processing";
    }
  };

  const getStatusColor = (status: OperationStatus) => {
    switch (status) {
      case OperationStatus.COMPLETED:
        return "text-green-600";
      case OperationStatus.FAILED:
        return "text-red-600";
      case OperationStatus.IN_PROGRESS:
      case OperationStatus.RETRYING:
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: OperationStatus) => {
    switch (status) {
      case OperationStatus.COMPLETED:
        return CheckCircle;
      case OperationStatus.FAILED:
        return X;
      case OperationStatus.IN_PROGRESS:
      case OperationStatus.RETRYING:
        return RefreshCw;
      default:
        return Clock;
    }
  };

  useEffect(() => {
    if (activeOperations.length === 0) {
      setEstimatedTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const avgDuration = completedOperations.reduce((sum, op) => 
        sum + (op.duration || 0), 0) / Math.max(completedOperations.length, 1);
      
      const remaining = activeOperations.length * avgDuration;
      setEstimatedTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOperations.length, completedOperations]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  if (variant === "compact") {
    if (operations.length === 0) return null;

    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Progress value={totalProgress} className="w-20 h-2" />
        <span className="text-xs text-muted-foreground">
          {completedOperations.length}/{operations.length}
        </span>
        {activeOperations.length > 0 && (
          <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
        )}
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Syncing Profile</CardTitle>
            {onCancel && activeOperations.length > 0 && (
              <Button size="sm" variant="ghost" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(totalProgress)}%</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
          </div>

          {showEstimatedTime && estimatedTimeRemaining && (
            <div className="text-sm text-muted-foreground">
              Estimated time remaining: {formatDuration(estimatedTimeRemaining)}
            </div>
          )}

          <div className="space-y-2">
            {operations.map((operation) => {
              const Icon = getStatusIcon(operation.status);
              const isActive = operation.status === OperationStatus.IN_PROGRESS || 
                             operation.status === OperationStatus.RETRYING;

              return (
                <div key={operation.id} className="flex items-center gap-3">
                  <Icon className={cn(
                    "w-4 h-4",
                    getStatusColor(operation.status),
                    isActive && "animate-spin"
                  )} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {getOperationLabel(operation.type)}
                    </div>
                    {operation.message && (
                      <div className="text-xs text-muted-foreground">
                        {operation.message}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {operation.retryCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Retry {operation.retryCount}
                      </Badge>
                    )}
                    {operation.status === OperationStatus.FAILED && onRetry && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRetry(operation.id)}
                        className="h-6 px-2"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {failedOperations.length > 0 && (
            <div className="text-sm text-red-600">
              {failedOperations.length} operation(s) failed
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Detailed variant
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Sync Progress</h3>
        {onCancel && activeOperations.length > 0 && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Overall Progress</span>
          <span>{Math.round(totalProgress)}%</span>
        </div>
        <Progress value={totalProgress} className="h-2" />
      </div>

      {showEstimatedTime && estimatedTimeRemaining && (
        <div className="text-sm text-muted-foreground">
          Estimated time remaining: {formatDuration(estimatedTimeRemaining)}
        </div>
      )}

      <div className="space-y-2">
        {operations.map((operation) => {
          const Icon = getStatusIcon(operation.status);
          const isActive = operation.status === OperationStatus.IN_PROGRESS || 
                           operation.status === OperationStatus.RETRYING;

          return (
            <div key={operation.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <Icon className={cn(
                "w-4 h-4",
                getStatusColor(operation.status),
                isActive && "animate-spin"
              )} />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {getOperationLabel(operation.type)}
                </div>
                {operation.message && (
                  <div className="text-xs text-muted-foreground">
                    {operation.message}
                  </div>
                )}
                {operation.progress !== undefined && isActive && (
                  <Progress value={operation.progress} className="h-1 mt-1" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {operation.duration && operation.status === OperationStatus.COMPLETED && (
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(operation.duration)}
                  </span>
                )}
                {operation.retryCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Retry {operation.retryCount}
                  </Badge>
                )}
                {operation.status === OperationStatus.FAILED && onRetry && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRetry(operation.id)}
                    className="h-6 px-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}