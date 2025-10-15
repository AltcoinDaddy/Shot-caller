"use client"

import { SponsorshipRequestForm } from "@/components/sponsorship-request-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  TrendingUp, 
  Target, 
  Trophy, 
  Star, 
  Zap,
  Eye,
  MousePointer,
  DollarSign,
  Gift,
  Calendar,
  BarChart3
} from "lucide-react"

export default function SponsorshipPage() {
  const sponsorshipTiers = [
    {
      name: "Tournament Sponsor",
      price: "500+ FLOW",
      description: "Sponsor individual tournaments with your branding",
      features: [
        "Logo placement on tournament page",
        "Custom tournament messaging",
        "Branded prize pool enhancement",
        "Basic engagement analytics",
        "Social media mentions"
      ],
      color: "border-blue-200 bg-blue-50"
    },
    {
      name: "Premium Partner",
      price: "1,500+ FLOW",
      description: "Monthly partnership with enhanced visibility",
      features: [
        "All Tournament Sponsor benefits",
        "Homepage banner placement",
        "Custom NFT rewards for winners",
        "Advanced analytics dashboard",
        "Priority tournament scheduling",
        "Dedicated account manager"
      ],
      color: "border-purple-200 bg-purple-50",
      popular: true
    },
    {
      name: "Exclusive Partner",
      price: "5,000+ FLOW",
      description: "Seasonal exclusive partnership with maximum exposure",
      features: [
        "All Premium Partner benefits",
        "Exclusive tournament series",
        "Custom branded game modes",
        "White-label tournament creation",
        "Direct user engagement tools",
        "Comprehensive ROI reporting",
        "Co-marketing opportunities"
      ],
      color: "border-gold-200 bg-yellow-50"
    }
  ]

  const platformStats = [
    { label: "Active Users", value: "12,500+", icon: Users },
    { label: "Monthly Tournaments", value: "50+", icon: Trophy },
    { label: "NFT Transactions", value: "$2.5M+", icon: DollarSign },
    { label: "Engagement Rate", value: "78%", icon: TrendingUp }
  ]

  const sponsorBenefits = [
    {
      icon: Target,
      title: "Targeted Audience",
      description: "Reach engaged NFT collectors and fantasy sports enthusiasts with high purchasing power"
    },
    {
      icon: Eye,
      title: "Brand Visibility",
      description: "Prominent logo placement and custom branding across tournament interfaces"
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Detailed metrics on engagement, click-through rates, and brand mentions"
    },
    {
      icon: Gift,
      title: "Custom Rewards",
      description: "Distribute branded NFTs and exclusive content to tournament winners"
    },
    {
      icon: Zap,
      title: "Real-time Engagement",
      description: "Interactive tournament experiences with live leaderboards and social features"
    },
    {
      icon: Calendar,
      title: "Flexible Scheduling",
      description: "Choose tournament timing and frequency that aligns with your marketing calendar"
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Partner with ShotCaller
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Reach engaged NFT collectors and fantasy sports fans through sponsored tournaments, 
          branded experiences, and exclusive rewards. Drive meaningful engagement with our 
          passionate community.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Become a Sponsor
          </Button>
          <Button variant="outline" size="lg">
            View Case Studies
          </Button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {platformStats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-6">
              <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sponsorship Benefits */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Why Sponsor ShotCaller?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsorBenefits.map((benefit, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <benefit.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sponsorship Tiers */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Sponsorship Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sponsorshipTiers.map((tier, index) => (
            <Card key={index} className={`relative ${tier.color}`}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="text-3xl font-bold text-primary">{tier.price}</div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant={tier.popular ? "default" : "outline"}>
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Success Stories */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">FS</span>
                </div>
                <div>
                  <h3 className="font-semibold">FlowSports</h3>
                  <p className="text-sm text-muted-foreground">Blockchain Sports Platform</p>
                </div>
              </div>
              <blockquote className="text-muted-foreground mb-4">
                "Sponsoring ShotCaller tournaments increased our brand awareness by 300% 
                among NFT collectors. The engagement metrics exceeded our expectations."
              </blockquote>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-bold text-lg">245</div>
                  <div className="text-xs text-muted-foreground">Participants</div>
                </div>
                <div>
                  <div className="font-bold text-lg">78%</div>
                  <div className="text-xs text-muted-foreground">Engagement</div>
                </div>
                <div>
                  <div className="font-bold text-lg">12%</div>
                  <div className="text-xs text-muted-foreground">CTR</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">CG</span>
                </div>
                <div>
                  <h3 className="font-semibold">CryptoGaming</h3>
                  <p className="text-sm text-muted-foreground">Gaming Ecosystem</p>
                </div>
              </div>
              <blockquote className="text-muted-foreground mb-4">
                "The custom NFT rewards we provided through ShotCaller became highly sought 
                after collectibles. Great ROI on our sponsorship investment."
              </blockquote>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-bold text-lg">180</div>
                  <div className="text-xs text-muted-foreground">Participants</div>
                </div>
                <div>
                  <div className="font-bold text-lg">65%</div>
                  <div className="text-xs text-muted-foreground">Engagement</div>
                </div>
                <div>
                  <div className="font-bold text-lg">8%</div>
                  <div className="text-xs text-muted-foreground">CTR</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Form */}
      <div className="mb-8">
        <SponsorshipRequestForm />
      </div>

      {/* FAQ Section */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
        <p className="text-muted-foreground mb-6">
          Our partnerships team is ready to help you create a custom sponsorship package 
          that meets your marketing objectives.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline">
            Schedule a Call
          </Button>
          <Button variant="outline">
            Download Media Kit
          </Button>
        </div>
      </div>
    </div>
  )
}