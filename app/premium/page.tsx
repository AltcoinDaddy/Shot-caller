"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { PlayerComparisonTool } from "@/components/player-comparison-tool"
import { InteractiveTrendsAnalysis } from "@/components/interactive-trends-analysis"
import { Star, TrendingUp, Target, Award, Calendar, BarChart3, Crown, AlertCircle, Plus, Edit, Trash2 } from "lucide-react"
import { usePremium } from "@/hooks/use-premium"
import { PremiumBadge, PremiumFeatureLock } from "@/components/premium-badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PremiumPage() {
  const { 
    isPremium, 
    subscription, 
    analytics, 
    lineups,
    getPlans, 
    purchasePremium, 
    renewPremium,
    createLineup,
    updateLineup,
    deleteLineup,
    isLoading,
    error,
    daysRemaining,
    canRenew,
    isExpiringSoon,
    maxLineups,
    canCreateLineup
  } = usePremium()
  
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [isCreatingLineup, setIsCreatingLineup] = useState(false)
  const [newLineupName, setNewLineupName] = useState('')

  const handleUpgrade = async (planId: string) => {
    try {
      setSelectedPlan(planId)
      // In a real implementation, this would integrate with Flow wallet
      await purchasePremium(planId, `mock_tx_${Date.now()}`)
    } catch (error) {
      console.error("Failed to upgrade:", error)
    }
  }

  const handleRenew = async () => {
    try {
      if (subscription.access) {
        await renewPremium(subscription.access.accessType, `mock_renewal_${Date.now()}`)
      }
    } catch (error) {
      console.error("Failed to renew:", error)
    }
  }

  const handleCreateLineup = async () => {
    if (!newLineupName.trim()) return
    
    try {
      await createLineup({
        name: newLineupName,
        nftIds: [],
        projectedPoints: 0,
        confidence: 0,
        isActive: false,
      })
      setNewLineupName('')
      setIsCreatingLineup(false)
    } catch (error) {
      console.error("Failed to create lineup:", error)
    }
  }

  const plans = getPlans()

  if (!isPremium) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Premium Analytics</h1>
          <p className="text-muted-foreground">
            Unlock advanced insights and gain a competitive edge
          </p>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Premium Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                      <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                      Advanced analytics
                    </li>
                  )}
                  {plan.features.extraLineupSlots > 0 && (
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                      {plan.features.extraLineupSlots} extra lineup slots
                    </li>
                  )}
                  {plan.features.bonusRewardMultiplier > 1.0 && (
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                      +{Math.round((plan.features.bonusRewardMultiplier - 1) * 100)}% bonus rewards
                    </li>
                  )}
                  {plan.features.exclusiveTournaments && (
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                      Exclusive tournaments
                    </li>
                  )}
                  {plan.features.prioritySupport && (
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                      Priority support
                    </li>
                  )}
                  {plan.features.personalAnalyticsCoach && (
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                      Personal analytics coach
                    </li>
                  )}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isLoading && selectedPlan === plan.id}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {isLoading && selectedPlan === plan.id ? 'Processing...' : `Get ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Feature Preview */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-8">Premium Features Preview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PremiumFeatureLock 
              feature="Advanced Projections" 
              description="Get AI-powered player projections with confidence scores"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Advanced Projections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "LeBron James", projected: 45.2, confidence: 85 },
                      { name: "Stephen Curry", projected: 38.5, confidence: 78 }
                    ].map((player, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Projected: {player.projected} pts
                          </p>
                        </div>
                        <Badge variant="outline">{player.confidence}% confidence</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </PremiumFeatureLock>

            <PremiumFeatureLock 
              feature="Performance Trends" 
              description="Track your scoring and ranking trends over time"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { week: "W11", points: 156.2, rank: 45 },
                        { week: "W12", points: 178.5, rank: 23 },
                        { week: "W13", points: 142.8, rank: 67 },
                        { week: "W14", points: 189.3, rank: 12 },
                        { week: "W15", points: 165.7, rank: 34 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="points" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </PremiumFeatureLock>
          </div>
        </div>
      </div>
    )
  }

  // Premium user interface
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Premium Analytics</h1>
            <p className="text-muted-foreground">
              Advanced insights to dominate your competition
            </p>
          </div>
          <div className="text-right">
            <Badge className="mb-2 bg-gradient-to-r from-yellow-500 to-orange-500">
              <Crown className="w-3 h-3 mr-1" />
              Premium Active
            </Badge>
            <p className="text-sm text-muted-foreground">
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
            </p>
            {canRenew && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRenew}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Renew'}
              </Button>
            )}
          </div>
        </div>
        
        {isExpiringSoon && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your premium subscription expires in {daysRemaining} days. Renew now to keep your premium features.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="projections" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="matchups">Matchups</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="comparison">Compare</TabsTrigger>
          <TabsTrigger value="lineups">My Lineups</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projections" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Player Projections</CardTitle>
                <CardDescription>AI-powered fantasy point predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.playerProjections.map((player, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{player.playerName}</p>
                        <p className="text-sm text-muted-foreground">
                          Projected: {player.projectedPoints} pts | {player.opponent}
                        </p>
                        <Badge variant={
                          player.difficulty === 'Easy' ? 'default' : 
                          player.difficulty === 'Medium' ? 'secondary' : 'destructive'
                        } className="text-xs mt-1">
                          {player.difficulty}
                        </Badge>
                      </div>
                      <Badge variant="outline">{player.confidence}% confidence</Badge>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading projections...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Insights</CardTitle>
                <CardDescription>Personalized analytics and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {analytics?.accuracyScore || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Projection Accuracy</p>
                  </div>
                  
                  {analytics?.weeklyInsights && (
                    <div className="space-y-2">
                      <h4 className="font-medium">This Week's Insights:</h4>
                      {analytics.weeklyInsights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Badge variant="secondary" className="w-2 h-2 p-0 mt-2"></Badge>
                          {insight}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="matchups" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics?.matchupAnalysis.map((matchup, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{matchup.player}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={
                        matchup.difficulty === "Easy" ? "default" : 
                        matchup.difficulty === "Medium" ? "secondary" : "destructive"
                      }>
                        {matchup.difficulty}
                      </Badge>
                      <Badge variant={
                        matchup.recommendation === "Start" ? "default" :
                        matchup.recommendation === "Consider" ? "secondary" : "outline"
                      }>
                        {matchup.recommendation}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{matchup.opponent}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {matchup.projectedPoints} pts
                      </div>
                      <p className="text-sm text-muted-foreground">Projected Points</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Key Factors:</h4>
                      <ul className="space-y-1 text-sm">
                        {matchup.factors.map((factor, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="col-span-2 text-center py-8">
                <p className="text-muted-foreground">Loading matchup analysis...</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <InteractiveTrendsAnalysis 
            timeframe="season"
            showPremiumFeatures={true}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard 
            userId="current-user" 
            timeframe="season"
            showPremiumFeatures={true}
          />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <PlayerComparisonTool />
        </TabsContent>
        
        <TabsContent value="lineups" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Premium Lineup Slots</CardTitle>
                  <CardDescription>
                    Manage up to {maxLineups} lineups per week ({lineups.length}/{maxLineups} used)
                  </CardDescription>
                </div>
                {canCreateLineup && (
                  <Dialog open={isCreatingLineup} onOpenChange={setIsCreatingLineup}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Lineup
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Lineup</DialogTitle>
                        <DialogDescription>
                          Create a new premium lineup to test different strategies
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="lineup-name">Lineup Name</Label>
                          <Input
                            id="lineup-name"
                            value={newLineupName}
                            onChange={(e) => setNewLineupName(e.target.value)}
                            placeholder="Enter lineup name..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleCreateLineup} disabled={!newLineupName.trim() || isLoading}>
                            {isLoading ? 'Creating...' : 'Create Lineup'}
                          </Button>
                          <Button variant="outline" onClick={() => setIsCreatingLineup(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Existing lineups */}
                {lineups.map((lineup) => (
                  <Card key={lineup.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{lineup.name}</h4>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => {}}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteLineup(lineup.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Badge variant={lineup.isActive ? "default" : "secondary"}>
                          {lineup.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {lineup.nftIds.length} players selected
                        </p>
                        {lineup.projectedPoints > 0 && (
                          <p className="text-sm">
                            Projected: {lineup.projectedPoints} pts
                          </p>
                        )}
                        <Button size="sm" variant="outline" className="w-full">
                          Edit Lineup
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: maxLineups - lineups.length }).map((_, index) => (
                  <Card key={`empty-${index}`} className="p-4 border-dashed">
                    <div className="text-center space-y-2">
                      <h4 className="font-medium text-muted-foreground">Empty Slot</h4>
                      <Badge variant="secondary">Available</Badge>
                      <p className="text-sm text-muted-foreground">
                        Premium slot ready
                      </p>
                      {canCreateLineup ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setIsCreatingLineup(true)}
                        >
                          Create Lineup
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Lineup limit reached
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}