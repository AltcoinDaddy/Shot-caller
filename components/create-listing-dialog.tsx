"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, DollarSign } from "lucide-react"
import { NFTMoment } from "@/lib/types/nft"
import { useMarketplaceActions } from "@/hooks/use-marketplace"
import { useToast } from "@/hooks/use-toast"

interface CreateListingDialogProps {
  nft: NFTMoment
  userAddress: string
  onSuccess?: () => void
  children?: React.ReactNode
}

export function CreateListingDialog({ nft, userAddress, onSuccess, children }: CreateListingDialogProps) {
  const [open, setOpen] = useState(false)
  const [price, setPrice] = useState("")
  const [expirationDays, setExpirationDays] = useState("30")
  const { createListing, loading } = useMarketplaceActions()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const priceValue = parseFloat(price)
    const expirationValue = parseInt(expirationDays)

    if (!priceValue || priceValue <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0",
        variant: "destructive"
      })
      return
    }

    if (priceValue < 0.1) {
      toast({
        title: "Price Too Low",
        description: "Minimum price is 0.1 FLOW",
        variant: "destructive"
      })
      return
    }

    if (priceValue > 10000) {
      toast({
        title: "Price Too High",
        description: "Maximum price is 10,000 FLOW",
        variant: "destructive"
      })
      return
    }

    const listing = await createListing(userAddress, nft.momentId, priceValue, expirationValue)
    
    if (listing) {
      toast({
        title: "Listing Created!",
        description: `${nft.playerName} is now listed for ${priceValue} FLOW`,
      })
      setOpen(false)
      setPrice("")
      setExpirationDays("30")
      onSuccess?.()
    }
  }

  const calculateFees = () => {
    const priceValue = parseFloat(price) || 0
    const marketplaceFee = priceValue * 0.03
    const sellerReceives = priceValue - marketplaceFee
    return { marketplaceFee, sellerReceives }
  }

  const { marketplaceFee, sellerReceives } = calculateFees()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            List for Sale
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">List NFT for Sale</DialogTitle>
          <DialogDescription className="text-sm">
            Set your price and listing duration for this NFT
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* NFT Preview - Mobile Optimized */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg truncate">{nft.playerName}</CardTitle>
                <Badge variant="outline" className="text-xs">{nft.sport}</Badge>
              </div>
              <CardDescription className="text-sm">{nft.team}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <img
                  src={nft.imageUrl}
                  alt={nft.playerName}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 space-y-1 text-xs sm:text-sm min-w-0">
                  <div className="flex justify-between">
                    <span>Rarity:</span>
                    <Badge className="text-xs">{nft.rarity}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Serial:</span>
                    <span className="truncate">#{nft.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collection:</span>
                    <span className="truncate text-right">{nft.collectionName}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Price Input - Mobile Optimized */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">Price (FLOW)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  step="0.001"
                  min="0.1"
                  max="10000"
                  placeholder="0.000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-10 text-base touch-target" // Prevent zoom on iOS
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Min: 0.1 FLOW • Max: 10,000 FLOW
              </p>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expiration">Listing Duration</Label>
              <Select value={expirationDays} onValueChange={setExpirationDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">1 Week</SelectItem>
                  <SelectItem value="14">2 Weeks</SelectItem>
                  <SelectItem value="30">1 Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fee Breakdown - Mobile Optimized */}
            {price && parseFloat(price) > 0 && (
              <div className="space-y-2 p-3 bg-muted rounded-lg mobile-card">
                <h4 className="font-semibold text-sm">Fee Breakdown</h4>
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Listing Price:</span>
                    <span className="font-medium">{parseFloat(price).toFixed(3)} FLOW</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Marketplace Fee (3%):</span>
                    <span>-{marketplaceFee.toFixed(3)} FLOW</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 text-sm">
                    <span>You Receive:</span>
                    <span className="text-green-600">{sellerReceives.toFixed(3)} FLOW</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto touch-target"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !price || parseFloat(price) <= 0}
                className="w-full sm:w-auto touch-target"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                <span className="text-sm sm:text-base">Create Listing</span>
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}