"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Trophy, TrendingUp, TrendingDown, Minus, RefreshCw, Users, Target } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLeaderboard, usePrizePool } from "@/hooks/use-leaderboard"
import { usePremium } from "@/hooks/use-premium"
import { PrizePoolDisplay } from "@/components/prize-pool-display"
import { PremiumBadge } from "@/components/premium-badge"
import { LeaderboardTimeframe } from "@/lib/types/leaderboard"

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("season")
  
  const { leaderboard, stats, loading, error, refreshLeaderboard } = useLeaderboard(timeframe, 100)
  const { prizePool, loading: prizePoolLoading } = usePrizePool("contest_1") // Default contest
  const { isPremium, features } = usePremium()

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-500 text-black"
    if (rank === 2) return "bg-gray-400 text-black"
    if (rank === 3) return "bg-amber-700 text-white"
    if (rank <= 10) return "bg-green-500/20 text-green-700 dark:text-green-300"
    return "bg-muted text-muted-foreground"
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const handleRefresh = async () => {
    await refreshLeaderboard()
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Mobile Optimized */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-2 mobile-heading">LEADERBOARD</h1>
              <p className="text-base sm:text-xl text-muted-foreground">Compete with the best fantasy managers in the game</p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={loading}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto touch-target"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </Button>
          </div>
          
          {/* Stats Overview - Mobile Optimized */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 mobile-grid">
              <Card className="p-3 sm:p-4 mobile-card">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm text-muted-foreground">Total Players</div>
                    <div className="font-bold text-sm sm:text-base truncate">{stats.totalUsers.toLocaleString()}</div>
                  </div>
                </div>
              </Card>
              <Card className="p-3 sm:p-4 mobile-card">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm text-muted-foreground">Top Score</div>
                    <div className="font-bold text-sm sm:text-base truncate">{stats.topScore.toLocaleString()}</div>
                  </div>
                </div>
              </Card>
              <Card className="p-3 sm:p-4 mobile-card">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm text-muted-foreground">Prize Pool</div>
                    <div className="font-bold text-sm sm:text-base truncate">{stats.totalPrizePool.toLocaleString()} FLOW</div>
                  </div>
                </div>
              </Card>
              <Card className="p-3 sm:p-4 mobile-card">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm text-muted-foreground">Weekly Active</div>
                    <div className="font-bold text-sm sm:text-base truncate">{stats.weeklyParticipants.toLocaleString()}</div>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Premium Rewards Info */}
          {isPremium && (
            <Card className="p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                    Premium Active
                  </Badge>
                  <div>
                    <h3 className="font-semibold">Enhanced Rewards</h3>
                    <p className="text-sm text-muted-foreground">
                      You're earning +{Math.round((features.bonusRewardMultiplier - 1) * 100)}% bonus rewards on all winnings
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    +{Math.round((features.bonusRewardMultiplier - 1) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Bonus Multiplier</p>
                </div>
              </div>
            </Card>
          )}
          
          {!isPremium && (
            <Card className="p-6 border-dashed">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-2">Unlock Premium Rewards</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get bonus reward multipliers, exclusive tournaments, and advanced analytics
                  </p>
                </div>
                <PremiumBadge feature="Bonus Rewards" />
              </div>
            </Card>
          )}
        </div>

        {/* Timeframe Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="season" onValueChange={(v) => setTimeframe(v as LeaderboardTimeframe)}>
            <TabsList>
              <TabsTrigger value="season">Season Rankings</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 h-80">
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <div className="h-16 w-16 bg-muted animate-pulse rounded-full" />
                    <div className="h-20 w-20 bg-muted animate-pulse rounded-full" />
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 text-center">
            <div className="text-red-500 mb-2">Failed to load leaderboard</div>
            <div className="text-sm text-muted-foreground mb-4">{error}</div>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </Card>
        )}

        {/* Top 3 Podium - Mobile Optimized */}
        {!loading && !error && leaderboard.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {leaderboard.slice(0, 3).map((player, idx) => {
              const order = idx === 0 ? 1 : idx === 1 ? 0 : 2 // Reorder for podium effect
              const heights = ["sm:h-64 md:h-80", "sm:h-56 md:h-72", "sm:h-48 md:h-64"]
              const points = timeframe === 'weekly' ? player.weeklyPoints : player.totalPoints
              return (
                <Card
                  key={player.id}
                  className={`p-4 sm:p-6 flex flex-col items-center justify-end ${heights[order]} sm:order-${order} bg-gradient-to-b from-card to-muted/30 border-2 mobile-card min-h-[200px]`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`h-12 w-12 sm:h-16 sm:w-16 rounded-full ${getRankBadge(player.rank)} flex items-center justify-center mb-3 sm:mb-4`}
                    >
                      {player.rank === 1 ? (
                        <Trophy className="h-6 w-6 sm:h-8 sm:w-8" />
                      ) : (
                        <span className="text-lg sm:text-2xl font-bold">{player.rank}</span>
                      )}
                    </div>
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mb-3 sm:mb-4 border-2 sm:border-4 border-background">
                      <AvatarImage src={player.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-sm sm:text-base">{player.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="font-bold text-lg sm:text-xl mb-2 truncate w-full px-2">{player.username}</div>
                    <div className="text-2xl sm:text-3xl font-bold mb-1">{points.toLocaleString()}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {timeframe === 'weekly' ? 'Weekly' : 'Total'} Points
                    </div>
                    {player.rankChange !== 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {getChangeIcon(player.rankChange)}
                        <span className="text-xs sm:text-sm">{Math.abs(player.rankChange)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Full Leaderboard Table - Mobile Optimized */}
        {!loading && !error && leaderboard.length > 0 && (
          <Card className="overflow-hidden mb-8 sm:mb-12 mobile-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-2 sm:p-4 font-bold text-xs sm:text-sm">RANK</th>
                    <th className="text-left p-2 sm:p-4 font-bold text-xs sm:text-sm">PLAYER</th>
                    <th className="text-right p-2 sm:p-4 font-bold text-xs sm:text-sm hidden sm:table-cell">TOTAL</th>
                    <th className="text-right p-2 sm:p-4 font-bold text-xs sm:text-sm">POINTS</th>
                    <th className="text-center p-2 sm:p-4 font-bold text-xs sm:text-sm hidden md:table-cell">W/L</th>
                    <th className="text-center p-2 sm:p-4 font-bold text-xs sm:text-sm hidden lg:table-cell">NFTs</th>
                    <th className="text-center p-2 sm:p-4 font-bold text-xs sm:text-sm hidden sm:table-cell">CHANGE</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player) => {
                    const points = timeframe === 'weekly' ? player.weeklyPoints : player.totalPoints
                    return (
                      <tr key={player.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-2 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div
                              className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full ${getRankBadge(player.rank)} flex items-center justify-center font-bold text-xs sm:text-sm`}
                            >
                              {player.rank <= 3 && player.rank === 1 ? <Trophy className="h-3 w-3 sm:h-5 sm:w-5" /> : player.rank}
                            </div>
                          </div>
                        </td>
                        <td className="p-2 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                              <AvatarImage src={player.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs sm:text-sm">{player.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm sm:text-base truncate">{player.username}</div>
                              <div className="text-xs text-muted-foreground hidden sm:block">
                                {player.walletAddress.slice(0, 6)}...{player.walletAddress.slice(-4)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 text-right hidden sm:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="font-bold text-sm sm:text-lg">{player.totalPoints.toLocaleString()}</div>
                            {/* Show premium bonus indicator for premium users */}
                            {isPremium && features.bonusRewardMultiplier > 1.0 && (
                              <Badge variant="outline" className="text-xs bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20 hidden lg:inline-flex">
                                +{Math.round((features.bonusRewardMultiplier - 1) * 100)}%
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 text-right">
                          <div className="text-sm sm:text-base">
                            <div className="font-bold sm:hidden">{points.toLocaleString()}</div>
                            <div className="text-muted-foreground hidden sm:block">{player.weeklyPoints.toLocaleString()}</div>
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 text-center hidden md:table-cell">
                          <div className="text-xs sm:text-sm">
                            <span className="text-green-600">{timeframe === 'weekly' ? player.weeklyWins : player.wins}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-red-600">{timeframe === 'weekly' ? player.weeklyLosses : player.losses}</span>
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 text-center hidden lg:table-cell">
                          <Badge variant="outline" className="text-xs">{player.nftsUsed}/5</Badge>
                        </td>
                        <td className="p-2 sm:p-4 hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            {getChangeIcon(player.rankChange)}
                            {player.rankChange !== 0 && <span className="text-xs sm:text-sm">{Math.abs(player.rankChange)}</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Rewards Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-yellow-500 text-black flex items-center justify-center">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-lg">1st Place</div>
                <div className="text-sm text-muted-foreground">Season Reward</div>
              </div>
            </div>
            <div className="text-2xl font-bold">5,000 FLOW</div>
            <div className="text-sm text-muted-foreground">+ Exclusive NFT</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-gray-400/10 to-gray-400/5 border-gray-400/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-gray-400 text-black flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div>
                <div className="font-bold text-lg">2nd Place</div>
                <div className="text-sm text-muted-foreground">Season Reward</div>
              </div>
            </div>
            <div className="text-2xl font-bold">3,000 FLOW</div>
            <div className="text-sm text-muted-foreground">+ Premium NFT</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-700/10 to-amber-700/5 border-amber-700/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div>
                <div className="font-bold text-lg">3rd Place</div>
                <div className="text-sm text-muted-foreground">Season Reward</div>
              </div>
            </div>
            <div className="text-2xl font-bold">1,500 FLOW</div>
            <div className="text-sm text-muted-foreground">+ Standard NFT</div>
          </Card>
        </div>
      </div>
    </div>
  )
}
