"use client"

import { useState, useEffect } from 'react'
import { DashboardCard, QuickAction } from '@/components/dashboard-card'
import { Wallet, History, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useWallet } from '@/hooks/use-wallet'
import { useRouter } from 'next/navigation'
import { useApiErrorHandling } from '@/hooks/use-dashboard-error-handling'
import { useDashboardRefresh } from '@/contexts/dashboard-context'

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

export function TreasuryDashboardCardSimple({ className }: TreasuryDashboardCardProps) {
  const { balance, balanceLoading, balanceError, refreshBalance, isAuthenticated, formatAddress } = useWallet()
  const [treasuryData, setTreasuryData] = useState<TreasuryData | null>(null)
  const router = useRouter()

  // Enhanced error handling
  const {
    isLoading: treasuryLoading,
    error: treasuryError,
    apiCall,
    retry,
    reset,
    errorMessage,
    errorType,
    canRetry
  } = useApiErrorHandling('/api', {
    component: 'treasury-card',
    maxRetries: 3,
    onError: (error) => {
      console.error('Treasury card error:', error)
    },
    onRetry: (attempt) => {
      console.log(`Treasury data retry attempt ${attempt}`)
    }
  })

  const fetchTreasuryData = async () => {
    if (!isAuthenticated) return

    const data = await apiCall<{ success: boolean; treasury: TreasuryData; error?: string }>(
      '/treasury/status?limit=3',
      { method: 'GET' },
      'Fetch treasury data'
    )

    if (data?.success && data.treasury) {
      setTreasuryData(data.treasury)
    }
  }

  // Listen for dashboard refresh events
  useDashboardRefresh(fetchTreasuryData)

  useEffect(() => {
    fetchTreasuryData()
  }, [isAuthenticated])

  const handleRefresh = async () => {
    reset() // Reset error state
    await Promise.all([
      refreshBalance(),
      fetchTreasuryData()
    ])
  }

  const handleRetry = async () => {
    await retry(
      () => fetchTreasuryData(),
      'Retry treasury data fetch'
    )
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

  const quickActions: QuickAction[] = [
    {
      label: 'Refresh',
      onClick: handleRefresh,
      icon: RefreshCw,
      variant: 'outline'
    },
    {
      label: 'History',
      onClick: () => router.push('/treasury'),
      icon: History,
      variant: 'outline'
    }
  ]

  // Combine loading states and errors
  const loading = (balanceLoading || treasuryLoading) && !balanceError && !treasuryError
  const combinedError = balanceError || errorMessage
  const shouldShowRetry = canRetry || !!balanceError

  // Format stats
  const stats = {
    primary: `${formatBalance(balance)} FLOW`,
    secondary: treasuryData ? `${treasuryData.recentTransactions.length} recent` : undefined,
    label: 'Wallet Balance'
  }

  return (
    <DashboardCard
      title="TREASURY"
      description="Manage your FLOW tokens and transactions"
      href="/treasury"
      icon={Wallet}
      stats={stats}
      quickActions={quickActions}
      loading={loading}
      error={combinedError}
      onRetry={shouldShowRetry ? (balanceError ? handleRefresh : handleRetry) : undefined}
      className={className}
    >
      {/* Recent Transactions Preview */}
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

      {/* No transactions state */}
      {treasuryData && treasuryData.recentTransactions.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">No recent transactions</p>
        </div>
      )}

      {/* Not authenticated state */}
      {!isAuthenticated && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">Connect wallet to view treasury</p>
        </div>
      )}
    </DashboardCard>
  )
}