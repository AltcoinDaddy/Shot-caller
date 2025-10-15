"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, Trophy, Calendar, Target } from "lucide-react"
import { UserRankingHistory } from "@/lib/types/leaderboard"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RankingHistoryProps {
  history: UserRankingHistory[]
  loading?: boolean
  showChart?: boolean
}

export function RankingHistory({ history, loading = false, showChart = true }: RankingHistoryProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 bg-muted animate-pulse rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (!history || history.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-muted-foreground">No ranking history available</div>
      </Card>
    )
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-500 text-black"
    if (rank === 2) return "bg-gray-400 text-black"
    if (rank === 3) return "bg-amber-700 text-white"
    if (rank <= 10) return "bg-green-500/20 text-green-700 dark:text-green-300"
    if (rank <= 50) return "bg-blue-500/20 text-blue-700 dark:text-blue-300"
    return "bg-muted text-muted-foreground"
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4" />
    return <span className="text-sm font-bold">{rank}</span>
  }

  const getTrendIcon = (current: UserRankingHistory, previous?: UserRankingHistory) => {
    if (!previous) return <Minus className="h-4 w-4 text-muted-foreground" />
    
    const change = previous.rank - current.rank
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  // Prepare chart data (reverse to show chronological order)
  const chartData = [...history].reverse().map((entry, index) => ({
    week: `Week ${entry.weekId}`,
    rank: entry.rank,
    points: entry.points,
    weekIndex: index
  }))

  const bestRank = Math.min(...history.map(h => h.rank))
  const totalPoints = history.reduce((sum, h) => sum + h.points, 0)
  const totalRewards = history.reduce((sum, h) => sum + h.rewardsEarned, 0)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full ${getRankBadge(bestRank)} flex items-center justify-center`}>
              {getRankIcon(bestRank)}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Best Rank</div>
              <div className="font-bold">#{bestRank}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Points</div>
              <div className="font-bold">{totalPoints.toLocaleString()}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/20 text-green-700 dark:text-green-300 flex items-center justify-center">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Rewards</div>
              <div className="font-bold">{totalRewards} FLOW</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Ranking Chart */}
      {showChart && chartData.length > 1 && (
        <Card className="p-6">
          <h4 className="font-bold mb-4">Ranking Trend</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  reversed
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'rank' ? `#${value}` : value,
                    name === 'rank' ? 'Rank' : 'Points'
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="rank" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* History List */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-muted/50 border-b">
          <h4 className="font-bold">Weekly Performance History</h4>
        </div>
        <div className="divide-y">
          {history.map((entry, index) => {
            const previousEntry = history[index + 1]
            return (
              <div key={entry.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full ${getRankBadge(entry.rank)} flex items-center justify-center`}>
                      {getRankIcon(entry.rank)}
                    </div>
                    <div>
                      <div className="font-semibold">Week {entry.weekId}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <div className="text-sm text-muted-foreground">Points</div>
                      <div className="font-semibold">{entry.points.toLocaleString()}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">NFTs Used</div>
                      <div className="font-semibold">{entry.nftsUsed}/5</div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">Contests</div>
                      <div className="font-semibold">{entry.contestsWon}/{entry.contestsEntered}</div>
                    </div>

                    {entry.rewardsEarned > 0 && (
                      <div>
                        <div className="text-sm text-muted-foreground">Rewards</div>
                        <div className="font-semibold text-green-600">{entry.rewardsEarned} FLOW</div>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      {getTrendIcon(entry, previousEntry)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}