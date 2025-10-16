import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MarketplaceListingCard } from '@/components/marketplace-listing-card'

// Mock the hooks
const mockUseMarketplace = vi.fn()
vi.mock('@/hooks/use-marketplace', () => ({
  useMarketplace: mockUseMarketplace,
}))

// Mock the auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { walletAddress: '0x1234567890abcdef' },
    isAuthenticated: true,
  }),
}))

const mockListing = {
  id: '1',
  sellerAddress: '0xabcdef1234567890',
  momentId: 12345,
  price: 10.5,
  status: 'active' as const,
  createdAt: new Date('2024-01-01'),
  nft: {
    id: '1',
    momentId: 12345,
    playerName: 'LeBron James',
    team: 'Lakers',
    position: 'SF',
    sport: 'NBA' as const,
    rarity: 'Legendary' as const,
    metadata: {},
    imageUrl: 'https://example.com/lebron.jpg',
  },
}

describe('MarketplaceListingCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarketplace.mockReturnValue({
      listings: [mockListing],
      loading: false,
      error: null,
      purchaseNFT: vi.fn(),
      cancelListing: vi.fn(),
      refreshListings: vi.fn(),
    })
  })

  it('renders listing card with NFT details', () => {
    render(<MarketplaceListingCard listing={mockListing} />)
    
    expect(screen.getByText('LeBron James')).toBeInTheDocument()
    expect(screen.getByText('Lakers')).toBeInTheDocument()
    expect(screen.getByText('SF')).toBeInTheDocument()
    expect(screen.getByText('Legendary')).toBeInTheDocument()
    expect(screen.getByText('10.5 FLOW')).toBeInTheDocument()
  })

  it('shows purchase button for other users listings', () => {
    render(<MarketplaceListingCard listing={mockListing} />)
    
    expect(screen.getByText('Purchase')).toBeInTheDocument()
  })

  it('shows cancel button for own listings', () => {
    const ownListing = {
      ...mockListing,
      sellerAddress: '0x1234567890abcdef', // Same as authenticated user
    }

    render(<MarketplaceListingCard listing={ownListing} />)
    
    expect(screen.getByText('Cancel Listing')).toBeInTheDocument()
    expect(screen.queryByText('Purchase')).not.toBeInTheDocument()
  })

  it('handles purchase action', async () => {
    const mockPurchaseNFT = vi.fn()
    mockUseMarketplace.mockReturnValue({
      listings: [mockListing],
      loading: false,
      error: null,
      purchaseNFT: mockPurchaseNFT,
      cancelListing: vi.fn(),
      refreshListings: vi.fn(),
    })

    render(<MarketplaceListingCard listing={mockListing} />)
    
    const purchaseButton = screen.getByText('Purchase')
    fireEvent.click(purchaseButton)
    
    await waitFor(() => {
      expect(mockPurchaseNFT).toHaveBeenCalledWith(mockListing.id)
    })
  })

  it('handles cancel listing action', async () => {
    const mockCancelListing = vi.fn()
    const ownListing = {
      ...mockListing,
      sellerAddress: '0x1234567890abcdef',
    }

    mockUseMarketplace.mockReturnValue({
      listings: [ownListing],
      loading: false,
      error: null,
      purchaseNFT: vi.fn(),
      cancelListing: mockCancelListing,
      refreshListings: vi.fn(),
    })

    render(<MarketplaceListingCard listing={ownListing} />)
    
    const cancelButton = screen.getByText('Cancel Listing')
    fireEvent.click(cancelButton)
    
    await waitFor(() => {
      expect(mockCancelListing).toHaveBeenCalledWith(ownListing.id)
    })
  })

  it('shows sold status for sold listings', () => {
    const soldListing = {
      ...mockListing,
      status: 'sold' as const,
      soldAt: new Date('2024-01-02'),
      buyerAddress: '0x9876543210fedcba',
    }

    render(<MarketplaceListingCard listing={soldListing} />)
    
    expect(screen.getByText('SOLD')).toBeInTheDocument()
    expect(screen.queryByText('Purchase')).not.toBeInTheDocument()
  })

  it('displays NFT image with fallback', () => {
    render(<MarketplaceListingCard listing={mockListing} />)
    
    const image = screen.getByAltText('LeBron James NFT')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/lebron.jpg')
  })

  it('shows listing creation date', () => {
    render(<MarketplaceListingCard listing={mockListing} />)
    
    expect(screen.getByText(/Listed on/)).toBeInTheDocument()
  })

  it('disables purchase button when loading', () => {
    mockUseMarketplace.mockReturnValue({
      listings: [mockListing],
      loading: true,
      error: null,
      purchaseNFT: vi.fn(),
      cancelListing: vi.fn(),
      refreshListings: vi.fn(),
    })

    render(<MarketplaceListingCard listing={mockListing} />)
    
    const purchaseButton = screen.getByText('Purchase')
    expect(purchaseButton).toBeDisabled()
  })

  it('shows rarity badge with appropriate styling', () => {
    render(<MarketplaceListingCard listing={mockListing} />)
    
    const rarityBadge = screen.getByText('Legendary')
    expect(rarityBadge).toHaveClass('bg-gradient-to-r', 'from-yellow-400', 'to-orange-500')
  })
})