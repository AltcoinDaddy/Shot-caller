"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardCard, QuickAction } from '@/components/dashboard-card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, Calendar, Trophy, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { useResults, type ContestResult, type UpcomingContest, type WeeklyStats } from '@/hooks/use-results'
import { cn } from '@/lib/utils'

interface ResultsData {
  latestResult?: ContestResult
  upcomingContests: UpcomingContest[]
  weeklyStats: WeeklyStats
}

interface ResultsDashboardCardProps {
  className?: string
}

export function ResultsDashboardCard({ className }: ResultsDashboardCardProps) {
  const [data, setData] = useState<ResultsData | null>(null)
  const router = useRouter()
  const { 
    loading, 
    error, 
    getAvailableContests, 
    getContestResults, 
    getWeeklyStats 
  } = useResults()

  useEffect(() => {
    fetchResultsData()
  }, [])

  const fetchResultsData = async () => {
    try {
      // Fetch data using the hook
      const [upcomingContests, recentResults, weeklyStats] = await Promise.all([
        getAvailableContests(),
        getContestResults(),
        getWeeklyStats()
      ])

      if (upcomingContests && recentResults && weeklyStats) {
        const processedData: ResultsData = {
          latestResult: recentResults[0], // Most recent result
          upcomingContests: upcomingContests.slice(0, 2), // Next 2 contests
          weeklyStats
        }
        setData(processedData)
      } else {
        // Set fallback data for development
        setData(getFallbackData())
      }

    } catch (err) {
      console.error('Error fetching results data:', err)
      // Set fallback data for development
      setData(getFallbackData())
    }
  }



  const getFallbackData = (): ResultsData => ({
    latestResult: {
      id: 'fallback_contest',
      weekId: 14,
      rank: 3,
      totalPoints: 1456,
      totalParticipants: 247,
      prizeWon: 25.5,
      status: 'completed',
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    upcomingContests: [
      {
        id: 'upcoming_1',
        weekId: 15,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        entryFee: 10,
        prizePool: 2500,
        totalParticipants: 156,
        maxParticipants: 500,
        contestType: 'weekly',
        status: 'upcoming'
      }
    ],
    weeklyStats: {
      currentWeekPoints: 1456,
      rankChange: 13,
      bestWeekRank: 1,
      averageRank: 8.5
    }
  })

  const handleViewDetails = () => {
    router.push('/results')
  }

  const handleViewUpcoming = () => {
    router.push('/results?tab=upcoming')
  }

  const handleViewBreakdown = () => {
    if (data?.latestResult) {
      router.push(`/results?week=${data.latestResult.weekId}`)
    } else {
      router.push('/results')
    }
  }

  const quickActions: QuickAction[] = [
    {
      label: 'View Breakdown',
      onClick: handleViewBreakdown,
      icon: BarChart3,
      variant: 'outline'
    },
    {
      label: 'Upcoming',
      onClick: handleViewUpcoming,
      icon: Calendar,
      variant: 'outline'
    }
  ]

  const formatRankDisplay = (rank: number, totalParticipants: number) => {
    const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'
    return `${rank}${suffix} / ${totalParticipants}`
  }

  const formatTimeUntil = (dateString: string) => {
    const now = new Date()
    const target = new Date(dateString)
    const diffMs = target.getTime() - now.getTime()
    
    if (diffMs < 0) return 'Started'
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (diffDays > 0) return `${diffDays}d ${diffHours}h`
    if (diffHours > 0) return `${diffHours}h`
    return 'Soon'
  }

  if (loading) {
    return (
      <div className={cn("dashboard-card", className)}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    )
  }

  const stats = data?.latestResult ? {
    primary: formatRankDisplay(data.latestResult.rank, data.latestResult.totalParticipants),
    secondary: `${data.latestResult.totalPoints} pts`,
    label: `Week ${data.latestResult.weekId} Result`
  } : undefined

  return (
    <DashboardCard
      title="RESULTS"
      description="Contest results and upcoming events"
      href="/results"
      icon={BarChart3}
      stats={stats}
      quickActions={quickActions}
      loading={loading}
      error={error}
      onRetry={fetchResultsData}
      className={className}
    >
      {data && (
        <div className="space-y-4">
          {/* Latest Result Summary */}
          {data.latestResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {data.latestResult.rank <= 3 ? (
                    <Trophy className={cn(
                      "h-4 w-4",
                      data.latestResult.rank === 1 && "text-yellow-500",
                      data.latestResult.rank === 2 && "text-gray-400", 
                      data.latestResult.rank === 3 && "text-amber-600"
                    )} />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {data.latestResult.rank <= 3 ? 'Prize Winner!' : 'Good Performance'}
                  </span>
                </div>
                {data.latestResult.prizeWon && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/20 text-green-600">
                    +{data.latestResult.prizeWon} FLOW
                  </Badge>
                )}
              </div>
              
              {/* Rank Change Indicator */}
              {data.weeklyStats.rankChange !== 0 && (
                <div className="flex items-center gap-1 text-xs">
                  {data.weeklyStats.rankChange > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">+{data.weeklyStats.rankChange} positions</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">{data.weeklyStats.rankChange} positions</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Contest Preview */}
          {data.upcomingContests.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground mb-2">Next Contest</div>
              {data.upcomingContests.slice(0, 1).map((contest) => (
                <div key={contest.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Week {contest.weekId}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimeUntil(contest.startTime)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{contest.entryFee} FLOW entry</span>
                    <span>{contest.totalParticipants} joined</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  )
}