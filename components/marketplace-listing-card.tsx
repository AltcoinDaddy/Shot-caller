"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Loader2, ShoppingCart, X, Eye } from "lucide-react"
import { MarketplaceListing } from "@/lib/types/marketplace"
import { useMarketplaceActions } from "@/hooks/use-marketplace"
import { useToast } from "@/hooks/use-toast"
import { OptimizedNFTImage, NFT_IMAGE_SIZES } from "@/components/optimized-nft-image"

interface MarketplaceListingCardProps {
  listing: MarketplaceListing
  currentUserAddress?: string
  onPurchaseSuccess?: () => void
  onCancelSuccess?: () => void
}

export function MarketplaceListingCard({ 
  listing, 
  currentUserAddress, 
  onPurchaseSuccess, 
  onCancelSuccess 
}: MarketplaceListingCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const { purchaseNFT, cancelListing, loading } = useMarketplaceActions()
  const { toast } = useToast()

  const isOwnListing = currentUserAddress === listing.sellerAddress
  const canPurchase = currentUserAddress && !isOwnListing && listing.status === 'active'

  const handlePurchase = async () => {
    if (!currentUserAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to purchase NFTs",
        variant: "destructive"
      })
      return
    }

    const transaction = await purchaseNFT(listing.id, currentUserAddress)
    
    if (transaction) {
      toast({
        title: "Purchase Successful!",
        description: `You successfully purchased ${listing.nftDetails.playerName} for ${listing.price} FLOW`,
      })
      onPurchaseSuccess?.()
    } else {
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCancel = async () => {
    if (!currentUserAddress) return

    const success = await cancelListing(listing.id, currentUserAddress)
    
    if (success) {
      toast({
        title: "Listing Cancelled",
        description: "Your listing has been successfully cancelled",
      })
      onCancelSuccess?.()
    } else {
      toast({
        title: "Cancellation Failed",
        description: "There was an error cancelling your listing. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'bg-yellow-500'
      case 'Epic': return 'bg-purple-500'
      case 'Rare': return 'bg-blue-500'
      case 'Common': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg active:shadow-md transition-shadow mobile-card touch-target">
      <div className="aspect-square relative">
        <OptimizedNFTImage
          src={listing.nftDetails.imageUrl}
          alt={`${listing.nftDetails.playerName} - ${listing.nftDetails.team}`}
          className="w-full h-full"
          sizes={NFT_IMAGE_SIZES.card}
          quality={90}
          priority={false}
        />
        <Badge 
          className={`absolute top-2 right-2 text-white text-xs ${getRarityColor(listing.nftDetails.rarity)}`}
        >
          <span className="hidden sm:inline">{listing.nftDetails.rarity}</span>
          <span className="sm:hidden">{listing.nftDetails.rarity.slice(0, 1)}</span>
        </Badge>
        {isOwnListing && (
          <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs">
            <span className="hidden sm:inline">Your Listing</span>
            <span className="sm:hidden">Yours</span>
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <span className="truncate pr-2">{listing.nftDetails.playerName}</span>
          <Badge variant="outline" className="text-xs flex-shrink-0">{listing.nftDetails.sport}</Badge>
        </CardTitle>
        <CardDescription className="text-sm truncate">{listing.nftDetails.team}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Listed:</span>
            <span className="text-right">{formatDate(listing.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seller:</span>
            <span className="font-mono text-xs truncate ml-2">
              {listing.sellerAddress.slice(0, 4)}...{listing.sellerAddress.slice(-4)}
            </span>
          </div>
          {listing.expiresAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span className="text-right">{formatDate(listing.expiresAt)}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-3 sm:gap-2">
        <div className="text-xl sm:text-2xl font-bold text-primary text-center sm:text-left">
          {listing.price} FLOW
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none touch-target">
                <Eye className="h-4 w-4 mr-1" />
                <span className="text-xs sm:text-sm">Details</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{listing.nftDetails.playerName}</DialogTitle>
                <DialogDescription>
                  {listing.nftDetails.team} • {listing.nftDetails.sport} • {listing.nftDetails.rarity}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="w-full aspect-square relative rounded-lg overflow-hidden">
                  <OptimizedNFTImage
                    src={listing.nftDetails.imageUrl}
                    alt={`${listing.nftDetails.playerName} - ${listing.nftDetails.team}`}
                    className="w-full h-full"
                    sizes={NFT_IMAGE_SIZES.hero}
                    quality={95}
                    priority={true}
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Player Stats</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(listing.nftDetails.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Listing Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-bold">{listing.price} FLOW</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Marketplace Fee (3%):</span>
                      <span>{(listing.price * 0.03).toFixed(3)} FLOW</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Seller Receives:</span>
                      <span>{(listing.price * 0.97).toFixed(3)} FLOW</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {canPurchase && (
            <Button 
              onClick={handlePurchase} 
              disabled={loading}
              className="flex-1 sm:flex-none touch-target"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-1" />
              )}
              <span className="text-xs sm:text-sm">Buy Now</span>
            </Button>
          )}

          {isOwnListing && listing.status === 'active' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  disabled={loading}
                  className="flex-1 sm:flex-none touch-target"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <X className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-xs sm:text-sm">Cancel</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Listing</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this listing? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Listed</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>
                    Cancel Listing
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}