"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Wallet, AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useNFTOwnership } from "@/hooks/use-nft-ownership"
import { usePremium } from "@/hooks/use-premium"
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation"
import { NFTMomentCard, NFTMomentCardSkeleton } from "@/components/nft-moment-card"
import { WalletConnector } from "@/components/wallet-connector"
import { ActiveBoosterEffects } from "@/components/active-booster-effects"
import { PremiumBadge } from "@/components/premium-badge"
import { lineupService } from "@/lib/services/lineup-service"
import { NFTMoment } from "@/lib/types/nft"
import { cn } from "@/lib/utils"

export default function TeamPage() {
  const { isAuthenticated, user } = useAuth()
  const { 
    moments, 
    eligibleMoments, 
    isLoading, 
    error, 
    hasEligibleNFTs,
    refreshOwnership 
  } = useNFTOwnership(true, 2 * 60 * 1000) // Auto-refresh every 2 minutes for real-time accuracy
  
  const { 
    isPremium, 
    lineups: premiumLineups, 
    maxLineups, 
    canCreateLineup,
    createLineup: createPremiumLineup,
    updateLineup: updatePremiumLineup
  } = usePremium()

  const [lineup, setLineup] = useState<NFTMoment[]>([])
  const [selectedSport, setSelectedSport] = useState<"NBA" | "NFL" | "ALL">("ALL")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [activeContest, setActiveContest] = useState<any>(null)
  const [existingLineup, setExistingLineup] = useState<NFTMoment[] | null>(null)

  // Load active contest and existing lineup
  useEffect(() => {
    const loadContestData = async () => {
      try {
        const contests = await lineupService.getActiveContests()
        if (contests.length > 0) {
          setActiveContest(contests[0]) // Use first active contest
          
          // Check if user already has a lineup
          if (isAuthenticated && user.addr) {
            const existingLineupData = await lineupService.getLineupWithMetadata(
              contests[0].id,
              user.addr
            )
            if (existingLineupData) {
              setExistingLineup(existingLineupData.moments)
              setLineup(existingLineupData.moments)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load contest data:', error)
      }
    }

    if (isAuthenticated) {
      loadContestData()
    }
  }, [isAuthenticated, user.addr])

  const availableNFTs = eligibleMoments.filter((nft) => 
    !lineup.find((l) => l.momentId === nft.momentId)
  )
  
  const filteredNFTs = selectedSport === "ALL" 
    ? availableNFTs 
    : availableNFTs.filter((nft) => nft.sport === selectedSport)

  const addToLineup = (moment: NFTMoment) => {
    if (lineup.length < 5) {
      setLineup([...lineup, moment])
      setSubmitError(null)
      setSubmitSuccess(false)
    }
  }

  const removeFromLineup = (momentId: number) => {
    setLineup(lineup.filter((moment) => moment.momentId !== momentId))
    setSubmitError(null)
    setSubmitSuccess(false)
  }

  const handleSubmitLineup = async () => {
    if (!activeContest || lineup.length === 0) return

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const nftIds = lineup.map(moment => moment.momentId)
      
      // Show progress feedback
      console.log(`Submitting lineup with ${nftIds.length} NFTs to contest ${activeContest.id}`)
      
      const result = await lineupService.submitLineup(activeContest.id, nftIds)
      
      if (result.success) {
        setSubmitSuccess(true)
        setExistingLineup([...lineup])
        
        // Log success for debugging
        console.log('Lineup submitted successfully:', result.transactionId)
        
        // Refresh NFT ownership to ensure we have latest data
        setTimeout(() => {
          refreshOwnership()
        }, 2000)
      } else {
        setSubmitError(result.error || 'Failed to submit lineup')
        console.error('Lineup submission failed:', result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setSubmitError(errorMessage)
      console.error('Lineup submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show wallet connection if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-12 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none opacity-5">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-foreground rounded-full float-animation"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-4xl font-bold tracking-tight mb-4">Connect Your Wallet</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Connect your Dapper Wallet to access your NBA Top Shot and NFL All Day moments
              </p>
            </div>
            <WalletConnector className="max-w-md mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-5">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-foreground rounded-full float-animation"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation className="mb-4 sm:mb-6" />
        
        {/* Header - Mobile Optimized */}
        <div className="mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 holographic mobile-heading">
            BUILD YOUR TEAM
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground">
            Select up to 5 NFTs from your collection to create your fantasy lineup
          </p>
          
          {/* Contest Info - Mobile Optimized */}
          {activeContest && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted/50 rounded-lg border mobile-card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Week {activeContest.weekId} Contest</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Ends: {new Date(activeContest.endTime).toLocaleDateString()}
                  </p>
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-blue-600 mt-1">
                      Contest ID: {activeContest.id} | Status: {activeContest.status}
                    </p>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs sm:text-sm text-muted-foreground">Prize Pool</div>
                  <div className="font-bold text-sm sm:text-base">{activeContest.rewardPool} FLOW</div>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Participants: {activeContest.totalParticipants}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Development Debug Info */}
          {process.env.NODE_ENV === 'development' && isAuthenticated && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Debug Info</h4>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <div>Wallet: {user.addr}</div>
                <div>Total NFTs: {moments.length}</div>
                <div>Eligible NFTs: {eligibleMoments.length}</div>
                <div>NBA: {eligibleMoments.filter(m => m.sport === 'NBA').length} | NFL: {eligibleMoments.filter(m => m.sport === 'NFL').length}</div>
                {error && <div className="text-red-600">Error: {error}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Error States */}
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>Failed to load your NFT collection: {error}</div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={refreshOwnership}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Retrying...
                      </>
                    ) : (
                      'Retry'
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Make sure your Dapper Wallet is connected and contains NBA Top Shot or NFL All Day moments
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!hasEligibleNFTs && !isLoading && !error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>No eligible NFTs found in your collection.</div>
                <div className="text-sm text-muted-foreground">
                  You need NBA Top Shot or NFL All Day moments to play ShotCaller. 
                  Visit <a href="https://nbatopshot.com" target="_blank" rel="noopener noreferrer" className="underline">NBA Top Shot</a> or <a href="https://nflallday.com" target="_blank" rel="noopener noreferrer" className="underline">NFL All Day</a> to get started.
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshOwnership}
                  disabled={isLoading}
                >
                  Refresh Collection
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Status */}
        {submitError && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {submitSuccess && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Lineup submitted successfully! Good luck in the contest.
            </AlertDescription>
          </Alert>
        )}

        {/* Active Boosters */}
        {isAuthenticated && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-50">
            <ActiveBoosterEffects lineupId="current_lineup" />
          </div>
        )}

        {/* Current Lineup - Mobile Optimized */}
        <div className="mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight mobile-heading">
                CURRENT LINEUP <span className="text-muted-foreground">({lineup.length}/5)</span>
              </h2>
              {isPremium && premiumLineups.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                    Premium Lineups
                  </Badge>
                  <select 
                    className="text-sm border rounded px-2 py-1 bg-background"
                    onChange={(e) => {
                      // Handle premium lineup selection
                      const selectedLineup = premiumLineups.find(l => l.id === e.target.value)
                      if (selectedLineup) {
                        // In a real implementation, this would load the NFTs for the lineup
                        console.log('Selected premium lineup:', selectedLineup)
                      }
                    }}
                  >
                    <option value="">Select Premium Lineup</option>
                    {premiumLineups.map(lineup => (
                      <option key={lineup.id} value={lineup.id}>
                        {lineup.name} ({lineup.nftIds.length}/5)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!isPremium && (
                <PremiumBadge feature="Multiple Lineups" showUpgrade={true} />
              )}
            </div>
            {lineup.length > 0 && activeContest && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {existingLineup && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <CheckCircle className="h-3 w-3" />
                    Already Submitted
                  </Badge>
                )}
                <Button
                  size="default"
                  className="gap-2 animate-in fade-in slide-in-from-right-4 duration-500 hover:scale-105 active:scale-95 transition-transform pulse-glow w-full sm:w-auto touch-target"
                  onClick={handleSubmitLineup}
                  disabled={lineup.length === 0 || isSubmitting || !activeContest}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span className="text-sm sm:text-base">Submitting...</span>
                    </>
                  ) : existingLineup ? (
                    <>
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm sm:text-base">Update Lineup</span>
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                      <span className="text-sm sm:text-base">Submit Lineup</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {lineup.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed transition-all hover:border-foreground hover:bg-muted/50 scan-line">
              <p className="text-muted-foreground text-lg">
                {isLoading 
                  ? "Loading your NFT collection..." 
                  : "No players selected yet. Add NFTs from your collection below."
                }
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mobile-grid">
              {lineup.map((moment, index) => (
                <NFTMomentCard
                  key={moment.momentId}
                  moment={moment}
                  isInLineup={true}
                  onRemove={removeFromLineup}
                  className={cn(
                    "animate-in fade-in zoom-in-95 duration-500",
                    "pulse-glow"
                  )}
                  style={{ animationDelay: `${index * 100}ms` } as any}
                />
              ))}
            </div>
          )}
        </div>

        {/* Available NFTs - Mobile Optimized */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight mobile-heading">YOUR COLLECTION</h2>
            {!isLoading && (
              <div className="text-xs sm:text-sm text-muted-foreground">
                {eligibleMoments.length} eligible NFTs found
              </div>
            )}
          </div>

          <Tabs defaultValue="ALL" className="mb-4 sm:mb-6" onValueChange={(v) => setSelectedSport(v as "NBA" | "NFL" | "ALL")}>
            <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-cols-none sm:flex">
              <TabsTrigger value="ALL" className="transition-all hover:scale-105 holographic text-xs sm:text-sm">
                <span className="hidden sm:inline">All Sports ({eligibleMoments.length})</span>
                <span className="sm:hidden">All ({eligibleMoments.length})</span>
              </TabsTrigger>
              <TabsTrigger value="NBA" className="transition-all hover:scale-105 holographic text-xs sm:text-sm">
                <span className="hidden sm:inline">NBA Top Shot ({eligibleMoments.filter(m => m.sport === 'NBA').length})</span>
                <span className="sm:hidden">NBA ({eligibleMoments.filter(m => m.sport === 'NBA').length})</span>
              </TabsTrigger>
              <TabsTrigger value="NFL" className="transition-all hover:scale-105 holographic text-xs sm:text-sm">
                <span className="hidden sm:inline">NFL All Day ({eligibleMoments.filter(m => m.sport === 'NFL').length})</span>
                <span className="sm:hidden">NFL ({eligibleMoments.filter(m => m.sport === 'NFL').length})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium">Loading your NFT collection...</p>
                  <p className="text-sm text-muted-foreground">
                    Verifying ownership of NBA Top Shot and NFL All Day moments
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, index) => (
                  <NFTMomentCardSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : filteredNFTs.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg">
                {selectedSport === "ALL" 
                  ? "No eligible NFTs found in your collection"
                  : `No ${selectedSport} NFTs found in your collection`
                }
              </p>
              {selectedSport !== "ALL" && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSelectedSport("ALL")}
                >
                  View All Sports
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mobile-grid">
              {filteredNFTs.map((moment, index) => (
                <NFTMomentCard
                  key={moment.momentId}
                  moment={moment}
                  onSelect={addToLineup}
                  disabled={lineup.length >= 5}
                  className={cn(
                    "animate-in fade-in zoom-in-95 duration-500"
                  )}
                  style={{ animationDelay: `${index * 50}ms` } as any}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
