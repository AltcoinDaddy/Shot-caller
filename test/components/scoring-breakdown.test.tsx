import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScoringBreakdown } from '@/components/scoring-breakdown'

// Mock the scoring hook
const mockUseScoring = vi.fn()
vi.mock('@/hooks/use-scoring', () => ({
  useScoring: mockUseScoring,
}))

const mockScoringData = {
  weekId: 5,
  totalPoints: 125.5,
  playerScores: [
    {
      momentId: 12345,
      playerName: 'LeBron James',
      team: 'Lakers',
      position: 'SF',
      sport: 'NBA',
      fantasyPoints: 45.2,
      stats: {
        points: 28,
        rebounds: 12,
        assists: 8,
        steals: 2,
        blocks: 1,
      },
      breakdown: {
        points: 28.0,
        rebounds: 12.0,
        assists: 4.0,
        steals: 1.0,
        blocks: 0.2,
      },
    },
    {
      momentId: 67890,
      playerName: 'Stephen Curry',
      team: 'Warriors',
      position: 'PG',
      sport: 'NBA',
      fantasyPoints: 38.7,
      stats: {
        points: 32,
        rebounds: 4,
        assists: 9,
        steals: 1,
        blocks: 0,
        threePointers: 6,
      },
      breakdown: {
        points: 32.0,
        rebounds: 4.0,
        assists: 4.5,
        steals: 0.5,
        threePointers: -1.3, // Bonus for 3-pointers
      },
    },
    {
      momentId: 11111,
      playerName: 'Patrick Mahomes',
      team: 'Chiefs',
      position: 'QB',
      sport: 'NFL',
      fantasyPoints: 41.6,
      stats: {
        passingYards: 325,
        passingTDs: 3,
        rushingYards: 45,
        interceptions: 1,
      },
      breakdown: {
        passingYards: 13.0,
        passingTDs: 18.0,
        rushingYards: 4.5,
        interceptions: -2.0,
        completionBonus: 8.1,
      },
    },
  ],
  boosterEffects: [
    {
      type: 'disney_energy',
      effect: 'score_multiplier',
      value: 1.05,
      appliedTo: [12345, 67890],
      bonusPoints: 4.2,
    },
  ],
  weeklyRank: 15,
  totalParticipants: 156,
}

