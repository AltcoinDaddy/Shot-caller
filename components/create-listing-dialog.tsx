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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>List NFT for Sale</DialogTitle>
          <DialogDescription>
            Set your price and listing duration for this NFT
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* NFT Preview */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{nft.playerName}</CardTitle>
                <Badge variant="outline">{nft.sport}</Badge>
              </div>
              <CardDescription>{nft.team}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <img
                  src={nft.imageUrl}
                  alt={nft.playerName}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Rarity:</span>
                    <Badge className="text-xs">{nft.rarity}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Serial:</span>
                    <span>#{nft.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collection:</span>
                    <span>{nft.collectionName}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Price Input */}
            <div className="space-y-2">
              <Label htmlFor="price">Price (FLOW)</Label>
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
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum: 0.1 FLOW • Maximum: 10,000 FLOW
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

            {/* Fee Breakdown */}
            {price && parseFloat(price) > 0 && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm">Fee Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Listing Price:</span>
                    <span>{parseFloat(price).toFixed(3)} FLOW</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Marketplace Fee (3%):</span>
                    <span>-{marketplaceFee.toFixed(3)} FLOW</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>You Receive:</span>
                    <span>{sellerReceives.toFixed(3)} FLOW</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !price || parseFloat(price) <= 0}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Listing
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}