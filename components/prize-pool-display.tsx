"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Gift, Coins, Users } from "lucide-react"
import { PrizePool, PrizeDistribution } from "@/lib/types/leaderboard"

interface PrizePoolDisplayProps {
  prizePool: PrizePool | null
  loading?: boolean
  compact?: boolean
}

export function PrizePoolDisplay({ prizePool, loading = false, compact = false }: PrizePoolDisplayProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-6 bg-muted animate-pulse rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!prizePool) {
    return (
      <Card className="p-6 text-center">
        <div className="text-muted-foreground">No prize pool information available</div>
      </Card>
    )
  }

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`
  }

  const getRankDisplay = (dist: PrizeDistribution) => {
    if (dist.rankRange) {
      return `${dist.rankRange.min}-${dist.rankRange.max}`
    }
    return `${dist.rank}`
  }

  const getRankIcon = (dist: PrizeDistribution) => {
    if (dist.rank === 1) return <Trophy className="h-6 w-6" />
    if (dist.rank === 2) return <span className="text-xl font-bold">2</span>
    if (dist.rank === 3) return <span className="text-xl font-bold">3</span>
    return <Users className="h-6 w-6" />
  }

  const getRankBadgeColor = (dist: PrizeDistribution) => {
    if (dist.rank === 1) return "bg-yellow-500 text-black"
    if (dist.rank === 2) return "bg-gray-400 text-black"
    if (dist.rank === 3) return "bg-amber-700 text-white"
    return "bg-muted text-muted-foreground"
  }

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">Prize Pool</span>
          </div>
          {prizePool.sponsored && (
            <Badge variant="secondary" className="text-xs">
              Sponsored
            </Badge>
          )}
        </div>
        <div className="text-2xl font-bold mb-1">
          {formatAmount(prizePool.totalPool, prizePool.currency)}
        </div>
        <div className="text-sm text-muted-foreground">
          {prizePool.distribution.length} prize tiers
        </div>
      </Card>
    )
  }

  // Get top 3 distributions for featured display
  const topDistributions = prizePool.distribution
    .filter(dist => dist.rank && dist.rank <= 3)
    .sort((a, b) => (a.rank || 0) - (b.rank || 0))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Coins className="h-6 w-6 text-yellow-500" />
          <h3 className="text-2xl font-bold">Prize Pool</h3>
        </div>
        <div className="text-4xl font-bold text-yellow-500 mb-2">
          {formatAmount(prizePool.totalPool, prizePool.currency)}
        </div>
        {prizePool.sponsored && prizePool.sponsorName && (
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary">Sponsored by {prizePool.sponsorName}</Badge>
          </div>
        )}
      </div>

      {/* Top 3 Prizes */}
      <div className="grid md:grid-cols-3 gap-6">
        {topDistributions.map((dist) => (
          <Card
            key={dist.rank}
            className={`p-6 bg-gradient-to-br ${
              dist.rank === 1
                ? 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20'
                : dist.rank === 2
                ? 'from-gray-400/10 to-gray-400/5 border-gray-400/20'
                : 'from-amber-700/10 to-amber-700/5 border-amber-700/20'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`h-12 w-12 rounded-full ${getRankBadgeColor(dist)} flex items-center justify-center`}
              >
                {getRankIcon(dist)}
              </div>
              <div>
                <div className="font-bold text-lg">{getRankDisplay(dist)} Place</div>
                <div className="text-sm text-muted-foreground">{dist.percentage}% of pool</div>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatAmount(dist.amount, dist.currency)}
            </div>
            {dist.nftReward && (
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-1 mb-1">
                  <Gift className="h-4 w-4" />
                  <span>{dist.nftReward.rarity} NFT</span>
                </div>
                <div>{dist.nftReward.description}</div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* All Prize Tiers */}
      {prizePool.distribution.length > 3 && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-muted/50 border-b">
            <h4 className="font-bold">All Prize Tiers</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-3 font-semibold">Rank</th>
                  <th className="text-right p-3 font-semibold">Percentage</th>
                  <th className="text-right p-3 font-semibold">Amount</th>
                  <th className="text-left p-3 font-semibold">NFT Reward</th>
                </tr>
              </thead>
              <tbody>
                {prizePool.distribution.map((dist, index) => (
                  <tr key={index} className="border-b hover:bg-muted/20">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-8 w-8 rounded-full ${getRankBadgeColor(dist)} flex items-center justify-center text-sm font-bold`}
                        >
                          {dist.rank || getRankDisplay(dist)}
                        </div>
                        <span>{getRankDisplay(dist)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">{dist.percentage}%</td>
                    <td className="p-3 text-right font-semibold">
                      {formatAmount(dist.amount, dist.currency)}
                    </td>
                    <td className="p-3">
                      {dist.nftReward ? (
                        <div className="text-sm">
                          <Badge variant="outline" className="mb-1">
                            {dist.nftReward.rarity}
                          </Badge>
                          <div className="text-muted-foreground">
                            {dist.nftReward.description}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}