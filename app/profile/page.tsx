"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trophy, Wallet, TrendingUp, Calendar, Award, Star, RefreshCw, CheckCircle } from "lucide-react"
import Image from "next/image"
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation"
import { useAuth } from "@/contexts/auth-context"
import { useNFTOwnership } from "@/hooks/use-nft-ownership"
import { useProfileSync } from "@/hooks/use-profile-sync"
import { WalletConnector } from "@/components/wallet-connector"
import { SyncStatusIndicator } from "@/components/sync-status-indicator"
import { ProfileSyncStatus } from "@/components/profile-sync-status"
import { SyncLoadingState } from "@/components/sync-loading-state"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const { 
    user, 
    isAuthenticated, 
    isEligible, 
    collections, 
    walletType, 
    walletInfo,
    syncStatus,
    profileData,
    nftCollection,
    forceSyncProfile,
    refreshNFTCollection
  } = useAuth()
  const { moments, eligibleMoments, isLoading: nftsLoading } = useNFTOwnership(true)
  
  // Use profile sync hook for real-time updates
  const {
    isRefreshing,
    showSyncSuccess,
    profileUpdateAnimation,
    handleRefreshProfile,
    handleRefreshNFTs,
    dismissSyncSuccess
  } = useProfileSync()
  
  // Override sync methods to use auth context directly
  const handleSyncProfile = async () => {
    try {
      await forceSyncProfile()
    } catch (error) {
      console.error('Profile sync failed:', error)
    }
  }
  
  const handleSyncNFTs = async () => {
    try {
      await refreshNFTCollection()
    } catch (error) {
      console.error('NFT sync failed:', error)
    }
  }
  
  // Track collection changes for visual feedback
  const [previousNFTCount, setPreviousNFTCount] = useState(0)
  const [previousEligibleCount, setPreviousEligibleCount] = useState(0)
  const [showCollectionUpdate, setShowCollectionUpdate] = useState(false)
  
  // Update collection counts and show feedback when they change
  useEffect(() => {
    const currentNFTCount = moments.length
    const currentEligibleCount = eligibleMoments.length
    
    if (previousNFTCount > 0 && (currentNFTCount !== previousNFTCount || currentEligibleCount !== previousEligibleCount)) {
      setShowCollectionUpdate(true)
    }
    
    setPreviousNFTCount(currentNFTCount)
    setPreviousEligibleCount(currentEligibleCount)
  }, [moments.length, eligibleMoments.length, previousNFTCount, previousEligibleCount])
  
  // If not authenticated, show wallet connection
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-12 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <BreadcrumbNavigation className="mb-4 sm:mb-6" />
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-4xl font-bold tracking-tight mb-4">Connect Your Wallet</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Connect your Dapper Wallet to view your profile and NFT collection
              </p>
            </div>
            <WalletConnector className="max-w-md mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  // Generate username from wallet address or profile data
  const username = profileData?.username || 
    (user.addr ? `${user.addr.slice(0, 6)}...${user.addr.slice(-4)}` : "Unknown User")
  
  // Calculate stats from sync-aware data
  const totalNFTs = profileData?.stats?.totalNFTs || moments.length
  const eligibleNFTsCount = profileData?.stats?.eligibleMoments || eligibleMoments.length
  
  // Mock some additional data that would come from a backend
  const mockStats = {
    seasonRank: 47,
    totalPoints: 2847,
    weeklyPoints: 342,
    wins: 12,
    joinDate: "January 2024",
    achievements: [
      { id: 1, name: "First Win", icon: Trophy, earned: true },
      { id: 2, name: "Top 100", icon: Star, earned: true },
      { id: 3, name: "Perfect Week", icon: Award, earned: false },
      { id: 4, name: "Season Champion", icon: Trophy, earned: false },
    ],
  }

  return (
    <div className="min-h-screen py-12 relative overflow-hidden">
      {/* Sync Notifications */}
      {showSyncSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-300 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Profile synchronized successfully</span>
          </div>
        </div>
      )}
      
      {syncStatus.isActive && (
        <div className="fixed top-4 right-4 z-50 bg-blue-100 border border-blue-300 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800">
              {syncStatus.currentOperation ? 
                `${syncStatus.currentOperation.replace(/_/g, ' ')}...` : 
                "Synchronizing profile..."
              }
            </span>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <BreadcrumbNavigation className="mb-4 sm:mb-6" />
        
        {/* Profile Header */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className={cn(
            "p-8 relative overflow-hidden holographic transition-all duration-500",
            profileUpdateAnimation && "scale-[1.02] shadow-2xl",
            showSyncSuccess && "ring-2 ring-green-500/50"
          )}>
            <div className="absolute inset-0 scan-line opacity-20" />
            
            {/* Sync Status Header */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <SyncStatusIndicator 
                status={syncStatus} 
                variant="detailed" 
                showLastSync={true}
              />
              {showSyncSuccess && (
                <div className="flex items-center gap-1 text-green-600 animate-in fade-in slide-in-from-right-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Synced</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <Avatar className="h-32 w-32 border-4 border-foreground transition-all hover:scale-110 hover:rotate-12 duration-500">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="text-4xl">{username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{username}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                  <Badge variant="outline" className="gap-2">
                    <Wallet className="h-4 w-4" />
                    {user.addr}
                  </Badge>
                  {walletType && (
                    <Badge variant="outline" className="gap-2">
                      {walletType === 'dapper' ? 'Dapper Wallet' : 
                       walletType === 'flow' ? 'Flow Wallet' : 'Other Wallet'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {mockStats.joinDate}
                  </Badge>
                  {collections.length > 0 && (
                    <Badge variant="secondary" className="gap-2">
                      {collections.join(", ")}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Button
                    variant="secondary"
                    className="gap-2 transition-all hover:scale-105 pulse-glow"
                    disabled
                  >
                    <Wallet className="h-4 w-4" />
                    Wallet Connected
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncProfile}
                    disabled={isRefreshing || syncStatus.isActive}
                    className="gap-2 transition-all hover:scale-105"
                  >
                    <RefreshCw className={cn(
                      "h-4 w-4",
                      (isRefreshing || syncStatus.isActive) && "animate-spin"
                    )} />
                    {isRefreshing || syncStatus.isActive ? "Syncing..." : "Refresh Profile"}
                  </Button>
                  
                  {!isEligible && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      No Eligible NFTs
                    </Badge>
                  )}
                  {isEligible && (
                    <Badge variant="secondary">
                      {eligibleNFTsCount} Eligible NFTs
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-center">
                <div className="transition-all hover:scale-110 duration-300">
                  <div className="text-4xl font-bold mb-1">{totalNFTs}</div>
                  <div className="text-sm text-muted-foreground">Total NFTs</div>
                </div>
                <div className="transition-all hover:scale-110 duration-300">
                  <div className="text-4xl font-bold mb-1">#{mockStats.seasonRank}</div>
                  <div className="text-sm text-muted-foreground">Rank</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sync Status Section */}
        {isAuthenticated && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-50">
            <ProfileSyncStatus
              syncStatus={syncStatus}
              profileData={{
                walletAddress: user.addr || undefined,
                nftCount: moments.length,
                eligibleMoments: eligibleMoments.length,
                lastNFTSync: syncStatus.lastSync || undefined,
                lastStatsSync: syncStatus.lastSync || undefined,
                profileStats: {
                  gamesPlayed: mockStats.wins + 5,
                  totalPoints: mockStats.totalPoints,
                  rank: mockStats.seasonRank
                }
              }}
              onRefreshProfile={handleSyncProfile}
              onRefreshNFTs={handleSyncNFTs}
              isLoading={isRefreshing || syncStatus.isActive}
              className="max-w-2xl mx-auto"
            />
          </div>
        )}

        {/* Simple NFT Collection Display */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold tracking-tight">MY NFT COLLECTION</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNFTs}
              disabled={isRefreshing || syncStatus.isActive}
              className="gap-2"
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                (isRefreshing || syncStatus.isActive) && "animate-spin"
              )} />
              Refresh NFTs
            </Button>
          </div>

          <SyncLoadingState
            isLoading={nftsLoading || (isRefreshing && syncStatus.currentOperation === 'nft_collection_fetch')}
            variant="spinner"
            loadingText="Loading your NFT collection..."
          >
            <div className={cn(
              "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-all duration-500",
              profileUpdateAnimation && "scale-[1.005]"
            )}>
              {moments.length > 0 ? moments.map((nft, index) => (
                <Card
                  key={nft.momentId}
                  className="overflow-hidden group hover:border-foreground transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={nft.imageUrl || "/placeholder.svg"}
                      alt={nft.playerName}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <Badge className="mb-2 bg-white/20 text-white border-white/40">{nft.sport}</Badge>
                      <div className="font-bold text-xl mb-1">{nft.playerName}</div>
                      <div className="text-sm text-white/80 mb-2">{nft.team}</div>
                      <div className="text-xs text-white/60">#{nft.momentId}</div>
                    </div>
                  </div>
                </Card>
              )) : (
                <div className="col-span-full text-center py-12">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No NFTs found in your collection</p>
                </div>
              )}
            </div>
          </SyncLoadingState>
        </div>
      </div>
    </div>
  )
}