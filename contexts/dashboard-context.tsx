"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { ErrorInfo, parseError, RetryManager } from '@/components/dashboard-loading-states'

interface DashboardError {
  id: string
  error: ErrorInfo
  timestamp: Date
  component?: string
}

interface DashboardContextType {
  isRefreshing: boolean
  lastRefresh: Date
  refreshData: () => Promise<void>
  autoRefreshEnabled: boolean
  setAutoRefreshEnabled: (enabled: boolean) => void
  refreshInterval: number
  setRefreshInterval: (interval: number) => void
  errors: DashboardError[]
  addError: (error: unknown, component?: string) => void
  removeError: (id: string) => void
  clearErrors: () => void
  retryManager: RetryManager
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

interface DashboardProviderProps {
  children: ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const { isAuthenticated } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5 * 60 * 1000) // 5 minutes default
  const [errors, setErrors] = useState<DashboardError[]>([])
  const [retryManager] = useState(() => new RetryManager(3, 1000))

  // Error management functions
  const addError = useCallback((error: unknown, component?: string) => {
    const errorInfo = parseError(error)
    const dashboardError: DashboardError = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      error: errorInfo,
      timestamp: new Date(),
      component
    }
    
    setErrors(prev => [...prev.slice(-4), dashboardError]) // Keep last 5 errors
    
    // Auto-remove error after 30 seconds if it's not critical
    if (errorInfo.type !== 'auth') {
      setTimeout(() => {
        removeError(dashboardError.id)
      }, 30000)
    }
  }, [])

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Enhanced refresh function with error handling
  const refreshData = useCallback(async () => {
    if (isRefreshing || !isAuthenticated) return

    setIsRefreshing(true)
    
    try {
      await retryManager.executeWithRetry(
        async () => {
          // Dispatch custom event that dashboard components can listen to
          window.dispatchEvent(new CustomEvent('dashboard-refresh'))
          
          // Simulate refresh delay
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          setLastRefresh(new Date())
          
          // Clear errors on successful refresh
          clearErrors()
        },
        (attempt, error) => {
          console.warn(`Dashboard refresh attempt ${attempt} failed:`, error)
          addError(error, 'dashboard-refresh')
        }
      )
    } catch (error) {
      console.error('Dashboard refresh failed after all retries:', error)
      addError(error, 'dashboard-refresh')
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, isAuthenticated, retryManager, addError, clearErrors])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefreshEnabled || !isAuthenticated) return

    const interval = setInterval(() => {
      refreshData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, isAuthenticated, refreshInterval, refreshData])

  // Initial refresh when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      refreshData()
    }
  }, [isAuthenticated, refreshData])

  const value: DashboardContextType = {
    isRefreshing,
    lastRefresh,
    refreshData,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    refreshInterval,
    setRefreshInterval,
    errors,
    addError,
    removeError,
    clearErrors,
    retryManager
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

// Hook for components to listen to refresh events
export function useDashboardRefresh(callback: () => void | Promise<void>) {
  useEffect(() => {
    const handleRefresh = () => {
      callback()
    }

    window.addEventListener('dashboard-refresh', handleRefresh)
    return () => window.removeEventListener('dashboard-refresh', handleRefresh)
  }, [callback])
}