describe('ScoringBreakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseScoring.mockReturnValue({
      scoringData: mockScoringData,
      loading: false,
      error: null,
      refreshScoring: vi.fn(),
    })
  })

  it('renders scoring breakdown with total points', () => {
    render(<ScoringBreakdown weekId={5} />)
    
    expect(screen.getByText('Week 5 Scoring Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Total Points: 125.5')).toBeInTheDocument()
    expect(screen.getByText('Rank: 15 / 156')).toBeInTheDocument()
  })

  it('displays individual player scores', () => {
    render(<ScoringBreakdown weekId={5} />)
    
    expect(screen.getByText('LeBron James')).toBeInTheDocument()
    expect(screen.getByText('45.2 pts')).toBeInTheDocument()
    expect(screen.getByText('Stephen Curry')).toBeInTheDocument()
    expect(screen.getByText('38.7 pts')).toBeInTheDocument()
    expect(screen.getByText('Patrick Mahomes')).toBeInTheDocument()
    expect(screen.getByText('41.6 pts')).toBeInTheDocument()
  })

  it('shows detailed stat breakdown when player is expanded', () => {
    render(<ScoringBreakdown weekId={5} />)
    
    // Click on LeBron James to expand
    fireEvent.click(screen.getByText('LeBron James'))
    
    // Check for detailed stats
    expect(screen.getByText('Points: 28 (28.0 pts)')).toBeInTheDocument()
    expect(screen.getByText('Rebounds: 12 (12.0 pts)')).toBeInTheDocument()
    expect(screen.getByText('Assists: 8 (4.0 pts)')).toBeInTheDocument()
    expect(screen.getByText('Steals: 2 (1.0 pts)')).toBeInTheDocument()
    expect(screen.getByText('Blocks: 1 (0.2 pts)')).toBeInTheDocument()
  })

  it('displays booster effects', () => {
    render(<ScoringBreakdown weekId={5} />)
    
    expect(screen.getByText('Active Boosters')).toBeInTheDocument()
    expect(screen.getByText('Disney Energy Booster')).toBeInTheDocument()
    expect(screen.getByText('+5% Score Multiplier')).toBeInTheDocument()
    expect(screen.getByText('Bonus: +4.2 pts')).toBeInTheDocument()
  })

  it('shows different stats for NFL players', () => {
    render(<ScoringBreakdown weekId={5} />)
    
    // Click on Patrick Mahomes to expand
    fireEvent.click(screen.getByText('Patrick Mahomes'))
    
    // Check for NFL-specific stats
    expect(screen.getByText('Passing Yards: 325 (13.0 pts)')).toBeInTheDocument()
    expect(screen.getByText('Passing TDs: 3 (18.0 pts)')).toBeInTheDocument()
    expect(screen.getByText('Rushing Yards: 45 (4.5 pts)')).toBeInTheDocument()
    expect(screen.getByText('Interceptions: 1 (-2.0 pts)')).toBeInTheDocument()
  })

  it('handles loading state', () => {
    mockUseScoring.mockReturnValue({
      scoringData: null,
      loading: true,
      error: null,
      refreshScoring: vi.fn(),
    })

    render(<ScoringBreakdown weekId={5} />)
    
    expect(screen.getByText('Loading scoring data...')).toBeInTheDocument()
  })

  it('handles error state', () => {
    mockUseScoring.mockReturnValue({
      scoringData: null,
      loading: false,
      error: 'Failed to load scoring data',
      refreshScoring: vi.fn(),
    })

    render(<ScoringBreakdown weekId={5} />)
    
    expect(screen.getByText('Failed to load scoring data')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('allows refreshing scoring data', () => {
    const mockRefreshScoring = vi.fn()
    mockUseScoring.mockReturnValue({
      scoringData: mockScoringData,
      loading: false,
      error: null,
      refreshScoring: mockRefreshScoring,
    })

    render(<ScoringBreakdown weekId={5} />)
    
    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)
    
    expect(mockRefreshScoring).toHaveBeenCalled()
  })

  it('shows scoring rules explanation', () => {
    render(<ScoringBreakdown weekId={5} />)
    
    const rulesButton = screen.getByText('Scoring Rules')
    fireEvent.click(rulesButton)
    
    expect(screen.getByText('NBA Scoring')).toBeInTheDocument()
    expect(screen.getByText('Points: 1 pt each')).toBeInTheDocument()
    expect(screen.getByText('Rebounds: 1 pt each')).toBeInTheDocument()
    expect(screen.getByText('Assists: 0.5 pts each')).toBeInTheDocument()
    
    expect(screen.getByText('NFL Scoring')).toBeInTheDocument()
    expect(screen.getByText('Passing Yards: 1 pt per 25 yards')).toBeInTheDocument()
    expect(screen.getByText('Passing TDs: 6 pts each')).toBeInTheDocument()
  })

  it('highlights best performing player', () => {
    render(<ScoringBreakdown weekId={5} />)
    
    // LeBron James has the highest score (45.2)
    const bestPlayer = screen.getByTestId('player-12345')
    expect(bestPlayer).toHaveClass('border-yellow-400', 'bg-yellow-50')
    expect(screen.getByText('Top Performer')).toBeInTheDocument()
  })

  it('shows comparison to league average', () => {
    render(<ScoringBreakdown weekId={5} />)
    
    expect(screen.getByText('League Average: 98.3 pts')).toBeInTheDocument()
    expect(screen.getByText('+27.2 pts above average')).toBeInTheDocument()
  })
})