"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ProfileDataTransitionProps {
  children: ReactNode;
  isUpdating?: boolean;
  updateKey?: string | number;
  transitionDuration?: number;
  className?: string;
}

export function ProfileDataTransition({
  children,
  isUpdating = false,
  updateKey,
  transitionDuration = 500,
  className
}: ProfileDataTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const previousUpdateKeyRef = useRef(updateKey);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Trigger transition when updateKey changes
    if (updateKey !== undefined && updateKey !== previousUpdateKeyRef.current) {
      setIsTransitioning(true);
      setShowContent(false);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Show new content after transition
      timeoutRef.current = setTimeout(() => {
        setShowContent(true);
        setIsTransitioning(false);
      }, transitionDuration / 2);

      previousUpdateKeyRef.current = updateKey;
    }
  }, [updateKey, transitionDuration]);

  useEffect(() => {
    // Handle isUpdating prop changes
    if (isUpdating) {
      setIsTransitioning(true);
    } else {
      // Delay showing content to allow for smooth transition
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    }
  }, [isUpdating]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn(
      "transition-all duration-500 ease-in-out",
      isTransitioning && "scale-[0.98] opacity-70",
      !showContent && "opacity-0",
      className
    )}>
      <div className={cn(
        "transition-transform duration-300 ease-out",
        isTransitioning && "translate-y-1"
      )}>
        {children}
      </div>
    </div>
  );
}

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  className,
  prefix = "",
  suffix = ""
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValueRef = useRef(value);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (value !== previousValueRef.current) {
      setIsAnimating(true);
      const startValue = previousValueRef.current;
      const endValue = value;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = Math.round(
          startValue + (endValue - startValue) * easeOutCubic
        );
        
        setDisplayValue(currentValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          previousValueRef.current = value;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span className={cn(
      "transition-all duration-200",
      isAnimating && "scale-110 text-blue-600 dark:text-blue-400",
      className
    )}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

export interface ProfileStatsTransitionProps {
  stats: {
    totalNFTs: number;
    eligibleMoments: number;
    seasonRank: number;
    totalPoints: number;
  };
  isUpdating?: boolean;
  className?: string;
}

export function ProfileStatsTransition({
  stats,
  isUpdating = false,
  className
}: ProfileStatsTransitionProps) {
  return (
    <ProfileDataTransition
      isUpdating={isUpdating}
      updateKey={`${stats.totalNFTs}-${stats.eligibleMoments}-${stats.seasonRank}-${stats.totalPoints}`}
      className={className}
    >
      <div className="grid grid-cols-2 gap-6 text-center">
        <div className="transition-all hover:scale-110 duration-300">
          <div className="text-4xl font-bold mb-1">
            <AnimatedCounter value={stats.totalNFTs} />
          </div>
          <div className="text-sm text-muted-foreground">Total NFTs</div>
        </div>
        <div className="transition-all hover:scale-110 duration-300">
          <div className="text-4xl font-bold mb-1">
            <AnimatedCounter value={stats.seasonRank} prefix="#" />
          </div>
          <div className="text-sm text-muted-foreground">Rank</div>
        </div>
      </div>
    </ProfileDataTransition>
  );
}

export interface NFTCollectionTransitionProps {
  children: ReactNode;
  collectionCount: number;
  isLoading?: boolean;
  className?: string;
}

export function NFTCollectionTransition({
  children,
  collectionCount,
  isLoading = false,
  className
}: NFTCollectionTransitionProps) {
  const [previousCount, setPreviousCount] = useState(collectionCount);
  const [showChangeIndicator, setShowChangeIndicator] = useState(false);

  useEffect(() => {
    if (collectionCount !== previousCount && previousCount > 0) {
      setShowChangeIndicator(true);
      setTimeout(() => setShowChangeIndicator(false), 2000);
    }
    setPreviousCount(collectionCount);
  }, [collectionCount, previousCount]);

  return (
    <div className={cn("relative", className)}>
      {showChangeIndicator && (
        <div className="absolute top-0 right-0 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
          {collectionCount > previousCount ? '+' : ''}{collectionCount - previousCount}
        </div>
      )}
      
      <ProfileDataTransition
        isUpdating={isLoading}
        updateKey={collectionCount}
      >
        {children}
      </ProfileDataTransition>
    </div>
  );
}