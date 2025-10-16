import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { CreateListingDialog } from '@/components/create-listing-dialog'

// Mock the hooks
const mockUseMarketplace = vi.fn()
const mockUseNFTOwnership = vi.fn()

vi.mock('@/hooks/use-marketplace', () => ({
  useMarketplace: mockUseMarketplace,
}))

vi.mock('@/hooks/use-nft-ownership', () => ({
  useNFTOwnership: mockUseNFTOwnership,
}))

// Mock the auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { walletAddress: '0x1234567890abcdef' },
    isAuthenticated: true,
  }),
}))

const mockOwnedNFTs = [
  {
    id: '1',
    momentId: 12345,
    playerName: 'LeBron James',
    team: 'Lakers',
    position: 'SF',
    sport: 'NBA',
    rarity: 'Legendary',
    metadata: {},
    imageUrl: 'https://example.com/lebron.jpg',
  },
  {
    id: '2',
    momentId: 67890,
    playerName: 'Stephen Curry',
    team: 'Warriors',
    position: 'PG',
    sport: 'NBA',
    rarity: 'Epic',
    metadata: {},
    imageUrl: 'https://example.com/curry.jpg',
  },
]

describe('CreateListingDialog', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseMarketplace.mockReturnValue({
      createListing: vi.fn(),
      loading: false,
      error: null,
    })

    mockUseNFTOwnership.mockReturnValue({
      ownedNFTs: mockOwnedNFTs,
      loading: false,
      error: null,
      refreshNFTs: vi.fn(),
    })
  })

  it('renders dialog with NFT selection and price input', () => {
    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    expect(screen.getByText('Create NFT Listing')).toBeInTheDocument()
    expect(screen.getByText('Select NFT')).toBeInTheDocument()
    expect(screen.getByText('Price (FLOW)')).toBeInTheDocument()
    expect(screen.getByText('Create Listing')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('displays owned NFTs in selection dropdown', async () => {
    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    // Click on NFT selector
    await user.click(screen.getByText('Select NFT'))
    
    // Check for NFT options
    expect(screen.getByText('LeBron James - Lakers (Legendary)')).toBeInTheDocument()
    expect(screen.getByText('Stephen Curry - Warriors (Epic)')).toBeInTheDocument()
  })

  it('validates required fields before submission', async () => {
    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    // Try to submit without selecting NFT or entering price
    await user.click(screen.getByText('Create Listing'))
    
    expect(screen.getByText('Please select an NFT')).toBeInTheDocument()
    expect(screen.getByText('Please enter a price')).toBeInTheDocument()
  })

  it('validates minimum price', async () => {
    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    // Select NFT
    await user.click(screen.getByText('Select NFT'))
    await user.click(screen.getByText('LeBron James - Lakers (Legendary)'))
    
    // Enter invalid price
    await user.type(screen.getByLabelText('Price (FLOW)'), '0')
    await user.click(screen.getByText('Create Listing'))
    
    expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument()
  })

  it('validates maximum price', async () => {
    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    // Select NFT
    await user.click(screen.getByText('Select NFT'))
    await user.click(screen.getByText('LeBron James - Lakers (Legendary)'))
    
    // Enter price that's too high
    await user.type(screen.getByLabelText('Price (FLOW)'), '10001')
    await user.click(screen.getByText('Create Listing'))
    
    expect(screen.getByText('Price cannot exceed 10,000 FLOW')).toBeInTheDocument()
  })

  it('successfully creates listing with valid data', async () => {
    const mockCreateListing = vi.fn().mockResolvedValue({ success: true })
    mockUseMarketplace.mockReturnValue({
      createListing: mockCreateListing,
      loading: false,
      error: null,
    })

    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    // Select NFT
    await user.click(screen.getByText('Select NFT'))
    await user.click(screen.getByText('LeBron James - Lakers (Legendary)'))
    
    // Enter price
    await user.type(screen.getByLabelText('Price (FLOW)'), '15.5')
    
    // Submit
    await user.click(screen.getByText('Create Listing'))
    
    await waitFor(() => {
      expect(mockCreateListing).toHaveBeenCalledWith({
        momentId: 12345,
        price: 15.5,
      })
    })
    
    expect(mockOnSuccess).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows loading state during submission', async () => {
    const mockCreateListing = vi.fn().mockImplementation(() => new Promise(() => {}))
    mockUseMarketplace.mockReturnValue({
      createListing: mockCreateListing,
      loading: true,
      error: null,
    })

    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    // Select NFT and enter price
    await user.click(screen.getByText('Select NFT'))
    await user.click(screen.getByText('LeBron James - Lakers (Legendary)'))
    await user.type(screen.getByLabelText('Price (FLOW)'), '15.5')
    
    // Submit
    await user.click(screen.getByText('Create Listing'))
    
    expect(screen.getByText('Creating Listing...')).toBeInTheDocument()
    expect(screen.getByText('Creating Listing...')).toBeDisabled()
  })

  it('handles creation errors', async () => {
    const mockCreateListing = vi.fn().mockRejectedValue(new Error('Network error'))
    mockUseMarketplace.mockReturnValue({
      createListing: mockCreateListing,
      loading: false,
      error: 'Network error',
    })

    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    // Select NFT and enter price
    await user.click(screen.getByText('Select NFT'))
    await user.click(screen.getByText('LeBron James - Lakers (Legendary)'))
    await user.type(screen.getByLabelText('Price (FLOW)'), '15.5')
    
    // Submit
    await user.click(screen.getByText('Create Listing'))
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('shows marketplace fee information', () => {
    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    expect(screen.getByText('Marketplace Fee: 2.5%')).toBeInTheDocument()
    expect(screen.getByText('You will receive 97.5% of the sale price')).toBeInTheDocument()
  })

  it('calculates and displays net proceeds', async () => {
    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    // Enter price
    await user.type(screen.getByLabelText('Price (FLOW)'), '100')
    
    // Check calculated proceeds
    expect(screen.getByText('You will receive: 97.5 FLOW')).toBeInTheDocument()
    expect(screen.getByText('Marketplace fee: 2.5 FLOW')).toBeInTheDocument()
  })

  it('closes dialog when cancel is clicked', async () => {
    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    await user.click(screen.getByText('Cancel'))
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows empty state when no NFTs owned', () => {
    mockUseNFTOwnership.mockReturnValue({
      ownedNFTs: [],
      loading: false,
      error: null,
      refreshNFTs: vi.fn(),
    })

    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    expect(screen.getByText('No NFTs available to list')).toBeInTheDocument()
    expect(screen.getByText('You need to own NFTs to create listings')).toBeInTheDocument()
  })

  it('shows loading state for NFTs', () => {
    mockUseNFTOwnership.mockReturnValue({
      ownedNFTs: [],
      loading: true,
      error: null,
      refreshNFTs: vi.fn(),
    })

    render(
      <CreateListingDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
    
    expect(screen.getByText('Loading your NFTs...')).toBeInTheDocument()
  })
})