"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trophy, Wallet, TrendingUp, Calendar, Award, Star } from "lucide-react"
import Image from "next/image"
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation"
import { useAuth } from "@/contexts/auth-context"
import { useNFTOwnership } from "@/hooks/use-nft-ownership"
import { WalletConnector } from "@/components/wallet-connector"

// Mock user data
const userData = {
  username: "CryptoKing23",
  walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  avatar: "/placeholder.svg?height=120&width=120",
  joinDate: "January 2024",
  totalNFTs: 47,
  seasonRank: 47,
  totalPoints: 2847,
  weeklyPoints: 342,
  wins: 12,
  achievements: [
    { id: 1, name: "First Win", icon: Trophy, earned: true },
    { id: 2, name: "Top 100", icon: Star, earned: true },
    { id: 3, name: "Perfect Week", icon: Award, earned: false },
    { id: 4, name: "Season Champion", icon: Trophy, earned: false },
  ],
}

const userNFTs = [
  {
    id: 1,
    playerName: "LeBron James",
    team: "Lakers",
    position: "SF",
    sport: "NBA",
    momentId: "#12345",
    image: "/lebron-james-nba-action.jpg",
    rarity: "Legendary",
    inLineup: true,
  },
  {
    id: 2,
    playerName: "Stephen Curry",
    team: "Warriors",
    position: "PG",
    sport: "NBA",
    momentId: "#12346",
    image: "/stephen-curry-nba-shooting.jpg",
    rarity: "Rare",
    inLineup: true,
  },
  {
    id: 3,
    playerName: "Giannis Antetokounmpo",
    team: "Bucks",
    position: "PF",
    sport: "NBA",
    momentId: "#12347",
    image: "/giannis-antetokounmpo-nba-dunk.jpg",
    rarity: "Epic",
    inLineup: true,
  },
  {
    id: 4,
    playerName: "Patrick Mahomes",
    team: "Chiefs",
    position: "QB",
    sport: "NFL",
    momentId: "#54321",
    image: "/patrick-mahomes-nfl-throwing.jpg",
    rarity: "Legendary",
    inLineup: true,
  },
  {
    id: 5,
    playerName: "Justin Jefferson",
    team: "Vikings",
    position: "WR",
    sport: "NFL",
    momentId: "#54322",
    image: "/justin-jefferson-nfl-catching.jpg",
    rarity: "Rare",
    inLineup: false,
  },
  {
    id: 6,
    playerName: "Luka Doncic",
    team: "Mavericks",
    position: "PG",
    sport: "NBA",
    momentId: "#12348",
    image: "/luka-doncic-nba-basketball.jpg",
    rarity: "Epic",
    inLineup: true,
  },
]

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "Legendary":
      return "bg-yellow-500 text-black"
    case "Epic":
      return "bg-purple-500 text-white"
    case "Rare":
      return "bg-blue-500 text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

