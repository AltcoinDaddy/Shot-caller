"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Star, Crown, Zap, Lock } from "lucide-react"
import { usePremium } from "@/hooks/use-premium"
import { useState } from "react"

interface PremiumBadgeProps {
  feature?: string
  showUpgrade?: boolean
  className?: string
}

export function PremiumBadge({ feature, showUpgrade = true, className }: PremiumBadgeProps) {
  const { isPremium, subscription, getPlans, purchasePremium, isLoading } = usePremium()
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('')

  const handleUpgrade = async (planId: string) => {
    try {
      setSelectedPlan(planId)
      // In a real implementation, this would integrate with Flow wallet
      // For now, we'll simulate the purchase
      await purchasePremium(planId, `mock_tx_${Date.now()}`)
      setIsUpgradeOpen(false)
    } catch (error) {
      console.error('Failed to upgrade:', error)
    }
  }

  if (isPremium) {
    return (
      <Badge variant="default" className={`bg-gradient-to-r from-yellow-500 to-orange-500 text-white ${className}`}>
        <Crown className="w-3 h-3 mr-1" />
        Premium
      </Badge>
    )
  }

  if (!showUpgrade) {
    return (
      <Badge variant="outline" className={className}>
        <Lock className="w-3 h-3 mr-1" />
        Premium Only
      </Badge>
    )
  }

  const plans = getPlans()

  return (
    <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Star className="w-4 h-4 mr-2" />
          Upgrade to Premium
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Upgrade to Premium</DialogTitle>
          <DialogDescription>
            {feature ? `Unlock ${feature} and more premium features` : 'Unlock advanced features and gain a competitive edge'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{plan.price} FLOW</div>
                  <p className="text-sm text-muted-foreground">
                    {plan.id === 'monthly' ? 'per month' : 'full season'}
                  </p>
                  {plan.id === 'season' && (
                    <p className="text-xs text-green-600">Save 58% vs monthly</p>
                  )}
                </div>
                
                <ul className="space-y-2 text-sm">
                  {plan.features.advancedAnalytics && (
                    <li className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-green-500" />
                      Advanced analytics
                    </li>
                  )}
                  {plan.features.extraLineupSlots > 0 && (
                    <li className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-green-500" />
                      {plan.features.extraLineupSlots} extra lineup slots
                    </li>
                  )}
                  {plan.features.bonusRewardMultiplier > 1.0 && (
                    <li className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-green-500" />
                      +{Math.round((plan.features.bonusRewardMultiplier - 1) * 100)}% bonus rewards
                    </li>
                  )}
                  {plan.features.exclusiveTournaments && (
                    <li className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-green-500" />
                      Exclusive tournaments
                    </li>
                  )}
                  {plan.features.prioritySupport && (
                    <li className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-green-500" />
                      Priority support
                    </li>
                  )}
                  {plan.features.personalAnalyticsCoach && (
                    <li className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-green-500" />
                      Personal analytics coach
                    </li>
                  )}
                </ul>
                
                <Button 
                  className="w-full" 
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isLoading && selectedPlan === plan.id}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {isLoading && selectedPlan === plan.id ? 'Processing...' : `Get ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface PremiumFeatureLockProps {
  feature: string
  description: string
  children: React.ReactNode
  className?: string
}

export function PremiumFeatureLock({ feature, description, children, className }: PremiumFeatureLockProps) {
  const { isPremium } = usePremium()

  if (isPremium) {
    return <>{children}</>
  }

  return (
    <div className={`relative ${className}`}>
      <div className="blur-sm pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <div className="text-center space-y-4">
          <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-semibold">{feature}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <PremiumBadge feature={feature} />
          </div>
        </div>
      </div>
    </div>
  )
}