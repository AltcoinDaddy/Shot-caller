"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, 
  RefreshCw, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  X,
  Play
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SyncOnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  autoStart?: boolean;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SyncOnboardingFlow({ 
  isOpen, 
  onClose, 
  onComplete,
  autoStart = false 
}: SyncOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(autoStart);

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to ShotCaller Sync",
      description: "Learn how we keep your wallet and profile synchronized",
      icon: <Wallet className="h-8 w-8 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Seamless Wallet Integration</h3>
            <p className="text-muted-foreground">
              ShotCaller automatically synchronizes your connected wallet with your profile, 
              ensuring your NFT collection and game data are always up-to-date.
            </p>
          </div>
          
          <div className="grid gap-3 mt-6">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Real-time NFT collection updates</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Automatic eligibility checking</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Secure and private synchronization</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "how-it-works",
      title: "How Sync Works",
      description: "Understanding the synchronization process",
      icon: <RefreshCw className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Automatic Synchronization</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Connect Your Wallet</h4>
                <p className="text-sm text-muted-foreground">
                  When you connect your Dapper wallet, we immediately fetch your NFT collection
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Continuous Updates</h4>
                <p className="text-sm text-muted-foreground">
                  Your profile updates automatically every 5 minutes and when you return to the app
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Real-time Reflection</h4>
                <p className="text-sm text-muted-foreground">
                  Changes to your NFT collection are reflected in your profile and game eligibility
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "privacy-security",
      title: "Privacy & Security",
      description: "Your data is safe and secure",
      icon: <Shield className="h-8 w-8 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your Privacy Matters</h3>
            <p className="text-muted-foreground">
              We only sync what's necessary for gameplay and never store sensitive information
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-green-600 mb-2">What We Sync</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Wallet address</li>
                  <li>• NFT collection data</li>
                  <li>• Game eligibility status</li>
                  <li>• Profile statistics</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-red-600 mb-2">What We Don't Store</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Private keys</li>
                  <li>• Personal information</li>
                  <li>• Transaction history</li>
                  <li>• Browsing data</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="font-semibold text-sm">Security Features</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Encrypted local storage</li>
              <li>• Secure HTTPS connections</li>
              <li>• No sensitive data transmission</li>
              <li>• User-controlled data clearing</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "sync-status",
      title: "Understanding Sync Status",
      description: "Learn to read sync indicators",
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Sync Status Indicators</h3>
            <p className="text-muted-foreground">
              Always know the status of your wallet-profile synchronization
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div className="flex-1">
                <div className="font-semibold">Synced</div>
                <div className="text-sm text-muted-foreground">
                  Your profile is up-to-date
                </div>
              </div>
              <Badge variant="outline" className="text-green-600">Good</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="font-semibold">Syncing</div>
                <div className="text-sm text-muted-foreground">
                  Currently updating your data
                </div>
              </div>
              <Badge variant="outline" className="text-yellow-600">Wait</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div className="flex-1">
                <div className="font-semibold">Error</div>
                <div className="text-sm text-muted-foreground">
                  Sync failed - click to retry
                </div>
              </div>
              <Badge variant="outline" className="text-red-600">Action</Badge>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm">
              <strong>Tip:</strong> You can find sync status indicators in the navigation bar 
              next to your wallet address and on your profile page.
            </div>
          </div>
        </div>
      )
    },
    {
      id: "manual-controls",
      title: "Manual Sync Controls",
      description: "Take control when you need to",
      icon: <Play className="h-8 w-8 text-indigo-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Play className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Manual Sync Options</h3>
            <p className="text-muted-foreground">
              Sometimes you need to sync immediately - here's how
            </p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Profile Refresh Button</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Click the refresh button on your profile page to immediately sync your wallet data
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Wallet Reconnection</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Disconnect and reconnect your wallet to trigger a complete resync
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <Wallet className="h-4 w-4 mr-2" />
                  Reconnect Wallet
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg">
            <div className="text-sm">
              <strong>When to use manual sync:</strong>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• Just bought new NFTs</li>
                <li>• Profile seems outdated</li>
                <li>• Before important contests</li>
                <li>• After wallet changes</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "complete",
      title: "You're All Set!",
      description: "Ready to use ShotCaller with confidence",
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Sync Setup Complete!</h3>
            <p className="text-muted-foreground">
              You now understand how ShotCaller keeps your wallet and profile synchronized. 
              Your NFT collection will always be up-to-date for gameplay.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">Quick Reminders:</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Sync happens automatically every 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Watch for status indicators in the navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Use manual refresh when needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Your data is always secure and private</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm">
              <strong>Need help later?</strong> Look for the help icon next to sync indicators 
              or visit the sync help section in your profile.
            </div>
          </div>
        </div>
      ),
      action: {
        label: "Start Playing!",
        onClick: onComplete
      }
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  const handleStart = () => {
    setHasStarted(true);
  };

  if (!hasStarted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Welcome to ShotCaller
            </DialogTitle>
            <DialogDescription>
              Learn how wallet-profile sync works in just 2 minutes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <RefreshCw className="h-10 w-10 text-blue-500" />
              </div>
              <p className="text-muted-foreground">
                Take a quick tour to understand how ShotCaller keeps your wallet 
                and profile synchronized for the best gaming experience.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSkip} className="flex-1">
                Skip Tour
              </Button>
              <Button onClick={handleStart} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Start Tour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {currentStepData.icon}
              {currentStepData.title}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </span>
          </div>

          <div className="min-h-[400px]">
            {currentStepData.content}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              
              {currentStep === steps.length - 1 ? (
                <Button onClick={currentStepData.action?.onClick || onComplete}>
                  {currentStepData.action?.label || "Complete"}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage onboarding state
export function useSyncOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('shotcaller-sync-onboarding-seen');
    setHasSeenOnboarding(!!seen);
    
    // Show onboarding for new users
    if (!seen) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('shotcaller-sync-onboarding-seen', 'true');
    setHasSeenOnboarding(true);
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('shotcaller-sync-onboarding-seen');
    setHasSeenOnboarding(false);
    setShowOnboarding(true);
  };

  return {
    hasSeenOnboarding,
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    resetOnboarding
  };
}