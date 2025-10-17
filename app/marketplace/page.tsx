"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Filter, TrendingUp, Star, Wallet, Plus, RefreshCw } from "lucide-react"
import { MarketplaceListingCard } from "@/components/marketplace-listing-card"
import { CreateListingDialog } from "@/components/create-listing-dialog"
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation"
import { useMarketplaceListings, useUserListings, useMarketplaceStats } from "@/hooks/use-marketplace"
import { useWallet } from "@/hooks/use-wallet"
import { useNFTOwnership } from "@/hooks/use-nft-ownership"
import { MarketplaceFilters, MarketplaceSortOptions } from "@/lib/types/marketplace"

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSport, setSelectedSport] = useState<"NBA" | "NFL" | "all">("all")
  const [selectedRarity, setSelectedRarity] = useState<"Common" | "Rare" | "Epic" | "Legendary" | "all">("all")
  const [sortBy, setSortBy] = useState<"price" | "rarity" | "date" | "player">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)

  const { isConnected, address } = useWallet()
  const { nfts: ownedNFTs, loading: nftsLoading } = useNFTOwnership(address)

  // Marketplace filters and sorting
  const filters: MarketplaceFilters = {
    sport: selectedSport,
    rarity: selectedRarity,
    search: searchTerm || undefined,
  }

  const sort: MarketplaceSortOptions = {
    sortBy,
    sortOrder
  }

  // Fetch marketplace data
  const { 
    listings, 
    loading: listingsLoading, 
    error: listingsError, 
    refetch: refetchListings 
  } = useMarketplaceListings({
    filters,
    sort,
    page: currentPage,
    limit: 12,
    autoRefresh: true,
    refreshInterval: 30000
  })

  const { 
    listings: userListings, 
    loading: userListingsLoading, 
    refetch: refetchUserListings 
  } = useUserListings(address, true)

  const { stats, loading: statsLoading } = useMarketplaceStats()

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedSport, selectedRarity, sortBy, sortOrder])

  const handleRefresh = () => {
    refetchListings()
    refetchUserListings()
  }

  const handleListingSuccess = () => {
    refetchListings()
    refetchUserListings()
  }

  const handlePurchaseSuccess = () => {
    refetchListings()
    refetchUserListings()
  }

  const handleCancelSuccess = () => {
    refetchListings()
    refetchUserListings()
  }

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder]
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  const getSortValue = () => `${sortBy}-${sortOrder}`

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation className="mb-4 sm:mb-6" />
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">NFT Marketplace</h1>
            <p className="text-muted-foreground">
              Trade NBA Top Shot and NFL All Day moments with FLOW tokens
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Marketplace Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.activeListings}</div>
                <p className="text-xs text-muted-foreground">Active Listings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.totalVolume.toFixed(1)} FLOW</div>
                <p className="text-xs text-muted-foreground">Total Volume</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.averagePrice.toFixed(1)} FLOW</div>
                <p className="text-xs text-muted-foreground">Average Price</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.topSale.toFixed(1)} FLOW</div>
                <p className="text-xs text-muted-foreground">Top Sale</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players, teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              <SelectItem value="NBA">NBA</SelectItem>
              <SelectItem value="NFL">NFL</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedRarity} onValueChange={setSelectedRarity}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              <SelectItem value="Common">Common</SelectItem>
              <SelectItem value="Rare">Rare</SelectItem>
              <SelectItem value="Epic">Epic</SelectItem>
              <SelectItem value="Legendary">Legendary</SelectItem>
            </SelectContent>
          </Select>
          <Select value={getSortValue()} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="rarity-desc">Rarity: High to Low</SelectItem>
              <SelectItem value="player-asc">Player: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">Buy NFTs</TabsTrigger>
          <TabsTrigger value="sell">My Listings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buy" className="space-y-6">
          {listingsError && (
            <Alert>
              <AlertDescription>
                Error loading marketplace listings: {listingsError}
              </AlertDescription>
            </Alert>
          )}

          {listingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : listings && listings.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.items.map((listing) => (
                  <MarketplaceListingCard
                    key={listing.id}
                    listing={listing}
                    currentUserAddress={address}
                    onPurchaseSuccess={handlePurchaseSuccess}
                    onCancelSuccess={handleCancelSuccess}
                  />
                ))}
              </div>

              {/* Pagination */}
              {listings.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {currentPage} of {listings.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(listings.totalPages, p + 1))}
                    disabled={currentPage === listings.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No listings found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search filters or check back later for new listings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="sell" className="space-y-6">
          {!isConnected ? (
            <Card>
              <CardHeader>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>
                  Connect your Dapper Wallet to view and manage your NFT listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    You need to connect your wallet to access marketplace features
                  </p>
                  <Button>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Create New Listing Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Create New Listing
                    <Badge variant="outline">{ownedNFTs?.length || 0} NFTs Available</Badge>
                  </CardTitle>
                  <CardDescription>
                    List your NBA Top Shot and NFL All Day moments for sale
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {nftsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading your NFTs...</p>
                      </div>
                    </div>
                  ) : ownedNFTs && ownedNFTs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ownedNFTs.slice(0, 6).map((nft) => (
                        <Card key={nft.id} className="overflow-hidden">
                          <div className="aspect-square relative">
                            <img
                              src={nft.imageUrl}
                              alt={nft.playerName}
                              className="w-full h-full object-cover"
                            />
                            <Badge className="absolute top-2 right-2">
                              {nft.rarity}
                            </Badge>
                          </div>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{nft.playerName}</CardTitle>
                            <CardDescription className="text-xs">{nft.team}</CardDescription>
                          </CardHeader>
                          <CardFooter className="pt-2">
                            <CreateListingDialog
                              nft={nft}
                              userAddress={address!}
                              onSuccess={handleListingSuccess}
                            >
                              <Button size="sm" className="w-full">
                                <Plus className="h-4 w-4 mr-1" />
                                List for Sale
                              </Button>
                            </CreateListingDialog>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No NFTs found in your wallet</p>
                      <p className="text-sm">Make sure you have NBA Top Shot or NFL All Day moments</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User's Active Listings */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Listings</CardTitle>
                  <CardDescription>
                    Manage your active and past marketplace listings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userListingsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-16 w-16 rounded" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/4" />
                          </div>
                          <Skeleton className="h-8 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : userListings && userListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userListings.map((listing) => (
                        <MarketplaceListingCard
                          key={listing.id}
                          listing={listing}
                          currentUserAddress={address}
                          onCancelSuccess={handleCancelSuccess}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>You haven't created any listings yet</p>
                      <p className="text-sm">List your NFTs above to start selling</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}