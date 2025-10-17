"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Calendar, 
  Trophy, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useNFTOwnership } from '@/hooks/use-nft-ownership'
import { lineupService, ContestInfo } from '@/lib/services/lineup-service'
import { NFTMoment } from '@/lib/types/nft'
import { cn } from '@/lib/utils'

interface MyTeamDashboardCardProps {
  className?: string
}

export function MyTeamDashboardCard({ className }: MyTeamDashboardCardProps) {
  const { isAuthenticated, user } = useAuth()
  const { 
    eligibleMoments, 
    totalMoments, 
    isLoading: nftLoading, 
    error: nftError,
    refreshOwnership 
  } = useNFTOwnership()

  const [activeContest, setActiveContest] = useState<ContestInfo | null>(null)
  const [currentLineup, setCurrentLineup] = useState<NFTMoment[] | null>(null)
  const [isLoadingContest, setIsLoadingContest] = useState(false)
  const [contestError, setContestError] = useState<string | null>(null)

  // Load active contest and lineup data
  useEffect(() => {
    const loadContestData = async () => {
      if (!isAuthenticated || !user?.addr) {
        setActiveContest(null)
        setCurrentLineup(null)
        return
      }

      setIsLoadingContest(true)
      setContestError(null)

      try {
        // Get active contests
        const contests = await lineupService.getActiveContests()
        const contest = contests.length > 0 ? contests[0] : null
        setActiveContest(contest)

        // Get current lineup if contest exists
        if (contest) {
          const lineupData = await lineupService.getLineupWithMetadata(
            contest.id,
            user.addr
          )
          setCurrentLineup(lineupData?.moments || null)
        } else {
          setCurrentLineup(null)
        }
      } catch (error) {
        console.error('Failed to load contest data:', error)
        setContestError(error instanceof Error ? error.message : 'Failed to load contest data')
      } finally {
        setIsLoadingContest(false)
      }
    }

    loadContestData()
  }, [isAuthenticated, user?.addr])

  const handleRetry = () => {
    refreshOwnership()
  }

  // Loading state
  if (nftLoading || isLoadingContest) {
    return <MyTeamDashboardCardSkeleton className={className} />
  }

  // Error state
  if (nftError || contestError) {
    return (
      <MyTeamDashboardCardError 
        error={nftError || contestError || 'Unknown error'}
        onRetry={handleRetry}
        className={className}
      />
    )
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <Card className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-foreground/20",
        "bg-gradient-to-br from-card to-card/80 backdrop-blur-sm",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">MY TEAM</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Connect wallet to view team
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Dapper Wallet to manage your team
            </p>
            <Link href="/team">
              <Button variant="default" className="w-full">
                Connect Wallet
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate lineup status
  const lineupCount = currentLineup?.length || 0
  const hasLineup = lineupCount > 0
  const isLineupComplete = lineupCount === 5
  const hasEligibleNFTs = eligibleMoments.length > 0

  // Contest status
  const contestStatus = activeContest ? {
    isActive: activeContest.isActive,
    weekId: activeContest.weekId,
    endTime: activeContest.endTime,
    status: activeContest.status
  } : null

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-foreground/20",
      "bg-gradient-to-br from-card to-card/80 backdrop-blur-sm",
      className
    )}>
      {/* Holographic effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-pulse" />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">MY TEAM</CardTitle>
              <p className="text-sm text-muted-foreground">
                Lineup & NFT collection
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lineup Status */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-foreground">
              {lineupCount}/5
            </span>
            <span className="text-sm text-muted-foreground">
              players in lineup
            </span>
          </div>
          
          {/* NFT Collection Summary */}
          <div className="text-xs text-muted-foreground">
            {totalMoments} total NFTs • {eligibleMoments.length} eligible
          </div>
        </div>

        {/* Contest Information */}
        {contestStatus && (
          <div className="space-y-2">
            <Badge 
              variant="outline" 
              className={cn(
                "w-fit gap-1",
                contestStatus.isActive 
                  ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
                  : "bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-300"
              )}
            >
              <Calendar className="h-3 w-3" />
              Week {contestStatus.weekId} {contestStatus.isActive ? 'Active' : contestStatus.status}
            </Badge>
            
            {/* Lineup Status Badge */}
            {hasLineup && (
              <Badge 
                variant="outline" 
                className={cn(
                  "w-fit gap-1",
                  isLineupComplete 
                    ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
                    : "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                )}
              >
                {isLineupComplete ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Lineup Complete
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    Lineup Incomplete
                  </>
                )}
              </Badge>
            )}
          </div>
        )}

        {/* No NFTs Warning */}
        {!hasEligibleNFTs && (
          <Alert className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              No eligible NFTs found. You need NBA Top Shot or NFL All Day moments to play.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button
              variant={hasLineup ? "outline" : "default"}
              size="sm"
              asChild
              className="flex-1 text-xs"
            >
              <Link href="/team">
                {hasLineup ? (
                  <>
                    <Trophy className="h-3 w-3 mr-1" />
                    Update Lineup
                  </>
                ) : (
                  <>
                    <Users className="h-3 w-3 mr-1" />
                    Set Lineup
                  </>
                )}
              </Link>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1 text-xs"
            >
              <Link href="/team">
                View Team
              </Link>
            </Button>
          </div>

          {/* Main Action Link */}
          <Link href="/team">
            <Button variant="ghost" className="w-full group-hover:bg-primary/10 transition-colors text-xs">
              Manage Team
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function MyTeamDashboardCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}

interface MyTeamDashboardCardErrorProps {
  error: string
  onRetry?: () => void
  className?: string
}

function MyTeamDashboardCardError({ error, onRetry, className }: MyTeamDashboardCardErrorProps) {
  return (
    <Card className={cn("border-destructive/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">MY TEAM</CardTitle>
            <p className="text-sm text-muted-foreground">
              Failed to load team data
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {error}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRetry}
              className="flex-1 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            asChild
            className="flex-1 text-xs"
          >
            <Link href="/team">
              Go to Team
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { MyTeamDashboardCardSkeleton, MyTeamDashboardCardError }