import { Sponsor, SponsoredTournament, SponsorAnalytics, SponsorshipRequest } from '@/lib/types/sponsorship'

// Mock data for development
const mockSponsors: Sponsor[] = [
  {
    id: 'sponsor-1',
    name: 'FlowSports',
    logoUrl: '/placeholder-logo.svg',
    website: 'https://flowsports.com',
    description: 'Leading blockchain sports platform',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'sponsor-2',
    name: 'CryptoGaming',
    logoUrl: '/placeholder-logo.svg',
    website: 'https://cryptogaming.io',
    description: 'Premier crypto gaming ecosystem',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'sponsor-3',
    name: 'NFT Marketplace',
    logoUrl: '/placeholder-logo.svg',
    website: 'https://nftmarketplace.com',
    description: 'Top NFT trading platform',
    isActive: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
]

const mockSponsoredTournaments: SponsoredTournament[] = [
  {
    id: 'sponsored-1',
    tournamentId: 'tournament-1',
    sponsorId: 'sponsor-1',
    sponsor: mockSponsors[0],
    sponsorContribution: 500.0,
    brandingConfig: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      bannerImageUrl: '/placeholder.jpg',
      customMessage: 'Powered by FlowSports - The Future of Blockchain Gaming',
      logoPlacement: 'all'
    },
    customRewards: {
      nftRewards: [
        {
          rank: 1,
          nftId: 'nft-special-1',
          nftName: 'FlowSports Champion Trophy',
          nftImageUrl: '/trophy-championship-podium-winner-celebration.jpg'
        }
      ],
      bonusFlowRewards: [
        { rank: 1, bonusAmount: 100 },
        { rank: 2, bonusAmount: 50 },
        { rank: 3, bonusAmount: 25 }
      ]
    },
    metrics: {
      totalParticipants: 245,
      totalViews: 1250,
      engagementRate: 0.78,
      clickThroughRate: 0.12,
      brandMentions: 45
    },
    status: 'active',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-14')
  },
  {
    id: 'sponsored-2',
    tournamentId: 'tournament-2',
    sponsorId: 'sponsor-2',
    sponsor: mockSponsors[1],
    sponsorContribution: 750.0,
    brandingConfig: {
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      bannerImageUrl: '/placeholder.jpg',
      customMessage: 'CryptoGaming Presents: Ultimate Fantasy Championship',
      logoPlacement: 'header'
    },
    customRewards: {
      nftRewards: [
        {
          rank: 1,
          nftId: 'nft-special-2',
          nftName: 'CryptoGaming Elite Badge',
          nftImageUrl: '/trophy-championship-podium-winner-celebration.jpg'
        }
      ],
      bonusFlowRewards: [
        { rank: 1, bonusAmount: 150 },
        { rank: 2, bonusAmount: 75 },
        { rank: 3, bonusAmount: 40 }
      ]
    },
    metrics: {
      totalParticipants: 180,
      totalViews: 890,
      engagementRate: 0.65,
      clickThroughRate: 0.08,
      brandMentions: 32
    },
    status: 'completed',
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-12-01')
  }
]

class SponsorshipService {
  // Sponsor Management
  async getSponsors(): Promise<Sponsor[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockSponsors
  }

