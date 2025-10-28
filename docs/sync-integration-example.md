# Sync Integration Example

This document provides a complete example of integrating the wallet-profile sync documentation and UI components into a ShotCaller application.

## Complete Integration Example

### 1. App Root with Onboarding

```typescript
// app/layout.tsx
import { SyncOnboardingFlow, useSyncOnboarding } from '@/components/sync-ui';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { 
    showOnboarding, 
    setShowOnboarding,
    completeOnboarding 
  } = useSyncOnboarding();

  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          
          {/* Onboarding flow for new users */}
          <SyncOnboardingFlow
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            onComplete={completeOnboarding}
            autoStart={false}
          />
        </Providers>
      </body>
    </html>
  );
}
```

### 2. Navigation with Sync Status

```typescript
// components/navigation.tsx
import { 
  SyncStatusIndicator, 
  SyncHelpDialog,
  SyncOfflineIndicator 
} from '@/components/sync-ui';
import { useAuth } from '@/contexts/auth-context';
import { useNetworkStatus } from '@/hooks/use-network-status';

export function Navigation() {
  const { user, syncStatus, isAuthenticated } = useAuth();
  const { isOnline } = useNetworkStatus();

  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Logo />
        
        {/* Show sync status when authenticated */}
        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <SyncStatusIndicator 
              status={syncStatus?.status || 'offline'} 
              showText={false}
            />
            
            {/* Show offline indicator when needed */}
            {!isOnline && <SyncOfflineIndicator />}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {/* Help dialog always available */}
        <SyncHelpDialog 
          defaultTab={isAuthenticated ? "overview" : "support"}
        />
        
        {isAuthenticated ? (
          <UserMenu user={user} />
        ) : (
          <WalletConnector />
        )}
      </div>
    </nav>
  );
}
```

### 3. Profile Page with Full Sync Integration

```typescript
// app/profile/page.tsx
import { 
  SyncRefreshButton, 
  SyncErrorBadge,
  SyncHelpTooltip,
  SyncStatusIndicator
} from '@/components/sync-ui';
import { useAuth } from '@/contexts/auth-context';
import { useManualSync } from '@/hooks/use-manual-sync';

export default function ProfilePage() {
  const { 
    user, 
    profileData, 
    syncStatus, 
    nftCollection 
  } = useAuth();
  
  const { forceSync, isLoading } = useManualSync();

  if (!user) {
    return <div>Please connect your wallet</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with sync controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Profile</h1>
          <SyncHelpTooltip type="info" />
        </div>
        
        <div className="flex items-center gap-3">
          <SyncStatusIndicator 
            status={syncStatus?.status || 'offline'}
            showText={true}
          />
          
          <SyncRefreshButton
            onClick={forceSync}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Sync error display */}
      {syncStatus?.status === 'error' && (
        <SyncErrorBadge
          error={syncStatus.error || 'Sync failed'}
          onRetry={forceSync}
        />
      )}

      {/* Sync status information */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Sync Status</h3>
            <p className="text-sm text-muted-foreground">
              Last updated: {syncStatus?.lastSync ? 
                new Date(syncStatus.lastSync).toLocaleString() : 
                'Never'
              }
            </p>
          </div>
          
          <SyncHelpTooltip type="status" status={syncStatus?.status}>
            <div className="text-right">
              <div className="font-medium capitalize">
                {syncStatus?.status || 'Unknown'}
              </div>
              {syncStatus?.nextSync && (
                <div className="text-xs text-muted-foreground">
                  Next sync: {new Date(syncStatus.nextSync).toLocaleTimeString()}
                </div>
              )}
            </div>
          </SyncHelpTooltip>
        </div>
      </div>

      {/* Profile content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Wallet information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Wallet Information</h2>
          
          <div className="bg-card rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address:</span>
              <span className="font-mono text-sm">{user.address}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wallet Type:</span>
              <span>{profileData?.walletType || 'Unknown'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connected:</span>
              <span className="text-green-600">Yes</span>
            </div>
          </div>
        </div>

        {/* NFT Collection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">NFT Collection</h2>
            <SyncHelpTooltip type="info" message="Your NFT collection is automatically synced from your wallet" />
          </div>
          
          <div className="bg-card rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total NFTs:</span>
              <span>{nftCollection?.items?.length || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Eligible for Play:</span>
              <span>{profileData?.stats?.eligibleMoments || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collections:</span>
              <span>{profileData?.collections?.join(', ') || 'None'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Grid */}
      {nftCollection?.items && nftCollection.items.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Moments</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {nftCollection.items.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            No NFTs found in your collection
          </div>
          <SyncRefreshButton
            onClick={forceSync}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
```

### 4. Wallet Connector with Sync Integration

