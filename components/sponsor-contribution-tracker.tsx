"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, 
  Coins, 
  TrendingUp, 
  Calendar, 
  Trophy, 
  Users, 
  Target,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import { Sponsor, SponsoredTournament } from "@/lib/types/sponsorship"
import { sponsorshipService } from "@/lib/services/sponsorship-service"

interface ContributionEntry {
  id: string
  sponsorId: string
  sponsor: Sponsor
  tournamentId: string
  tournamentName: string
  contributionAmount: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  createdAt: Date
  targetParticipants?: number
  currentParticipants: number
  prizePoolEnhancement: number
}

interface SponsorContributionTrackerProps {
  tournamentId?: string
  showCreateForm?: boolean
}

export function SponsorContributionTracker({ 
  tournamentId, 
  showCreateForm = true 
}: SponsorContributionTrackerProps) {
  const [contributions, setContributions] = useState<ContributionEntry[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    sponsorId: '',
    contributionAmount: '',
    targetParticipants: '',
    customMessage: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sponsorData, sponsoredTournaments] = await Promise.all([
        sponsorshipService.getSponsors(),
        sponsorshipService.getSponsoredTournaments()
      ])
      
      setSponsors(sponsorData.filter(s => s.isActive))
      
      // Convert sponsored tournaments to contribution entries
      const contributionEntries: ContributionEntry[] = sponsoredTournaments.map(st => ({
        id: st.id,
        sponsorId: st.sponsorId,
        sponsor: st.sponsor,
        tournamentId: st.tournamentId,
        tournamentName: `Week ${Math.floor(Math.random() * 20) + 1} Championship`, // Mock tournament name
        contributionAmount: st.sponsorContribution,
        status: st.status as any,
        createdAt: st.createdAt,
        targetParticipants: 500, // Mock target
        currentParticipants: st.metrics.totalParticipants,
        prizePoolEnhancement: st.sponsorContribution
      }))
      
      setContributions(contributionEntries)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContribution = async () => {
    if (!formData.sponsorId || !formData.contributionAmount) return
    
    try {
      const sponsor = sponsors.find(s => s.id === formData.sponsorId)
      if (!sponsor) return
      
      // In a real implementation, this would create the sponsored tournament
      const newContribution: ContributionEntry = {
        id: `contribution-${Date.now()}`,
        sponsorId: formData.sponsorId,
        sponsor,
        tournamentId: tournamentId || `tournament-${Date.now()}`,
        tournamentName: `Week ${Math.floor(Math.random() * 20) + 1} Championship`,
        contributionAmount: parseFloat(formData.contributionAmount),
        status: 'pending',
        createdAt: new Date(),
        targetParticipants: formData.targetParticipants ? parseInt(formData.targetParticipants) : 500,
        currentParticipants: 0,
        prizePoolEnhancement: parseFloat(formData.contributionAmount)
      }
      
      setContributions(prev => [newContribution, ...prev])
      setShowDialog(false)
      setFormData({
        sponsorId: '',
        contributionAmount: '',
        targetParticipants: '',
        customMessage: ''
      })
    } catch (error) {
      console.error('Failed to create contribution:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'active':
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalContributions = contributions.reduce((sum, c) => sum + c.contributionAmount, 0)
  const activeContributions = contributions.filter(c => c.status === 'active').length
  const completedContributions = contributions.filter(c => c.status === 'completed').length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-8 bg-muted animate-pulse rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Sponsor Contributions</h3>
          <p className="text-muted-foreground">
            Track and manage sponsor contributions to tournament prize pools
          </p>
        </div>
        {showCreateForm && (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Contribution
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Sponsor Contribution</DialogTitle>
                <DialogDescription>
                  Create a new sponsor contribution for tournament enhancement
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sponsor">Sponsor</Label>
                  <Select value={formData.sponsorId} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, sponsorId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sponsor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sponsors.map((sponsor) => (
                        <SelectItem key={sponsor.id} value={sponsor.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={sponsor.logoUrl} alt={sponsor.name} />
                              <AvatarFallback>{sponsor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {sponsor.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="amount">Contribution Amount (FLOW)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="500"
                    value={formData.contributionAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, contributionAmount: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="target">Target Participants (Optional)</Label>
                  <Input
                    id="target"
                    type="number"
                    placeholder="500"
                    value={formData.targetParticipants}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetParticipants: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Custom Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Special tournament message..."
                    value={formData.customMessage}
                    onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateContribution}>
                  Create Contribution
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContributions.toLocaleString()} FLOW</div>
            <p className="text-xs text-muted-foreground">
              Across {contributions.length} tournaments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contributions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeContributions}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedContributions}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Contribution</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contributions.length > 0 ? (totalContributions / contributions.length).toFixed(0) : 0} FLOW
            </div>
            <p className="text-xs text-muted-foreground">
              Per tournament
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contributions List */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Recent Contributions</h4>
        {contributions.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">
              No sponsor contributions yet. Create your first contribution to get started.
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {contributions.map((contribution) => (
              <Card key={contribution.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={contribution.sponsor.logoUrl} alt={contribution.sponsor.name} />
                        <AvatarFallback>{contribution.sponsor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h5 className="font-semibold">{contribution.sponsor.name}</h5>
                          <Badge className={getStatusColor(contribution.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(contribution.status)}
                              {contribution.status}
                            </div>
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {contribution.tournamentName} • {contribution.createdAt.toLocaleDateString()}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold">{contribution.contributionAmount} FLOW</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span>{contribution.currentParticipants}/{contribution.targetParticipants} participants</span>
                          </div>
                        </div>
                        
                        {contribution.targetParticipants && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Participation Goal</span>
                              <span>{((contribution.currentParticipants / contribution.targetParticipants) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress 
                              value={(contribution.currentParticipants / contribution.targetParticipants) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        +{contribution.prizePoolEnhancement} FLOW
                      </div>
                      <div className="text-sm text-muted-foreground">Prize Pool Enhancement</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}