  async getSponsor(sponsorId: string): Promise<Sponsor | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockSponsors.find(s => s.id === sponsorId) || null
  }

  async createSponsor(sponsorData: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sponsor> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const newSponsor: Sponsor = {
      ...sponsorData,
      id: `sponsor-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    mockSponsors.push(newSponsor)
    return newSponsor
  }

  async updateSponsor(sponsorId: string, updates: Partial<Sponsor>): Promise<Sponsor | null> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const sponsorIndex = mockSponsors.findIndex(s => s.id === sponsorId)
    if (sponsorIndex === -1) return null
    
    mockSponsors[sponsorIndex] = {
      ...mockSponsors[sponsorIndex],
      ...updates,
      updatedAt: new Date()
    }
    
    return mockSponsors[sponsorIndex]
  }

  // Sponsored Tournament Management
  async getSponsoredTournaments(): Promise<SponsoredTournament[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockSponsoredTournaments
  }

  async getSponsoredTournament(tournamentId: string): Promise<SponsoredTournament | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockSponsoredTournaments.find(st => st.tournamentId === tournamentId) || null
  }

  async createSponsoredTournament(
    tournamentData: Omit<SponsoredTournament, 'id' | 'sponsor' | 'metrics' | 'createdAt' | 'updatedAt'>
  ): Promise<SponsoredTournament> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const sponsor = mockSponsors.find(s => s.id === tournamentData.sponsorId)
    if (!sponsor) throw new Error('Sponsor not found')
    
    const newSponsoredTournament: SponsoredTournament = {
      ...tournamentData,
      id: `sponsored-${Date.now()}`,
      sponsor,
      metrics: {
        totalParticipants: 0,
        totalViews: 0,
        engagementRate: 0,
        clickThroughRate: 0,
        brandMentions: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    mockSponsoredTournaments.push(newSponsoredTournament)
    return newSponsoredTournament
  }

  // Analytics
  async getSponsorAnalytics(sponsorId: string, startDate: Date, endDate: Date): Promise<SponsorAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 700))
    
    const sponsorTournaments = mockSponsoredTournaments.filter(st => st.sponsorId === sponsorId)
    
    const totalContribution = sponsorTournaments.reduce((sum, st) => sum + st.sponsorContribution, 0)
    const totalParticipants = sponsorTournaments.reduce((sum, st) => sum + st.metrics.totalParticipants, 0)
    const totalViews = sponsorTournaments.reduce((sum, st) => sum + st.metrics.totalViews, 0)
    const avgEngagement = sponsorTournaments.length > 0 
      ? sponsorTournaments.reduce((sum, st) => sum + st.metrics.engagementRate, 0) / sponsorTournaments.length
      : 0
    const avgClickThrough = sponsorTournaments.length > 0
      ? sponsorTournaments.reduce((sum, st) => sum + st.metrics.clickThroughRate, 0) / sponsorTournaments.length
      : 0
    const totalBrandMentions = sponsorTournaments.reduce((sum, st) => sum + st.metrics.brandMentions, 0)
    
    return {
      sponsorId,
      period: { startDate, endDate },
      tournaments: {
        total: sponsorTournaments.length,
        completed: sponsorTournaments.filter(st => st.status === 'completed').length,
        totalContribution
      },
      engagement: {
        totalParticipants,
        totalViews,
        averageEngagementRate: avgEngagement,
        clickThroughRate: avgClickThrough,
        brandMentions: totalBrandMentions
      },
      roi: {
        totalSpent: totalContribution,
        estimatedReach: totalViews * 2.5, // Estimated multiplier for reach
        costPerEngagement: totalParticipants > 0 ? totalContribution / totalParticipants : 0,
        participantAcquisitionCost: totalParticipants > 0 ? totalContribution / totalParticipants : 0
      }
    }
  }

  // Sponsorship Requests
  async submitSponsorshipRequest(request: SponsorshipRequest): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate validation
    if (!request.sponsorName || !request.contactEmail) {
      return { success: false, message: 'Missing required fields' }
    }
    
    // In a real implementation, this would save to database and notify admins
    console.log('New sponsorship request:', request)
    
    return { 
      success: true, 
      message: 'Sponsorship request submitted successfully. We will contact you within 48 hours.' 
    }
  }

  // Tournament Enhancement
  async enhanceTournamentWithSponsorship(
    tournamentId: string, 
    sponsorId: string, 
    contribution: number
  ): Promise<{ success: boolean; newPrizePool: number }> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    // In a real implementation, this would:
    // 1. Add sponsor contribution to tournament prize pool
    // 2. Update tournament branding
    // 3. Process FLOW token transfer
    
    const basePool = 1000 // Mock base prize pool
    const newPrizePool = basePool + contribution
    
    return { success: true, newPrizePool }
  }

  // Metrics Tracking
  async trackSponsorEngagement(
    sponsoredTournamentId: string, 
    eventType: 'view' | 'click' | 'mention' | 'participation'
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const tournament = mockSponsoredTournaments.find(st => st.id === sponsoredTournamentId)
    if (!tournament) return
    
    switch (eventType) {
      case 'view':
        tournament.metrics.totalViews++
        break
      case 'click':
        // Update click-through rate calculation
        break
      case 'mention':
        tournament.metrics.brandMentions++
        break
      case 'participation':
        tournament.metrics.totalParticipants++
        break
    }
    
    tournament.updatedAt = new Date()
  }
}

export const sponsorshipService = new SponsorshipService()