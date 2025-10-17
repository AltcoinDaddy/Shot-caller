import { render } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MyTeamDashboardCard } from '@/components/myteam-dashboard-card'

// Mock the dependencies
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn()
}))

vi.mock('@/hooks/use-nft-ownership', () => ({
  useNFTOwnership: vi.fn()
}))

vi.mock('@/lib/services/lineup-service', () => ({
  lineupService: {
    getActiveContests: vi.fn().mockResolvedValue([]),
    getLineupWithMetadata: vi.fn().mockResolvedValue(null)
  }
}))

// Import after mocking
import { useAuth } from '@/contexts/auth-context'
import { useNFTOwnership } from '@/hooks/use-nft-ownership'

const mockUseAuth = vi.mocked(useAuth)
const mockUseNFTOwnership = vi.mocked(useNFTOwnership)

describe('MyTeamDashboardCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isEligible: false,
      eligibilityReason: null,
      collections: [],
      login: vi.fn(),
      logout: vi.fn(),
    })

    mockUseNFTOwnership.mockReturnValue({
      ownership: null,
      moments: [],
      eligibleMoments: [],
      disneyNFTs: [],
      isLoading: false,
      isRefreshing: false,
      error: null,
      refreshOwnership: vi.fn(),
      verifyMoment: vi.fn(),
      searchMoments: vi.fn(),
      clearCache: vi.fn(),
      hasEligibleNFTs: false,
      totalMoments: 0,
      topShotCount: 0,
      allDayCount: 0,
      cacheStats: {},
    })

    const { container } = render(<MyTeamDashboardCard />)
    expect(container).toBeTruthy()
  })

  it('renders without crashing when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { addr: '0x123' },
      isEligible: true,
      eligibilityReason: null,
      collections: ['TopShot'],
      login: vi.fn(),
      logout: vi.fn(),
    })

    mockUseNFTOwnership.mockReturnValue({
      ownership: null,
      moments: [],
      eligibleMoments: [],
      disneyNFTs: [],
      isLoading: false,
      isRefreshing: false,
      error: null,
      refreshOwnership: vi.fn(),
      verifyMoment: vi.fn(),
      searchMoments: vi.fn(),
      clearCache: vi.fn(),
      hasEligibleNFTs: false,
      totalMoments: 0,
      topShotCount: 0,
      allDayCount: 0,
      cacheStats: {},
    })

    const { container } = render(<MyTeamDashboardCard />)
    expect(container).toBeTruthy()
  })
})