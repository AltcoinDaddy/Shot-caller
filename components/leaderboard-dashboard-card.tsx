"use client"

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useUserRanking } from '@/hooks/use-leaderboard'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

interface LeaderboardDashboardCardProps {
  className?: string
}

export function LeaderboardDashboardCard({ className }: LeaderboardDashboardCardProps) {
  const { user } = useAuth()
  const { ranking, loading, error, refreshRanking } = useUserRanking(user?.addr || null, 'season')

  if (loading) {
    return <LeaderboardCardSkeleton className={className} />
  }

  if (error) {
    return (
      <LeaderboardCardError 
        error={error}
        onRetry={refreshRanking}
        className={className}
      />
    )
  }

  // Default values if no ranking data
  const currentRank = ranking?.rank || 0
  const weeklyPoints = ranking?.weeklyPoints || 0
  const totalPoints = ranking?.totalPoints || 0
  const rankChange = ranking?.rankChange || 0
  const previousRank = ranking?.previousRank

  return (
    <Card className={cn(
      "dashboard-card group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-foreground/20",
      "bg-gradient-to-br from-card to-card/80 backdrop-blur-sm",
      className
    )}>
      {/* Holographic effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-pulse" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">LEADERBOARD</CardTitle>
        <Trophy className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      
      <CardContent>
        {/* Current Rank Display */}
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold">
                {currentRank > 0 ? `#${currentRank}` : 'Unranked'}
              </span>
              {rankChange !== 0 && (
                <RankBadge rankChange={rankChange} previousRank={previousRank} />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Current rank
            </p>
          </div>

          {/* Points Display */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">This week:</span>
              <span className="font-medium">{weeklyPoints.toLocaleString()} pts</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Season total:</span>
              <span className="font-medium">{totalPoints.toLocaleString()} pts</span>
            </div>
          </div>

          {/* Quick Action Button */}
          <Button size="sm" asChild className="w-full">
            <Link href="/leaderboard">
              View Full Rankings
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface RankBadgeProps {
  rankChange: number
  previousRank?: number
}

function RankBadge({ rankChange, previousRank }: RankBadgeProps) {
  const isPositive = rankChange > 0
  const isNegative = rankChange < 0
  
  let icon = Minus
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
  let text = "No change"
  
  if (isPositive) {
    icon = TrendingUp
    variant = "default"
    text = `+${rankChange}`
  } else if (isNegative) {
    icon = TrendingDown
    variant = "destructive"
    text = `${rankChange}` // rankChange is already negative
  }

  return (
    <Badge variant={variant} className="text-xs">
      {React.createElement(icon, { className: "h-3 w-3 mr-1" })}
      {text}
    </Badge>
  )
}

function LeaderboardCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("dashboard-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline space-x-2">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-20 mt-1" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

interface LeaderboardCardErrorProps {
  error: string
  onRetry?: () => void
  className?: string
}

function LeaderboardCardError({ error, onRetry, className }: LeaderboardCardErrorProps) {
  return (
    <Card className={cn("dashboard-card border-destructive/50", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">LEADERBOARD</CardTitle>
        <AlertCircle className="h-4 w-4 text-destructive" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>
          {onRetry && (
            <Button 
              variant="outline" 
              onClick={onRetry}
              size="sm"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}