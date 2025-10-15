export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  website?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SponsoredTournament {
  id: string;
  tournamentId: string;
  sponsorId: string;
  sponsor: Sponsor;
  sponsorContribution: number; // FLOW tokens
  brandingConfig: {
    primaryColor?: string;
    secondaryColor?: string;
    bannerImageUrl?: string;
    customMessage?: string;
    logoPlacement: 'header' | 'sidebar' | 'footer' | 'all';
  };
  customRewards: {
    nftRewards: Array<{
      rank: number;
      nftId: string;
      nftName: string;
      nftImageUrl: string;
    }>;
    bonusFlowRewards: Array<{
      rank: number;
      bonusAmount: number;
    }>;
  };
  metrics: {
    totalParticipants: number;
    totalViews: number;
    engagementRate: number;
    clickThroughRate: number;
    brandMentions: number;
  };
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface SponsorAnalytics {
  sponsorId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  tournaments: {
    total: number;
    completed: number;
    totalContribution: number;
  };
  engagement: {
    totalParticipants: number;
    totalViews: number;
    averageEngagementRate: number;
    clickThroughRate: number;
    brandMentions: number;
  };
  roi: {
    totalSpent: number;
    estimatedReach: number;
    costPerEngagement: number;
    participantAcquisitionCost: number;
  };
}

export interface SponsorshipRequest {
  sponsorName: string;
  contactEmail: string;
  website?: string;
  proposedContribution: number;
  tournamentPreferences: {
    frequency: 'weekly' | 'monthly' | 'seasonal';
    sportPreference: 'NBA' | 'NFL' | 'both';
    targetAudience: string;
  };
  brandingRequirements: {
    logoUrl: string;
    primaryColor: string;
    customMessage: string;
  };
  customRewards?: {
    nftRewards: boolean;
    bonusRewards: boolean;
    exclusiveContent: boolean;
  };
}