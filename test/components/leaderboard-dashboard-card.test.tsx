import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LeaderboardDashboardCard } from '@/components/leaderboard-dashboard-card'
import { useUserRanking } from '@/hooks/use-leaderboard'
import { useAuth } from '@/contexts/auth-context'

// Mock the hooks
vi.mock('@/hooks/use-leaderboard')
vi.mock('@/contexts/auth-context')

const mockUseUserRanking = vi.mocked(useUserRanking)
const mockUseAuth = vi.mocked(useAuth)

describe('LeaderboardDashboardCard', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { addr: '0x123', cid: 'user-123', loggedIn: true },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state correctly', () => {
    mockUseUserRanking.mockReturnValue({
      ranking: null,
      history: [],
      loading: true,
      error: null,
      refreshRanking: vi.fn()
    })

    render(<LeaderboardDashboardCard />)
    
    // Should show skeleton loading elements
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders error state correctly', () => {
    const mockRefresh = vi.fn()
    mockUseUserRanking.mockReturnValue({
      ranking: null,
      history: [],
      loading: false,
      error: 'Failed to fetch leaderboard data',
      refreshRanking: mockRefresh
    })

    render(<LeaderboardDashboardCard />)
    
    expect(screen.getByText('LEADERBOARD')).toBeInTheDocument()
    expect(screen.getByText('Failed to fetch leaderboard data')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Try Again'))
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('renders ranking data correctly', () => {
    mockUseUserRanking.mockReturnValue({
      ranking: {
        id: 'ranking-1',
        rank: 42,
        userId: 'user-123',
        username: 'testuser',
        walletAddress: '0x123',
        totalPoints: 1500,
        weeklyPoints: 247,
        rankChange: 5,
        previousRank: 47,
        nftsUsed: 5,
        wins: 3,
        losses: 2,
        weeklyWins: 1,
        weeklyLosses: 0,
        lastUpdated: new Date()
      },
      history: [],
      loading: false,
      error: null,
      refreshRanking: vi.fn()
    })

    render(<LeaderboardDashboardCard />)
    
    expect(screen.getByText('#42')).toBeInTheDocument()
    expect(screen.getByText('Current rank')).toBeInTheDocument()
    expect(screen.getByText('247 pts')).toBeInTheDocument()
    expect(screen.getByText('1,500 pts')).toBeInTheDocument()
    expect(screen.getByText('+5')).toBeInTheDocument()
    expect(screen.getByText('View Full Rankings')).toBeInTheDocument()
  })

  it('renders unranked state correctly', () => {
    mockUseUserRanking.mockReturnValue({
      ranking: null,
      history: [],
      loading: false,
      error: null,
      refreshRanking: vi.fn()
    })

    render(<LeaderboardDashboardCard />)
    
    expect(screen.getByText('Unranked')).toBeInTheDocument()
    expect(screen.getAllByText(/0 pts/)).toHaveLength(2) // Both weekly and season totals show 0 pts
  })

  it('renders negative rank change correctly', () => {
    mockUseUserRanking.mockReturnValue({
      ranking: {
        id: 'ranking-1',
        rank: 50,
        userId: 'user-123',
        username: 'testuser',
        walletAddress: '0x123',
        totalPoints: 1200,
        weeklyPoints: 180,
        rankChange: -3,
        previousRank: 47,
        nftsUsed: 5,
        wins: 2,
        losses: 3,
        weeklyWins: 0,
        weeklyLosses: 1,
        lastUpdated: new Date()
      },
      history: [],
      loading: false,
      error: null,
      refreshRanking: vi.fn()
    })

    render(<LeaderboardDashboardCard />)
    
    expect(screen.getByText('#50')).toBeInTheDocument()
    expect(screen.getByText('-3')).toBeInTheDocument()
  })

  it('navigates to leaderboard page when button is clicked', () => {
    mockUseUserRanking.mockReturnValue({
      ranking: {
        id: 'ranking-1',
        rank: 42,
        userId: 'user-123',
        username: 'testuser',
        walletAddress: '0x123',
        totalPoints: 1500,
        weeklyPoints: 247,
        rankChange: 0,
        nftsUsed: 5,
        wins: 3,
        losses: 2,
        weeklyWins: 1,
        weeklyLosses: 0,
        lastUpdated: new Date()
      },
      history: [],
      loading: false,
      error: null,
      refreshRanking: vi.fn()
    })

    render(<LeaderboardDashboardCard />)
    
    const link = screen.getByRole('link', { name: /view full rankings/i })
    expect(link).toHaveAttribute('href', '/leaderboard')
  })
})