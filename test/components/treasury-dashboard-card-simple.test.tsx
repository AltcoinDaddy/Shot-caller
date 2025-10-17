import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TreasuryDashboardCardSimple } from '@/components/treasury-dashboard-card-simple'
import { useWallet } from '@/hooks/use-wallet'
import { useRouter } from 'next/navigation'

// Mock the hooks
vi.mock('@/hooks/use-wallet')
vi.mock('next/navigation')

// Mock fetch
global.fetch = vi.fn()

const mockUseWallet = useWallet as any
const mockUseRouter = useRouter as any
const mockPush = vi.fn()

describe('TreasuryDashboardCardSimple', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as any)
  })

  it('renders loading state when wallet is loading', () => {
    mockUseWallet.mockReturnValue({
      balance: '0.0',
      balanceLoading: true,
      balanceError: undefined,
      refreshBalance: vi.fn(),
      isAuthenticated: true,
      formatAddress: vi.fn(),
    } as any)

    render(<TreasuryDashboardCardSimple />)
    
    // Should show loading skeleton - check for skeleton elements
    const skeletons = document.querySelectorAll('[data-testid="skeleton"], .animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders error state when there is an error', () => {
    mockUseWallet.mockReturnValue({
      balance: '0.0',
      balanceLoading: false,
      balanceError: 'Failed to load balance',
      refreshBalance: vi.fn(),
      isAuthenticated: true,
      formatAddress: vi.fn(),
    } as any)

    render(<TreasuryDashboardCardSimple />)
    
    expect(screen.getByText('Failed to load balance')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('renders treasury data when authenticated and loaded', async () => {
    const mockRefreshBalance = vi.fn()
    
    mockUseWallet.mockReturnValue({
      balance: '12.50',
      balanceLoading: false,
      balanceError: undefined,
      refreshBalance: mockRefreshBalance,
      isAuthenticated: true,
      formatAddress: vi.fn(),
    } as any)

    // Mock successful API response
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        treasury: {
          totalRewardPool: 1000,
          totalTreasury: 500,
          totalVolume: 1500,
          recentTransactions: [
            {
              id: '1',
              transactionHash: 'hash1',
              transactionType: 'tournament_entry',
              amount: -5.0,
              feeAmount: 0.5,
              rewardPoolAmount: 4.5,
              treasuryAmount: 0,
              userAddress: 'user1',
              createdAt: '2023-12-01T00:00:00Z'
            },
            {
              id: '2',
              transactionHash: 'hash2',
              transactionType: 'reward_distribution',
              amount: 10.0,
              feeAmount: 0,
              rewardPoolAmount: -10.0,
              treasuryAmount: 0,
              userAddress: 'user1',
              createdAt: '2023-12-02T00:00:00Z'
            }
          ]
        }
      })
    })

    render(<TreasuryDashboardCardSimple />)

    await waitFor(() => {
      expect(screen.getByText('TREASURY')).toBeInTheDocument()
      expect(screen.getByText('12.50 FLOW')).toBeInTheDocument()
      expect(screen.getByText('Wallet Balance')).toBeInTheDocument()
    })

    // Should show recent transactions
    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
      expect(screen.getByText('Tournament Entry')).toBeInTheDocument()
      expect(screen.getByText('Reward Distribution')).toBeInTheDocument()
    })
  })

  it('shows not authenticated message when user is not logged in', () => {
    mockUseWallet.mockReturnValue({
      balance: '0.0',
      balanceLoading: false,
      balanceError: undefined,
      refreshBalance: vi.fn(),
      isAuthenticated: false,
      formatAddress: vi.fn(),
    } as any)

    render(<TreasuryDashboardCardSimple />)

    expect(screen.getByText('Connect wallet to view treasury')).toBeInTheDocument()
  })

  it('handles refresh button click', async () => {
    const mockRefreshBalance = vi.fn()
    
    mockUseWallet.mockReturnValue({
      balance: '12.50',
      balanceLoading: false,
      balanceError: undefined,
      refreshBalance: mockRefreshBalance,
      isAuthenticated: true,
      formatAddress: vi.fn(),
    } as any)

    // Mock API response
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        treasury: {
          totalRewardPool: 1000,
          totalTreasury: 500,
          totalVolume: 1500,
          recentTransactions: []
        }
      })
    })

    render(<TreasuryDashboardCardSimple />)

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Refresh'))

    expect(mockRefreshBalance).toHaveBeenCalled()
  })

  it('handles history button click', async () => {
    mockUseWallet.mockReturnValue({
      balance: '12.50',
      balanceLoading: false,
      balanceError: undefined,
      refreshBalance: vi.fn(),
      isAuthenticated: true,
      formatAddress: vi.fn(),
    } as any)

    // Mock API response
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        treasury: {
          totalRewardPool: 1000,
          totalTreasury: 500,
          totalVolume: 1500,
          recentTransactions: []
        }
      })
    })

    render(<TreasuryDashboardCardSimple />)

    await waitFor(() => {
      expect(screen.getByText('History')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('History'))

    expect(mockPush).toHaveBeenCalledWith('/treasury')
  })

  it('shows no transactions message when there are no recent transactions', async () => {
    mockUseWallet.mockReturnValue({
      balance: '12.50',
      balanceLoading: false,
      balanceError: undefined,
      refreshBalance: vi.fn(),
      isAuthenticated: true,
      formatAddress: vi.fn(),
    } as any)

    // Mock API response with no transactions
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        treasury: {
          totalRewardPool: 1000,
          totalTreasury: 500,
          totalVolume: 1500,
          recentTransactions: []
        }
      })
    })

    render(<TreasuryDashboardCardSimple />)

    await waitFor(() => {
      expect(screen.getByText('No recent transactions')).toBeInTheDocument()
    })
  })
})