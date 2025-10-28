/**
 * Complete Sync System Integration Tests
 * 
 * Tests the integration between all sync components including:
 * - Sync Manager
 * - Auth Context
 * - Event Bus
 * - Network Resilience
 * - UI Components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ConcreteWalletProfileSyncManager } from '@/lib/services/wallet-profile-sync-manager';
import { SyncEventBus } from '@/lib/services/sync-event-bus';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { SyncEventType, SyncStatus, ProfileData } from '@/lib/types/sync';
import React from 'react';

// Mock dependencies
const mockNFTOwnershipService = {
  getOwnership: vi.fn(),
  getEligibleMoments: vi.fn(),
};

const mockNetworkResilienceManager = {
  executeWithRetry: vi.fn(),
  isOnline: vi.fn(() => true),
  getConnectionQuality: vi.fn(() => 'good'),
};

// Mock FCL
const mockFCL = {
  authenticate: vi.fn(),
  unauthenticate: vi.fn(),
  currentUser: {
    subscribe: vi.fn(),
    snapshot: vi.fn(),
  },
};

// Test component that uses auth context
const TestSyncComponent: React.FC = () => {
  const {
    user,
    isAuthenticated,
    syncStatus,
    profileData,
    nftCollection,
    forceSyncProfile,
    refreshNFTCollection,
    onSyncStatusChange,
    onProfileDataChange
  } = useAuth();

  const [syncEvents, setSyncEvents] = React.useState<string[]>([]);
  const [profileUpdates, setProfileUpdates] = React.useState<number>(0);

  React.useEffect(() => {
    const unsubscribeSync = onSyncStatusChange((status) => {
      setSyncEvents(prev => [...prev, `sync_status_${status.isActive ? 'active' : 'inactive'}`]);
    });

    const unsubscribeProfile = onProfileDataChange((data) => {
      setProfileUpdates(prev => prev + 1);
    });

    return () => {
      unsubscribeSync();
      unsubscribeProfile();
    };
  }, [onSyncStatusChange, onProfileDataChange]);

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="wallet-address">{user.addr || 'no-address'}</div>
      <div data-testid="sync-active">{syncStatus.isActive ? 'syncing' : 'idle'}</div>
      <div data-testid="sync-operation">{syncStatus.currentOperation || 'none'}</div>
      <div data-testid="profile-data">{profileData ? JSON.stringify(profileData) : 'no-profile'}</div>
      <div data-testid="nft-count">{nftCollection.length}</div>
      <div data-testid="sync-events">{syncEvents.join(',')}</div>
      <div data-testid="profile-updates">{profileUpdates}</div>
      
      <button data-testid="force-sync" onClick={forceSyncProfile}>
        Force Sync
      </button>
      <button data-testid="refresh-nfts" onClick={refreshNFTCollection}>
        Refresh NFTs
      </button>
    </div>
  );
};

describe('Complete Sync System Integration', () => {
  let syncManager: ConcreteWalletProfileSyncManager;
  let eventBus: SyncEventBus;
  const testAddress = '0x1234567890123456';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock responses
    mockNFTOwnershipService.getOwnership.mockResolvedValue({
      success: true,
      data: {
        address: testAddress,
        moments: [
          { id: '1', sport: 'NBA', playerName: 'LeBron James', team: 'Lakers' },
          { id: '2', sport: 'NFL', playerName: 'Tom Brady', team: 'Buccaneers' }
        ],
        collections: [
          { collectionName: 'NBA Top Shot', sport: 'NBA' },
          { collectionName: 'NFL All Day', sport: 'NFL' }
        ],
        totalCount: 2,
        lastVerified: new Date(),
        isEligible: true
      }
    });

    mockNFTOwnershipService.getEligibleMoments.mockResolvedValue({
      success: true,
      data: [
        { id: '1', sport: 'NBA' },
        { id: '2', sport: 'NFL' }
      ]
    });

    mockNetworkResilienceManager.executeWithRetry.mockImplementation(
      async (operation: () => Promise<any>) => operation()
    );

    // Mock FCL
    mockFCL.currentUser.subscribe.mockImplementation((callback) => {
      // Simulate initial state
      setTimeout(() => callback({ addr: null, loggedIn: false, services: [] }), 0);
      return vi.fn(); // unsubscribe function
    });

    mockFCL.currentUser.snapshot.mockResolvedValue({
      addr: null,
      loggedIn: false,
      services: []
    });

    // Replace global fcl
    vi.stubGlobal('fcl', mockFCL);

    // Create fresh instances
    eventBus = new SyncEventBus({ debugMode: true });
    syncManager = new ConcreteWalletProfileSyncManager(
      {
        autoSyncEnabled: true,
        syncInterval: 60000,
      },
      {
        nftOwnershipService: mockNFTOwnershipService,
        networkResilienceManager: mockNetworkResilienceManager,
      }
    );
  });

  afterEach(() => {
    syncManager?.clearAllCaches();
    eventBus?.destroy();
    vi.unstubAllGlobals();
  });

  describe('Auth Context and Sync Manager Integration', () => {
    it('should integrate auth context with sync manager for complete flow', async () => {
      const { rerender } = render(
        <AuthProvider>
          <TestSyncComponent />
        </AuthProvider>
      );

      // Initial state - not authenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('sync-active')).toHaveTextContent('idle');

      // Simulate wallet connection
      act(() => {
        mockFCL.currentUser.subscribe.mockImplementation((callback) => {
          callback({
            addr: testAddress,
            loggedIn: true,
            services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
          });
          return vi.fn();
        });
      });

      rerender(
        <AuthProvider>
          <TestSyncComponent />
        </AuthProvider>
      );

      // Wait for authentication and sync
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('wallet-address')).toHaveTextContent(testAddress);
      });

      // Verify sync was triggered
      await waitFor(() => {
        expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalledWith(testAddress, false);
      });
    });

    it('should handle manual sync operations through auth context', async () => {
      // Setup authenticated state
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        callback({
          addr: testAddress,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        });
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestSyncComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Trigger manual sync
      fireEvent.click(screen.getByTestId('force-sync'));

      // Verify sync status changes
      await waitFor(() => {
        expect(screen.getByTestId('sync-active')).toHaveTextContent('syncing');
      });

      await waitFor(() => {
        expect(screen.getByTestId('sync-active')).toHaveTextContent('idle');
      }, { timeout: 5000 });
    });

    it('should handle NFT collection refresh through auth context', async () => {
      // Setup authenticated state
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        callback({
          addr: testAddress,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        });
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestSyncComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Trigger NFT refresh
      fireEvent.click(screen.getByTestId('refresh-nfts'));

      // Verify NFT service was called
      await waitFor(() => {
        expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalledWith(testAddress);
      });
    });
  });

  describe('Event System Integration', () => {
    it('should propagate sync events through the entire system', async () => {
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        callback({
          addr: testAddress,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        });
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestSyncComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Trigger sync and verify events
      fireEvent.click(screen.getByTestId('force-sync'));

      await waitFor(() => {
        const syncEvents = screen.getByTestId('sync-events').textContent;
        expect(syncEvents).toContain('sync_status_active');
      });

      await waitFor(() => {
        const syncEvents = screen.getByTestId('sync-events').textContent;
        expect(syncEvents).toContain('sync_status_inactive');
      }, { timeout: 5000 });
    });

    it('should handle profile data updates through event system', async () => {
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        callback({
          addr: testAddress,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        });
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestSyncComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Initial profile update from connection
      await waitFor(() => {
        expect(screen.getByTestId('profile-updates')).toHaveTextContent('1');
      });

      // Trigger another sync
      fireEvent.click(screen.getByTestId('force-sync'));

      // Should get another profile update
      await waitFor(() => {
        expect(screen.getByTestId('profile-updates')).toHaveTextContent('2');
      }, { timeout: 5000 });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle sync errors gracefully across all components', async () => {
      // Mock sync failure
      mockNFTOwnershipService.getOwnership.mockRejectedValue(
        new Error('Network error')
      );

      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        callback({
          addr: testAddress,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        });
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestSyncComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Trigger sync that will fail
      fireEvent.click(screen.getByTestId('force-sync'));

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByTestId('sync-active')).toHaveTextContent('idle');
      }, { timeout: 5000 });

      // System should remain functional
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    it('should retry failed operations with network resilience', async () => {
      let attempts = 0;
      mockNetworkResilienceManager.executeWithRetry.mockImplementation(
        async (operation: () => Promise<any>) => {
          attempts++;
          if (attempts < 2) {
            throw new Error('Network error');
          }
          return await operation();
        }
      );

      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        callback({
          addr: testAddress,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        });
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestSyncComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Should have retried and succeeded
      await waitFor(() => {
        expect(attempts).toBe(2);
        expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent sync operations without conflicts', async () => {
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        callback({
          addr: testAddress,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        });
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestSyncComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Trigger multiple concurrent operations
      fireEvent.click(screen.getByTestId('force-sync'));
      fireEvent.click(screen.getByTestId('refresh-nfts'));

      // Should handle gracefully without errors
      await waitFor(() => {
        expect(screen.getByTestId('sync-active')).toHaveTextContent('idle');
      }, { timeout: 10000 });

      // Verify both operations completed
      expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalled();
    });

    it('should maintain cache consistency across operations', async () => {
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        callback({
          addr: testAddress,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        });
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestSyncComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Initial sync should populate cache
      await waitFor(() => {
        expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalled();
      });

      // Subsequent sync should use cache when appropriate
      fireEvent.click(screen.getByTestId('force-sync'));

      await waitFor(() => {
        expect(screen.getByTestId('sync-active')).toHaveTextContent('idle');
      }, { timeout: 5000 });

      // Verify cache was used appropriately
      expect(mockNFTOwnershipService.getOwnership).toHaveBeenCalledTimes(2); // Initial + force sync
    });
  });

  describe('Wallet Disconnection Integration', () => {
    it('should clean up all sync state on wallet disconnection', async () => {
      let currentCallback: any;
      
      mockFCL.currentUser.subscribe.mockImplementation((callback) => {
        currentCallback = callback;
        callback({
          addr: testAddress,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
        });
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestSyncComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Simulate wallet disconnection
      act(() => {
        currentCallback({
          addr: null,
          loggedIn: false,
          services: []
        });
      });

      // Verify cleanup
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('wallet-address')).toHaveTextContent('no-address');
        expect(screen.getByTestId('sync-active')).toHaveTextContent('idle');
        expect(screen.getByTestId('profile-data')).toHaveTextContent('no-profile');
        expect(screen.getByTestId('nft-count')).toHaveTextContent('0');
      });
    });
  });
});