"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Calendar, BarChart3, Users, Target } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { SportsDataTest } from "@/components/sports-data-test"
import { ScoringBreakdownComponent, LineupScoringBreakdown } from "@/components/scoring-breakdown"
import { ScoringExample } from "@/components/scoring-example"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { PlayerComparisonTool } from "@/components/player-comparison-tool"
import { TeamPerformanceAnalytics } from "@/components/team-performance-analytics"
import { InteractiveTrendsAnalysis } from "@/components/interactive-trends-analysis"
import { useScoring } from "@/hooks/use-scoring"
import { usePremium } from "@/hooks/use-premium"

// Mock weekly results data
const weeklyData = [
  { week: "Week 1", points: 245 },
  { week: "Week 2", points: 289 },
  { week: "Week 3", points: 267 },
  { week: "Week 4", points: 312 },
  { week: "Week 5", points: 298 },
  { week: "Week 6", points: 334 },
  { week: "Week 7", points: 301 },
  { week: "Week 8", points: 342 },
]

// Mock player performance data
const playerPerformance = [
  {
    id: 1,
    playerName: "LeBron James",
    team: "Lakers",
    position: "SF",
    sport: "NBA",
    weeklyPoints: 87,
    change: 12,
    stats: { ppg: 28.5, rpg: 8.2, apg: 7.8 },
    image: "/lebron-james-nba-action.jpg",
  },
  {
    id: 2,
    playerName: "Stephen Curry",
    team: "Warriors",
    position: "PG",
    sport: "NBA",
    weeklyPoints: 92,
    change: 8,
    stats: { ppg: 31.2, rpg: 5.4, apg: 6.7 },
    image: "/stephen-curry-nba-shooting.jpg",
  },
  {
    id: 3,
    playerName: "Patrick Mahomes",
    team: "Chiefs",
    position: "QB",
    sport: "NFL",
    weeklyPoints: 78,
    change: -5,
    stats: { yards: 342, tds: 3, rating: 112.4 },
    image: "/patrick-mahomes-nfl-throwing.jpg",
  },
  {
    id: 4,
    playerName: "Giannis Antetokounmpo",
    team: "Bucks",
    position: "PF",
    sport: "NBA",
    weeklyPoints: 85,
    change: 15,
    stats: { ppg: 33.1, rpg: 12.5, apg: 6.2 },
    image: "/giannis-antetokounmpo-nba-dunk.jpg",
  },
]

