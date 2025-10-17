import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BreadcrumbNavigation } from '@/components/breadcrumb-navigation'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

const mockUsePathname = vi.mocked(await import('next/navigation')).usePathname

describe('BreadcrumbNavigation', () => {
  it('should not render on home page', () => {
    mockUsePathname.mockReturnValue('/')
    
    const { container } = render(<BreadcrumbNavigation />)
    expect(container.firstChild).toBeNull()
  })

  it('should render breadcrumbs for dashboard page', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    
    render(<BreadcrumbNavigation />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('should render breadcrumbs for feature pages with dashboard link', () => {
    mockUsePathname.mockReturnValue('/team')
    
    render(<BreadcrumbNavigation />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('My Team')).toBeInTheDocument()
  })

  it('should render breadcrumbs for leaderboard page', () => {
    mockUsePathname.mockReturnValue('/leaderboard')
    
    render(<BreadcrumbNavigation />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Leaderboard')).toBeInTheDocument()
  })

  it('should render breadcrumbs for profile page', () => {
    mockUsePathname.mockReturnValue('/profile')
    
    render(<BreadcrumbNavigation />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('should handle unknown routes with capitalized labels', () => {
    mockUsePathname.mockReturnValue('/unknown-route')
    
    render(<BreadcrumbNavigation />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Unknown-route')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    
    const { container } = render(<BreadcrumbNavigation className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})