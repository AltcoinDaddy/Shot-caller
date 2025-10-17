import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ResultsDashboardCard } from '@/components/results-dashboard-card'

// Mock the useResults hook
vi.mock('@/hooks/use-results', () => ({
  useResults: () => ({
    loading: false,
    error: null,
    getAvailableContests: vi.fn().mockResolvedValue([
      {
        id: 'contest_1',
        weekId: 15,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        entryFee: 10,
        prizePool: 2500,
        totalParticipants: 156,
        maxParticipants: 500,
        contestType: 'weekly',
        status: 'upcoming' as const
      }
    ]),
    getContestResults: vi.fn().mockResolvedValue([
      {
        id: 'result_1',
        weekId: 14,
        rank: 3,
        totalPoints: 1456,
        totalParticipants: 247,
        prizeWon: 25.5,
        status: 'completed' as const,
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]),
    getWeeklyStats: vi.fn().mockResolvedValue({
      currentWeekPoints: 1456,
      rankChange: 13,
      bestWeekRank: 1,
      averageRank: 8.5
    })
  })
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

describe('ResultsDashboardCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the results dashboard card', async () => {
    render(<ResultsDashboardCard />)
    
    // Check if the card title is rendered
    expect(screen.getByText('RESULTS')).toBeInTheDocument()
    
    // Wait for data to load and check if results are displayed
    await waitFor(() => {
      expect(screen.getByText(/3rd \/ 247/)).toBeInTheDocument()
    })
  })

  it('displays latest contest result information', async () => {
    render(<ResultsDashboardCard />)
    
    await waitFor(() => {
      // Check rank display
      expect(screen.getByText(/3rd \/ 247/)).toBeInTheDocument()
      
      // Check points display
      expect(screen.getByText(/1456 pts/)).toBeInTheDocument()
      
      // Check week information
      expect(screen.getByText(/Week 14 Result/)).toBeInTheDocument()
    })
  })

  it('shows prize information for winning results', async () => {
    render(<ResultsDashboardCard />)
    
    await waitFor(() => {
      // Check for prize badge
      expect(screen.getByText(/\+25\.5 FLOW/)).toBeInTheDocument()
      
      // Check for prize winner text
      expect(screen.getByText(/Prize Winner!/)).toBeInTheDocument()
    })
  })

  it('displays rank change indicators', async () => {
    render(<ResultsDashboardCard />)
    
    await waitFor(() => {
      // Check for positive rank change
      expect(screen.getByText(/\+13 positions/)).toBeInTheDocument()
    })
  })

  it('shows upcoming contest information', async () => {
    render(<ResultsDashboardCard />)
    
    await waitFor(() => {
      // Check for next contest section
      expect(screen.getByText(/Next Contest/)).toBeInTheDocument()
      
      // Check for week information
      expect(screen.getByText(/Week 15/)).toBeInTheDocument()
      
      // Check for entry fee
      expect(screen.getByText(/10 FLOW entry/)).toBeInTheDocument()
      
      // Check for participants
      expect(screen.getByText(/156 joined/)).toBeInTheDocument()
    })
  })

  it('renders quick action buttons', async () => {
    render(<ResultsDashboardCard />)
    
    await waitFor(() => {
      // Check for quick action buttons
      expect(screen.getByText('View Breakdown')).toBeInTheDocument()
      expect(screen.getByText('Upcoming')).toBeInTheDocument()
    })
  })

  it('renders main action button', async () => {
    render(<ResultsDashboardCard />)
    
    await waitFor(() => {
      // Check for main action button
      expect(screen.getByText('View Details')).toBeInTheDocument()
    })
  })
})