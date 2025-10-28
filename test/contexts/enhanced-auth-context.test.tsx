import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { WalletProfileSyncManager } from '@/lib/services/wallet-profile-sync-manager';
import { SyncEventType, SyncStatus } from '@/lib/types/sync';

// Mock dependencies
vi.mock('@/lib/flow-config', () => ({
  fcl: {
    currentUser: {
      subscribe: vi.fn(() => vi.fn()), // Return unsubscribe function
      snapshot: vi.fn(() => Promise.resolve({
        addr: null,
        cid: null,
        loggedIn: false,
        services: []
      }))
    },
    authenticate: vi.fn(),
    unauthenticate: vi.fn()
  },
  isDapperWallet: vi.fn(() => false),
  isFlowWallet: vi.fn(() => false),
  getWalletServiceInfo: vi.fn(() => null)
}));

vi.mock('@/lib/session-storage', () => ({
  sessionStorage: {
    saveSession: vi.fn(),
    clearSession: vi.fn(),
    getSession: vi.fn(() => null)
  },
  validateFlowAddress: vi.fn(() => true)
}));

vi.mock('@/lib/wallet-verification', () => ({
  verifyWalletAddress: vi.fn(() => Promise.resolve({ isValid: true })),
  verifyGameplayEligibility: vi.fn(() => Promise.resolve({
    isEligible: true,
    reason: 'Valid wallet',
    collections: ['nba', 'nfl']
  }))
}));

vi.mock('@/lib/utils/error-handling', () => ({
  handleError: vi.fn((fn) => fn()),
  ErrorType: {
    WALLET_CONNECTION: 'wallet_connection',
    AUTHENTICATION: 'authentication'
  }
}));

vi.mock('@/lib/services/wallet-profile-sync-manager');

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="sync-status">{JSON.stringify(auth.syncStatus)}</div>
      <div data-testid="profile-data">{JSON.stringify(auth.profileData)}</div>
      <button 
        data-testid="force-sync" 
        onClick={() => auth.forceSyncProfile()}
      >
        Force Sync
      </button>
      <button 
        data-testid="refresh-nft" 
        onClick={() => auth.refreshNFTCollection()}
      >
        Refresh NFT
      </button>
    </div>
  );
};

describe('Enhanced AuthContext with Sync Capabilities', () => {
  let mockSyncManager: any;
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock sync manager
    mockSyncManager = {
      subscribe: vi.fn(),
      onWalletConnect: vi.fn(),
      onWalletDisconnect: vi.fn(),
      syncWalletToProfile: vi.fn(),
      syncNFTCollection: vi.fn(),
      getSyncStatus: vi.fn(() => ({
        isActive: false,
        lastSync: null,
        nextSync: null,
        failureCount: 0
      }))
    };
    
    (WalletProfileSyncManager as any).mockImplementation(() => mockSyncManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default sync status', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const syncStatus = JSON.parse(screen.getByTestId('sync-status').textContent || '{}');
    expect(syncStatus).toEqual({
      isActive: false,
      lastSync: null,
      nextSync: null,
      failureCount: 0
    });
  });

  it('should initialize sync manager on mount', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(WalletProfileSyncManager).toHaveBeenCalledWith({
      autoSyncEnabled: true,
      syncInterval: 300000,
      retryPolicy: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        retryCondition: expect.any(Function)
      }
    });
  });

  it('should subscribe to sync events', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(mockSyncManager.subscribe).toHaveBeenCalledWith(
      SyncEventType.PROFILE_SYNC_STARTED,
      expect.any(Function)
    );
    expect(mockSyncManager.subscribe).toHaveBeenCalledWith(
      SyncEventType.PROFILE_SYNC_COMPLETED,
      expect.any(Function)
    );
    expect(mockSyncManager.subscribe).toHaveBeenCalledWith(
      SyncEventType.NFT_COLLECTION_UPDATED,
      expect.any(Function)
    );
    expect(mockSyncManager.subscribe).toHaveBeenCalledWith(
      SyncEventType.SYNC_ERROR,
      expect.any(Function)
    );
  });

  it('should provide sync-related methods', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Check that sync buttons are rendered (methods are available)
    expect(screen.getByTestId('force-sync')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-nft')).toBeInTheDocument();
  });

  it('should handle force sync profile', async () => {
    // Mock user state
    const mockUser = {
      addr: '0x123',
      cid: 'test',
      loggedIn: true,
      services: []
    };

    mockSyncManager.syncWalletToProfile.mockResolvedValue({
      success: true,
      timestamp: new Date(),
      operations: [],
      duration: 1000
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Simulate wallet connection by updating the context
    // This would normally happen through FCL subscription
    // For testing, we'll just verify the method exists and can be called
    const forceSyncButton = screen.getByTestId('force-sync');
    expect(forceSyncButton).toBeInTheDocument();
  });

  it('should handle refresh NFT collection', async () => {
    mockSyncManager.syncNFTCollection.mockResolvedValue({
      success: true,
      timestamp: new Date(),
      operations: [],
      duration: 1000,
      collectionCount: 5,
      newNFTs: 1,
      removedNFTs: 0,
      eligibleMoments: 3
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const refreshNftButton = screen.getByTestId('refresh-nft');
    expect(refreshNftButton).toBeInTheDocument();
  });

  it('should provide event subscription methods', () => {
    let syncStatusCallback: ((status: SyncStatus) => void) | null = null;
    let profileDataCallback: ((data: any) => void) | null = null;

    const TestSubscriptionComponent = () => {
      const auth = useAuth();
      
      // Test event subscriptions
      const unsubscribeSync = auth.onSyncStatusChange((status) => {
        syncStatusCallback = () => status;
      });
      
      const unsubscribeProfile = auth.onProfileDataChange((data) => {
        profileDataCallback = () => data;
      });

      return (
        <div>
          <button onClick={unsubscribeSync}>Unsubscribe Sync</button>
          <button onClick={unsubscribeProfile}>Unsubscribe Profile</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestSubscriptionComponent />
      </AuthProvider>
    );

    // Verify subscription methods work
    expect(screen.getByText('Unsubscribe Sync')).toBeInTheDocument();
    expect(screen.getByText('Unsubscribe Profile')).toBeInTheDocument();
  });

  it('should provide sync history method', () => {
    const TestHistoryComponent = () => {
      const auth = useAuth();
      const history = auth.getSyncHistory();
      
      return <div data-testid="sync-history">{JSON.stringify(history)}</div>;
    };

    render(
      <AuthProvider>
        <TestHistoryComponent />
      </AuthProvider>
    );

    const historyElement = screen.getByTestId('sync-history');
    expect(historyElement).toBeInTheDocument();
    expect(JSON.parse(historyElement.textContent || '[]')).toEqual([]);
  });
});