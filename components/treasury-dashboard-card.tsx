"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  History
} from 'lucide-react'
import { useWallet } from '@/hooks/use-wallet'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface TreasuryTransaction {
  id: string
  transactionHash: string
  transactionType: string
  amount: number
  feeAmount: number
  rewardPoolAmount: number
  treasuryAmount: number
  userAddress: string
  createdAt: string
}

interface TreasuryData {
  totalRewardPool: number
  totalTreasury: number
  totalVolume: number
  recentTransactions: TreasuryTransaction[]
}

interface TreasuryDashboardCardProps {
  className?: string
}

export function TreasuryDashboardCard({ className }: TreasuryDashboardCardProps) {
  const { balance, balanceLoading, balanceError, refreshBalance, isAuthenticated, user } = useWallet()
  const [treasuryData, setTreasuryData] = useState<TreasuryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTreasuryData = async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/treasury/status?limit=3')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch treasury data')
      }

      if (data.success) {
        setTreasuryData(data.treasury)
      } else {
        throw new Error(data.error || 'Failed to fetch treasury data')
      }
    } catch (err) {
      console.error('Treasury data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load treasury data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTreasuryData()
  }, [isAuthenticated])

  const handleRefresh = async () => {
    await Promise.all([
      refreshBalance(),
      fetchTreasuryData()
    ])
  }

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
 }

  const getTransactionIcon = (type: string) => {
    if (type.includes('entry') || type.includes('purchase')) {
      return ArrowUpRight
    }
    return ArrowDownLeft
  }

  // Loading state
  if (balanceLoading || isLoading) {
    return <TreasuryCardSkeleton className={className} />
  }

  // Error state
  if (balanceError || error) {
    return (
      <TreasuryCardError 
        error={balanceError || error || 'Unknown error'}
        onRetry={handleRefresh}
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
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">TREASURY</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Connect wallet to view treasury
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Dapper Wallet to view your FLOW balance
            </p>
            <Link href="/treasury">
              <Button variant="default" className="w-full">
                Connect Wallet
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

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
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">TREASURY</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                FLOW balance & transactions
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-foreground">
              {formatBalance(balance)}
            </span>
            <span className="text-sm text-muted-foreground">FLOW</span>
          </div>
          <p className="text-xs text-muted-foreground">Wallet Balance</p>
        </div>

        {/* Treasury Stats */}
        {treasuryData && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Pool:</span>
              <span className="font-medium">{treasuryData.totalRewardPool.toFixed(2)} FLOW</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium">{treasuryData.totalVolume.toFixed(2)} FLOW</span>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {treasuryData && treasuryData.recentTransactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
            <div className="space-y-1">
              {treasuryData.recentTransactions.slice(0, 2).map((transaction) => {
                const TransactionIcon = getTransactionIcon(transaction.transactionType)
                return (
                  <div key={transaction.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <TransactionIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate max-w-[100px]">
                        {formatTransactionType(transaction.transactionType)}
                      </span>
                    </div>
                    <span className="font-mono">
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} FLOW
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex-1 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1 text-xs"
            >
              <Link href="/treasury">
                <History className="h-3 w-3 mr-1" />
                History
              </Link>
            </Button>
          </div>

          {/* Main Action Link */}
          <Link href="/treasury">
            <Button variant="ghost" className="w-full group-hover:bg-primary/10 transition-colors text-xs">
              Manage Treasury
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function TreasuryCardSkeleton({ className }: { className?: string }) {
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
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
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

interface TreasuryCardErrorProps {
  error: string
  onRetry?: () => void
  className?: string
}

function TreasuryCardError({ error, onRetry, className }: TreasuryCardErrorProps) {
  return (
    <Card className={cn("border-destructive/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">TREASURY</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Failed to load treasury data
            </CardDescription>
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
            <Link href="/treasury">
              Go to Treasury
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { TreasuryCardSkeleton, TreasuryCardError }