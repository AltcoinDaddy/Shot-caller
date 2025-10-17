import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardProvider } from '@/contexts/dashboard-context'
import { useAuth } from '@/contexts/auth-context'
import { useUserRanking } from '@/hooks/use-leaderboard'
import { useAnalytics } from '@/hooks/use-analytics'

// Mock the hooks
vi.mock('@/contexts/auth-context')
vi.mock('@/hooks/use-leaderboard')
vi.mock('@/hooks/use-analytics')

const mockUseAuth = vi.mocked(useAuth)
const mockUseUserRanking = vi.mocked(useUserRanking)
const mockUseAnalytics = vi.mocked(useAnalytics)

// Mock component wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DashboardProvider>
    {children}
  </DashboardProvider>
)

describe('DashboardHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders welcome message for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      walletType: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      isEligible: false,
      collections: [],
      refreshEligibility: vi.fn(),
      walletInfo: null
    })

    mockUseUserRanking.mockReturnValue({
      ranking: null,
      history: [],
      loading: false,
      error: null,
      refreshRanking: vi.fn()
    })

    mockUseAnalytics.mockReturnValue({
      analyticsData: null,
      loading: false,
      error: null,
      refresh: vi.fn(),
      hasData: false,
      isPremiumUser: false,
      hasAdvancedFeatures: false,
      loadAnalyticsData: vi.fn(),
      loadComparisonData: vi.fn(),
      calculatePlayerTrends: vi.fn(),
      exportAnalyticsData: vi.fn(),
      insights: [],
      comparisonData: null,
      optimizationSuggestions: []
    })

    render(
      <TestWrapper>
        <DashboardHeader />
      </TestWrapper>
    )

    expect(screen.getByText('Welcome to ShotCaller')).toBeInTheDocument()
    expect(screen.getByText(/Connect your wallet to access/)).toBeInTheDocument()
  })

  it('renders personalized greeting for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { addr: '0x1234567890abcdef', cid: null, loggedIn: true },
      walletType: 'dapper',
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      isEligible: true,
      collections: ['nba-topshot'],
      refreshEligibility: vi.fn(),
      walletInfo: null
    })

    mockUseUserRanking.mockReturnValue({
      ranking: {
        userId: '0x1234567890abcdef',
        rank: 42,
        totalPoints: 1247,
        weeklyPoints: 89,
        rankChange: 5,
        username: 'TestUser',
        avatar: null,
        isActive: true
      },
      history: [],
      loading: false,
      error: null,
      refreshRanking: vi.fn()
    })

    mockUseAnalytics.mockReturnValue({
      analyticsData: {
        performanceMetrics: {
          totalPoints: 1247,
          averagePoints: 249.4,
          consistency: 0.78,
          efficiency: 0.85,
          rankingTrend: 'improving' as const,
          winRate: 0.65
        },
        weeklyTrends: [],
        playerAnalytics: [],
        teamComposition: {
          sportDistribution: { NBA: 3, NFL: 2 },
          positionDistribution: { PG: 1, SG: 1, SF: 1, QB: 1, RB: 1 },
          playerContributions: []
        },
        insights: {
          topPerformer: { name: 'Test Player', contribution: 20.9 },
          improvementAreas: [],
          recommendations: []
        }
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
      hasData: true,
      isPremiumUser: false,
      hasAdvancedFeatures: false,
      loadAnalyticsData: vi.fn(),
      loadComparisonData: vi.fn(),
      calculatePlayerTrends: vi.fn(),
      exportAnalyticsData: vi.fn(),
      insights: [],
      comparisonData: null,
      optimizationSuggestions: []
    })

    render(
      <TestWrapper>
        <DashboardHeader />
      </TestWrapper>
    )

    // Check for time-based greeting (will be one of these)
    const greetingRegex = /(Good morning|Good afternoon|Good evening), Dapper 0x1234...cdef!/
    expect(screen.getByText(greetingRegex)).toBeInTheDocument()
    
    expect(screen.getByText(/Your ShotCaller command center/)).toBeInTheDocument()
  })

  it('displays stats overview with correct data', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { addr: '0x1234567890abcdef', cid: null, loggedIn: true },
      walletType: 'dapper',
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      isEligible: true,
      collections: ['nba-topshot'],
      refreshEligibility: vi.fn(),
      walletInfo: null
    })

    mockUseUserRanking.mockReturnValue({
      ranking: {
        userId: '0x1234567890abcdef',
        rank: 42,
        totalPoints: 1247,
        weeklyPoints: 89,
        rankChange: 5,
        username: 'TestUser',
        avatar: null,
        isActive: true
      },
      history: [],
      loading: false,
      error: null,
      refreshRanking: vi.fn()
    })

    mockUseAnalytics.mockReturnValue({
      analyticsData: {
        performanceMetrics: {
          totalPoints: 1247,
          averagePoints: 249.4,
          consistency: 0.78,
          efficiency: 0.85,
          rankingTrend: 'improving' as const,
          winRate: 0.65
        },
        weeklyTrends: [],
        playerAnalytics: [],
        teamComposition: {
          sportDistribution: { NBA: 3, NFL: 2 },
          positionDistribution: { PG: 1, SG: 1, SF: 1, QB: 1, RB: 1 },
          playerContributions: []
        },
        insights: {
          topPerformer: { name: 'Test Player', contribution: 20.9 },
          improvementAreas: [],
          recommendations: []
        }
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
      hasData: true,
      isPremiumUser: false,
      hasAdvancedFeatures: false,
      loadAnalyticsData: vi.fn(),
      loadComparisonData: vi.fn(),
      calculatePlayerTrends: vi.fn(),
      exportAnalyticsData: vi.fn(),
      insights: [],
      comparisonData: null,
      optimizationSuggestions: []
    })

    render(
      <TestWrapper>
        <DashboardHeader />
      </TestWrapper>
    )

    // Check for stats display
    expect(screen.getByText('1,247')).toBeInTheDocument() // Total points
    expect(screen.getByText('89')).toBeInTheDocument() // Weekly points
    expect(screen.getByText('#42')).toBeInTheDocument() // Rank
    expect(screen.getByText('65%')).toBeInTheDocument() // Win rate
  })

  it('handles refresh functionality', async () => {
    const mockRefreshRanking = vi.fn()
    const mockRefreshAnalytics = vi.fn()

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { addr: '0x1234567890abcdef', cid: null, loggedIn: true },
      walletType: 'dapper',
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      isEligible: true,
      collections: ['nba-topshot'],
      refreshEligibility: vi.fn(),
      walletInfo: null
    })

    mockUseUserRanking.mockReturnValue({
      ranking: null,
      history: [],
      loading: false,
      error: null,
      refreshRanking: mockRefreshRanking
    })

    mockUseAnalytics.mockReturnValue({
      analyticsData: null,
      loading: false,
      error: null,
      refresh: mockRefreshAnalytics,
      hasData: false,
      isPremiumUser: false,
      hasAdvancedFeatures: false,
      loadAnalyticsData: vi.fn(),
      loadComparisonData: vi.fn(),
      calculatePlayerTrends: vi.fn(),
      exportAnalyticsData: vi.fn(),
      insights: [],
      comparisonData: null,
      optimizationSuggestions: []
    })

    render(
      <TestWrapper>
        <DashboardHeader />
      </TestWrapper>
    )

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(refreshButton)

    // Wait for the refresh to complete
    await waitFor(() => {
      expect(mockRefreshRanking).toHaveBeenCalled()
      expect(mockRefreshAnalytics).toHaveBeenCalled()
    })
  })

  it('shows loading state correctly', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { addr: '0x1234567890abcdef', cid: null, loggedIn: true },
      walletType: 'dapper',
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      isEligible: true,
      collections: ['nba-topshot'],
      refreshEligibility: vi.fn(),
      walletInfo: null
    })

    mockUseUserRanking.mockReturnValue({
      ranking: null,
      history: [],
      loading: true,
      error: null,
      refreshRanking: vi.fn()
    })

    mockUseAnalytics.mockReturnValue({
      analyticsData: null,
      loading: true,
      error: null,
      refresh: vi.fn(),
      hasData: false,
      isPremiumUser: false,
      hasAdvancedFeatures: false,
      loadAnalyticsData: vi.fn(),
      loadComparisonData: vi.fn(),
      calculatePlayerTrends: vi.fn(),
      exportAnalyticsData: vi.fn(),
      insights: [],
      comparisonData: null,
      optimizationSuggestions: []
    })

    render(
      <TestWrapper>
        <DashboardHeader />
      </TestWrapper>
    )

    // Should show skeleton loading states - check for skeleton elements by class
    const { container } = render(
      <TestWrapper>
        <DashboardHeader />
      </TestWrapper>
    )
    const skeletonElements = container.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})