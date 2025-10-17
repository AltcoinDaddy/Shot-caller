"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from "@/contexts/auth-context"
import { DashboardProvider } from "@/contexts/dashboard-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardLoadingState, DashboardErrorState, parseError } from "@/components/dashboard-loading-states"
import { DashboardErrorBoundary } from "@/components/dashboard-error-boundary"
import { DashboardErrorNotifications } from "@/components/dashboard-error-notifications"
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation"
import { MyTeamDashboardCard } from "@/components/myteam-dashboard-card"
import { LeaderboardDashboardCard } from "@/components/leaderboard-dashboard-card"
import { ResultsDashboardCard } from "@/components/results-dashboard-card"
import { TreasuryDashboardCardSimple } from "@/components/treasury-dashboard-card-simple"
import { PremiumDashboardCard } from "@/components/premium-dashboard-card"
import { useMobileInfo } from "@/hooks/use-mobile"
import { useTouchInteractions } from "@/hooks/use-touch-interactions"
import { ResponsiveContainer, ResponsiveGrid, TouchFriendlyCard } from "@/components/mobile-layout"
import { 
  User,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ProfileDashboardCardProps {
  isMobile: boolean
  isTouchDevice: boolean
}

function ProfileDashboardCard({ isMobile, isTouchDevice }: ProfileDashboardCardProps) {
  return (
    <TouchFriendlyCard 
      href="/profile"
      className={cn(
        "dashboard-card group",
        isTouchDevice && "mobile-card"
      )}
    >
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className={cn(
          "flex flex-row items-center justify-between space-y-0",
          isMobile ? "pb-2" : "pb-2"
        )}>
          <CardTitle className={cn(
            "font-medium",
            isMobile ? "text-sm" : "text-sm"
          )}>
            PROFILE
          </CardTitle>
          <User className={cn(
            "text-muted-foreground",
            isMobile ? "h-4 w-4" : "h-4 w-4"
          )} />
        </CardHeader>
        <CardContent className={cn(
          isMobile && "space-y-3"
        )}>
          <div className={cn(
            "font-bold",
            isMobile ? "text-xl" : "text-2xl"
          )}>
            47
          </div>
          <p className={cn(
            "text-muted-foreground mb-4",
            isMobile ? "text-xs" : "text-xs"
          )}>
            Total NFTs
          </p>
          <div className="flex flex-col gap-2">
            <div className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              Member since Dec 2023
            </div>
            <Button 
              size={isMobile ? "sm" : "sm"} 
              asChild
              className={cn(
                isTouchDevice && "mobile-button min-h-[44px]"
              )}
            >
              <Link href="/profile">
                Edit Profile
                <ArrowRight className={cn(
                  "ml-1",
                  isMobile ? "h-3 w-3" : "h-3 w-3"
                )} />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </TouchFriendlyCard>
  )
}

export default function DashboardPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'network' | 'server' | 'auth' | 'timeout' | 'service' | 'unknown'>('unknown')
  const [retryCount, setRetryCount] = useState(0)
  const { isMobile, isTablet, isDesktop, isTouchDevice } = useMobileInfo()

  // Enhanced dashboard initialization with better error handling
  useEffect(() => {
    const initializeDashboard = async () => {
      if (authLoading) return

      try {
        setDashboardLoading(true)
        setDashboardError(null)
        
        // Simulate potential network issues for demonstration
        if (retryCount === 0 && Math.random() < 0.1) {
          throw new Error('Network connection failed')
        }
        
        // Simulate loading time for dashboard initialization
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // In a real implementation, this would initialize dashboard data
        // Check service health, load user data, etc.
        
        // Reset retry count on success
        setRetryCount(0)
        
      } catch (error) {
        const errorInfo = parseError(error)
        setDashboardError(errorInfo.message)
        setErrorType(errorInfo.type)
        console.error('Dashboard initialization failed:', error)
      } finally {
        setDashboardLoading(false)
      }
    }

    initializeDashboard()
  }, [authLoading, retryCount])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setDashboardError(null)
    setDashboardLoading(true)
  }

  // Show loading state while auth is loading or dashboard is initializing
  if (authLoading || dashboardLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <DashboardLoadingState />
      </div>
    )
  }

  // Show error state if dashboard failed to load
  if (dashboardError) {
    return (
      <div className="container mx-auto px-6 py-8">
        <DashboardErrorState 
          error={dashboardError}
          errorType={errorType}
          onRetry={handleRetry}
        />
      </div>
    )
  }

  return (
    <DashboardErrorBoundary>
      <DashboardProvider>
        {/* Error notifications overlay */}
        <DashboardErrorNotifications />
        
        <ResponsiveContainer>
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation className={cn(
          isMobile ? "mb-4" : "mb-6"
        )} />
        
        {/* Dashboard Header with Stats Overview */}
        <DashboardHeader className={cn(
          isMobile ? "mb-6" : "mb-8"
        )} />

        {/* Dashboard Grid */}
        <ResponsiveGrid 
          columns={{ mobile: 1, tablet: 2, desktop: 3 }}
          className="dashboard-grid"
        >
          {/* MY TEAM Card */}
          <MyTeamDashboardCard className={cn(
            "dashboard-card",
            isTouchDevice && "mobile-card"
          )} />

          {/* LEADERBOARD Card */}
          <LeaderboardDashboardCard className={cn(
            "dashboard-card",
            isTouchDevice && "mobile-card"
          )} />

          {/* RESULTS Card */}
          <ResultsDashboardCard className={cn(
            "dashboard-card",
            isTouchDevice && "mobile-card"
          )} />

          {/* TREASURY Card */}
          <TreasuryDashboardCardSimple className={cn(
            "dashboard-card",
            isTouchDevice && "mobile-card"
          )} />

          {/* PREMIUM Card */}
          <PremiumDashboardCard className={cn(
            isTouchDevice && "mobile-card"
          )} />

          {/* PROFILE Card */}
          <ProfileDashboardCard 
            isMobile={isMobile}
            isTouchDevice={isTouchDevice}
          />
        </ResponsiveGrid>
      </ResponsiveContainer>
    </DashboardProvider>
  </DashboardErrorBoundary>
  )
}