```typescript
// components/wallet-connector.tsx
import { useState } from 'react';
import { SyncHelpTooltip, useSyncOnboarding } from '@/components/sync-ui';
import { useAuth } from '@/contexts/auth-context';

export function WalletConnector() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { connectWallet } = useAuth();
  const { setShowOnboarding } = useSyncOnboarding();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      // Show onboarding for first-time users
      setShowOnboarding(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <SyncHelpTooltip 
        type="info" 
        message="Connecting your wallet will automatically sync your NFT collection"
      >
        <Button 
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </SyncHelpTooltip>
    </div>
  );
}
```

### 5. Error Boundary with Sync Context

```typescript
// components/sync-error-boundary.tsx
import { Component, ReactNode } from 'react';
import { SyncHelpDialog, SyncErrorBadge } from '@/components/sync-ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Sync error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Sync Error</h2>
              <p className="text-muted-foreground">
                Something went wrong with the sync system
              </p>
            </div>
            
            <SyncErrorBadge
              error={this.state.error?.message || 'Unknown error'}
              onRetry={() => window.location.reload()}
            />
            
            <div className="flex justify-center">
              <SyncHelpDialog defaultTab="troubleshooting" />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 6. Custom Hooks Integration

```typescript
// hooks/use-sync-integration.ts
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useSyncOnboarding } from '@/components/sync-ui';
import { toast } from '@/components/ui/use-toast';

export function useSyncIntegration() {
  const { syncStatus, isAuthenticated } = useAuth();
  const { hasSeenOnboarding, setShowOnboarding } = useSyncOnboarding();

  // Show onboarding for new authenticated users
  useEffect(() => {
    if (isAuthenticated && !hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, hasSeenOnboarding, setShowOnboarding]);

  // Show toast notifications for sync events
  useEffect(() => {
    if (!syncStatus) return;

    switch (syncStatus.status) {
      case 'completed':
        toast({
          title: 'Sync Complete',
          description: 'Your profile has been updated with the latest data',
        });
        break;
      
      case 'error':
        toast({
          title: 'Sync Failed',
          description: 'Unable to sync your profile. Please try again.',
          variant: 'destructive',
        });
        break;
    }
  }, [syncStatus?.status]);

  return {
    syncStatus,
    isAuthenticated
  };
}
```

## Usage in Different Contexts

### Dashboard Integration

```typescript
// app/dashboard/page.tsx
import { SyncStatusIndicator, SyncHelpTooltip } from '@/components/sync-ui';

export default function Dashboard() {
  const { syncStatus } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Dashboard</h1>
        <div className="flex items-center gap-2">
          <SyncHelpTooltip type="info" />
          <SyncStatusIndicator status={syncStatus?.status} />
        </div>
      </div>
      
      {/* Dashboard content */}
    </div>
  );
}
```

### Mobile Responsive Integration

```typescript
// components/mobile-sync-status.tsx
import { SyncStatusIndicator, SyncHelpDialog } from '@/components/sync-ui';
import { useAuth } from '@/contexts/auth-context';
import { useMobile } from '@/hooks/use-mobile';

export function MobileSyncStatus() {
  const { syncStatus } = useAuth();
  const isMobile = useMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-background border rounded-lg p-2 shadow-lg">
      <SyncStatusIndicator status={syncStatus?.status} />
      <SyncHelpDialog 
        trigger={
          <Button variant="ghost" size="sm">
            <HelpCircle className="h-4 w-4" />
          </Button>
        }
      />
    </div>
  );
}
```

## Testing Integration

```typescript
// __tests__/sync-integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyncIntegrationExample } from '../sync-integration-example';

// Mock the auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    syncStatus: { status: 'synced', lastSync: new Date() },
    isAuthenticated: true,
    forceSync: jest.fn()
  })
}));

describe('Sync Integration', () => {
  test('displays sync status in navigation', () => {
    render(<SyncIntegrationExample />);
    
    expect(screen.getByRole('button', { name: /sync status/i })).toBeInTheDocument();
  });

  test('shows help dialog when clicked', async () => {
    render(<SyncIntegrationExample />);
    
    fireEvent.click(screen.getByText('Sync Help'));
    
    await waitFor(() => {
      expect(screen.getByText('Wallet-Profile Sync Help')).toBeInTheDocument();
    });
  });

  test('triggers manual sync from profile page', async () => {
    const mockForceSync = jest.fn();
    
    render(<SyncIntegrationExample forceSync={mockForceSync} />);
    
    fireEvent.click(screen.getByText('Refresh'));
    
    expect(mockForceSync).toHaveBeenCalled();
  });
});
```

This integration example demonstrates how to use all the sync documentation and UI components together to create a cohesive user experience for wallet-profile synchronization in ShotCaller.