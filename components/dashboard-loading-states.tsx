"use client"

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Server, 
  Clock,
  Shield,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  DashboardCardSkeleton,
  MyTeamCardSkeleton,
  LeaderboardCardSkeleton,
  ResultsCardSkeleton,
  TreasuryCardSkeleton,
  PremiumCardSkeleton,
  ProfileCardSkeleton,
  StaggeredLoading
} from '@/components/dashboard-skeletons'

interface DashboardLoadingStateProps {
  className?: string
}

export function DashboardLoadingState({ className }: DashboardLoadingStateProps) {
  const cardSkeletons = [
    <MyTeamCardSkeleton key="myteam" />,
    <LeaderboardCardSkeleton key="leaderboard" />,
    <ResultsCardSkeleton key="results" />,
    <TreasuryCardSkeleton key="treasury" />,
    <PremiumCardSkeleton key="premium" />,
    <ProfileCardSkeleton key="profile" />
  ]

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Loading */}
      <DashboardHeaderSkeleton />
      
      {/* Cards Grid Loading with staggered animation */}
      <div className="dashboard-grid">
        <StaggeredLoading isLoading={false} staggerDelay={150}>
          {cardSkeletons}
        </StaggeredLoading>
      </div>
    </div>
  )
}

export function DashboardHeaderSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Stats Overview Loading */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="col-span-2 p-4">
            <CardContent className="p-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function DashboardCardSkeleton({ className }: { className?: string }) {
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
        <div className="space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}

interface DashboardErrorStateProps {
  error: string
  onRetry?: () => void
  className?: string
  errorType?: 'network' | 'server' | 'auth' | 'timeout' | 'service' | 'unknown'
}

export function DashboardErrorState({ 
  error, 
  onRetry, 
  className, 
  errorType = 'unknown' 
}: DashboardErrorStateProps) {
  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return WifiOff
      case 'server':
        return Server
      case 'auth':
        return Shield
      case 'timeout':
        return Clock
      case 'service':
        return Database
      default:
        return AlertCircle
    }
  }

  const getErrorTitle = () => {
    switch (errorType) {
      case 'network':
        return 'Connection Problem'
      case 'server':
        return 'Server Error'
      case 'auth':
        return 'Authentication Required'
      case 'timeout':
        return 'Request Timeout'
      case 'service':
        return 'Service Unavailable'
      default:
        return 'Failed to Load Dashboard'
    }
  }

  const getErrorSuggestion = () => {
    switch (errorType) {
      case 'network':
        return 'Check your internet connection and try again.'
      case 'server':
        return 'Our servers are experiencing issues. Please try again in a few moments.'
      case 'auth':
        return 'Please reconnect your wallet to continue.'
      case 'timeout':
        return 'The request took too long. Please try again.'
      case 'service':
        return 'Some services are temporarily unavailable. Please try again later.'
      default:
        return 'Something went wrong while loading your dashboard.'
    }
  }

  const ErrorIcon = getErrorIcon()

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="border-destructive/50 p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-destructive/10">
              <ErrorIcon className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-destructive">
              {getErrorTitle()}
            </h3>
            <p className="text-sm text-muted-foreground">
              {error}
            </p>
            <p className="text-xs text-muted-foreground">
              {getErrorSuggestion()}
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button
              onClick={() => window.location.reload()}
              variant="ghost"
              size="sm"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function DashboardEmptyState({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Welcome to ShotCaller
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect your Dapper Wallet to get started with fantasy sports using your NFT collection.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Enhanced error handling utilities
export interface ErrorInfo {
  type: 'network' | 'server' | 'auth' | 'timeout' | 'service' | 'unknown'
  message: string
  code?: string | number
  retryable: boolean
  suggestion?: string
}

export function parseError(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        type: 'network',
        message: 'Network connection failed',
        retryable: true,
        suggestion: 'Check your internet connection and try again.'
      }
    }
    
    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('aborted')) {
      return {
        type: 'timeout',
        message: 'Request timed out',
        retryable: true,
        suggestion: 'The request took too long. Please try again.'
      }
    }
    
    // Authentication errors
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return {
        type: 'auth',
        message: 'Authentication required',
        retryable: false,
        suggestion: 'Please reconnect your wallet to continue.'
      }
    }
    
    return {
      type: 'unknown',
      message: error.message,
      retryable: true
    }
  }
  
  // Handle HTTP response errors
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any
    
    if (errorObj.status) {
      if (errorObj.status >= 500) {
        return {
          type: 'server',
          message: 'Server error occurred',
          code: errorObj.status,
          retryable: true,
          suggestion: 'Our servers are experiencing issues. Please try again in a few moments.'
        }
      }
      
      if (errorObj.status === 401 || errorObj.status === 403) {
        return {
          type: 'auth',
          message: 'Authentication required',
          code: errorObj.status,
          retryable: false,
          suggestion: 'Please reconnect your wallet to continue.'
        }
      }
      
      if (errorObj.status === 404) {
        return {
          type: 'service',
          message: 'Service not found',
          code: errorObj.status,
          retryable: false,
          suggestion: 'The requested service is not available.'
        }
      }
    }
  }
  
  return {
    type: 'unknown',
    message: 'An unexpected error occurred',
    retryable: true,
    suggestion: 'Please try again or refresh the page.'
  }
}

