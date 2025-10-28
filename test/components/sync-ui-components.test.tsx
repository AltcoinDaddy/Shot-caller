import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SyncStatusIndicator } from '@/components/sync-status-indicator';
import { NavigationSyncIndicator } from '@/components/navigation-sync-indicator';
import { ProfileSyncStatus } from '@/components/profile-sync-status';
import { SyncErrorDisplay, SyncErrorType } from '@/components/sync-error-display';
import { SyncProgressIndicator, SyncOperationType, OperationStatus } from '@/components/sync-progress-indicator';
import { SyncLoadingState } from '@/components/sync-loading-state';

// Mock the UI components
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => children,
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => children,
  PopoverTrigger: ({ children }: any) => children,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

describe('Sync UI Components', () => {
  const mockSyncStatus = {
    isActive: false,
    lastSync: new Date('2024-01-01T12:00:00Z'),
    nextSync: null,
    failureCount: 0,
  };

  const mockError = {
    type: SyncErrorType.NETWORK_ERROR,
    message: 'Network connection failed',
    operation: 'wallet_verification',
    timestamp: new Date(),
    retryable: true,
  };

  const mockOperation = {
    id: '1',
    type: SyncOperationType.WALLET_VERIFICATION,
    status: OperationStatus.IN_PROGRESS,
    startTime: new Date(),
    retryCount: 0,
    progress: 50,
  };

  describe('SyncStatusIndicator', () => {
    it('should render compact variant correctly', () => {
      render(
        <SyncStatusIndicator
          status={mockSyncStatus}
          variant="compact"
        />
      );

      // Should show sync status indicator with green dot for successful sync
      expect(screen.getByText('Synced')).toBeInTheDocument();
    });

    it('should render detailed variant with retry button when there are failures', () => {
      const failedStatus = { ...mockSyncStatus, failureCount: 2 };
      const mockRetry = vi.fn();

      render(
        <SyncStatusIndicator
          status={failedStatus}
          variant="detailed"
          onRetry={mockRetry}
        />
      );

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });

    it('should show active sync state', () => {
      const activeStatus = { 
        ...mockSyncStatus, 
        isActive: true, 
        currentOperation: 'Syncing NFT collection' 
      };

      render(
        <SyncStatusIndicator
          status={activeStatus}
          variant="detailed"
        />
      );

      expect(screen.getByText('Syncing')).toBeInTheDocument();
    });
  });

  describe('NavigationSyncIndicator', () => {
    it('should render sync status in navigation', () => {
      render(
        <NavigationSyncIndicator
          syncStatus={mockSyncStatus}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should show error badge when there are errors', () => {
      render(
        <NavigationSyncIndicator
          syncStatus={mockSyncStatus}
          errors={[mockError]}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('ProfileSyncStatus', () => {
    const mockProfileData = {
      walletAddress: '0x123',
      nftCount: 5,
      eligibleMoments: 3,
      lastNFTSync: new Date(),
      lastStatsSync: new Date(),
    };

    it('should render profile sync status', () => {
      render(
        <ProfileSyncStatus
          syncStatus={mockSyncStatus}
          profileData={mockProfileData}
        />
      );

      expect(screen.getByText('Profile Sync')).toBeInTheDocument();
      expect(screen.getByText('Wallet Connection')).toBeInTheDocument();
      expect(screen.getByText('NFT Collection')).toBeInTheDocument();
    });

    it('should show refresh buttons', () => {
      const mockRefresh = vi.fn();

      render(
        <ProfileSyncStatus
          syncStatus={mockSyncStatus}
          profileData={mockProfileData}
          onRefreshProfile={mockRefresh}
        />
      );

      const refreshButton = screen.getByText('Refresh All');
      expect(refreshButton).toBeInTheDocument();

      fireEvent.click(refreshButton);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('SyncErrorDisplay', () => {
    it('should render error message', () => {
      render(
        <SyncErrorDisplay
          error={mockError}
          variant="card"
        />
      );

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Check your internet connection and try again.')).toBeInTheDocument();
    });

    it('should show retry button for retryable errors', () => {
      const mockRetry = vi.fn();

      render(
        <SyncErrorDisplay
          error={mockError}
          onRetry={mockRetry}
          variant="card"
        />
      );

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });

    it('should show inline variant', () => {
      render(
        <SyncErrorDisplay
          error={mockError}
          variant="inline"
        />
      );

      expect(screen.getByText(mockError.message)).toBeInTheDocument();
    });
  });

  describe('SyncProgressIndicator', () => {
    it('should render progress for operations', () => {
      render(
        <SyncProgressIndicator
          operations={[mockOperation]}
          variant="detailed"
        />
      );

      expect(screen.getByText('Sync Progress')).toBeInTheDocument();
      expect(screen.getByText('Verifying wallet')).toBeInTheDocument();
    });

    it('should show compact progress', () => {
      render(
        <SyncProgressIndicator
          operations={[mockOperation]}
          variant="compact"
        />
      );

      expect(screen.getByText('0/1')).toBeInTheDocument();
    });
  });

  describe('SyncLoadingState', () => {
    it('should show children when not loading', () => {
      render(
        <SyncLoadingState isLoading={false}>
          <div>Content</div>
        </SyncLoadingState>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should show loading state when loading', () => {
      render(
        <SyncLoadingState isLoading={true} variant="spinner" loadingText="Loading...">
          <div>Content</div>
        </SyncLoadingState>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show overlay variant', () => {
      render(
        <SyncLoadingState isLoading={true} variant="overlay" loadingText="Syncing...">
          <div>Content</div>
        </SyncLoadingState>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });
  });
});