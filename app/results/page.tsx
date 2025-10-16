"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Calendar, BarChart3, Users, Target } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock weekly results data
const weeklyData = [
  { week: "Week 1", points: 145, rank: 12 },
  { week: "Week 2", points: 167, rank: 8 },
  { week: "Week 3", points: 134, rank: 18 },
  { week: "Week 4", points: 189, rank: 3 },
  { week: "Week 5", points: 156, rank: 11 },
  { week: "Week 6", points: 178, rank: 5 },
  { week: "Week 7", points: 145, rank: 14 },
  { week: "Week 8", points: 201, rank: 1 },
]

// Mock player performance data
const playerPerformance = [
  {
    id: 1,
    name: "LeBron James",
    team: "LAL",
    position: "SF",
    sport: "NBA",
    weeklyPoints: 78,
    change: 12,
    stats: { ppg: 28.5, rpg: 8.2, apg: 6.8 },
    image: "/lebron-james-nba-dunk.jpg",
  },
  {
    id: 2,
    name: "Tyreek Hill",
    team: "MIA",
    position: "WR",
    sport: "NFL",
    weeklyPoints: 92,
    change: -5,
    stats: { rec: 8, yards: 156, tds: 2 },
    image: "/tyreek-hill-nfl-catch.jpg",
  },
  {
    id: 3,
    name: "Nikola Jokić",
    team: "DEN",
    position: "C",
    sport: "NBA",
    weeklyPoints: 65,
    change: 8,
    stats: { ppg: 24.8, rpg: 11.2, apg: 9.1 },
    image: "/nikola-jokic-nba-pass.jpg",
  },
  {
    id: 4,
    name: "Josh Allen",
    team: "BUF",
    position: "QB",
    sport: "NFL",
    weeklyPoints: 88,
    change: 15,
    stats: { pass_yds: 312, pass_tds: 3, rush_yds: 45 },
    image: "/josh-allen-nfl-throw.jpg",
  },
  {
    id: 5,
    name: "Giannis Antetokounmpo",
    team: "MIL",
    position: "PF",
    sport: "NBA",
    weeklyPoints: 85,
    change: 15,
    stats: { ppg: 33.1, rpg: 12.5, apg: 6.2 },
    image: "/giannis-antetokounmpo-nba-dunk.jpg",
  },
]

export default function ResultsPage() {
  const [selectedWeek, setSelectedWeek] = useState("Week 8");
  const [activeTab, setActiveTab] = useState("overview");
  
  const totalPoints = playerPerformance.reduce((sum, player) => sum + player.weeklyPoints, 0);
  const avgPoints = Math.round(totalPoints / playerPerformance.length);

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Weekly Performance Chart */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Weekly Performance</h2>
                  <Badge variant="outline" className="text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    {selectedWeek}
                  </Badge>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="points" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Total Points</h3>
                  </div>
                  <p className="text-3xl font-bold mt-2">{totalPoints}</p>
                  <p className="text-sm text-muted-foreground">This week</p>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Average</h3>
                  </div>
                  <p className="text-3xl font-bold mt-2">{avgPoints}</p>
                  <p className="text-sm text-muted-foreground">Per player</p>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Rank</h3>
                  </div>
                  <p className="text-3xl font-bold mt-2">1st</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-500">+13 positions</p>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Change</h3>
                  </div>
                  <p className="text-3xl font-bold mt-2">+23</p>
                  <p className="text-sm text-muted-foreground">From last week</p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight mb-6">PLAYER BREAKDOWN</h2>
              <div className="grid gap-4">
                {playerPerformance.map((player) => (
                  <Card key={player.id} className="overflow-hidden hover:border-foreground transition-colors">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold">{player.name}</h3>
                            <p className="text-muted-foreground">{player.team} • {player.position} • {player.sport}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{player.weeklyPoints} pts</p>
                            <div className="flex items-center justify-end">
                              {player.change > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                              )}
                              <span className={player.change > 0 ? "text-green-500" : "text-red-500"}>
                                {player.change > 0 ? "+" : ""}{player.change}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {Object.entries(player.stats).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-muted-foreground uppercase tracking-wide">{key}</p>
                              <p className="font-semibold">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight mb-6">ANALYTICS</h2>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Performance Trends</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="points" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}