import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BoosterInventory } from '@/components/booster-inventory'

// Mock the hooks
const mockUseBoosters = vi.fn()
vi.mock('@/hooks/use-boosters', () => ({
  useBoosters: mockUseBoosters,
}))

// Mock the auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { walletAddress: '0x1234567890abcdef' },
    isAuthenticated: true,
  }),
}))

const mockBoosters = [
  {
    id: '1',
    ownerAddress: '0x1234567890abcdef',
    boosterType: 'disney_energy',
    effectType: 'score_multiplier',
    effectValue: 1.05,
    durationHours: 168,
    status: 'available',
    purchasedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    ownerAddress: '0x1234567890abcdef',
    boosterType: 'disney_luck',
    effectType: 'random_bonus',
    effectValue: 10,
    durationHours: 168,
    status: 'active',
    purchasedAt: new Date('2024-01-01'),
    activatedAt: new Date('2024-01-02'),
    expiresAt: new Date('2024-01-09'),
  },
]

describe('BoosterInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseBoosters.mockReturnValue({
      boosters: mockBoosters,
      loading: false,
      error: null,
      activateBooster: vi.fn(),
      purchaseBooster: vi.fn(),
      refreshBoosters: vi.fn(),
    })
  })

  it('renders booster inventory with available boosters', () => {
    render(<BoosterInventory />)
    
    expect(screen.getByText('Booster Inventory')).toBeInTheDocument()
    expect(screen.getByText('Disney Energy')).toBeInTheDocument()
    expect(screen.getByText('Disney Luck')).toBeInTheDocument()
  })

  it('shows booster effects and status', () => {
    render(<BoosterInventory />)
    
    expect(screen.getByText('+5% Score Multiplier')).toBeInTheDocument()
    expect(screen.getByText('Random Bonus: +10 points')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('allows activating available boosters', async () => {
    const mockActivateBooster = vi.fn()
    mockUseBoosters.mockReturnValue({
      boosters: mockBoosters,
      loading: false,
      error: null,
      activateBooster: mockActivateBooster,
      purchaseBooster: vi.fn(),
      refreshBoosters: vi.fn(),
    })

    render(<BoosterInventory />)
    
    const activateButton = screen.getByText('Activate')
    fireEvent.click(activateButton)
    
    await waitFor(() => {
      expect(mockActivateBooster).toHaveBeenCalledWith('1')
    })
  })

  it('shows loading state', () => {
    mockUseBoosters.mockReturnValue({
      boosters: [],
      loading: true,
      error: null,
      activateBooster: vi.fn(),
      purchaseBooster: vi.fn(),
      refreshBoosters: vi.fn(),
    })

    render(<BoosterInventory />)
    
    expect(screen.getByText('Loading boosters...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockUseBoosters.mockReturnValue({
      boosters: [],
      loading: false,
      error: 'Failed to load boosters',
      activateBooster: vi.fn(),
      purchaseBooster: vi.fn(),
      refreshBoosters: vi.fn(),
    })

    render(<BoosterInventory />)
    
    expect(screen.getByText('Failed to load boosters')).toBeInTheDocument()
  })

  it('shows empty state when no boosters', () => {
    mockUseBoosters.mockReturnValue({
      boosters: [],
      loading: false,
      error: null,
      activateBooster: vi.fn(),
      purchaseBooster: vi.fn(),
      refreshBoosters: vi.fn(),
    })

    render(<BoosterInventory />)
    
    expect(screen.getByText('No boosters in your inventory')).toBeInTheDocument()
    expect(screen.getByText('Visit the Treasury to purchase boosters')).toBeInTheDocument()
  })

  it('disables activate button for active boosters', () => {
    render(<BoosterInventory />)
    
    const buttons = screen.getAllByRole('button')
    const activeBoosterButton = buttons.find(button => 
      button.textContent === 'Active' && button.hasAttribute('disabled')
    )
    
    expect(activeBoosterButton).toBeInTheDocument()
  })

  it('shows expiration time for active boosters', () => {
    render(<BoosterInventory />)
    
    expect(screen.getByText(/Expires:/)).toBeInTheDocument()
  })
})