"use client"

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface QuickAction {
  label: string
  onClick: () => void
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'outline' | 'secondary'
}

export interface DashboardCardStats {
  primary: string | number
  secondary?: string | number
  label: string
}

export interface DashboardCardProps {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  stats?: DashboardCardStats
  quickActions?: QuickAction[]
  loading?: boolean
  error?: string
  onRetry?: () => void
  className?: string
  children?: React.ReactNode
}

export function DashboardCard({
  title,
  description,
  href,
  icon: Icon,
  stats,
  quickActions = [],
  loading = false,
  error,
  onRetry,
  className,
  children
}: DashboardCardProps) {
  if (loading) {
    return <DashboardCardSkeleton />
  }

  if (error) {
    return (
      <DashboardCardError 
        title={title}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-foreground/20",
      "bg-gradient-to-br from-card to-card/80 backdrop-blur-sm",
      className
    )}>
      {/* Holographic effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-pulse" />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Section */}
        {stats && (
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-foreground">
                {stats.primary}
              </span>
              {stats.secondary && (
                <span className="text-sm text-muted-foreground">
                  {stats.secondary}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{stats.label}</p>
          </div>
        )}

        {/* Custom Content */}
        {children && (
          <div className="py-2">
            {children}
          </div>
        )}

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {quickActions.map((action, index) => {
              const ActionIcon = action.icon
              return (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  className="text-xs"
                >
                  {ActionIcon && <ActionIcon className="h-3 w-3 mr-1" />}
                  {action.label}
                </Button>
              )
            })}
          </div>
        )}

        {/* Main Action Link */}
        <div className="pt-2">
          <Link href={href}>
            <Button variant="default" className="w-full group-hover:bg-primary/90 transition-colors">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}

interface DashboardCardErrorProps {
  title: string
  error: string
  onRetry?: () => void
  className?: string
}

function DashboardCardError({ title, error, onRetry, className }: DashboardCardErrorProps) {
  return (
    <Card className={cn("border-destructive/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Failed to load data
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export { DashboardCardSkeleton, DashboardCardError }