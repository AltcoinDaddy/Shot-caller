"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer, 
  MessageSquare, 
  DollarSign,
  Trophy,
  Target,
  Calendar,
  Download
} from "lucide-react"
import { SponsorAnalytics, Sponsor } from "@/lib/types/sponsorship"
import { sponsorshipService } from "@/lib/services/sponsorship-service"

interface SponsorAnalyticsDashboardProps {
  sponsorId?: string
  showAllSponsors?: boolean
}

export function SponsorAnalyticsDashboard({ 
  sponsorId, 
  showAllSponsors = false 
}: SponsorAnalyticsDashboardProps) {
  const [selectedSponsor, setSelectedSponsor] = useState<string>(sponsorId || '')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d')
  const [analytics, setAnalytics] = useState<SponsorAnalytics | null>(null)
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSponsors()
  }, [])

  useEffect(() => {
    if (selectedSponsor) {
      loadAnalytics()
    }
  }, [selectedSponsor, selectedPeriod])

  const loadSponsors = async () => {
    try {
      const sponsorData = await sponsorshipService.getSponsors()
      setSponsors(sponsorData.filter(s => s.isActive))
      if (!selectedSponsor && sponsorData.length > 0) {
        setSelectedSponsor(sponsorData[0].id)
      }
    } catch (error) {
      console.error('Failed to load sponsors:', error)
    }
  }

  const loadAnalytics = async () => {
    if (!selectedSponsor) return
    
    setLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }
      
      const analyticsData = await sponsorshipService.getSponsorAnalytics(
        selectedSponsor, 
        startDate, 
        endDate
      )
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = () => {
    if (!analytics) return
    
    const data = {
      sponsor: sponsors.find(s => s.id === selectedSponsor)?.name,
      period: selectedPeriod,
      analytics,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sponsor-analytics-${selectedSponsor}-${selectedPeriod}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const currentSponsor = sponsors.find(s => s.id === selectedSponsor)

  // Mock chart data
  const engagementData = [
    { name: 'Week 1', participants: 45, views: 230, clicks: 28 },
    { name: 'Week 2', participants: 62, views: 310, clicks: 37 },
    { name: 'Week 3', participants: 78, views: 420, clicks: 51 },
    { name: 'Week 4', participants: 95, views: 380, clicks: 46 }
  ]

  const roiData = [
    { name: 'Cost per Participant', value: analytics?.roi.participantAcquisitionCost || 0 },
    { name: 'Cost per Engagement', value: analytics?.roi.costPerEngagement || 0 },
    { name: 'Estimated Reach', value: (analytics?.roi.estimatedReach || 0) / 100 }
  ]

  const tournamentDistribution = [
    { name: 'Active', value: analytics ? analytics.tournaments.total - analytics.tournaments.completed : 0, color: '#3B82F6' },
    { name: 'Completed', value: analytics?.tournaments.completed || 0, color: '#10B981' }
  ]

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
          <h2 className="text-3xl font-bold">Sponsor Analytics</h2>
          <p className="text-muted-foreground">
            Track engagement metrics and ROI for sponsored tournaments
          </p>
        </div>
        <div className="flex items-center gap-4">
          {showAllSponsors && (
            <Select value={selectedSponsor} onValueChange={setSelectedSponsor}>
              <SelectTrigger className="w-48">
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
          )}
          
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Current Sponsor Info */}
      {currentSponsor && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={currentSponsor.logoUrl} alt={currentSponsor.name} />
                <AvatarFallback className="text-2xl">{currentSponsor.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{currentSponsor.name}</h3>
                <p className="text-muted-foreground">{currentSponsor.description}</p>
                {currentSponsor.website && (
                  <a 
                    href={currentSponsor.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    {currentSponsor.website}
                  </a>
                )}
              </div>
              <Badge variant={currentSponsor.isActive ? "default" : "secondary"}>
                {currentSponsor.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.tournaments.totalContribution.toLocaleString()} FLOW</div>
              <p className="text-xs text-muted-foreground">
                Across {analytics.tournaments.total} tournaments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.engagement.totalParticipants.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {(analytics.engagement.averageEngagementRate * 100).toFixed(1)}% engagement rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.engagement.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {(analytics.engagement.clickThroughRate * 100).toFixed(1)}% click-through rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost per Participant</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.roi.participantAcquisitionCost.toFixed(2)} FLOW</div>
              <p className="text-xs text-muted-foreground">
                Acquisition cost
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Detailed Analytics */}
      <Tabs defaultValue="engagement" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          <TabsTrigger value="brand">Brand Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
              <CardDescription>
                Participant and view trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="participants" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="views" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tournaments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Distribution</CardTitle>
                <CardDescription>Active vs completed tournaments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={tournamentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {tournamentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tournament Performance</CardTitle>
                <CardDescription>Key tournament metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Tournaments</span>
                  <span className="font-semibold">{analytics?.tournaments.total || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed</span>
                  <span className="font-semibold">{analytics?.tournaments.completed || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="font-semibold">
                    {analytics ? ((analytics.tournaments.completed / analytics.tournaments.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg. Contribution</span>
                  <span className="font-semibold">
                    {analytics ? (analytics.tournaments.totalContribution / analytics.tournaments.total).toFixed(0) : 0} FLOW
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ROI Metrics</CardTitle>
              <CardDescription>Return on investment analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Brand Mentions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.engagement.brandMentions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all platforms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Reach</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.roi.estimatedReach.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Potential audience
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Brand Visibility</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics ? ((analytics.engagement.totalViews / analytics.roi.estimatedReach) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Of estimated reach
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}