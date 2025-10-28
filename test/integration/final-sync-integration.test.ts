/**
 * Final Sync Integration Test Suite
 * 
 * Comprehensive end-to-end testing of all sync components integrated into the main application flow.
 * This test validates the complete wallet-profile synchronization system under various conditions.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { ConcreteWalletProfileSyncManager } from '@/lib/services/wallet-profile-sync-manager';
import { SyncEventBus } from '@/lib/services/sync-event-bus';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { 
  SyncEventType, 
  SyncStatus, 
  ProfileData, 
  WalletType,
  SyncResult,
  NFTSyncResult 
} from '@/lib/types/sync';
import React from 'react';

// Mock external dependencies
const mockNFTOwnershipService = {
  getOwnership: vi.fn(),
  getEligibleMoments: vi.fn(),
  verifyNFTOwnership: vi.fn(),
};

const mockNetworkResilienceManager = {
  executeWithRetry: vi.fn(),
  isOnline: vi.fn(() => true),
  getConnectionQuality: vi.fn(() => 'good'),
  queueOfflineOperation: vi.fn(),
  processOfflineQueue: vi.fn(),
};

const mockFindLabsAPI = {
  getNFTCollection: vi.fn(),
  getPlayerStats: vi.fn(),
};

// Mock FCL with realistic behavior
const mockFCL = {
  authenticate: vi.fn(),
  unauthenticate: vi.fn(),
  currentUser: {
    subscribe: vi.fn(),
    snapshot: vi.fn(),
  },
};

// Test data
const TEST_WALLET_ADDRESS = '0x1234567890abcdef';
const MOCK_NFT_COLLECTION = [
  {
    id: 'nba_moment_1',
    sport: 'NBA',
    playerName: 'LeBron James',
    team: 'Lakers',
    momentId: 'lebron_dunk_2023',
    imageUrl: '/nba-moment-1.jpg',
    eligible: true
  },
  {
    id: 'nfl_moment_1', 
    sport: 'NFL',
    playerName: 'Tom Brady',
    team: 'Buccaneers',
    momentId: 'brady_touchdown_2023',
    imageUrl: '/nfl-moment-1.jpg',
    eligible: true
  }
];

const MOCK_PROFILE_DATA: ProfileData = {
  address: TEST_WALLET_ADDRESS,
  username: TEST_WALLET_ADDRESS,
  walletType: WalletType.DAPPER,
  collections: ['NBA Top Shot', 'NFL All Day'],
  stats: {
    totalNFTs: 2,
    eligibleMoments: 2,
    weeklyScore: 150,
    seasonRank: 42,
    wins: 5,
    losses: 2,
    totalPoints: 1250
  },
  achievements: [
    { id: 'first_win', name: 'First Victory', description: 'Won your first game' }
  ],
  lastUpdated: new Date()
};

// Comprehensive test component that exercises all sync functionality
const ComprehensiveSyncTestComponent: React.FC = () => {
  const {
    user,
    isAuthenticated,
    syncStatus,
    profileData,
    nftCollection,
    forceSyncProfile,
    refreshNFTCollection,
    onSyncStatusChange,
    onProfileDataChange,
    login,
    logout
  } = useAuth();

  const [syncEvents, setSyncEvents] = React.useState<string[]>([]);
  const [profileUpdateCount, setProfileUpdateCount] = React.useState(0);
  const [lastSyncError, setLastSyncError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribeSync = onSyncStatusChange((status) => {
      setSyncEvents(prev => [...prev, `${status.isActive ? 'start' : 'end'}_${status.currentOperation || 'unknown'}`]);
      if (status.failureCount > 0) {
        setLastSyncError('Sync failed');
      }
    });

    const unsubscribeProfile = onProfileDataChange((data) => {
      setProfileUpdateCount(prev => prev + 1);
      if (data) {
        setLastSyncError(null);
      }
    });

    return () => {
      unsubscribeSync();
      unsubscribeProfile();
    };
  }, [onSyncStatusChange, onProfileDataChange]);

  return React.createElement('div', { 'data-testid': 'sync-test-component' },
    React.createElement('div', { 'data-testid': 'auth-status' }, isAuthenticated ? 'authenticated' : 'not-authenticated'),
    React.createElement('div', { 'data-testid': 'wallet-address' }, user.addr || 'no-address'),
    React.createElement('div', { 'data-testid': 'wallet-logged-in' }, user.loggedIn ? 'logged-in' : 'logged-out'),
    React.createElement('div', { 'data-testid': 'sync-active' }, syncStatus.isActive ? 'active' : 'inactive'),
    React.createElement('div', { 'data-testid': 'sync-operation' }, syncStatus.currentOperation || 'none'),
    React.createElement('div', { 'data-testid': 'sync-last-time' }, syncStatus.lastSync?.toISOString() || 'never'),
    React.createElement('div', { 'data-testid': 'sync-failure-count' }, syncStatus.failureCount),
    React.createElement('div', { 'data-testid': 'profile-exists' }, profileData ? 'exists' : 'none'),
    React.createElement('div', { 'data-testid': 'profile-address' }, profileData?.address || 'no-address'),
    React.createElement('div', { 'data-testid': 'profile-wallet-type' }, profileData?.walletType || 'unknown'),
    React.createElement('div', { 'data-testid': 'profile-collections' }, profileData?.collections.join(',') || 'none'),
    React.createElement('div', { 'data-testid': 'profile-nft-count' }, profileData?.stats.totalNFTs || 0),
    React.createElement('div', { 'data-testid': 'nft-collection-count' }, nftCollection.length),
    React.createElement('div', { 'data-testid': 'nft-collection-data' }, JSON.stringify(nftCollection)),
    React.createElement('div', { 'data-testid': 'sync-events' }, syncEvents.join('|')),
    React.createElement('div', { 'data-testid': 'profile-update-count' }, profileUpdateCount),
    React.createElement('div', { 'data-testid': 'last-sync-error' }, lastSyncError || 'none'),
    React.createElement('button', { 'data-testid': 'login-button', onClick: login }, 'Login'),
    React.createElement('button', { 'data-testid': 'logout-button', onClick: logout }, 'Logout'),
    React.createElement('button', { 'data-testid': 'force-sync-button', onClick: forceSyncProfile }, 'Force Sync'),
    React.createElement('button', { 'data-testid': 'refresh-nfts-button', onClick: refreshNFTCollection }, 'Refresh NFTs')
  );
};

describe('Final Sync Integration Tests', () => {
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;

  beforeAll(() => {
    // Suppress console errors/warnings during tests unless they're test failures
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockNFTOwnershipService.getOwnership.mockResolvedValue({
      success: true,
      data: {
        address: TEST_WALLET_ADDRESS,
        moments: MOCK_NFT_COLLECTION,
        collections: [
          { collectionName: 'NBA Top Shot', sport: 'NBA' },
          { collectionName: 'NFL All Day', sport: 'NFL' }
        ],
        totalCount: MOCK_NFT_COLLECTION.length,
        lastVerified: new Date(),
        isEligible: true
      }
    });

    mockNFTOwnershipService.getEligibleMoments.mockResolvedValue({
      success: true,
      data: MOCK_NFT_COLLECTION.filter(nft => nft.eligible)
    });

    mockNetworkResilienceManager.executeWithRetry.mockImplementation(
      async (operation: () => Promise<any>) => operation()
    );

    mockFindLabsAPI.getNFTCollection.mockResolvedValue({
      success: true,
      data: MOCK_NFT_COLLECTION
    });

    // Setup FCL mocks
    mockFCL.currentUser.subscribe.mockImplementation((callback) => {
      setTimeout(() => callback({ addr: null, loggedIn: false, services: [] }), 0);
      return vi.fn();
    });

    mockFCL.currentUser.snapshot.mockResolvedValue({
      addr: null,
      loggedIn: false,
      services: []
    });

    // Mock global dependencies
    vi.stubGlobal('fcl', mockFCL);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe('Complete Wallet Connection Flow', () => {
    it('should handle complete wallet connection and sync flow', async () => {
      let currentCallback: any;
      
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        currentCallback = callback;
        // Start with disconnected state
        setTimeout(() => callback({ addr: null, loggedIn: false, services: [] }), 0);
        return vi.fn();
      });

      const { rerender } = render(
        <AuthProvider>
          <ComprehensiveSyncTestComponent />
        </AuthProvider>
      );

      // Verify initial disconnected state
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('wallet-logged-in')).toHaveTextContent('logged-out');
        expect(screen.getByTestId('sync-active')).toHaveTextContent('inactive');
      });

      // Simulate successful wallet connection
      act(() => {
        mockFCL.authenticate.mockResolvedValue(undefined);
        currentCallback({
          addr: TEST_WALLET_ADDRESS,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        });
      });

      // Verify authentication state changes
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('wallet-address')).toHaveTextContent(TEST_WALLET_ADDRESS);
        expect(screen.getByTestId('wallet-logged-in')).toHaveTextContent('logged-in');
      });

      // Verify sync was automatically triggered
      await waitFor(() => {
        expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalledWith(TEST_WALLET_ADDRESS, false);
      });

      // Verify profile data was populated
      await waitFor(() => {
        expect(screen.getByTestId('profile-exists')).toHaveTextContent('exists');
        expect(screen.getByTestId('profile-address')).toHaveTextContent(TEST_WALLET_ADDRESS);
        expect(screen.getByTestId('profile-nft-count')).toHaveTextContent('2');
      });

      // Verify sync events were recorded
      await waitFor(() => {
        const syncEvents = screen.getByTestId('sync-events').textContent;
        expect(syncEvents).toContain('start');
        expect(syncEvents).toContain('end');
      });
    });

    it('should handle wallet disconnection and cleanup', async () => {
      let currentCallback: any;
      
      // Start with connected state
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        currentCallback = callback;
        setTimeout(() => callback({
          addr: TEST_WALLET_ADDRESS,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        }), 0);
        return vi.fn();
      });

      render(
        <AuthProvider>
          <ComprehensiveSyncTestComponent />
        </AuthProvider>
      );

      // Wait for initial connection and sync
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('profile-exists')).toHaveTextContent('exists');
      });

      // Simulate wallet disconnection
      act(() => {
        mockFCL.unauthenticate.mockResolvedValue(undefined);
        currentCallback({
          addr: null,
          loggedIn: false,
          services: []
        });
      });

      // Verify complete cleanup
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('wallet-address')).toHaveTextContent('no-address');
        expect(screen.getByTestId('profile-exists')).toHaveTextContent('none');
        expect(screen.getByTestId('nft-collection-count')).toHaveTextContent('0');
        expect(screen.getByTestId('sync-active')).toHaveTextContent('inactive');
      });
    });
  });

  describe('Manual Sync Operations', () => {
    it('should handle manual profile sync operations', async () => {
      // Setup connected state
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback({
          addr: TEST_WALLET_ADDRESS,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        }), 0);
        return vi.fn();
      });

      render(
        <AuthProvider>
          <ComprehensiveSyncTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Clear previous calls
      mockNFTOwnershipService.getOwnership.mockClear();

      // Trigger manual sync
      fireEvent.click(screen.getByTestId('force-sync-button'));

      // Verify sync status changes
      await waitFor(() => {
        expect(screen.getByTestId('sync-active')).toHaveTextContent('active');
      });

      // Verify sync completes
      await waitFor(() => {
        expect(screen.getByTestId('sync-active')).toHaveTextContent('inactive');
        expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalledWith(TEST_WALLET_ADDRESS, true);
      }, { timeout: 10000 });

      // Verify profile update count increased
      await waitFor(() => {
        const updateCount = parseInt(screen.getByTestId('profile-update-count').textContent || '0');
        expect(updateCount).toBeGreaterThan(0);
      });
    });

    it('should handle manual NFT collection refresh', async () => {
      // Setup connected state
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback({
          addr: TEST_WALLET_ADDRESS,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        }), 0);
        return vi.fn();
      });

      render(
        <AuthProvider>
          <ComprehensiveSyncTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Clear previous calls
      mockNFTOwnershipService.getOwnership.mockClear();

      // Trigger NFT refresh
      fireEvent.click(screen.getByTestId('refresh-nfts-button'));

      // Verify NFT service was called
      await waitFor(() => {
        expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalledWith(TEST_WALLET_ADDRESS);
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle sync errors gracefully', async () => {
      // Mock sync failure
      mockNFTOwnershipService.getOwnership.mockRejectedValueOnce(
        new Error('Network timeout')
      );

      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback({
          addr: TEST_WALLET_ADDRESS,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        }), 0);
        return vi.fn();
      });

      render(
        <AuthProvider>
          <ComprehensiveSyncTestComponent />
        </AuthProvider>
      );

      // Wait for connection attempt and error
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Should handle error gracefully
      await waitFor(() => {
        const failureCount = parseInt(screen.getByTestId('sync-failure-count').textContent || '0');
        expect(failureCount).toBeGreaterThan(0);
      }, { timeout: 10000 });

      // System should remain functional
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('wallet-address')).toHaveTextContent(TEST_WALLET_ADDRESS);
    });

    it('should retry failed operations with network resilience', async () => {
      let attempts = 0;
      mockNetworkResilienceManager.executeWithRetry.mockImplementation(
        async (operation: () => Promise<any>) => {
          attempts++;
          if (attempts === 1) {
            throw new Error('Network error');
          }
          return await operation();
        }
      );

      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback({
          addr: TEST_WALLET_ADDRESS,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        }), 0);
        return vi.fn();
      });

      render(
        <AuthProvider>
          <ComprehensiveSyncTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Should have retried and succeeded
      await waitFor(() => {
        expect(attempts).toBeGreaterThanOrEqual(2);
        expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalled();
      }, { timeout: 10000 });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent sync operations', async () => {
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback({
          addr: TEST_WALLET_ADDRESS,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        }), 0);
        return vi.fn();
      });

      render(
        <AuthProvider>
          <ComprehensiveSyncTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Clear previous calls
      mockNFTOwnershipService.getOwnership.mockClear();

      // Trigger multiple operations simultaneously
      fireEvent.click(screen.getByTestId('force-sync-button'));
      fireEvent.click(screen.getByTestId('refresh-nfts-button'));

      // Should handle gracefully without conflicts
      await waitFor(() => {
        expect(screen.getByTestId('sync-active')).toHaveTextContent('inactive');
      }, { timeout: 15000 });

      // Verify operations completed
      expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalled();
    });
  });

  describe('Performance Validation', () => {
    it('should complete sync operations within acceptable timeframes', async () => {
      const startTime = Date.now();

      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback({
          addr: TEST_WALLET_ADDRESS,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        }), 0);
        return vi.fn();
      });

      render(
        <AuthProvider>
          <ComprehensiveSyncTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('profile-exists')).toHaveTextContent('exists');
      });

      const endTime = Date.now();
      const syncDuration = endTime - startTime;

      // Sync should complete within 5 seconds
      expect(syncDuration).toBeLessThan(5000);
    });

    it('should maintain UI responsiveness during sync operations', async () => {
      // Add delay to sync operations
      mockNFTOwnershipService.getOwnership.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          success: true,
          data: {
            address: TEST_WALLET_ADDRESS,
            moments: MOCK_NFT_COLLECTION,
            collections: [{ collectionName: 'NBA Top Shot', sport: 'NBA' }],
            totalCount: MOCK_NFT_COLLECTION.length,
            lastVerified: new Date(),
            isEligible: true
          }
        };
      });

      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback({
          addr: TEST_WALLET_ADDRESS,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        }), 0);
        return vi.fn();
      });

      render(
        <AuthProvider>
          <ComprehensiveSyncTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Trigger sync
      fireEvent.click(screen.getByTestId('force-sync-button'));

      // UI should remain responsive - buttons should still be clickable
      expect(screen.getByTestId('force-sync-button')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-nfts-button')).toBeInTheDocument();
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();

      // Wait for sync completion
      await waitFor(() => {
        expect(screen.getByTestId('sync-active')).toHaveTextContent('inactive');
      }, { timeout: 10000 });
    });
  });

  describe('Data Consistency Validation', () => {
    it('should maintain data consistency across all components', async () => {
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback({
          addr: TEST_WALLET_ADDRESS,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        }), 0);
        return vi.fn();
      });

      render(
        <AuthProvider>
          <ComprehensiveSyncTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('profile-exists')).toHaveTextContent('exists');
      });

      // Verify all data is consistent
      expect(screen.getByTestId('wallet-address')).toHaveTextContent(TEST_WALLET_ADDRESS);
      expect(screen.getByTestId('profile-address')).toHaveTextContent(TEST_WALLET_ADDRESS);
      expect(screen.getByTestId('profile-nft-count')).toHaveTextContent('2');
      expect(screen.getByTestId('nft-collection-count')).toHaveTextContent('0'); // NFT collection in auth context starts empty
      expect(screen.getByTestId('profile-collections')).toContain('NBA Top Shot');
    });

    it('should update all related data when NFT collection changes', async () => {
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback({
          addr: TEST_WALLET_ADDRESS,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        }), 0);
        return vi.fn();
      });

      render(
        <AuthProvider>
          <ComprehensiveSyncTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Update mock to return different NFT collection
      const updatedCollection = [
        ...MOCK_NFT_COLLECTION,
        {
          id: 'nba_moment_2',
          sport: 'NBA',
          playerName: 'Stephen Curry',
          team: 'Warriors',
          momentId: 'curry_three_2023',
          imageUrl: '/nba-moment-2.jpg',
          eligible: true
        }
      ];

      mockNFTOwnershipService.getOwnership.mockResolvedValue({
        success: true,
        data: {
          address: TEST_WALLET_ADDRESS,
          moments: updatedCollection,
          collections: [
            { collectionName: 'NBA Top Shot', sport: 'NBA' },
            { collectionName: 'NFL All Day', sport: 'NFL' }
          ],
          totalCount: updatedCollection.length,
          lastVerified: new Date(),
          isEligible: true
        }
      });

      // Trigger sync
      fireEvent.click(screen.getByTestId('force-sync-button'));

      // Wait for sync completion and verify updated data
      await waitFor(() => {
        expect(screen.getByTestId('sync-active')).toHaveTextContent('inactive');
      }, { timeout: 10000 });

      // Profile should reflect updated NFT count
      await waitFor(() => {
        expect(screen.getByTestId('profile-nft-count')).toHaveTextContent('3');
      });
    });
  });
});