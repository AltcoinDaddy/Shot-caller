"use client"

import React, { useState } from 'react'
import { DashboardCard } from '@/components/dashboard-card'
import { Home, User, Trophy, Wallet, Crown, Settings } from 'lucide-react'

/**
 * Example component demonstrating different states and configurations
 * of the DashboardCard component
 */
export function DashboardCardExample() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }

  const handleError = () => {
    setError('Network connection failed')
  }

  const handleLoading = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 3000)
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard Card Examples</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Card */}
        <DashboardCard
          title="My Team"
          description="Manage your lineup and NFTs"
          href="/team"
          icon={User}
          stats={{
            primary: "4/5",
            secondary: "Active",
            label: "Players in lineup"
          }}
          quickActions={[
            {
              label: "Set Lineup",
              onClick: () => console.log("Set lineup clicked"),
              icon: Settings,
              variant: "outline"
            },
            {
              label: "View Team",
              onClick: () => console.log("View team clicked"),
              icon: User
            }
          ]}
        />

        {/* Leaderboard Card */}
        <DashboardCard
          title="Leaderboard"
          description="Your ranking and performance"
          href="/leaderboard"
          icon={Trophy}
          stats={{
            primary: "#42",
            secondary: "+5",
            label: "Current rank this week"
          }}
          quickActions={[
            {
              label: "View Rankings",
              onClick: () => console.log("View rankings clicked"),
              variant: "default"
            }
          ]}
        />

        {/* Treasury Card */}
        <DashboardCard
          title="Treasury"
          description="Your FLOW balance and transactions"
          href="/treasury"
          icon={Wallet}
          stats={{
            primary: "125.50",
            secondary: "FLOW",
            label: "Available balance"
          }}
          quickActions={[
            {
              label: "View Transactions",
              onClick: () => console.log("View transactions clicked"),
              variant: "outline"
            }
          ]}
        />

        {/* Premium Card */}
        <DashboardCard
          title="Premium"
          description="Unlock advanced features"
          href="/premium"
          icon={Crown}
          stats={{
            primary: "14",
            secondary: "days left",
            label: "Premium subscription"
          }}
          quickActions={[
            {
              label: "Upgrade",
              onClick: () => console.log("Upgrade clicked"),
              variant: "default"
            },
            {
              label: "Manage",
              onClick: () => console.log("Manage clicked"),
              variant: "outline"
            }
          ]}
        />

        {/* Loading State Card */}
        <DashboardCard
          title="Loading Example"
          description="This card shows loading state"
          href="/loading"
          icon={Home}
          loading={loading}
          quickActions={[
            {
              label: "Trigger Loading",
              onClick: handleLoading,
              variant: "outline"
            }
          ]}
        />

        {/* Error State Card */}
        <DashboardCard
          title="Error Example"
          description="This card shows error state"
          href="/error"
          icon={Home}
          error={error}
          onRetry={handleRetry}
          quickActions={[
            {
              label: "Trigger Error",
              onClick: handleError,
              variant: "outline"
            }
          ]}
        />

        {/* Card with Custom Content */}
        <DashboardCard
          title="Custom Content"
          description="Card with additional custom content"
          href="/custom"
          icon={Settings}
          stats={{
            primary: "100%",
            label: "Completion rate"
          }}
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>8/8 tasks</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full w-full"></div>
            </div>
          </div>
        </DashboardCard>

        {/* Minimal Card */}
        <DashboardCard
          title="Minimal Card"
          description="Simple card with no extras"
          href="/minimal"
          icon={Home}
        />
      </div>
    </div>
  )
}