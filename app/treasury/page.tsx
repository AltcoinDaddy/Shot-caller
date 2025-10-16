"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, Trophy, Zap, Star, Users, Timer, Shield } from "lucide-react"
import { BoosterInventory } from "@/components/booster-inventory"
import { SponsoredTournamentCard } from "@/components/sponsored-tournament-card"
import { TreasuryAdminDashboard } from "@/components/treasury-admin-dashboard"

// Mock treasury data
const treasuryStats = {
    totalBalance: 15420.75,
    rewardPool: 10794.53,
    platformTreasury: 4626.22,
    weeklyDistributed: 2340.50,
    totalParticipants: 1247
}

const activeTournaments = [
    {
        id: "1",
        name: "Week 15 Championship",
        entryFee: 5.0,
        prizePool: 1250.0,
        participants: 250,
        maxParticipants: 500,
        timeLeft: "2d 14h",
        status: "active"
    },
    {
        id: "2",
        name: "NFL Playoffs Special",
        entryFee: 10.0,
        prizePool: 800.0,
        participants: 80,
        maxParticipants: 100,
        timeLeft: "5d 8h",
        status: "upcoming"
    }
]

// Mock sponsored tournaments
const sponsoredTournaments = [
    {
        id: "sponsored-1",
        tournamentId: "tournament-1",
        sponsorId: "sponsor-1",
        sponsor: {
            id: "sponsor-1",
            name: "FlowSports",
            logoUrl: "/placeholder-logo.svg",
            website: "https://flowsports.com",
            description: "Leading blockchain sports platform",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        sponsorContribution: 500.0,
        brandingConfig: {
            primaryColor: "#3B82F6",
            secondaryColor: "#1E40AF",
            bannerImageUrl: "/placeholder.jpg",
            customMessage: "Powered by FlowSports - The Future of Blockchain Gaming",
            logoPlacement: "all" as const
        },
        customRewards: {
            nftRewards: [
                {
                    rank: 1,
                    nftId: "nft-special-1",
                    nftName: "FlowSports Champion Trophy",
                    nftImageUrl: "/trophy-championship-podium-winner-celebration.jpg"
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
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]



export default function TreasuryPage() {
    const [selectedTournament, setSelectedTournament] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false) // Mock admin status - in real app, check user permissions

    const handleTournamentEntry = (tournamentId: string, entryFee: number) => {
        // TODO: Implement FLOW token payment for tournament entry
        console.log("Entering tournament:", tournamentId, "Fee:", entryFee, "FLOW")
    }

    const handleBoosterPurchase = (boosterId: string, price: number) => {
        // TODO: Implement FLOW token payment for booster purchase
        console.log("Purchasing booster:", boosterId, "Price:", price, "FLOW")
    }

    const handleSeasonPassPurchase = () => {
        // TODO: Implement season pass purchase
        console.log("Purchasing season pass")
    }

    const handleSponsoredTournamentEntry = (tournamentId: string, entryFee: number) => {
        console.log("Entering sponsored tournament:", tournamentId, "Fee:", entryFee, "FLOW")
    }

    const handleSponsorClick = (sponsorId: string) => {
        console.log("Sponsor clicked:", sponsorId)
    }

    // Show admin dashboard if user is admin
    if (isAdmin) {
        return (
            <div className="container mx-auto px-4 py-8">
                <TreasuryAdminDashboard />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-bold mb-2 mobile-heading">Treasury & Tournaments</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Enter tournaments, purchase boosters, and manage your season pass
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={() => setIsAdmin(true)}
                    className="flex items-center gap-2 w-full sm:w-auto touch-target"
                    size="sm"
                >
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Admin View</span>
                </Button>
            </div>

            {/* Treasury Overview - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 mobile-grid">
                <Card className="mobile-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Treasury</CardTitle>
                        <Coins className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{treasuryStats.totalBalance.toLocaleString()} FLOW</div>
                        <p className="text-xs text-muted-foreground">
                            Platform treasury and reward pools
                        </p>
                    </CardContent>
                </Card>

                <Card className="mobile-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Weekly Rewards</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{treasuryStats.weeklyDistributed.toLocaleString()} FLOW</div>
                        <p className="text-xs text-muted-foreground">
                            Distributed this week
                        </p>
                    </CardContent>
                </Card>

                <Card className="mobile-card sm:col-span-2 md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Active Players</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{treasuryStats.totalParticipants.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Competing this week
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="tournaments" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                    <TabsTrigger value="tournaments" className="text-xs sm:text-sm py-2 sm:py-3">
                        <span className="hidden sm:inline">Tournaments</span>
                        <span className="sm:hidden">Contests</span>
                    </TabsTrigger>
                    <TabsTrigger value="sponsored" className="text-xs sm:text-sm py-2 sm:py-3">
                        <span className="hidden sm:inline">Sponsored</span>
                        <span className="sm:hidden">Sponsors</span>
                    </TabsTrigger>
                    <TabsTrigger value="boosters" className="text-xs sm:text-sm py-2 sm:py-3">
                        <span className="hidden sm:inline">Booster Shop</span>
                        <span className="sm:hidden">Boosters</span>
                    </TabsTrigger>
                    <TabsTrigger value="season-pass" className="text-xs sm:text-sm py-2 sm:py-3">
                        <span className="hidden sm:inline">Season Pass</span>
                        <span className="sm:hidden">Premium</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tournaments" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {activeTournaments.map((tournament) => (
                            <Card key={tournament.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>{tournament.name}</CardTitle>
                                        <Badge variant={tournament.status === "active" ? "default" : "secondary"}>
                                            {tournament.status}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        Entry Fee: {tournament.entryFee} FLOW • Prize Pool: {tournament.prizePool} FLOW
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Participants</span>
                                        <span>{tournament.participants}/{tournament.maxParticipants}</span>
                                    </div>
                                    <Progress
                                        value={(tournament.participants / tournament.maxParticipants) * 100}
                                        className="w-full"
                                    />
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <Timer className="h-4 w-4" />
                                            <span>Time Left: {tournament.timeLeft}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        onClick={() => handleTournamentEntry(tournament.id, tournament.entryFee)}
                                        disabled={tournament.participants >= tournament.maxParticipants}
                                    >
                                        {tournament.participants >= tournament.maxParticipants
                                            ? "Tournament Full"
                                            : `Enter for ${tournament.entryFee} FLOW`
                                        }
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="sponsored" className="space-y-6">
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2">Sponsored Tournaments</h3>
                        <p className="text-muted-foreground">
                            Enhanced tournaments with brand partnerships and exclusive rewards
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {sponsoredTournaments.map((tournament) => (
                            <SponsoredTournamentCard
                                key={tournament.id}
                                tournament={tournament}
                                onEnter={handleSponsoredTournamentEntry}
                                onSponsorClick={handleSponsorClick}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="boosters" className="space-y-6">
                    <BoosterInventory 
                        onActivateBooster={(boosterId) => {
                            console.log("Booster activated:", boosterId);
                        }}
                        onPurchaseBooster={(marketplaceItemId, price) => {
                            console.log("Booster purchased:", marketplaceItemId, "for", price, "FLOW");
                        }}
                    />
                </TabsContent>

                <TabsContent value="season-pass" className="space-y-6">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <Star className="h-12 w-12 text-yellow-500" />
                            </div>
                            <CardTitle className="text-2xl">ShotCaller Season Pass</CardTitle>
                            <CardDescription>
                                Unlock premium features and exclusive benefits
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-primary mb-2">25 FLOW</div>
                                <p className="text-muted-foreground">Full season access</p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold">Premium Features Include:</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                                        Advanced player analytics and projections
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                                        Extra lineup slots (up to 3 lineups per week)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                                        Bonus reward multipliers (+10% on winnings)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                                        Exclusive premium tournaments
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                                        Priority customer support
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Badge variant="secondary" className="w-2 h-2 p-0"></Badge>
                                        Early access to new features
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleSeasonPassPurchase}
                            >
                                Purchase Season Pass - 25 FLOW
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}