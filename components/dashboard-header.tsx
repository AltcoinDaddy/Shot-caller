"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Trophy,
  Target,
  Zap,
  Calendar
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useDashboard, useDashboardRefresh } from '@/contexts/dashboard-context'
import { useLeaderboard, useUserRanking } from '@/hooks/use-leaderboard'
import { useAnalytics } from '@/hooks/use-analytics'
import { useMobileInfo } from '@/hooks/use-mobile'
import { CompactServiceMonitor } from '@/components/dashboard-service-monitor'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  className?: string
}

interface StatsOverviewData {
  totalPoints: number
  weeklyPoints: number
  currentRank: number
  rankChange: number
  winRate: number
  consistency: number
  activeContests: number
  nftCount: number
}

export function DashboardHeader({ className }: DashboardHeaderProps) {
  const { isAuthenticated, user, walletType } = useAuth()
  const { isRefreshing, lastRefresh, refreshData } = useDashboard()
  const { ranking, loading: rankingLoading, refreshRanking } = useUserRanking(user?.addr || null)
  const { analyticsData, loading: analyticsLoading, refresh: refreshAnalytics } = useAnalytics()
  const { isMobile, isTablet, isTouchDevice } = useMobileInfo()
  
  const [statsData, setStatsData] = useState<StatsOverviewData | null>(null)

  // Listen for dashboard refresh events
  useDashboardRefresh(async () => {
    await Promise.all([
      refreshRanking(),
      refreshAnalytics()
    ])
  })

  // Get user's display name
  const getUserDisplayName = () => {
    if (!isAuthenticated || !user?.addr) return 'Player'
    
    // Use wallet type for personalization
    const walletPrefix = walletType === 'dapper' ? 'Dapper' : 'Flow'
    const shortAddress = user.addr.slice(0, 6) + '...' + user.addr.slice(-4)
    return `${walletPrefix} ${shortAddress}`
  }

  // Get greeting based on time of day
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Aggregate stats from various sources
  useEffect(() => {
    if (!isAuthenticated) {
      setStatsData(null)
      return
    }

    const aggregateStats = () => {
      const stats: StatsOverviewData = {
        totalPoints: ranking?.totalPoints || analyticsData?.performanceMetrics.totalPoints || 0,
        weeklyPoints: ranking?.weeklyPoints || 0,
        currentRank: ranking?.rank || 0,
        rankChange: ranking?.rankChange || 0,
        winRate: analyticsData?.performanceMetrics.winRate || 0,
        consistency: analyticsData?.performanceMetrics.consistency || 0,
        activeContests: 1, // Mock data - would come from contest service
        nftCount: analyticsData?.teamComposition.playerContributions.length || 0
      }
      setStatsData(stats)
    }

    aggregateStats()
  }, [isAuthenticated, ranking, analyticsData])

  // Handle refresh functionality
  const handleRefresh = async () => {
    await refreshData()
  }

  if (!isAuthenticated) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-2">
          <h1 className={cn(
            "font-bold",
            isMobile ? "text-2xl" : isTablet ? "text-3xl" : "text-4xl"
          )}>
            Welcome to ShotCaller
          </h1>
          <p className={cn(
            "text-muted-foreground",
            isMobile ? "text-base" : "text-lg"
          )}>
            Connect your wallet to access your personalized dashboard and start competing.
          </p>
        </div>
      </div>
    )
  }

  const isLoading = rankingLoading || analyticsLoading

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <div className={cn(
        "flex gap-4",
        isMobile ? "flex-col" : "flex-col lg:flex-row lg:items-center lg:justify-between"
      )}>
        <div className="space-y-2">
          <h1 className={cn(
            "font-bold",
            isMobile ? "text-2xl" : isTablet ? "text-3xl" : "text-4xl"
          )}>
            {getTimeBasedGreeting()}, {getUserDisplayName()}!
          </h1>
          <p className={cn(
            "text-muted-foreground",
            isMobile ? "text-sm" : "text-lg"
          )}>
            Your ShotCaller command center - manage your team, track performance, and dominate the competition.
          </p>
        </div>
        
        <div className={cn(
          "flex gap-3",
          isMobile ? "flex-col-reverse items-stretch" : "items-center"
        )}>
          {!isMobile && (
            <div className="flex items-center gap-4">
              <CompactServiceMonitor />
              <div className="text-sm text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size={isMobile ? "default" : "sm"}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "gap-2",
              isTouchDevice && "mobile-button min-h-[44px]"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            {isMobile ? "Refresh Dashboard" : "Refresh"}
          </Button>
          {isMobile && (
            <div className="space-y-2">
              <CompactServiceMonitor className="justify-center" />
              <div className="text-xs text-muted-foreground text-center">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview 
        data={statsData}
        loading={isLoading}
        onRefresh={handleRefresh}
        isMobile={isMobile}
        isTablet={isTablet}
        isTouchDevice={isTouchDevice}
      />
    </div>
  )
}

interface StatsOverviewProps {
  data: StatsOverviewData | null
  loading: boolean
  onRefresh: () => void
  isMobile: boolean
  isTablet: boolean
  isTouchDevice: boolean
}

function StatsOverview({ data, loading, onRefresh, isMobile, isTablet, isTouchDevice }: StatsOverviewProps) {
  if (loading) {
    return <StatsOverviewSkeleton />
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No stats available</p>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Load Stats
          </Button>
        </div>
      </Card>
    )
  }

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getRankChangeColor = (change: number) => {
    if (change > 0) return "text-green-500"
    if (change < 0) return "text-red-500"
    return "text-muted-foreground"
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`
  }

  return (
    <div className={cn(
      "grid gap-4",
      // Responsive grid layout
      isMobile 
        ? "grid-cols-2" 
        : isTablet 
          ? "grid-cols-4" 
          : "grid-cols-2 md:grid-cols-4 lg:grid-cols-8"
    )}>
      {/* Total Points */}
      <Card className={cn(
        "col-span-2 transition-shadow",
        isMobile ? "p-3" : "p-4",
        isTouchDevice ? "active:scale-95" : "hover:shadow-md"
      )}>
        <CardContent className="p-0 space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className={cn(
              "font-medium text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              Total Points
            </span>
          </div>
          <div className={cn(
            "font-bold",
            isMobile ? "text-xl" : "text-2xl"
          )}>
            {data.totalPoints.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Points */}
      <Card className={cn(
        "col-span-2 transition-shadow",
        isMobile ? "p-3" : "p-4",
        isTouchDevice ? "active:scale-95" : "hover:shadow-md"
      )}>
        <CardContent className="p-0 space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className={cn(
              "font-medium text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              This Week
            </span>
          </div>
          <div className={cn(
            "font-bold",
            isMobile ? "text-xl" : "text-2xl"
          )}>
            {data.weeklyPoints.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Current Rank */}
      <Card className={cn(
        "col-span-2 transition-shadow",
        isMobile ? "p-3" : "p-4",
        isTouchDevice ? "active:scale-95" : "hover:shadow-md"
      )}>
        <CardContent className="p-0 space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-500" />
            <span className={cn(
              "font-medium text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              Rank
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-bold",
              isMobile ? "text-xl" : "text-2xl"
            )}>
              #{data.currentRank}
            </span>
            {data.rankChange !== 0 && (
              <div className="flex items-center gap-1">
                {getRankChangeIcon(data.rankChange)}
                <span className={cn(
                  "font-medium",
                  isMobile ? "text-xs" : "text-sm",
                  getRankChangeColor(data.rankChange)
                )}>
                  {Math.abs(data.rankChange)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card className={cn(
        "col-span-2 transition-shadow",
        isMobile ? "p-3" : "p-4",
        isTouchDevice ? "active:scale-95" : "hover:shadow-md"
      )}>
        <CardContent className="p-0 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-500" />
            <span className={cn(
              "font-medium text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              Win Rate
            </span>
          </div>
          <div className={cn(
            "font-bold",
            isMobile ? "text-xl" : "text-2xl"
          )}>
            {formatPercentage(data.winRate)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsOverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="col-span-2 p-4">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export { StatsOverview, StatsOverviewSkeleton }