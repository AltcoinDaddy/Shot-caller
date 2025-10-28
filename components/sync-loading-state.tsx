"use client";

import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface SyncLoadingStateProps {
  isLoading: boolean;
  children: ReactNode;
  loadingText?: string;
  variant?: "skeleton" | "spinner" | "overlay";
  className?: string;
}

export function SyncLoadingState({
  isLoading,
  children,
  loadingText = "Syncing...",
  variant = "skeleton",
  className
}: SyncLoadingStateProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (variant === "spinner") {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="flex items-center gap-2">
          <Spinner className="w-4 h-4" />
          <span className="text-sm text-muted-foreground">{loadingText}</span>
        </div>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className={cn("relative", className)}>
        {children}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-4 py-2 shadow-lg">
            <Spinner className="w-4 h-4" />
            <span className="text-sm">{loadingText}</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export interface SyncSkeletonProps {
  lines?: number;
  className?: string;
}

export function SyncSkeleton({ lines = 3, className }: SyncSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 && "w-3/4",
            i === 1 && "w-1/2",
            i === 2 && "w-2/3",
            i > 2 && "w-full"
          )}
        />
      ))}
    </div>
  );
}

export interface InlineSyncLoadingProps {
  isLoading: boolean;
  text?: string;
  className?: string;
}

export function InlineSyncLoading({
  isLoading,
  text = "Syncing",
  className
}: InlineSyncLoadingProps) {
  if (!isLoading) return null;

  return (
    <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <Spinner className="w-3 h-3" />
      <span>{text}...</span>
    </div>
  );
}