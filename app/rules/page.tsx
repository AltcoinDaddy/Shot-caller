"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Calendar, Zap, Target, Award, DollarSign, Shield } from "lucide-react"

const scoringRules = {
  nba: [
    { stat: "Points", value: "+1 per point" },
    { stat: "Rebounds", value: "+1.2 per rebound" },
    { stat: "Assists", value: "+1.5 per assist" },
    { stat: "Steals", value: "+3 per steal" },
    { stat: "Blocks", value: "+3 per block" },
    { stat: "Turnovers", value: "-1 per turnover" },
    { stat: "Double-Double", value: "+5 bonus" },
    { stat: "Triple-Double", value: "+15 bonus" },
  ],
  nfl: [
    { stat: "Passing Yards", value: "+0.04 per yard" },
    { stat: "Passing TD", value: "+4 per TD" },
    { stat: "Interception", value: "-2 per INT" },
    { stat: "Rushing Yards", value: "+0.1 per yard" },
    { stat: "Rushing TD", value: "+6 per TD" },
    { stat: "Receiving Yards", value: "+0.1 per yard" },
    { stat: "Receiving TD", value: "+6 per TD" },
    { stat: "Reception", value: "+0.5 per catch (PPR)" },
  ],
}

const rarityMultipliers = [
  { rarity: "Common", multiplier: "1.0x", color: "bg-gray-500" },
  { rarity: "Rare", multiplier: "1.2x", color: "bg-blue-500" },
  { rarity: "Epic", multiplier: "1.5x", color: "bg-purple-500" },
  { rarity: "Legendary", multiplier: "2.0x", color: "bg-yellow-500" },
]

export default function RulesPage() {
  return (
    <div className="min-h-screen py-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-foreground rounded-full float-animation"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 holographic">HOW TO PLAY</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Master the game mechanics and scoring system to dominate the leaderboard
          </p>
        </div>

        {/* Game Overview */}
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <h2 className="text-3xl font-bold mb-6 tracking-tight">GAME OVERVIEW</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: "Build Your Team",
                description: "Select up to 5 NFTs from your Dapper wallet to create your fantasy lineup",
              },
              {
                icon: Calendar,
                title: "Weekly Contests",
                description: "Compete in weekly contests based on real-world player performances",
              },
              {
                icon: Zap,
                title: "Earn Points",
                description: "Score fantasy points based on official NBA and NFL statistics",
              },
              {
                icon: Trophy,
                title: "Win Rewards",
                description: "Top performers earn FLOW tokens and exclusive NFT rewards",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="p-6 transition-all duration-500 hover:scale-105 hover:shadow-2xl card-3d holographic"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <item.icon className="h-12 w-12 mb-4 transition-transform group-hover:scale-110" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Scoring System */}
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <h2 className="text-3xl font-bold mb-6 tracking-tight">SCORING SYSTEM</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* NBA Scoring */}
            <Card className="p-6 transition-all hover:shadow-2xl duration-300">
              <div className="flex items-center gap-3 mb-6">
                <Badge className="text-lg px-4 py-2">NBA</Badge>
                <h3 className="text-2xl font-bold">Basketball Scoring</h3>
              </div>
              <div className="space-y-3">
                {scoringRules.nba.map((rule, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <span className="font-medium">{rule.stat}</span>
                    <Badge variant="outline" className="font-mono">
                      {rule.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* NFL Scoring */}
            <Card className="p-6 transition-all hover:shadow-2xl duration-300">
              <div className="flex items-center gap-3 mb-6">
                <Badge className="text-lg px-4 py-2">NFL</Badge>
                <h3 className="text-2xl font-bold">Football Scoring</h3>
              </div>
              <div className="space-y-3">
                {scoringRules.nfl.map((rule, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <span className="font-medium">{rule.stat}</span>
                    <Badge variant="outline" className="font-mono">
                      {rule.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Rarity Multipliers */}
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-3xl font-bold mb-6 tracking-tight">RARITY MULTIPLIERS</h2>
          <Card className="p-8">
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              NFT rarity affects your scoring potential. Higher rarity Moments earn bonus multipliers on all fantasy
              points scored.
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              {rarityMultipliers.map((item, index) => (
                <div
                  key={index}
                  className="text-center p-6 rounded-lg border-2 transition-all duration-500 hover:scale-110 hover:shadow-2xl card-3d"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`h-16 w-16 rounded-full ${item.color} mx-auto mb-4 shimmer`} />
                  <div className="font-bold text-xl mb-2">{item.rarity}</div>
                  <div className="text-3xl font-bold text-muted-foreground">{item.multiplier}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Contest Rules */}
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
          <h2 className="text-3xl font-bold mb-6 tracking-tight">CONTEST RULES</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 transition-all hover:shadow-2xl duration-300">
              <Target className="h-12 w-12 mb-4 text-blue-500" />
              <h3 className="text-xl font-bold mb-4">Lineup Requirements</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Must select exactly 5 NFTs from your Dapper wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Can mix NBA Top Shot and NFL All Day Moments</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Lineup locks at the start of each game week</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Players must be active and not injured</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 transition-all hover:shadow-2xl duration-300">
              <DollarSign className="h-12 w-12 mb-4 text-green-500" />
              <h3 className="text-xl font-bold mb-4">Rewards Structure</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>1st Place: 5,000 FLOW + Exclusive NFT</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>2nd Place: 3,000 FLOW + Premium NFT</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>3rd Place: 1,500 FLOW + Standard NFT</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Top 10: Bonus FLOW tokens distributed</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Important Notes */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <Card className="p-8 bg-muted/50 border-2">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Shield className="h-8 w-8" />
              IMPORTANT NOTES
            </h2>
            <ul className="space-y-3 text-muted-foreground leading-relaxed">
              <li>• Stats are updated in real-time during games and finalized after official league confirmation</li>
              <li>• Rewards are distributed via Flow blockchain within 48 hours of contest completion</li>
              <li>• You must maintain wallet connection throughout the contest period</li>
              <li>• NFTs remain in your wallet - only their stats are used for fantasy scoring</li>
              <li>• Disputes must be filed within 24 hours of contest end</li>
              <li>• Fair play policy: Any manipulation or cheating results in immediate disqualification</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
