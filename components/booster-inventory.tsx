"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, Clock, Star, ShoppingCart, Sparkles, Timer, CheckCircle, XCircle } from "lucide-react"
import { useBoosters } from "@/hooks/use-boosters"
import { Booster, BoosterMarketplaceItem, DisneyPinnacleBooster } from "@/lib/types/booster"

interface BoosterInventoryProps {
  onActivateBooster?: (boosterId: string) => void;
  onPurchaseBooster?: (marketplaceItemId: string, price: number) => void;
  currentLineupId?: string;
}

export function BoosterInventory({ 
  onActivateBooster, 
  onPurchaseBooster,
  currentLineupId = "current_lineup" 
}: BoosterInventoryProps) {
  const {
    inventory,
    marketplaceBoosters,
    disneyBoosters,
    activeBoosters,
    availableBoosters,
    isLoading,
    isActivating,
    isPurchasing,
    error,
    activateBooster,
    purchaseBooster,
    clearError
  } = useBoosters();

  const [selectedBooster, setSelectedBooster] = useState<Booster | null>(null);
  const [selectedMarketplaceItem, setSelectedMarketplaceItem] = useState<BoosterMarketplaceItem | null>(null);

  const handleActivateBooster = async (boosterId: string) => {
    const success = await activateBooster(boosterId, currentLineupId);
    if (success) {
      onActivateBooster?.(boosterId);
      setSelectedBooster(null);
    }
  };

  const handlePurchaseBooster = async (marketplaceItemId: string, price: number) => {
    const success = await purchaseBooster(marketplaceItemId, price);
    if (success) {
      onPurchaseBooster?.(marketplaceItemId, price);
      setSelectedMarketplaceItem(null);
    }
  };

  const getBoosterStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'available': return 'bg-blue-500';
      case 'expired': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getBoosterStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'available': return <Zap className="h-4 w-4" />;
      case 'expired': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatTimeRemaining = (expiresAt?: Date) => {
    if (!expiresAt) return '';
    
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Booster Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Booster Inventory
          </CardTitle>
          <CardDescription>
            Manage your power-ups and boosters to enhance your lineup performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inventory">My Boosters</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="disney">Disney NFTs</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-4">
              {/* Active Boosters */}
              {activeBoosters.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">Active Boosters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeBoosters.map((booster) => (
                      <Card key={booster.id} className="border-green-200">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              {getBoosterStatusIcon(booster.status)}
                              {booster.boosterType.replace('_', ' ').toUpperCase()}
                            </CardTitle>
                            <Badge className={getBoosterStatusColor(booster.status)}>
                              {booster.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-muted-foreground mb-2">
                            {booster.effectType === 'score_multiplier' && 
                              `+${Math.round((booster.effectValue - 1) * 100)}% score multiplier`}
                            {booster.effectType === 'random_bonus' && 
                              `Random bonus (5-${booster.effectValue} points)`}
                            {booster.effectType === 'extra_points' && 
                              `+${booster.effectValue} bonus points`}
                          </p>
                          {booster.expiresAt && (
                            <div className="flex items-center gap-2 text-sm">
                              <Timer className="h-3 w-3" />
                              <span>{formatTimeRemaining(booster.expiresAt)}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Boosters */}
              {availableBoosters.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600">Available Boosters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableBoosters.map((booster) => (
                      <Card key={booster.id} className="border-blue-200">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              {getBoosterStatusIcon(booster.status)}
                              {booster.boosterType.replace('_', ' ').toUpperCase()}
                            </CardTitle>
                            <Badge variant="outline">{booster.status}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-muted-foreground mb-2">
                            {booster.effectType === 'score_multiplier' && 
                              `+${Math.round((booster.effectValue - 1) * 100)}% score multiplier`}
                            {booster.effectType === 'random_bonus' && 
                              `Random bonus (5-${booster.effectValue} points)`}
                            {booster.effectType === 'extra_points' && 
                              `+${booster.effectValue} bonus points`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Duration: {booster.durationHours}h
                          </p>
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => setSelectedBooster(booster)}
                              >
                                Activate
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Activate Booster</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to activate this booster for your current lineup?
                                </DialogDescription>
                              </DialogHeader>
                              {selectedBooster && (
                                <div className="space-y-2">
                                  <p><strong>Type:</strong> {selectedBooster.boosterType.replace('_', ' ')}</p>
                                  <p><strong>Effect:</strong> {
                                    selectedBooster.effectType === 'score_multiplier' 
                                      ? `+${Math.round((selectedBooster.effectValue - 1) * 100)}% score multiplier`
                                      : selectedBooster.effectType === 'random_bonus'
                                      ? `Random bonus (5-${selectedBooster.effectValue} points)`
                                      : `+${selectedBooster.effectValue} bonus points`
                                  }</p>
                                  <p><strong>Duration:</strong> {selectedBooster.durationHours} hours</p>
                                </div>
                              )}
                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  onClick={() => setSelectedBooster(null)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => selectedBooster && handleActivateBooster(selectedBooster.id)}
                                  disabled={isActivating}
                                >
                                  {isActivating ? 'Activating...' : 'Activate'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {(!inventory || inventory.totalCount === 0) && (
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No boosters in your inventory</p>
                  <p className="text-sm text-muted-foreground">Purchase boosters from the marketplace or use Disney Pinnacle NFTs</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="marketplace" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketplaceBoosters.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          {item.name}
                        </CardTitle>
                        <Badge variant="outline">{item.rarity}</Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Effect:</span>
                          <span>
                            {item.effectType === 'score_multiplier' && 
                              `+${Math.round((item.effectValue - 1) * 100)}%`}
                            {item.effectType === 'random_bonus' && 
                              `5-${item.effectValue} pts`}
                            {item.effectType === 'extra_points' && 
                              `+${item.effectValue} pts`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{item.durationHours}h</span>
                        </div>
                        {item.maxPurchases && (
                          <div className="flex justify-between">
                            <span>Weekly Limit:</span>
                            <span>{item.maxPurchases}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      <div className="text-lg font-bold text-primary">
                        {item.flowPrice} FLOW
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm"
                            onClick={() => setSelectedMarketplaceItem(item)}
                            disabled={!item.isAvailable}
                          >
                            {item.isAvailable ? 'Purchase' : 'Unavailable'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Purchase Booster</DialogTitle>
                            <DialogDescription>
                              Confirm your booster purchase with FLOW tokens
                            </DialogDescription>
                          </DialogHeader>
                          {selectedMarketplaceItem && (
                            <div className="space-y-2">
                              <p><strong>Name:</strong> {selectedMarketplaceItem.name}</p>
                              <p><strong>Description:</strong> {selectedMarketplaceItem.description}</p>
                              <p><strong>Price:</strong> {selectedMarketplaceItem.flowPrice} FLOW</p>
                              <p><strong>Duration:</strong> {selectedMarketplaceItem.durationHours} hours</p>
                            </div>
                          )}
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => setSelectedMarketplaceItem(null)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => selectedMarketplaceItem && handlePurchaseBooster(selectedMarketplaceItem.id, selectedMarketplaceItem.flowPrice)}
                              disabled={isPurchasing}
                            >
                              {isPurchasing ? 'Purchasing...' : `Purchase for ${selectedMarketplaceItem?.flowPrice} FLOW`}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="disney" className="space-y-4">
              {disneyBoosters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {disneyBoosters.map((disney) => (
                    <Card key={disney.nftId} className="border-purple-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            {disney.name}
                          </CardTitle>
                          <Badge variant="secondary">{disney.rarity}</Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {disney.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Collection:</span>
                            <span>{disney.collection}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Booster Type:</span>
                            <span className="capitalize">{disney.boosterType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Effect:</span>
                            <span>
                              {disney.effectType === 'score_multiplier' && 
                                `+${Math.round((disney.effectValue - 1) * 100)}%`}
                              {disney.effectType === 'random_bonus' && 
                                `5-${disney.effectValue} pts`}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          size="sm" 
                          className="w-full"
                          variant={disney.isActivated ? "secondary" : "default"}
                          disabled={disney.isActivated}
                        >
                          {disney.isActivated ? 'Activated' : 'Activate Disney Booster'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No Disney Pinnacle NFTs found</p>
                  <p className="text-sm text-muted-foreground">
                    Own Disney Pinnacle NFTs to unlock automatic power-ups
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}