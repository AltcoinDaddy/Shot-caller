import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardCard, DashboardCardProps, QuickAction } from '@/components/dashboard-card'
import { Home, User, Settings } from 'lucide-react'

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}))

describe('DashboardCard', () => {
  const defaultProps: DashboardCardProps = {
    title: 'Test Card',
    description: 'Test description',
    href: '/test',
    icon: Home
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders with required props', () => {
      render(<DashboardCard {...defaultProps} />)
      
      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
      expect(screen.getByRole('link')).toHaveAttribute('href', '/test')
    })

    it('renders icon correctly', () => {
      render(<DashboardCard {...defaultProps} />)
      
      // Check if the icon is rendered (Home icon should be present)
      const iconElement = document.querySelector('svg')
      expect(iconElement).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <DashboardCard {...defaultProps} className="custom-class" />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Stats Display', () => {
    it('renders stats when provided', () => {
      const statsProps = {
        ...defaultProps,
        stats: {
          primary: '42',
          secondary: '+5',
          label: 'Total Points'
        }
      }

      render(<DashboardCard {...statsProps} />)
      
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('+5')).toBeInTheDocument()
      expect(screen.getByText('Total Points')).toBeInTheDocument()
    })

    it('renders stats without secondary value', () => {
      const statsProps = {
        ...defaultProps,
        stats: {
          primary: 100,
          label: 'Score'
        }
      }

      render(<DashboardCard {...statsProps} />)
      
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('Score')).toBeInTheDocument()
    })

    it('does not render stats section when not provided', () => {
      render(<DashboardCard {...defaultProps} />)
      
      // Should not find any stats-related text
      expect(screen.queryByText('Total Points')).not.toBeInTheDocument()
    })
  })

  describe('Quick Actions', () => {
    it('renders quick action buttons', () => {
      const mockAction = vi.fn()
      const quickActions: QuickAction[] = [
        {
          label: 'Edit',
          onClick: mockAction,
          icon: Settings,
          variant: 'outline'
        },
        {
          label: 'View Profile',
          onClick: mockAction,
          icon: User
        }
      ]

      render(<DashboardCard {...defaultProps} quickActions={quickActions} />)
      
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('View Profile')).toBeInTheDocument()
    })

    it('calls onClick handler when quick action is clicked', () => {
      const mockAction = vi.fn()
      const quickActions: QuickAction[] = [
        {
          label: 'Test Action',
          onClick: mockAction
        }
      ]

      render(<DashboardCard {...defaultProps} quickActions={quickActions} />)
      
      fireEvent.click(screen.getByText('Test Action'))
      expect(mockAction).toHaveBeenCalledTimes(1)
    })

    it('renders quick actions without icons', () => {
      const mockAction = vi.fn()
      const quickActions: QuickAction[] = [
        {
          label: 'No Icon Action',
          onClick: mockAction
        }
      ]

      render(<DashboardCard {...defaultProps} quickActions={quickActions} />)
      
      expect(screen.getByText('No Icon Action')).toBeInTheDocument()
    })
  })

  describe('Custom Content', () => {
    it('renders children content', () => {
      render(
        <DashboardCard {...defaultProps}>
          <div>Custom content here</div>
        </DashboardCard>
      )
      
      expect(screen.getByText('Custom content here')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('renders skeleton when loading is true', () => {
      render(<DashboardCard {...defaultProps} loading={true} />)
      
      // Should not render the actual content
      expect(screen.queryByText('Test Card')).not.toBeInTheDocument()
      
      // Should render skeleton elements
      const skeletons = document.querySelectorAll('[data-testid="skeleton"], .animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('does not render main content when loading', () => {
      render(<DashboardCard {...defaultProps} loading={true} />)
      
      expect(screen.queryByText('Test Card')).not.toBeInTheDocument()
      expect(screen.queryByText('Test description')).not.toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('renders error state when error is provided', () => {
      const errorProps = {
        ...defaultProps,
        error: 'Failed to load data'
      }

      render(<DashboardCard {...errorProps} />)
      
      // Check that error message appears (there will be multiple instances)
      const errorMessages = screen.getAllByText('Failed to load data')
      expect(errorMessages.length).toBeGreaterThan(0)
      
      // Check that the error alert is present
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders retry button when onRetry is provided', () => {
      const mockRetry = vi.fn()
      const errorProps = {
        ...defaultProps,
        error: 'Network error',
        onRetry: mockRetry
      }

      render(<DashboardCard {...errorProps} />)
      
      const retryButton = screen.getByText('Try Again')
      expect(retryButton).toBeInTheDocument()
      
      fireEvent.click(retryButton)
      expect(mockRetry).toHaveBeenCalledTimes(1)
    })

    it('does not render retry button when onRetry is not provided', () => {
      const errorProps = {
        ...defaultProps,
        error: 'Network error'
      }

      render(<DashboardCard {...errorProps} />)
      
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
    })

    it('does not render main content when in error state', () => {
      const errorProps = {
        ...defaultProps,
        error: 'Something went wrong'
      }

      render(<DashboardCard {...errorProps} />)
      
      // Should still show title but not description or other content
      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.queryByText('Test description')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper link accessibility', () => {
      render(<DashboardCard {...defaultProps} />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/test')
    })

    it('has proper button accessibility for quick actions', () => {
      const mockAction = vi.fn()
      const quickActions: QuickAction[] = [
        {
          label: 'Accessible Action',
          onClick: mockAction
        }
      ]

      render(<DashboardCard {...defaultProps} quickActions={quickActions} />)
      
      const button = screen.getByRole('button', { name: 'Accessible Action' })
      expect(button).toBeInTheDocument()
    })

    it('has proper button accessibility for retry action', () => {
      const mockRetry = vi.fn()
      const errorProps = {
        ...defaultProps,
        error: 'Network error',
        onRetry: mockRetry
      }

      render(<DashboardCard {...errorProps} />)
      
      const retryButton = screen.getByRole('button', { name: 'Try Again' })
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('Styling and Animation Classes', () => {
    it('applies hover and animation classes', () => {
      const { container } = render(<DashboardCard {...defaultProps} />)
      
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('group')
      expect(card).toHaveClass('transition-all')
      expect(card).toHaveClass('hover:scale-[1.02]')
    })

    it('applies gradient background classes', () => {
      const { container } = render(<DashboardCard {...defaultProps} />)
      
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('bg-gradient-to-br')
    })
  })
})