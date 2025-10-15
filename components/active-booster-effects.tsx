"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Zap, Clock, Sparkles, TrendingUp } from "lucide-react"
import { useActiveBoosters } from "@/hooks/use-boosters"
import { Booster } from "@/lib/types/booster"

interface ActiveBoosterEffectsProps {
  lineupId?: string;
  showInScoring?: boolean;
}

export function ActiveBoosterEffects({ 
  lineupId = "current_lineup",
  showInScoring = false 
}: ActiveBoosterEffectsProps) {
  const { activeBoosters, isLoading } = useActiveBoosters();
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  // Update time remaining every minute
  useEffect(() => {
    const updateTimeRemaining = () => {
      const newTimeRemaining: Record<string, string> = {};
      
      activeBoosters.forEach(booster => {
        if (booster.expiresAt) {
          const now = new Date();
          const timeLeft = booster.expiresAt.getTime() - now.getTime();
          
          if (timeLeft <= 0) {
            newTimeRemaining[booster.id] = 'Expired';
          } else {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 24) {
              const days = Math.floor(hours / 24);
              newTimeRemaining[booster.id] = `${days}d ${hours % 24}h`;
            } else {
              newTimeRemaining[booster.id] = `${hours}h ${minutes}m`;
            }
          }
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [activeBoosters]);

  const getBoosterIcon = (boosterType: string) => {
    if (boosterType.includes('disney')) {
      return <Sparkles className="h-4 w-4 text-purple-500" />;
    }
    return <Zap className="h-4 w-4 text-blue-500" />;
  };

  const getBoosterDescription = (booster: Booster) => {
    switch (booster.effectType) {
      case 'score_multiplier':
        const percentage = Math.round((booster.effectValue - 1) * 100);
        return `+${percentage}% score multiplier`;
      case 'random_bonus':
        return `Random bonus (5-${booster.effectValue} points)`;
      case 'extra_points':
        return `+${booster.effectValue} bonus points`;
      case 'lineup_protection':
        return 'Protects from negative scores';
      default:
        return 'Unknown effect';
    }
  };

  const getTimeProgress = (booster: Booster) => {
    if (!booster.activatedAt || !booster.expiresAt) return 0;
    
    const now = new Date();
    const totalDuration = booster.expiresAt.getTime() - booster.activatedAt.getTime();
    const elapsed = now.getTime() - booster.activatedAt.getTime();
    
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  };

  if (isLoading) {
    return (
      <Card className={showInScoring ? "border-blue-200" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Active Boosters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeBoosters.length === 0) {
    return (
      <Card className={showInScoring ? "border-gray-200" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            Active Boosters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No active boosters</p>
            <p className="text-xs text-muted-foreground mt-1">
              Activate boosters to enhance your lineup performance
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={showInScoring ? "border-green-200 bg-green-50/50" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          Active Boosters ({activeBoosters.length})
        </CardTitle>
        {showInScoring && (
          <CardDescription className="text-xs">
            These effects are currently applied to your lineup scoring
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {activeBoosters.map((booster) => (
          <div key={booster.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getBoosterIcon(booster.boosterType)}
                <span className="text-sm font-medium">
                  {booster.boosterType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                {booster.sourceType === 'disney_pinnacle_nft' && (
                  <Badge variant="secondary" className="text-xs">
                    Disney
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{timeRemaining[booster.id] || 'Calculating...'}</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {getBoosterDescription(booster)}
            </div>
            
            {booster.activatedAt && booster.expiresAt && (
              <Progress 
                value={getTimeProgress(booster)} 
                className="h-1"
              />
            )}
          </div>
        ))}
        
        {showInScoring && (
          <div className="mt-4 p-2 bg-green-100 rounded-md">
            <p className="text-xs text-green-700 font-medium">
              ✨ Booster effects are automatically applied to your final score
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}