export default function ProfilePage() {
  const { user, isAuthenticated, isEligible, collections, walletType, walletInfo } = useAuth()
  const { moments, eligibleMoments, isLoading: nftsLoading } = useNFTOwnership(true)
  
  // If not authenticated, show wallet connection
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

  // Generate username from wallet address
  const username = user.addr ? `${user.addr.slice(0, 6)}...${user.addr.slice(-4)}` : "Unknown User"
  
  // Calculate stats from real data
  const totalNFTs = moments.length
  const eligibleNFTsCount = eligibleMoments.length
  
  // Mock some additional data that would come from a backend
  const mockStats = {
    seasonRank: 47,
    totalPoints: 2847,
    weeklyPoints: 342,
    wins: 12,
    joinDate: "January 2024", // This would come from user registration data
    achievements: [
      { id: 1, name: "First Win", icon: Trophy, earned: true },
      { id: 2, name: "Top 100", icon: Star, earned: true },
      { id: 3, name: "Perfect Week", icon: Award, earned: false },
      { id: 4, name: "Season Champion", icon: Trophy, earned: false },
    ],
  }

  return (
    <div className="min-h-screen py-12 relative overflow-hidden">
      {/* Background particles */}
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
        
        {/* Profile Header */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="p-8 relative overflow-hidden holographic">
            <div className="absolute inset-0 scan-line opacity-20" />
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

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <Card className="p-6 transition-all hover:scale-105 hover:shadow-2xl duration-300 card-3d">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div className="text-3xl font-bold">{mockStats.totalPoints.toLocaleString()}</div>
          </Card>

          <Card className="p-6 transition-all hover:scale-105 hover:shadow-2xl duration-300 card-3d">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="text-sm text-muted-foreground">Weekly Points</div>
            </div>
            <div className="text-3xl font-bold">{mockStats.weeklyPoints}</div>
          </Card>

          <Card className="p-6 transition-all hover:scale-105 hover:shadow-2xl duration-300 card-3d">
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-8 w-8 text-blue-500" />
              <div className="text-sm text-muted-foreground">Total Wins</div>
            </div>
            <div className="text-3xl font-bold">{mockStats.wins}</div>
          </Card>

          <Card className="p-6 transition-all hover:scale-105 hover:shadow-2xl duration-300 card-3d">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-8 w-8 text-purple-500" />
              <div className="text-sm text-muted-foreground">Achievements</div>
            </div>
            <div className="text-3xl font-bold">
              {mockStats.achievements.filter((a) => a.earned).length}/{mockStats.achievements.length}
            </div>
          </Card>
        </div>

        {/* Achievements */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <h2 className="text-3xl font-bold mb-6 tracking-tight">ACHIEVEMENTS</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {mockStats.achievements.map((achievement, index) => (
              <Card
                key={achievement.id}
                className={`p-6 text-center transition-all duration-500 hover:scale-105 card-3d ${
                  achievement.earned ? "border-yellow-500 holographic" : "opacity-50 grayscale"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <achievement.icon
                  className={`h-12 w-12 mx-auto mb-3 ${achievement.earned ? "text-yellow-500" : "text-muted-foreground"}`}
                />
                <div className="font-bold">{achievement.name}</div>
                {achievement.earned && <Badge className="mt-2 bg-yellow-500 text-black">Unlocked</Badge>}
              </Card>
            ))}
          </div>
        </div>

        {/* NFT Collection */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-3xl font-bold mb-6 tracking-tight">MY NFT COLLECTION</h2>

          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All NFTs ({moments.length})</TabsTrigger>
              <TabsTrigger value="eligible">Eligible ({eligibleMoments.length})</TabsTrigger>
              <TabsTrigger value="nba">NBA ({moments.filter((n) => n.sport === 'NBA').length})</TabsTrigger>
              <TabsTrigger value="nfl">NFL ({moments.filter((n) => n.sport === 'NFL').length})</TabsTrigger>
            </TabsList>

            {nftsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your NFT collection...</p>
                </div>
              </div>
            ) : (
              <>
                <TabsContent value="all">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {moments.length > 0 ? moments.map((nft, index) => (
                      <Card
                        key={nft.momentId}
                        className="overflow-hidden group hover:border-foreground transition-all duration-300 hover:scale-105 hover:shadow-2xl card-3d holographic"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="aspect-[3/4] relative">
                          <Image
                            src={nft.imageUrl || "/placeholder.svg"}
                            alt={nft.playerName}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                          <div className="absolute inset-0 scan-line opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute top-4 left-4 right-4 flex justify-between">
                            <Badge className={getRarityColor(nft.rarity)}>{nft.rarity}</Badge>
                            {eligibleMoments.some(e => e.momentId === nft.momentId) && (
                              <Badge className="bg-green-500 text-white shimmer">
                                <Trophy className="h-3 w-3 mr-1" />
                                Eligible
                              </Badge>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <Badge className="mb-2 bg-white/20 text-white border-white/40">{nft.sport}</Badge>
                            <div className="font-bold text-xl mb-1">{nft.playerName}</div>
                            <div className="text-sm text-white/80 mb-2">{nft.team}</div>
                            <div className="text-xs text-white/60">#{nft.momentId}</div>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No NFTs found in your collection</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="eligible">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {eligibleMoments.length > 0 ? eligibleMoments.map((nft, index) => (
                      <Card
                        key={nft.momentId}
                        className="overflow-hidden group hover:border-foreground transition-all duration-300 hover:scale-105 hover:shadow-2xl card-3d holographic pulse-glow"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="aspect-[3/4] relative">
                          <Image
                            src={nft.imageUrl || "/placeholder.svg"}
                            alt={nft.playerName}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                          <div className="absolute top-4 left-4 right-4 flex justify-between">
                            <Badge className={getRarityColor(nft.rarity)}>{nft.rarity}</Badge>
                            <Badge className="bg-green-500 text-white shimmer">
                              <Trophy className="h-3 w-3 mr-1" />
                              Eligible
                            </Badge>
                          </div>
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
                        <p className="text-muted-foreground">No eligible NFTs found</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          You need NBA Top Shot or NFL All Day moments to play
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="nba">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {moments.filter(n => n.sport === 'NBA').length > 0 ? moments.filter(n => n.sport === 'NBA').map((nft, index) => (
                      <Card
                        key={nft.momentId}
                        className="overflow-hidden group hover:border-foreground transition-all duration-300 hover:scale-105 hover:shadow-2xl card-3d holographic"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="aspect-[3/4] relative">
                          <Image
                            src={nft.imageUrl || "/placeholder.svg"}
                            alt={nft.playerName}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                          <div className="absolute top-4 left-4 right-4 flex justify-between">
                            <Badge className={getRarityColor(nft.rarity)}>{nft.rarity}</Badge>
                            {eligibleMoments.some(e => e.momentId === nft.momentId) && (
                              <Badge className="bg-green-500 text-white shimmer">
                                <Trophy className="h-3 w-3 mr-1" />
                                Eligible
                              </Badge>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <Badge className="mb-2 bg-white/20 text-white border-white/40">NBA</Badge>
                            <div className="font-bold text-xl mb-1">{nft.playerName}</div>
                            <div className="text-sm text-white/80 mb-2">{nft.team}</div>
                            <div className="text-xs text-white/60">#{nft.momentId}</div>
                          </div>
                        </div>
                      </Card>
                    )) : (
                      <div className="col-span-full text-center py-12">
                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No NBA Top Shot moments found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="nfl">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {moments.filter(n => n.sport === 'NFL').length > 0 ? moments.filter(n => n.sport === 'NFL').map((nft, index) => (
                      <Card
                        key={nft.momentId}
                        className="overflow-hidden group hover:border-foreground transition-all duration-300 hover:scale-105 hover:shadow-2xl card-3d holographic"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="aspect-[3/4] relative">
                          <Image
                            src={nft.imageUrl || "/placeholder.svg"}
                            alt={nft.playerName}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                          <div className="absolute top-4 left-4 right-4 flex justify-between">
                            <Badge className={getRarityColor(nft.rarity)}>{nft.rarity}</Badge>
                            {eligibleMoments.some(e => e.momentId === nft.momentId) && (
                              <Badge className="bg-green-500 text-white shimmer">
                                <Trophy className="h-3 w-3 mr-1" />
                                Eligible
                              </Badge>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <Badge className="mb-2 bg-white/20 text-white border-white/40">NFL</Badge>
                            <div className="font-bold text-xl mb-1">{nft.playerName}</div>
                            <div className="text-sm text-white/80 mb-2">{nft.team}</div>
                            <div className="text-xs text-white/60">#{nft.momentId}</div>
                          </div>
                        </div>
                      </Card>
                    )) : (
                      <div className="col-span-full text-center py-12">
                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No NFL All Day moments found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
