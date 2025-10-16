import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WalletConnector } from '@/components/wallet-connector'

// Mock FCL
const mockAuthenticate = vi.fn()
const mockUnauthenticate = vi.fn()
const mockCurrentUser = {
  subscribe: vi.fn((callback) => {
    callback({ addr: null, loggedIn: false })
    return () => {}
  })
}

vi.mock('@onflow/fcl', () => ({
  authenticate: mockAuthenticate,
  unauthenticate: mockUnauthenticate,
  currentUser: mockCurrentUser,
}))

describe('WalletConnector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders connect button when not connected', () => {
    render(<WalletConnector />)
    
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
  })

  it('calls authenticate when connect button is clicked', async () => {
    render(<WalletConnector />)
    
    const connectButton = screen.getByText('Connect Wallet')
    fireEvent.click(connectButton)
    
    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalled()
    })
  })

  it('shows wallet address when connected', () => {
    // Mock connected state
    mockCurrentUser.subscribe.mockImplementation((callback) => {
      callback({ addr: '0x1234567890abcdef', loggedIn: true })
      return () => {}
    })

    render(<WalletConnector />)
    
    expect(screen.getByText(/0x1234/)).toBeInTheDocument()
  })

  it('shows disconnect option when connected', () => {
    mockCurrentUser.subscribe.mockImplementation((callback) => {
      callback({ addr: '0x1234567890abcdef', loggedIn: true })
      return () => {}
    })

    render(<WalletConnector />)
    
    const disconnectButton = screen.getByText('Disconnect')
    expect(disconnectButton).toBeInTheDocument()
  })

  it('calls unauthenticate when disconnect is clicked', async () => {
    mockCurrentUser.subscribe.mockImplementation((callback) => {
      callback({ addr: '0x1234567890abcdef', loggedIn: true })
      return () => {}
    })

    render(<WalletConnector />)
    
    const disconnectButton = screen.getByText('Disconnect')
    fireEvent.click(disconnectButton)
    
    await waitFor(() => {
      expect(mockUnauthenticate).toHaveBeenCalled()
    })
  })
})