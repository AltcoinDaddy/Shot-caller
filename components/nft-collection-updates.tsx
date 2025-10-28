"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NFTCollectionChange {
  type: 'added' | 'removed';
  nft: {
    id: string;
    playerName: string;
    sport: string;
    rarity: string;
  };
  timestamp: Date;
}

export interface NFTCollectionUpdatesProps {
  changes: NFTCollectionChange[];
  onDismissChange?: (changeId: string) => void;
  className?: string;
}

export function NFTCollectionUpdates({
  changes,
  onDismissChange,
  className
}: NFTCollectionUpdatesProps) {
  const [visibleChanges, setVisibleChanges] = useState<NFTCollectionChange[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // Show new changes
    const newChanges = changes.filter(change => 
      !visibleChanges.some(visible => 
        visible.nft.id === change.nft.id && 
        visible.type === change.type &&
        visible.timestamp.getTime() === change.timestamp.getTime()
      )
    );

    if (newChanges.length > 0) {
      setVisibleChanges(prev => [...prev, ...newChanges]);

      // Auto-dismiss after 5 seconds
      newChanges.forEach(change => {
        const changeId = `${change.nft.id}-${change.type}-${change.timestamp.getTime()}`;
        const timeout = setTimeout(() => {
          setVisibleChanges(prev => prev.filter(c => 
            !(c.nft.id === change.nft.id && 
              c.type === change.type &&
              c.timestamp.getTime() === change.timestamp.getTime())
          ));
          timeoutRefs.current.delete(changeId);
        }, 5000);
        
        timeoutRefs.current.set(changeId, timeout);
      });
    }

    return () => {
      // Cleanup timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, [changes, visibleChanges]);

  const handleDismiss = (change: NFTCollectionChange) => {
    const changeId = `${change.nft.id}-${change.type}-${change.timestamp.getTime()}`;
    
    // Clear timeout if exists
    const timeout = timeoutRefs.current.get(changeId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(changeId);
    }

    // Remove from visible changes
    setVisibleChanges(prev => prev.filter(c => 
      !(c.nft.id === change.nft.id && 
        c.type === change.type &&
        c.timestamp.getTime() === change.timestamp.getTime())
    ));

    // Call external dismiss handler
    onDismissChange?.(changeId);
  };

  if (visibleChanges.length === 0) return null;

  return (
    <div className={cn("fixed top-20 right-4 z-40 space-y-2", className)}>
      {visibleChanges.map((change) => {
        const changeId = `${change.nft.id}-${change.type}-${change.timestamp.getTime()}`;
        const isAddition = change.type === 'added';
        
        return (
          <Card
            key={changeId}
            className={cn(
              "p-3 shadow-lg border-l-4 animate-in slide-in-from-right-2 fade-in duration-300",
              isAddition ? "bg-green-50 border-l-green-500" : "bg-red-50 border-l-red-500"
            )}
            onClick={() => handleDismiss(change)}
          >
            <div className="flex items-center gap-3 cursor-pointer">
              <div className={cn(
                "flex-shrink-0 p-1 rounded-full",
                isAddition ? "bg-green-100" : "bg-red-100"
              )}>
                {isAddition ? (
                  <Plus className="w-4 h-4 text-green-600" />
                ) : (
                  <Minus className="w-4 h-4 text-red-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isAddition ? "text-green-800" : "text-red-800"
                  )}>
                    {change.nft.playerName}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      isAddition ? "border-green-300 text-green-700" : "border-red-300 text-red-700"
                    )}
                  >
                    {change.nft.sport}
                  </Badge>
                </div>
                <p className={cn(
                  "text-xs",
                  isAddition ? "text-green-600" : "text-red-600"
                )}>
                  {isAddition ? "Added to collection" : "Removed from collection"}
                </p>
              </div>

              {change.nft.rarity === 'Legendary' && (
                <Sparkles className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export interface CollectionStatsUpdateProps {
  previousCount: number;
  currentCount: number;
  previousEligible: number;
  currentEligible: number;
  show: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function CollectionStatsUpdate({
  previousCount,
  currentCount,
  previousEligible,
  currentEligible,
  show,
  onDismiss,
  className
}: CollectionStatsUpdateProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300);
      }, 4000);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, onDismiss]);

  if (!show && !isVisible) return null;

  const totalChange = currentCount - previousCount;
  const eligibleChange = currentEligible - previousEligible;
  const hasChanges = totalChange !== 0 || eligibleChange !== 0;

  if (!hasChanges) return null;

  return (
    <div className={cn(
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out",
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
      className
    )}>
      <Card className="p-4 bg-blue-50 border-blue-200 shadow-lg">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Collection Updated
            </p>
            <div className="flex items-center gap-4 text-xs text-blue-600 mt-1">
              {totalChange !== 0 && (
                <span>
                  Total: {currentCount} ({totalChange > 0 ? '+' : ''}{totalChange})
                </span>
              )}
              {eligibleChange !== 0 && (
                <span>
                  Eligible: {currentEligible} ({eligibleChange > 0 ? '+' : ''}{eligibleChange})
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}