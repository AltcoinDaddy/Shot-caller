"use client"

import React, { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertCircle, 
  X, 
  RefreshCw, 
  WifiOff, 
  Server, 
  Shield, 
  Clock, 
  Database,
  CheckCircle,
  Info
} from 'lucide-react'
import { useDashboard } from '@/contexts/dashboard-context'
import { cn } from '@/lib/utils'

interface ErrorNotificationProps {
  className?: string
  maxVisible?: number
  autoHide?: boolean
  autoHideDelay?: number
}

export function DashboardErrorNotifications({ 
  className,
  maxVisible = 3,
  autoHide = true,
  autoHideDelay = 5000
}: ErrorNotificationProps) {
  const { errors, removeError, clearErrors } = useDashboard()
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set())

  // Auto-hide non-critical errors
  useEffect(() => {
    if (!autoHide) return

    errors.forEach(error => {
      if (error.error.type !== 'auth' && !dismissedErrors.has(error.id)) {
        const timer = setTimeout(() => {
          removeError(error.id)
        }, autoHideDelay)

        return () => clearTimeout(timer)
      }
    })
  }, [errors, autoHide, autoHideDelay, dismissedErrors, removeError])

  const visibleErrors = errors
    .filter(error => !dismissedErrors.has(error.id))
    .slice(-maxVisible)

  if (visibleErrors.length === 0) {
    return null
  }

  const handleDismiss = (errorId: string) => {
    setDismissedErrors(prev => new Set(prev).add(errorId))
    removeError(errorId)
  }

  const handleDismissAll = () => {
    clearErrors()
    setDismissedErrors(new Set())
  }

  return (
    <div className={cn("fixed top-4 right-4 z-50 space-y-2 max-w-md", className)}>
      {/* Dismiss all button */}
      {visibleErrors.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissAll}
            className="text-xs"
          >
            Dismiss All
          </Button>
        </div>
      )}

      {/* Error notifications */}
      {visibleErrors.map((error) => (
        <ErrorNotificationCard
          key={error.id}
          error={error}
          onDismiss={() => handleDismiss(error.id)}
        />
      ))}
    </div>
  )
}

interface ErrorNotificationCardProps {
  error: {
    id: string
    error: {
      type: 'network' | 'server' | 'auth' | 'timeout' | 'service' | 'unknown'
      message: string
      retryable: boolean
      suggestion?: string
    }
    timestamp: Date
    component?: string
  }
  onDismiss: () => void
}

function ErrorNotificationCard({ error, onDismiss }: ErrorNotificationCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const getErrorIcon = () => {
    switch (error.error.type) {
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

  const getErrorVariant = () => {
    switch (error.error.type) {
      case 'auth':
        return 'destructive'
      case 'server':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getErrorColor = () => {
    switch (error.error.type) {
      case 'network':
        return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200'
      case 'server':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
      case 'auth':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
      case 'timeout':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200'
      case 'service':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200'
    }
  }

  const ErrorIcon = getErrorIcon()

  return (
    <Alert 
      className={cn(
        "transition-all duration-300 shadow-lg",
        getErrorColor(),
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <ErrorIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <AlertDescription className="text-sm">
              <div className="space-y-1">
                <p className="font-medium">{error.error.message}</p>
                {error.error.suggestion && (
                  <p className="text-xs opacity-80">{error.error.suggestion}</p>
                )}
                <div className="flex items-center gap-2 text-xs">
                  {error.component && (
                    <Badge variant="outline" className="text-xs">
                      {error.component}
                    </Badge>
                  )}
                  <span className="opacity-60">
                    {error.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </AlertDescription>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Alert>
  )
}

// Success notification for when errors are resolved
interface SuccessNotificationProps {
  message: string
  onDismiss?: () => void
  autoHide?: boolean
  autoHideDelay?: number
}

export function SuccessNotification({ 
  message, 
  onDismiss, 
  autoHide = true, 
  autoHideDelay = 3000 
}: SuccessNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onDismiss?.(), 300)
      }, autoHideDelay)
      
      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay, onDismiss])

  return (
    <Alert 
      className={cn(
        "fixed top-4 right-4 z-50 max-w-md transition-all duration-300 shadow-lg",
        "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <AlertDescription className="text-sm font-medium">
            {message}
          </AlertDescription>
        </div>
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  )
}

// Info notification for general messages
interface InfoNotificationProps {
  message: string
  onDismiss?: () => void
  autoHide?: boolean
  autoHideDelay?: number
}

export function InfoNotification({ 
  message, 
  onDismiss, 
  autoHide = true, 
  autoHideDelay = 4000 
}: InfoNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onDismiss?.(), 300)
      }, autoHideDelay)
      
      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay, onDismiss])

  return (
    <Alert 
      className={cn(
        "fixed top-4 right-4 z-50 max-w-md transition-all duration-300 shadow-lg",
        "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <AlertDescription className="text-sm font-medium">
            {message}
          </AlertDescription>
        </div>
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  )
}