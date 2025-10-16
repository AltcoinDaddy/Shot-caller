import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Navigation } from '@/components/navigation'

// Mock the theme provider
vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}))

// Mock the premium hook
vi.mock('@/hooks/use-premium', () => ({
  usePremium: () => ({
    premiumAccess: null,
    loading: false,
    error: null,
    purchaseSeasonPass: vi.fn(),
    refreshPremiumData: vi.fn(),
  }),
}))

// Mock the auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { addr: null, walletAddress: null },
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
}))

describe('Navigation', () => {
  it('renders navigation links', () => {
    render(<Navigation />)
    
    expect(screen.getByText('SHOTCALLER')).toBeInTheDocument()
    expect(screen.getByText('MY TEAM')).toBeInTheDocument()
    expect(screen.getByText('LEADERBOARD')).toBeInTheDocument()
    expect(screen.getByText('RESULTS')).toBeInTheDocument()
    expect(screen.getByText('MARKETPLACE')).toBeInTheDocument()
    expect(screen.getByText('TREASURY')).toBeInTheDocument()
    expect(screen.getByText('PREMIUM')).toBeInTheDocument()
  })

  it('shows connect wallet button when not authenticated', () => {
    render(<Navigation />)
    
    expect(screen.getByText('Connect')).toBeInTheDocument()
  })

  it('renders mobile navigation toggle', () => {
    render(<Navigation />)
    
    // The mobile toggle button has a menu icon but no accessible name
    const mobileToggle = screen.getAllByRole('button')[1] // Second button is the mobile toggle
    expect(mobileToggle).toBeInTheDocument()
  })
})