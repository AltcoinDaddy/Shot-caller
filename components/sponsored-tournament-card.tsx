"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Coins, Trophy, Users, Timer, ExternalLink, Star, Gift } from "lucide-react"
import { SponsoredTournament } from "@/lib/types/sponsorship"

interface SponsoredTournamentCardProps {
  tournament: SponsoredTournament
  onEnter?: (tournamentId: string, entryFee: number) => void
  onSponsorClick?: (sponsorId: string) => void
  showMetrics?: boolean
}

export function SponsoredTournamentCard({ 
  tournament, 
  onEnter, 
  onSponsorClick,
  showMetrics = false 
}: SponsoredTournamentCardProps) {
  const [isEntering, setIsEntering] = useState(false)

  const handleEnter = async () => {
    if (!onEnter) return
    
    setIsEntering(true)
    try {
      // Mock entry fee - in real implementation, get from tournament data
      const entryFee = 10.0
      await onEnter(tournament.tournamentId, entryFee)
    } finally {
      setIsEntering(false)
    }
  }

  const handleSponsorClick = () => {
    if (onSponsorClick) {
      onSponsorClick(tournament.sponsorId)
    } else if (tournament.sponsor.website) {
      window.open(tournament.sponsor.website, '_blank')
    }
  }

  // Calculate participation percentage
  const maxParticipants = 500 // Mock max participants
  const participationPercentage = (tournament.metrics.totalParticipants / maxParticipants) * 100

  // Apply sponsor branding
  const cardStyle = tournament.brandingConfig.primaryColor 
    ? { 
        borderColor: tournament.brandingConfig.primaryColor + '40',
        background: `linear-gradient(135deg, ${tournament.brandingConfig.primaryColor}08 0%, ${tournament.brandingConfig.secondaryColor || tournament.brandingConfig.primaryColor}05 100%)`
      }
    : {}

  return (
    <Card className="relative overflow-hidden" style={cardStyle}>
      {/* Sponsor Banner */}
      {tournament.brandingConfig.bannerImageUrl && (
        <div 
          className="h-24 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${tournament.brandingConfig.bannerImageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute top-2 right-2">
            <Badge 
              variant="secondary" 
              className="bg-white/90 text-black font-semibold"
            >
              <Star className="h-3 w-3 mr-1" />
              Sponsored
            </Badge>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        {/* Sponsor Info */}
        <div className="flex items-center justify-between mb-3">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleSponsorClick}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={tournament.sponsor.logoUrl} alt={tournament.sponsor.name} />
              <AvatarFallback>{tournament.sponsor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium flex items-center gap-1">
                {tournament.sponsor.name}
                <ExternalLink className="h-3 w-3" />
              </div>
              <div className="text-xs text-muted-foreground">Sponsor</div>
            </div>
          </div>
          <Badge variant={tournament.status === "active" ? "default" : "secondary"}>
            {tournament.status}
          </Badge>
        </div>

        {/* Custom Message */}
        {tournament.brandingConfig.customMessage && (
          <div 
            className="text-sm font-medium mb-2 p-2 rounded-md"
            style={{ 
              backgroundColor: tournament.brandingConfig.primaryColor + '15',
              color: tournament.brandingConfig.primaryColor 
            }}
          >
            {tournament.brandingConfig.customMessage}
          </div>
        )}

        <CardTitle className="text-xl">Week 15 Championship</CardTitle>
        <CardDescription>
          Enhanced by {tournament.sponsor.name} • +{tournament.sponsorContribution} FLOW Prize Pool
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prize Pool Enhancement */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="font-semibold">Enhanced Prize Pool</div>
              <div className="text-sm text-muted-foreground">
                Base: 1,000 FLOW + Sponsor: {tournament.sponsorContribution} FLOW
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-500">
              {(1000 + tournament.sponsorContribution).toLocaleString()} FLOW
            </div>
          </div>
        </div>

        {/* Custom Rewards */}
        {tournament.customRewards.nftRewards.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Gift className="h-4 w-4" />
              Exclusive Sponsor Rewards
            </div>
            {tournament.customRewards.nftRewards.map((reward, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
                <div className="h-8 w-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {reward.rank}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{reward.nftName}</div>
                  <div className="text-xs text-muted-foreground">Exclusive NFT Reward</div>
                </div>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </div>
            ))}
          </div>
        )}

        {/* Bonus FLOW Rewards */}
        {tournament.customRewards.bonusFlowRewards.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Bonus FLOW Rewards</div>
            <div className="grid grid-cols-3 gap-2">
              {tournament.customRewards.bonusFlowRewards.slice(0, 3).map((bonus, index) => (
                <div key={index} className="text-center p-2 bg-muted/30 rounded-md">
                  <div className="text-xs text-muted-foreground">#{bonus.rank}</div>
                  <div className="font-semibold text-sm">+{bonus.bonusAmount} FLOW</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tournament Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Participants</span>
            <span>{tournament.metrics.totalParticipants}/{maxParticipants}</span>
          </div>
          <Progress value={participationPercentage} className="w-full" />
          
          {showMetrics && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-2 bg-muted/30 rounded-md">
                <div className="font-semibold">{tournament.metrics.totalViews}</div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded-md">
                <div className="font-semibold">{(tournament.metrics.engagementRate * 100).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Engagement</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            <span>Time Left: 2d 14h</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={handleEnter}
          disabled={isEntering || tournament.metrics.totalParticipants >= maxParticipants}
          style={{
            backgroundColor: tournament.brandingConfig.primaryColor,
            borderColor: tournament.brandingConfig.primaryColor
          }}
        >
          {isEntering ? (
            "Entering..."
          ) : tournament.metrics.totalParticipants >= maxParticipants ? (
            "Tournament Full"
          ) : (
            "Enter Tournament - 10 FLOW"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}