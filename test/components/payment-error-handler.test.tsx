import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaymentErrorHandler } from '@/components/payment-error-handler'

// Mock the toast hook
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

const mockOnRetry = vi.fn()
const mockOnCancel = vi.fn()

describe('PaymentErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders error message and retry button', () => {
    render(
      <PaymentErrorHandler
        error="Insufficient FLOW balance"
        onRetry={mockOnRetry}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByText('Payment Failed')).toBeInTheDocument()
    expect(screen.getByText('Insufficient FLOW balance')).toBeInTheDocument()
    expect(screen.getByText('Retry Payment')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('handles retry action', async () => {
    render(
      <PaymentErrorHandler
        error="Network error"
        onRetry={mockOnRetry}
        onCancel={mockOnCancel}
      />
    )
    
    const retryButton = screen.getByText('Retry Payment')
    fireEvent.click(retryButton)
    
    await waitFor(() => {
      expect(mockOnRetry).toHaveBeenCalled()
    })
  })

  it('handles cancel action', async () => {
    render(
      <PaymentErrorHandler
        error="Transaction rejected"
        onRetry={mockOnRetry}
        onCancel={mockOnCancel}
      />
    )
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  it('shows specific error messages for different error types', () => {
    const { rerender } = render(
      <PaymentErrorHandler
        error="insufficient_balance"
        onRetry={mockOnRetry}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByText('Insufficient FLOW tokens in your wallet')).toBeInTheDocument()
    
    rerender(
      <PaymentErrorHandler
        error="transaction_failed"
        onRetry={mockOnRetry}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByText('Transaction failed to process')).toBeInTheDocument()
    
    rerender(
      <PaymentErrorHandler
        error="wallet_disconnected"
        onRetry={mockOnRetry}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByText('Wallet connection lost')).toBeInTheDocument()
  })

  it('shows retry count when provided', () => {
    render(
      <PaymentErrorHandler
        error="Network timeout"
        onRetry={mockOnRetry}
        onCancel={mockOnCancel}
        retryCount={2}
        maxRetries={3}
      />
    )
    
    expect(screen.getByText('Attempt 2 of 3')).toBeInTheDocument()
  })

  it('disables retry button when max retries reached', () => {
    render(
      <PaymentErrorHandler
        error="Persistent error"
        onRetry={mockOnRetry}
        onCancel={mockOnCancel}
        retryCount={3}
        maxRetries={3}
      />
    )
    
    const retryButton = screen.getByText('Max Retries Reached')
    expect(retryButton).toBeDisabled()
  })

  it('shows loading state during retry', () => {
    render(
      <PaymentErrorHandler
        error="Temporary error"
        onRetry={mockOnRetry}
        onCancel={mockOnCancel}
        isRetrying={true}
      />
    )
    
    expect(screen.getByText('Retrying...')).toBeInTheDocument()
    expect(screen.getByText('Retrying...')).toBeDisabled()
  })

  it('provides helpful suggestions for different error types', () => {
    render(
      <PaymentErrorHandler
        error="insufficient_balance"
        onRetry={mockOnRetry}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByText('Please add FLOW tokens to your wallet and try again')).toBeInTheDocument()
  })

  it('shows contact support option for persistent errors', () => {
    render(
      <PaymentErrorHandler
        error="Unknown error"
        onRetry={mockOnRetry}
        onCancel={mockOnCancel}
        retryCount={3}
        maxRetries={3}
      />
    )
    
    expect(screen.getByText('Contact Support')).toBeInTheDocument()
  })
})