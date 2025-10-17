"use client"

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Base skeleton component with animation variants
interface SkeletonProps {
  className?: string
  variant?: 'pulse' | 'wave' | 'shimmer'
  children?: React.ReactNode
}

export function AnimatedSkeleton({ className, variant = 'pulse', children }: SkeletonProps) {
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    shimmer: 'animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_2s_infinite]'
  }[variant]

  return (
    <div className={cn(animationClass, className)}>
      {children || <Skeleton className="w-full h-full" />}
    </div>
  )
}

// Dashboard card skeleton with different layouts
interface DashboardCardSkeletonProps {
  className?: string
  variant?: 'default' | 'stats' | 'chart' | 'list' | 'minimal'
  showQuickActions?: boolean
}

export function DashboardCardSkeleton({ 
  className, 
  variant = 'default',
  showQuickActions = true 
}: DashboardCardSkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {variant === 'stats' && <StatsSkeletonContent />}
        {variant === 'chart' && <ChartSkeletonContent />}
        {variant === 'list' && <ListSkeletonContent />}
        {variant === 'minimal' && <MinimalSkeletonContent />}
        {variant === 'default' && <DefaultSkeletonContent />}
        
        {showQuickActions && <QuickActionsSkeletonContent />}
        
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}

function DefaultSkeletonContent() {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </>
  )
}

function StatsSkeletonContent() {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-3 w-18" />
        </div>
      </div>
    </>
  )
}

function ChartSkeletonContent() {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="h-24 flex items-end space-x-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t" 
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
    </>
  )
}

function ListSkeletonContent() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

function MinimalSkeletonContent() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

function QuickActionsSkeletonContent() {
  return (
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
  )
}

// Specialized skeletons for specific dashboard cards
export function MyTeamCardSkeleton({ className }: { className?: string }) {
  return (
    <DashboardCardSkeleton 
      className={className}
      variant="stats"
    />
  )
}

export function LeaderboardCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("dashboard-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline space-x-2">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-20 mt-1" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ResultsCardSkeleton({ className }: { className?: string }) {
  return (
    <DashboardCardSkeleton 
      className={className}
      variant="list"
    />
  )
}

export function TreasuryCardSkeleton({ className }: { className?: string }) {
  return (
    <DashboardCardSkeleton 
      className={className}
      variant="stats"
    />
  )
}

export function PremiumCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("dashboard-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="flex flex-wrap gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}

export function ProfileCardSkeleton({ className }: { className?: string }) {
  return (
    <DashboardCardSkeleton 
      className={className}
      variant="minimal"
    />
  )
}

// Progressive loading skeleton that reveals content gradually
interface ProgressiveSkeletonProps {
  isLoading: boolean
  children: React.ReactNode
  skeleton: React.ReactNode
  delay?: number
}

export function ProgressiveSkeleton({ 
  isLoading, 
  children, 
  skeleton, 
  delay = 0 
}: ProgressiveSkeletonProps) {
  const [showSkeleton, setShowSkeleton] = React.useState(isLoading)

  React.useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true)
    } else {
      const timer = setTimeout(() => {
        setShowSkeleton(false)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [isLoading, delay])

  if (showSkeleton) {
    return <>{skeleton}</>
  }

  return <>{children}</>
}

// Staggered loading for multiple cards
interface StaggeredLoadingProps {
  children: React.ReactNode[]
  isLoading: boolean
  staggerDelay?: number
}

export function StaggeredLoading({ 
  children, 
  isLoading, 
  staggerDelay = 100 
}: StaggeredLoadingProps) {
  const [visibleCount, setVisibleCount] = React.useState(isLoading ? 0 : children.length)

  React.useEffect(() => {
    if (!isLoading && visibleCount < children.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 1, children.length))
      }, staggerDelay)
      return () => clearTimeout(timer)
    }
  }, [isLoading, visibleCount, children.length, staggerDelay])

  return (
    <>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            "transition-opacity duration-300",
            index < visibleCount ? "opacity-100" : "opacity-0"
          )}
        >
          {child}
        </div>
      ))}
    </>
  )
}