# Auth Context Sync Enhancement

This document describes the enhancements made to the AuthContext to support wallet-profile synchronization capabilities.

## Overview

The enhanced AuthContext now includes comprehensive sync capabilities that ensure wallet connection state, NFT collection data, and profile information remain synchronized across the application.

## New Features

### 1. Sync Status Management

The auth context now tracks synchronization status in real-time:

```typescript
interface SyncStatus {
  isActive: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  failureCount: number;
  currentOperation?: string;
}
```

### 2. Profile Data State

Enhanced profile data management with sync metadata:

```typescript
interface ProfileData {
  address: string;
  username: string;
  walletType: WalletType;
  collections: string[];
  stats: ProfileStats;
  achievements: Achievement[];
  lastUpdated: Date;
}
```

### 3. Sync Methods

New methods for manual synchronization control:

- `forceSyncProfile()`: Force a complete profile synchronization
- `refreshNFTCollection()`: Refresh NFT collection data
- `getSyncHistory()`: Get sync operation history

### 4. Event Subscriptions

Real-time event subscriptions for sync status changes:

- `onSyncStatusChange(callback)`: Subscribe to sync status updates
- `onProfileDataChange(callback)`: Subscribe to profile data changes

## Usage Examples

### Basic Sync Status Display

```tsx
import { useAuth } from '@/contexts/auth-context';

const SyncIndicator = () => {
  const { syncStatus, profileData } = useAuth();
  
  return (
    <div>
      <span>Status: {syncStatus.isActive ? 'Syncing...' : 'Ready'}</span>
      {profileData && (
        <span>NFTs: {profileData.stats.totalNFTs}</span>
      )}
    </div>
  );
};
```

### Manual Sync Operations

```tsx
import { useAuth } from '@/contexts/auth-context';

const SyncControls = () => {
  const { forceSyncProfile, refreshNFTCollection, syncStatus } = useAuth();
  
  const handleSync = async () => {
    try {
      await forceSyncProfile();
      console.log('Profile synced successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };
  
  return (
    <button 
      onClick={handleSync}
      disabled={syncStatus.isActive}
    >
      Force Sync Profile
    </button>
  );
};
```

### Event Subscriptions

```tsx
import { useAuth } from '@/contexts/auth-context';
import { useEffect } from 'react';

const SyncEventListener = () => {
  const { onSyncStatusChange, onProfileDataChange } = useAuth();
  
  useEffect(() => {
    const unsubscribeSync = onSyncStatusChange((status) => {
      console.log('Sync status changed:', status);
    });
    
    const unsubscribeProfile = onProfileDataChange((data) => {
      console.log('Profile data updated:', data);
    });
    
    return () => {
      unsubscribeSync();
      unsubscribeProfile();
    };
  }, [onSyncStatusChange, onProfileDataChange]);
  
  return <div>Listening for sync events...</div>;
};
```

## Integration with Sync Manager

The auth context automatically initializes and manages a `WalletProfileSyncManager` instance:

1. **Initialization**: Sync manager is created when the auth context mounts
2. **Wallet Events**: Automatically triggers sync on wallet connect/disconnect
3. **Event Handling**: Subscribes to sync events and updates context state
4. **Cleanup**: Properly cleans up sync manager on unmount

## Automatic Sync Triggers

The enhanced auth context automatically triggers synchronization in these scenarios:

1. **Wallet Connection**: Immediate sync when wallet connects
2. **Wallet Disconnection**: Cleanup and state reset
3. **NFT Collection Changes**: Automatic refresh of eligibility status
4. **Periodic Sync**: Background sync at configurable intervals

## Error Handling

The sync system includes comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Authentication Errors**: Graceful fallback to cached data
- **API Errors**: User-friendly error messages with retry options
- **Timeout Errors**: Progressive timeout increases

## Performance Considerations

- **Lazy Initialization**: Sync manager is only created when needed
- **Event Debouncing**: Multiple rapid sync requests are debounced
- **Cache Integration**: Intelligent caching reduces redundant API calls
- **Background Processing**: Non-blocking sync operations

## Testing

The enhanced auth context includes comprehensive test coverage:

- Unit tests for all sync methods
- Integration tests for wallet connection flows
- Mock implementations for testing environments
- Performance tests for sync operations

## Migration Guide

For existing components using the auth context:

1. **No Breaking Changes**: All existing functionality remains unchanged
2. **Optional Features**: New sync features are opt-in
3. **Gradual Adoption**: Components can gradually adopt sync features
4. **Backward Compatibility**: Existing code continues to work

## Configuration

Sync behavior can be configured through the sync manager:

```typescript
// Default configuration
{
  autoSyncEnabled: true,
  syncInterval: 300000, // 5 minutes
  retryPolicy: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  }
}
```

## Requirements Satisfied

This enhancement satisfies the following requirements from the wallet-profile-sync spec:

- **1.1**: Automatic wallet-profile synchronization
- **1.2**: Real-time sync status updates
- **1.5**: Sync event subscriptions
- **3.1**: Profile data consistency
- **3.5**: Sync manager integration

## Next Steps

1. Update existing components to use sync status indicators
2. Implement sync controls in profile and wallet components
3. Add sync monitoring to admin dashboard
4. Configure production sync intervals and retry policies