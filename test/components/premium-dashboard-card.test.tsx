import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { useRouter } from 'next/navigation'
import { PremiumDashboardCard } from '@/components/premium-dashboard-card'
import { usePremium } from '@/hooks/use-premium'

// Mock the hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/hooks/use-premium', () => ({
  usePremium: vi.fn(),
}))

const mockPush = vi.fn()
const mockUsePremium = usePremium as any
const mockUseRouter = useRouter as any

describe('PremiumDashboardCard', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    })
    mockPush.mockClear()
  })

  it('renders premium active state correctly', () => {
    mockUsePremium.mockReturnValue({
      isPremium: true,
      subscription: {
        access: {
          id: '1',
          userAddress: '0x123',
          accessType: 'monthly',
          purchasedAt: new Date(),
          expiresAt: new Date(),
          status: 'active',
          flowAmount: 10,
        },
        features: {
          advancedAnalytics: true,
          extraLineupSlots: 2,
          bonusRewardMultiplier: 1.5,
          exclusiveTournaments: true,
          prioritySupport: true,
          personalAnalyticsCoach: false,
        },
        isActive: true,
        daysRemaining: 15,
        canRenew: false,
      },
      daysRemaining: 15,
      isExpiringSoon: false,
      canRenew: false,
      features: {
        advancedAnalytics: true,
        extraLineupSlots: 2,
        bonusRewardMultiplier: 1.5,
        exclusiveTournaments: true,
        prioritySupport: true,
        personalAnalyticsCoach: false,
      },
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    } as any)

    render(<PremiumDashboardCard />)

    expect(screen.getByText('PREMIUM')).toBeInTheDocument()
    expect(screen.getByText('Premium features active')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('days left')).toBeInTheDocument()
    expect(screen.getByText('Premium Active')).toBeInTheDocument()
    expect(screen.getByText('View Analytics')).toBeInTheDocument()
    expect(screen.getByText('Manage')).toBeInTheDocument()
  })

  it('renders free plan state correctly', () => {
    mockUsePremium.mockReturnValue({
      isPremium: false,
      subscription: {
        access: null,
        features: {
          advancedAnalytics: false,
          extraLineupSlots: 0,
          bonusRewardMultiplier: 1.0,
          exclusiveTournaments: false,
          prioritySupport: false,
          personalAnalyticsCoach: false,
        },
        isActive: false,
        daysRemaining: 0,
        canRenew: false,
      },
      daysRemaining: 0,
      isExpiringSoon: false,
      canRenew: false,
      features: {
        advancedAnalytics: false,
        extraLineupSlots: 0,
        bonusRewardMultiplier: 1.0,
        exclusiveTournaments: false,
        prioritySupport: false,
        personalAnalyticsCoach: false,
      },
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    } as any)

    render(<PremiumDashboardCard />)

    expect(screen.getByText('PREMIUM')).toBeInTheDocument()
    expect(screen.getByText('Unlock advanced features')).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Current Plan')).toBeInTheDocument()
    expect(screen.getByText('Upgrade Now')).toBeInTheDocument()
    expect(screen.getByText('View Plans')).toBeInTheDocument()
    expect(screen.getByText('Available with Premium')).toBeInTheDocument()
  })

  it('navigates to premium page when upgrade button is clicked', () => {
    mockUsePremium.mockReturnValue({
      isPremium: false,
      subscription: {
        access: null,
        features: {
          advancedAnalytics: false,
          extraLineupSlots: 0,
          bonusRewardMultiplier: 1.0,
          exclusiveTournaments: false,
          prioritySupport: false,
          personalAnalyticsCoach: false,
        },
        isActive: false,
        daysRemaining: 0,
        canRenew: false,
      },
      daysRemaining: 0,
      isExpiringSoon: false,
      canRenew: false,
      features: {
        advancedAnalytics: false,
        extraLineupSlots: 0,
        bonusRewardMultiplier: 1.0,
        exclusiveTournaments: false,
        prioritySupport: false,
        personalAnalyticsCoach: false,
      },
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    } as any)

    render(<PremiumDashboardCard />)

    const upgradeButton = screen.getByText('Upgrade Now')
    fireEvent.click(upgradeButton)

    expect(mockPush).toHaveBeenCalledWith('/premium')
  })
})