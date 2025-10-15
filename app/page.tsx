"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Trophy, Zap, Target, Wallet, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import Image from "next/image"
import { useWallet } from "@/hooks/use-wallet"
import { WalletConnector } from "@/components/wallet-connector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [countUp, setCountUp] = useState({ players: 0, nfts: 0, rewards: 0, weeks: 0 })
  const { isAuthenticated, isEligible, eligibilityReason, collections, balance } = useWallet()

  useEffect(() => {
    setMounted(true)

    const duration = 2000
    const steps = 60
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps

      setCountUp({
        players: Math.floor(2500 * progress),
        nfts: Math.floor(15000 * progress),
        rewards: Math.floor(50000 * progress),
        weeks: Math.floor(12 * progress),
      })

      if (step >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
            animation: "scan-line 20s linear infinite",
          }}
        />
      </div>

      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/dramatic-nba-basketball-player-dunking-action-shot.jpg"
            alt="Basketball action"
            fill
            className="object-cover opacity-20 grayscale"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,0,0,0.05),transparent_50%)] z-[1]" />

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div
            className={`max-w-5xl transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="inline-block px-4 py-2 bg-foreground text-background text-xs font-bold tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 holographic">
              NFT FANTASY SPORTS
            </div>

            <h1 className="text-7xl md:text-9xl font-bold tracking-tighter leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 hover:animate-pulse cursor-default">
              YOUR
              <br />
              MOMENTS.
              <br />
              YOUR
              <br />
              <span className="text-muted-foreground">LEGACY.</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              Transform NBA Top Shot and NFL All Day Moments into competitive fantasy assets. Build elite teams,
              dominate leaderboards, claim rewards.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              {isAuthenticated ? (
                isEligible ? (
                  <Link href="/team">
                    <Button
                      size="lg"
                      className="text-base font-bold tracking-wide h-14 px-8 group transition-all hover:scale-105 hover:shadow-2xl pulse-glow relative overflow-hidden"
                    >
                      <span className="relative z-10">BUILD YOUR TEAM</span>
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 relative z-10" />
                      <div className="absolute inset-0 shimmer" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    disabled
                    className="text-base font-bold tracking-wide h-14 px-8 bg-transparent"
                  >
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    <span>Need NFTs to Play</span>
                  </Button>
                )
              ) : (
                <Button
                  size="lg"
                  className="text-base font-bold tracking-wide h-14 px-8 group transition-all hover:scale-105 hover:shadow-2xl pulse-glow relative overflow-hidden"
                  onClick={() => {
                    // Scroll to wallet connection section
                    document.getElementById('wallet-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Wallet className="mr-2 h-5 w-5 relative z-10" />
                  <span className="relative z-10">CONNECT WALLET</span>
                  <div className="absolute inset-0 shimmer" />
                </Button>
              )}
              
              <Link href="/leaderboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base font-bold tracking-wide h-14 px-8 bg-transparent transition-all hover:scale-105 hover:bg-foreground hover:text-background relative overflow-hidden group"
                >
                  <span className="relative z-10">VIEW LEADERBOARD</span>
                  <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
            {[
              { src: "/lebron-james-nba-action.jpg", name: "LEBRON", serial: "#2847" },
              { src: "/stephen-curry-nba-shooting.jpg", name: "CURRY", serial: "#1523" },
              { src: "/giannis-antetokounmpo-nba-dunk.jpg", name: "GIANNIS", serial: "#4891" },
              { src: "/patrick-mahomes-nfl-throwing.jpg", name: "MAHOMES", serial: "#3204" },
            ].map((moment, i) => (
              <div
                key={i}
                className="relative aspect-[3/4] group cursor-pointer overflow-hidden rounded-lg border-2 border-border hover:border-foreground transition-all duration-500 card-3d holographic"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <Image
                  src={moment.src || "/placeholder.svg"}
                  alt={moment.name}
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="text-xs text-white/60 font-bold tracking-widest mb-1">{moment.serial}</div>
                  <div className="text-lg font-bold text-white tracking-tight">{moment.name}</div>
                </div>
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 border-y border-border relative scan-line">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { value: countUp.players, suffix: "+", label: "ACTIVE PLAYERS" },
              { value: countUp.nfts, suffix: "+", label: "NFTS IN PLAY" },
              { value: countUp.rewards, prefix: "$", suffix: "K", label: "TOTAL REWARDS" },
              { value: countUp.weeks, suffix: "", label: "WEEKS LIVE" },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center lg:text-left group cursor-default transition-all hover:scale-110 duration-300 float-animation"
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                <div className="text-5xl lg:text-6xl font-bold mb-2 tracking-tighter transition-all group-hover:text-muted-foreground group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                  {stat.prefix}
                  {stat.value.toLocaleString()}
                  {stat.suffix}
                </div>
                <div className="text-sm text-muted-foreground font-bold tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-20">
            HOW IT
            <br />
            WORKS
          </h2>

          <div className="grid lg:grid-cols-3 gap-16">
            {[
              {
                icon: Target,
                number: "01",
                title: "BUILD YOUR LINEUP",
                description:
                  "Select up to 5 NFTs from your Dapper wallet. Each Moment represents a real athlete with live stats.",
                image: "/nba-top-shot-nft-cards-collection-digital-wallet.jpg",
              },
              {
                icon: Zap,
                number: "02",
                title: "EARN POINTS",
                description:
                  "Score fantasy points based on real-world performances. Updated weekly with official league data.",
                image: "/basketball-scoreboard-stats-digital-display.jpg",
              },
              {
                icon: Trophy,
                number: "03",
                title: "CLAIM REWARDS",
                description:
                  "Compete for the top spot and earn token rewards distributed directly via Flow blockchain.",
                image: "/trophy-championship-podium-winner-celebration.jpg",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group cursor-default transition-all duration-500 hover:-translate-y-2 card-3d holographic"
              >
                {/* Feature Image */}
                <div className="relative h-48 mb-6 overflow-hidden rounded-lg border border-border group-hover:border-foreground transition-colors">
                  <Image
                    src={feature.image || "/placeholder.svg"}
                    alt={feature.title}
                    fill
                    className="object-cover grayscale group-hover:scale-110 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
                </div>

                <div className="text-6xl font-bold text-muted-foreground/20 mb-6 transition-all duration-500 group-hover:text-muted-foreground/40 group-hover:scale-110">
                  {feature.number}
                </div>
                <feature.icon
                  className="h-12 w-12 mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12"
                  strokeWidth={1.5}
                />
                <h3 className="text-2xl font-bold mb-4 tracking-tight transition-colors group-hover:text-muted-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed transition-all duration-300 group-hover:text-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wallet Connection Section */}
      {!isAuthenticated && (
        <section id="wallet-section" className="py-24 bg-muted/30">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">
                CONNECT YOUR
                <br />
                FLOW WALLET
              </h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                Access your NBA Top Shot and NFL All Day collection to start building your fantasy team. 
                Supports Dapper Wallet, Flow Wallet, and Blocto.
              </p>
              <div className="max-w-md mx-auto">
                <WalletConnector />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Wallet Status Section */}
      {isAuthenticated && (
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 text-center">
                WALLET STATUS
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Flow Balance
                    </CardTitle>
                    <CardDescription>Your current FLOW token balance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{balance} FLOW</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      NFT Collections
                    </CardTitle>
                    <CardDescription>Your eligible NFT collections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEligible ? (
                      <div className="space-y-2">
                        {collections.map((collection) => (
                          <Badge key={collection} variant="secondary" className="mr-2">
                            {collection}
                          </Badge>
                        ))}
                        <div className="text-sm text-muted-foreground mt-2">
                          Ready to compete!
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">{eligibilityReason}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-32 bg-foreground text-background transition-all duration-500 hover:bg-background hover:text-foreground border-y-2 border-foreground relative overflow-hidden group">
        {/* CTA Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/nfl-nba-sports-action-montage-athletes-competing.jpg"
            alt="Sports action"
            fill
            className="object-cover opacity-10 grayscale group-hover:opacity-20 transition-opacity duration-700"
          />
        </div>
        <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity z-[1]" />
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-4xl">
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.95]">
              READY TO
              <br />
              DOMINATE?
            </h2>
            <p className="text-xl opacity-70 mb-12 max-w-2xl leading-relaxed">
              {isAuthenticated 
                ? "Your wallet is connected. Start building your championship team now!"
                : "Connect your Flow wallet and transform your NFT collection into a championship fantasy team."
              }
            </p>
            {isAuthenticated && isEligible ? (
              <Link href="/team">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base font-bold tracking-wide h-14 px-8 group/btn transition-all hover:scale-105 hover:shadow-2xl pulse-glow"
                >
                  BUILD YOUR TEAM
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                className="text-base font-bold tracking-wide h-14 px-8 group/btn transition-all hover:scale-105 hover:shadow-2xl pulse-glow"
                onClick={() => {
                  document.getElementById('wallet-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {isAuthenticated ? 'GET ELIGIBLE NFTS' : 'CONNECT WALLET'}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