// Retry logic with exponential backoff
export class RetryManager {
  private retryCount = 0
  private maxRetries = 3
  private baseDelay = 1000 // 1 second
  
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries
    this.baseDelay = baseDelay
  }
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation()
        this.retryCount = 0 // Reset on success
        return result
      } catch (error) {
        const errorInfo = parseError(error)
        
        // Don't retry non-retryable errors
        if (!errorInfo.retryable || attempt === this.maxRetries) {
          throw error
        }
        
        // Calculate delay with exponential backoff
        const delay = this.baseDelay * Math.pow(2, attempt)
        
        if (onRetry) {
          onRetry(attempt + 1, error as Error)
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw new Error('Max retries exceeded')
  }
  
  reset() {
    this.retryCount = 0
  }
  
  canRetry(): boolean {
    return this.retryCount < this.maxRetries
  }
}

// Service availability checker
export class ServiceHealthChecker {
  private static instance: ServiceHealthChecker
  private healthStatus = new Map<string, boolean>()
  private lastCheck = new Map<string, number>()
  private checkInterval = 30000 // 30 seconds
  
  static getInstance(): ServiceHealthChecker {
    if (!ServiceHealthChecker.instance) {
      ServiceHealthChecker.instance = new ServiceHealthChecker()
    }
    return ServiceHealthChecker.instance
  }
  
  async checkService(serviceName: string, healthEndpoint: string): Promise<boolean> {
    const now = Date.now()
    const lastCheckTime = this.lastCheck.get(serviceName) || 0
    
    // Return cached result if checked recently
    if (now - lastCheckTime < this.checkInterval) {
      return this.healthStatus.get(serviceName) || false
    }
    
    try {
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        timeout: 5000
      } as any)
      
      const isHealthy = response.ok
      this.healthStatus.set(serviceName, isHealthy)
      this.lastCheck.set(serviceName, now)
      
      return isHealthy
    } catch (error) {
      this.healthStatus.set(serviceName, false)
      this.lastCheck.set(serviceName, now)
      return false
    }
  }
  
  isServiceHealthy(serviceName: string): boolean {
    return this.healthStatus.get(serviceName) || false
  }
  
  getServiceStatus(): Record<string, boolean> {
    return Object.fromEntries(this.healthStatus)
  }
}

// Graceful degradation component
interface GracefulDegradationProps {
  children: React.ReactNode
  fallback: React.ReactNode
  serviceName: string
  healthEndpoint?: string
}

export function GracefulDegradation({ 
  children, 
  fallback, 
  serviceName, 
  healthEndpoint 
}: GracefulDegradationProps) {
  const [isServiceAvailable, setIsServiceAvailable] = React.useState(true)
  const healthChecker = ServiceHealthChecker.getInstance()
  
  React.useEffect(() => {
    if (healthEndpoint) {
      const checkHealth = async () => {
        const isHealthy = await healthChecker.checkService(serviceName, healthEndpoint)
        setIsServiceAvailable(isHealthy)
      }
      
      checkHealth()
      const interval = setInterval(checkHealth, 30000) // Check every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [serviceName, healthEndpoint, healthChecker])
  
  if (!isServiceAvailable) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}