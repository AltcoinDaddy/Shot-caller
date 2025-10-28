"use client";

import { useState } from "react";
import { 
  HelpCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ExternalLink,
  Book,
  MessageCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SyncHelpDialogProps {
  trigger?: React.ReactNode;
  defaultTab?: string;
}

export function SyncHelpDialog({ trigger, defaultTab = "overview" }: SyncHelpDialogProps) {
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <HelpCircle className="h-4 w-4 mr-2" />
      Sync Help
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wallet-Profile Sync Help</DialogTitle>
          <DialogDescription>
            Learn how ShotCaller keeps your wallet and profile synchronized
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
            <TabsTrigger value="status">Status Guide</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  How Sync Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Automatic Sync</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Syncs when you connect your wallet</li>
                      <li>• Updates every 5 minutes automatically</li>
                      <li>• Syncs when you return to the app</li>
                      <li>• Real-time updates for NFT changes</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">What Gets Synced</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• NBA Top Shot moments</li>
                      <li>• NFL All Day moments</li>
                      <li>• Eligibility for contests</li>
                      <li>• Profile statistics</li>
                    </ul>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Manual Sync Options</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Profile Refresh Button</Badge>
                    <Badge variant="outline">Wallet Reconnection</Badge>
                    <Badge variant="outline">Browser Refresh</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h5 className="font-medium text-green-600">What We Sync</h5>
                    <ul className="text-sm text-muted-foreground">
                      <li>• Wallet address</li>
                      <li>• NFT collection data</li>
                      <li>• Game eligibility status</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-red-600">What We Don't Store</h5>
                    <ul className="text-sm text-muted-foreground">
                      <li>• Private keys</li>
                      <li>• Personal information</li>
                      <li>• Transaction history</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="troubleshooting" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Common Issues
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="border-l-4 border-red-500 pl-4">
                      <h5 className="font-semibold">NFTs Not Showing</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your NFTs aren't appearing in your profile
                      </p>
                      <div className="space-y-1 text-sm">
                        <div>1. Check wallet connection</div>
                        <div>2. Click the refresh button</div>
                        <div>3. Verify NFTs are in your wallet</div>
                        <div>4. Reconnect your wallet</div>
                      </div>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h5 className="font-semibold">Slow Sync</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Synchronization is taking too long
                      </p>
                      <div className="space-y-1 text-sm">
                        <div>1. Check internet connection</div>
                        <div>2. Large collections take longer</div>
                        <div>3. Wait for blockchain confirmation</div>
                        <div>4. Try again in a few minutes</div>
                      </div>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h5 className="font-semibold">Sync Errors</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        Getting error messages during sync
                      </p>
                      <div className="space-y-1 text-sm">
                        <div>1. Refresh the page</div>
                        <div>2. Check network connection</div>
                        <div>3. Disconnect and reconnect wallet</div>
                        <div>4. Clear browser cache</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Fixes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Button variant="outline" size="sm" className="justify-start">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Force Refresh Profile
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Wifi className="h-4 w-4 mr-2" />
                      Reconnect Wallet
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Clock className="h-4 w-4 mr-2" />
                      Wait & Retry
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Check Wallet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sync Status Indicators</CardTitle>
                <CardDescription>
                  Understanding what each status means and what to do
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Synced</div>
                      <div className="text-sm text-muted-foreground">
                        Your profile is up-to-date with your wallet
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600">Good</Badge>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                      <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Syncing</div>
                      <div className="text-sm text-muted-foreground">
                        Currently updating your profile data
                      </div>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">Wait</Badge>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Error</div>
                      <div className="text-sm text-muted-foreground">
                        Sync failed - click to retry or troubleshoot
                      </div>
                    </div>
                    <Badge variant="outline" className="text-red-600">Action Needed</Badge>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full" />
                      <WifiOff className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Offline</div>
                      <div className="text-sm text-muted-foreground">
                        Showing cached data - will sync when online
                      </div>
                    </div>
                    <Badge variant="outline" className="text-gray-600">Limited</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Where to Find Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Navigation Bar</span>
                    <span className="text-muted-foreground">Colored dot next to wallet</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profile Page</span>
                    <span className="text-muted-foreground">Status indicator and last updated</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tooltips</span>
                    <span className="text-muted-foreground">Hover over status indicators</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Complete User Guide
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Video Tutorials
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    FAQ Section
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Get Help
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Community Forum
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Report Bug
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Before Contacting Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="font-medium">Please try these steps first:</div>
                  <ul className="space-y-1 text-muted-foreground ml-4">
                    <li>1. Refresh your profile manually</li>
                    <li>2. Disconnect and reconnect your wallet</li>
                    <li>3. Check your internet connection</li>
                    <li>4. Clear your browser cache</li>
                    <li>5. Try a different browser</li>
                  </ul>
                  
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="font-medium mb-2">When contacting support, include:</div>
                    <ul className="space-y-1 text-muted-foreground text-xs">
                      <li>• Your wallet address</li>
                      <li>• Error messages (screenshots help)</li>
                      <li>• Steps you've already tried</li>
                      <li>• Browser and device information</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}