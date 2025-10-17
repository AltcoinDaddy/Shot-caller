"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { DashboardCard, QuickAction } from '@/components/dashboard-card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { usePremium } from '@/hooks/use-premium'
import { Crown, Star, Zap, Calendar, Settings, TrendingUp } from 'lucide-react'

export function PremiumDashboardCard() {
  const router = useRouter()
  const { 
    isPremium, 
    subscription, 
    daysRemaining, 
    isExpiringSoon, 
    canRenew,
    features,
    isLoading, 
    error,
    refresh
  } = usePremium()

  // Calculate progress for subscription (days remaining vs total days)
  const getSubscriptionProgress = () => {
    if (!subscription.access) return 0
    
    const totalDays = subscription.access.accessType === 'monthly' ? 30 : 
                     subscription.access.accessType === 'season' ? 180 : 365
    return Math.max(0, (daysRemaining / totalDays) * 100)
  }

  // Get active features count
  const getActiveFeatures = () => {
    const activeFeatures = []
    if (features.advancedAnalytics) activeFeatures.push('Analytics')
    if (features.extraLineupSlots > 0) activeFeatures.push(`+${features.extraLineupSlots} Lineups`)
    if (features.bonusRewardMultiplier > 1.0) activeFeatures.push('Bonus Rewards')
    if (features.exclusiveTournaments) activeFeatures.push('Exclusive Tournaments')
    if (features.prioritySupport) activeFeatures.push('Priority Support')
    if (features.personalAnalyticsCoach) activeFeatures.push('Personal Coach')
    return activeFeatures
  }

  const activeFeatures = getActiveFeatures()

  // Quick actions based on subscription status
  const quickActions: QuickAction[] = []

  if (isPremium) {
    quickActions.push({
      label: 'View Analytics',
      onClick: () => router.push('/premium?tab=analytics'),
      icon: TrendingUp,
      variant: 'default'
    })
    
    if (canRenew) {
      quickActions.push({
        label: 'Renew',
        onClick: () => router.push('/premium'),
        icon: Calendar,
        variant: 'outline'
      })
    }
    
    quickActions.push({
      label: 'Manage',
      onClick: () => router.push('/premium'),
      icon: Settings,
      variant: 'outline'
    })
  } else {
    quickActions.push({
      label: 'Upgrade Now',
      onClick: () => router.push('/premium'),
      icon: Star,
      variant: 'default'
    })
    
    quickActions.push({
      label: 'View Plans',
      onClick: () => router.push('/premium'),
      icon: Crown,
      variant: 'outline'
    })
  }

  // Stats based on subscription status
  const stats = isPremium 
    ? {
        primary: daysRemaining > 0 ? `${daysRemaining}` : 'Expired',
        secondary: daysRemaining > 0 ? 'days left' : '',
        label: subscription.access?.accessType ? 
          `${subscription.access.accessType.charAt(0).toUpperCase() + subscription.access.accessType.slice(1)} Plan` : 
          'Premium Plan'
      }
    : {
        primary: 'Free',
        secondary: '',
        label: 'Current Plan'
      }

  return (
    <DashboardCard
      title="PREMIUM"
      description={isPremium ? "Premium features active" : "Unlock advanced features"}
      href="/premium"
      icon={Crown}
      stats={stats}
      quickActions={quickActions}
      loading={isLoading}
      error={error}
      onRetry={refresh}
      className={isPremium ? "border-yellow-500/20 bg-gradient-to-br from-yellow-50/5 to-orange-50/5" : ""}
    >
      {/* Premium Status Section */}
      <div className="space-y-3">
        {isPremium ? (
          <>
            {/* Premium Active Status */}
            <div className="flex items-center justify-between">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Premium Active
              </Badge>
              {isExpiringSoon && (
                <Badge variant="destructive" className="text-xs">
                  Expires Soon
                </Badge>
              )}
            </div>

            {/* Subscription Progress */}
            {daysRemaining > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subscription Progress</span>
                  <span>{Math.round(getSubscriptionProgress())}%</span>
                </div>
                <Progress 
                  value={getSubscriptionProgress()} 
                  className="h-2"
                />
              </div>
            )}

            {/* Active Features */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Active Features</p>
              <div className="flex flex-wrap gap-1">
                {activeFeatures.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Zap className="w-2 h-2 mr-1" />
                    {feature}
                  </Badge>
                ))}
                {activeFeatures.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{activeFeatures.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Free Plan Features */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Available with Premium</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3" />
                  Advanced Analytics
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3" />
                  Extra Lineup Slots
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3" />
                  Bonus Rewards
                </div>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-xs font-medium text-center">
                Upgrade to unlock premium features and gain a competitive edge
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardCard>
  )
}