export default function ResultsPage() {
  const [selectedWeek, setSelectedWeek] = useState("Week 8")
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const { calculateLineupBreakdown, getPlayerBreakdown, loading: scoringLoading } = useScoring()
  const { isPremium } = usePremium()
  const totalPoints = playerPerformance.reduce((sum, player) => sum + player.weeklyPoints, 0)
  const avgPoints = Math.round(totalPoints / playerPerformance.length)

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">RESULTS</h1>
          <p className="text-xl text-muted-foreground">Track your team's performance and weekly stats</p>
        </div>

        {/* Main Navigation Tabs */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="comparison">Compare</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="team">Team Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Week Selector */}
              <div>
                <Tabs defaultValue="Week 8" onValueChange={setSelectedWeek}>
                  <TabsList className="flex-wrap h-auto">
                    {weeklyData.map((week) => (
                      <TabsTrigger key={week.week} value={week.week}>
                        {week.week}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Summary Cards */}
              <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Points</div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-4xl font-bold mb-1">{totalPoints}</div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>+8% from last week</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Average Points</div>
            </div>
            <div className="text-4xl font-bold mb-1">{avgPoints}</div>
            <div className="text-sm text-muted-foreground">Per player</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Best Performer</div>
            </div>
            <div className="text-4xl font-bold mb-1">92</div>
            <div className="text-sm text-muted-foreground">Stephen Curry</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Season Rank</div>
            </div>
            <div className="text-4xl font-bold mb-1">#47</div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>Up 3 spots</span>
            </div>
          </Card>
              </div>

              {/* Charts Section */}
              <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-6">WEEKLY PERFORMANCE</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="points" stroke="hsl(var(--foreground))" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-6">PLAYER CONTRIBUTIONS</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={playerPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="playerName" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="weeklyPoints" fill="hsl(var(--foreground))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
              </div>

              {/* Detailed Scoring Breakdown Toggle */}
              <div>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">DETAILED SCORING ANALYSIS</h2>
            <button
              onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {showDetailedBreakdown ? 'Hide Details' : 'Show Detailed Breakdown'}
            </button>
          </div>
              </div>

              {/* Detailed Scoring Breakdown */}
              {showDetailedBreakdown && (
                <div>
            <div className="grid gap-6">
              {playerPerformance.map((player) => (
                <ScoringBreakdownComponent
                  key={player.id}
                  playerScore={{
                    playerId: player.id.toString(),
                    playerName: player.playerName,
                    sport: player.sport as 'NBA' | 'NFL',
                    fantasyPoints: player.weeklyPoints,
                    stats: player.sport === 'NBA' ? {
                      minutes: 32,
                      points: Math.round(player.stats.ppg || 0),
                      rebounds: Math.round(player.stats.rpg || 0),
                      assists: Math.round(player.stats.apg || 0),
                      steals: 2,
                      blocks: 1,
                      turnovers: 3,
                      fieldGoalsMade: 8,
                      fieldGoalsAttempted: 15,
                      threePointersMade: 3,
                      threePointersAttempted: 7,
                      freeThrowsMade: 4,
                      freeThrowsAttempted: 5,
                      personalFouls: 2,
                      plusMinus: 8
                    } : {
                      passingYards: player.stats.yards || 0,
                      passingTouchdowns: player.stats.tds || 0,
                      interceptions: 1,
                      completions: 22,
                      attempts: 35,
                      rushingYards: 45,
                      rushingTouchdowns: 1,
                      rushingAttempts: 8,
                      receivingYards: 0,
                      receivingTouchdowns: 0,
                      receptions: 0,
                      targets: 0,
                      tackles: 0,
                      sacks: 0,
                      forcedFumbles: 0,
                      interceptionsCaught: 0,
                      fieldGoalsMade: 0,
                      fieldGoalsAttempted: 0,
                      extraPointsMade: 0,
                      extraPointsAttempted: 0
                    },
                    breakdown: [
                      {
                        statName: player.sport === 'NBA' ? 'points' : 'passingYards',
                        statValue: player.sport === 'NBA' ? Math.round(player.stats.ppg || 0) : (player.stats.yards || 0),
                        pointsPerUnit: player.sport === 'NBA' ? 1 : 0.04,
                        totalPoints: player.sport === 'NBA' ? Math.round(player.stats.ppg || 0) : Math.round((player.stats.yards || 0) * 0.04),
                        description: player.sport === 'NBA' ? '1 point per point scored' : '1 point per 25 passing yards'
                      },
                      {
                        statName: player.sport === 'NBA' ? 'rebounds' : 'passingTouchdowns',
                        statValue: player.sport === 'NBA' ? Math.round(player.stats.rpg || 0) : (player.stats.tds || 0),
                        pointsPerUnit: player.sport === 'NBA' ? 1.2 : 4,
                        totalPoints: player.sport === 'NBA' ? Math.round((player.stats.rpg || 0) * 1.2) : (player.stats.tds || 0) * 4,
                        description: player.sport === 'NBA' ? '1.2 points per rebound' : '4 points per passing TD'
                      },
                      {
                        statName: player.sport === 'NBA' ? 'assists' : 'rushingYards',
                        statValue: player.sport === 'NBA' ? Math.round(player.stats.apg || 0) : 45,
                        pointsPerUnit: player.sport === 'NBA' ? 1.5 : 0.1,
                        totalPoints: player.sport === 'NBA' ? Math.round((player.stats.apg || 0) * 1.5) : 4.5,
                        description: player.sport === 'NBA' ? '1.5 points per assist' : '1 point per 10 rushing yards'
                      }
                    ]
                  }}
                  showDetailed={true}
                />
              ))}
                </div>
              )}

              {/* Scoring System Demo */}
              <div>
          <h2 className="text-3xl font-bold tracking-tight mb-6">SCORING SYSTEM DEMO</h2>
          <ScoringExample />
              </div>

              {/* Sports Data Integration Test */}
              <div>
          <h2 className="text-3xl font-bold tracking-tight mb-6">SPORTS DATA INTEGRATION</h2>
          <SportsDataTest />
              </div>

              {/* Player Performance Details */}
              <div>
          <h2 className="text-3xl font-bold tracking-tight mb-6">PLAYER BREAKDOWN</h2>
          <div className="grid gap-4">
            {playerPerformance.map((player) => (
              <Card key={player.id} className="overflow-hidden hover:border-foreground transition-colors">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 h-48 md:h-auto relative">
                    <img
                      src={player.image || "/placeholder.svg"}
                      alt={player.playerName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card md:to-transparent" />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold">{player.playerName}</h3>
                          <Badge variant="outline">{player.position}</Badge>
                          <Badge variant="secondary">{player.sport}</Badge>
                        </div>
                        <div className="text-muted-foreground">{player.team}</div>
                      </div>
                      <div className="mt-4 md:mt-0 text-right">
                        <div className="text-4xl font-bold mb-1">{player.weeklyPoints}</div>
                        <div className="flex items-center justify-end gap-1">
                          {player.change > 0 ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">+{player.change} pts</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-600">{player.change} pts</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {player.sport === "NBA" ? (
                        <>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Points Per Game</div>
                            <div className="text-2xl font-bold">{player.stats.ppg}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Rebounds Per Game</div>
                            <div className="text-2xl font-bold">{player.stats.rpg}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Assists Per Game</div>
                            <div className="text-2xl font-bold">{player.stats.apg}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Passing Yards</div>
                            <div className="text-2xl font-bold">{player.stats.yards}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Touchdowns</div>
                            <div className="text-2xl font-bold">{player.stats.tds}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">QB Rating</div>
                            <div className="text-2xl font-bold">{player.stats.rating}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard 
                userId="current-user" 
                timeframe="season"
                showPremiumFeatures={true}
              />
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
              <PlayerComparisonTool />
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <InteractiveTrendsAnalysis 
                timeframe="season"
                showPremiumFeatures={true}
              />
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <TeamPerformanceAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
