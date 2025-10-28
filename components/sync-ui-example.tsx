"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  SyncStatusIndicator,
  SyncLoadingState,
  SyncErrorDisplay,
  SyncProgressIndicator,
  SyncStatusDashboard,
  NavigationSyncIndicator,
  ProfileSyncStatus,
  SyncErrorType,
  SyncOperationType,
  OperationStatus
} from "./sync-ui";
import type {
  SyncStatus,
  SyncError,
  SyncOperation,
  ProfileSyncData
} from "./sync-ui";

export function SyncUIExample() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    nextSync: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    failureCount: 0,
    currentOperation: undefined
  });

  const [operations, setOperations] = useState<SyncOperation[]>([
    {
      id: "1",
      type: SyncOperationType.WALLET_VERIFICATION,
      status: OperationStatus.COMPLETED,
      startTime: new Date(Date.now() - 2 * 60 * 1000),
      endTime: new Date(Date.now() - 1.5 * 60 * 1000),
      duration: 30000,
      retryCount: 0
    },
    {
      id: "2",
      type: SyncOperationType.NFT_COLLECTION_FETCH,
      status: OperationStatus.COMPLETED,
      startTime: new Date(Date.now() - 1.5 * 60 * 1000),
      endTime: new Date(Date.now() - 1 * 60 * 1000),
      duration: 45000,
      retryCount: 0
    }
  ]);

  const [errors, setErrors] = useState<SyncError[]>([]);

  const [profileData, setProfileData] = useState<ProfileSyncData>({
    walletAddress: "0x1234...5678",
    nftCount: 42,
    eligibleMoments: 38,
    lastNFTSync: new Date(Date.now() - 3 * 60 * 1000),
    lastStatsSync: new Date(Date.now() - 5 * 60 * 1000),
    profileStats: {
      gamesPlayed: 15,
      totalPoints: 1250,
      rank: 42
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const simulateSync = () => {
    setIsLoading(true);
    setSyncStatus(prev => ({
      ...prev,
      isActive: true,
      currentOperation: "Fetching NFT collection..."
    }));

    const newOperation: SyncOperation = {
      id: Date.now().toString(),
      type: SyncOperationType.NFT_COLLECTION_FETCH,
      status: OperationStatus.IN_PROGRESS,
      startTime: new Date(),
      retryCount: 0,
      progress: 0
    };

    setOperations(prev => [newOperation, ...prev]);

    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 20;
      setOperations(prev => prev.map(op => 
        op.id === newOperation.id 
          ? { ...op, progress }
          : op
      ));

      if (progress >= 100) {
        clearInterval(progressInterval);
        
        // Complete the operation
        setTimeout(() => {
          setOperations(prev => prev.map(op => 
            op.id === newOperation.id 
              ? { 
                  ...op, 
                  status: OperationStatus.COMPLETED,
                  endTime: new Date(),
                  duration: Date.now() - op.startTime.getTime()
                }
              : op
          ));

          setSyncStatus(prev => ({
            ...prev,
            isActive: false,
            lastSync: new Date(),
            currentOperation: undefined,
            failureCount: 0
          }));

          setIsLoading(false);
        }, 500);
      }
    }, 500);
  };

  const simulateError = () => {
    const error: SyncError = {
      type: SyncErrorType.NETWORK_ERROR,
      message: "Failed to connect to NFT service",
      operation: "NFT Collection Fetch",
      timestamp: new Date(),
      retryable: true,
      context: {
        endpoint: "/api/nfts",
        statusCode: 503
      }
    };

    setErrors(prev => [error, ...prev.slice(0, 4)]);
    setSyncStatus(prev => ({
      ...prev,
      failureCount: prev.failureCount + 1
    }));
  };

  const clearErrors = () => {
    setErrors([]);
    setSyncStatus(prev => ({
      ...prev,
      failureCount: 0
    }));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sync UI Components Demo</h1>
        <div className="flex items-center gap-2">
          <Button onClick={simulateSync} disabled={syncStatus.isActive}>
            Simulate Sync
          </Button>
          <Button onClick={simulateError} variant="outline">
            Simulate Error
          </Button>
          <Button onClick={clearErrors} variant="ghost">
            Clear Errors
          </Button>
        </div>
      </div>

      <Tabs defaultValue="indicators" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
          <TabsTrigger value="loading">Loading States</TabsTrigger>
          <TabsTrigger value="errors">Error Display</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="indicators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Status Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Compact Variant</h4>
                  <SyncStatusIndicator status={syncStatus} variant="compact" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Detailed Variant</h4>
                  <SyncStatusIndicator 
                    status={syncStatus} 
                    variant="detailed" 
                    showLastSync 
                    onRetry={simulateSync}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Navigation Indicator</h4>
                <NavigationSyncIndicator
                  syncStatus={syncStatus}
                  errors={errors}
                  onRetrySync={simulateSync}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Skeleton</h4>
                  <SyncLoadingState isLoading={true} variant="skeleton">
                    <div>Content would be here</div>
                  </SyncLoadingState>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Spinner</h4>
                  <SyncLoadingState isLoading={true} variant="spinner">
                    <div>Content would be here</div>
                  </SyncLoadingState>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Overlay</h4>
                  <SyncLoadingState isLoading={isLoading} variant="overlay">
                    <div className="p-4 border rounded">
                      <p>This content gets overlaid during loading</p>
                      <p>You can still see it behind the loading state</p>
                    </div>
                  </SyncLoadingState>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Display</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.length > 0 ? (
                errors.map((error, index) => (
                  <SyncErrorDisplay
                    key={index}
                    error={error}
                    onRetry={simulateSync}
                    onDismiss={() => setErrors(prev => prev.filter((_, i) => i !== index))}
                    variant="card"
                    showDetails
                  />
                ))
              ) : (
                <p className="text-muted-foreground">No errors to display. Click "Simulate Error" to see error components.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Compact Progress</h4>
                  <SyncProgressIndicator
                    operations={operations}
                    variant="compact"
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Detailed Progress</h4>
                  <SyncProgressIndicator
                    operations={operations}
                    variant="detailed"
                    onRetry={(id) => console.log("Retry operation:", id)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SyncStatusDashboard
              syncStatus={syncStatus}
              operations={operations}
              errors={errors}
              onRetrySync={simulateSync}
              onRetryOperation={(id) => console.log("Retry operation:", id)}
              onDismissError={(index) => setErrors(prev => prev.filter((_, i) => i !== index))}
            />
            
            <ProfileSyncStatus
              syncStatus={syncStatus}
              profileData={profileData}
              errors={errors}
              onRefreshProfile={simulateSync}
              onRefreshNFTs={simulateSync}
              onRefreshStats={simulateSync}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}