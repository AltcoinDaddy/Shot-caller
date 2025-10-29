"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trophy, Wallet, TrendingUp, Calendar, Award, Star, RefreshCw, CheckCircle, Sparkles } from "lucide-react"
import Image from "next/image"
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation"
import { useAuth } from "@/contexts/auth-context"
import { useNFTOwnership } from "@/hooks/use-nft-ownership"
import { useProfileSync } from "@/hooks/use-profile-sync"
import { WalletConnector } from "@/components/wallet-connector"
import { SyncStatusIndicator } from "@/components/sync-status-indicator"
import { ProfileSyncStatus } from "@/components/profile-sync-status"
import { SyncLoadingState } from "@/components/sync-loading-state"
import { SyncSuccessNotification, SyncProgressNotification, CollectionUpdateNotification } from "@/components/sync-success-notification"
import { ProfileDataTransition, ProfileStatsTransition, NFTCollectionTransition, AnimatedCounter } from "@/components/profile-data-transition"
import { RealTimeSyncListener } from "@/components/real-time-sync-listener"
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
    collectionChangeDetected,
    syncProgress,
    autoRefreshEnabled,
    handleRefreshProfile,
    handleRefreshNFTs,
    dismissSyncSuccess,
    enableAutoRefresh
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
      {/* Real-time Sync Listener */}
      <RealTimeSyncListener
        onCollectionChange={(changeType, count) => {
          console.log(`Collection ${changeType}: ${count} NFTs`);
        }}
        onProfileUpdate={(profileData) => {
          console.log('Profile updated:', profileData);
        }}
        onSyncComplete={(success) => {
          console.log('Sync completed:', success);
        }}
        autoRefreshInterval={5 * 60 * 1000} // 5 minutes
        enableVisibilitySync={true}
      />
      
      {/* Enhanced Sync Notifications */}
      <SyncSuccessNotification
        isVisible={showSyncSuccess && !syncStatus.isActive}
        onDismiss={dismissSyncSuccess}
        title="Profile Synchronized"
        description="Your profile and NFT collection are up to date"
        variant="success"
      />
      
      <SyncProgressNotification
        isVisible={syncStatus.isActive}
        progress={syncProgress}
        currentOperation={syncStatus.currentOperation || "profile_sync"}
        onDismiss={() => {}} // Don't allow dismissing active sync
      />
      
      <CollectionUpdateNotification
        isVisible={collectionChangeDetected}
        changeType="updated"
        count={Math.abs(moments.length - previousNFTCount)}
        onDismiss={() => {}} // Auto-dismiss after timeout
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <BreadcrumbNavigation className="mb-4 sm:mb-6" />
        
        {/* Profile Header with Real-time Updates */}
        <ProfileDataTransition
          isUpdating={profileUpdateAnimation || syncStatus.isActive}
          updateKey={`${user.addr}-${moments.length}-${eligibleNFTsCount}`}
          className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <Card className={cn(
            "p-8 relative overflow-hidden holographic transition-all duration-500",
            profileUpdateAnimation && "scale-[1.02] shadow-2xl ring-2 ring-blue-500/30",
            showSyncSuccess && "ring-2 ring-green-500/50",
            syncStatus.isActive && "ring-2 ring-blue-500/50 shadow-blue-500/20"
          )}>
            <div className="absolute inset-0 scan-line opacity-20" />
            
            {/* Enhanced Sync Status Header */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <SyncStatusIndicator 
                status={syncStatus} 
                variant="detailed" 
                showLastSync={true}
              />
              {showSyncSuccess && (
                <div className="flex items-center gap-1 text-green-600 animate-in fade-in slide-in-from-right-2 duration-300">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Synced</span>
                </div>
              )}
              {collectionChangeDetected && (
                <div className="flex items-center gap-1 text-purple-600 animate-in fade-in slide-in-from-right-2 duration-300">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Updated</span>
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

              <ProfileStatsTransition
                stats={{
                  totalNFTs,
                  eligibleMoments: eligibleNFTsCount,
                  seasonRank: mockStats.seasonRank,
                  totalPoints: mockStats.totalPoints
                }}
                isUpdating={profileUpdateAnimation || syncStatus.isActive}
              />
            </div>
          </Card>
        </ProfileDataTransition>

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

        {/* Enhanced NFT Collection Display with Real-time Updates */}
        <NFTCollectionTransition
          collectionCount={moments.length}
          isLoading={nftsLoading || (isRefreshing && syncStatus.currentOperation === 'nft_collection_fetch')}
          className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold tracking-tight">MY NFT COLLECTION</h2>
              <div className="flex items-center gap-2">
                <AnimatedCounter 
                  value={moments.length} 
                  className="text-lg font-semibold text-muted-foreground"
                />
                <span className="text-sm text-muted-foreground">
                  ({eligibleNFTsCount} eligible)
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => enableAutoRefresh(!autoRefreshEnabled)}
                className={cn(
                  "text-xs",
                  autoRefreshEnabled ? "text-green-600" : "text-muted-foreground"
                )}
              >
                Auto-refresh: {autoRefreshEnabled ? "ON" : "OFF"}
              </Button>
              
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
                <ProfileDataTransition
                  key={nft.momentId}
                  updateKey={`${nft.momentId}-${nft.playerName}`}
                  transitionDuration={300}
                >
                  <Card className="overflow-hidden group hover:border-foreground transition-all duration-300 hover:scale-105 hover:shadow-2xl">
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
                </ProfileDataTransition>
              )) : (
                <div className="col-span-full text-center py-12">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No NFTs found in your collection</p>
                </div>
              )}
            </div>
          </SyncLoadingState>
        </NFTCollectionTransition>
      </div>
    </div>
  )
}