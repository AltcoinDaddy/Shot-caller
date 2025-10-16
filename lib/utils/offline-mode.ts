/**
 * Offline mode support with data synchronization for ShotCaller
 * Handles offline data storage, sync queues, and network status detection
 */

import { toast } from '@/hooks/use-toast'

export interface OfflineAction {
  id: string
  type: string
  data: any
  timestamp: Date
  retryCount: number
  maxRetries: number
}

export interface CachedData {
  key: string
  data: any
  timestamp: Date
  expiresAt?: Date
}

export interface NetworkStatus {
  isOnline: boolean
  connectionType?: string
  effectiveType?: string
}

class OfflineModeManager {
  private syncQueue: OfflineAction[] = []
  private cache: Map<string, CachedData> = new Map()
  private networkStatus: NetworkStatus = { isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true }
  private syncInProgress = false
  private listeners: Set<(status: NetworkStatus) => void> = new Set()

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeNetworkListeners()
      this.loadFromStorage()
      this.startPeriodicSync()
    }
  }

  /**
   * Initialize network status listeners
   */
  private initializeNetworkListeners() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      this.updateNetworkStatus({ isOnline: true })
      this.onNetworkReconnect()
    })

    window.addEventListener('offline', () => {
      this.updateNetworkStatus({ isOnline: false })
      this.onNetworkDisconnect()
    })

    // Enhanced network detection if available
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      const updateConnectionInfo = () => {
        this.updateNetworkStatus({
          isOnline: navigator.onLine,
          connectionType: connection.type,
          effectiveType: connection.effectiveType
        })
      }

      connection.addEventListener('change', updateConnectionInfo)
      updateConnectionInfo()
    }
  }

  /**
   * Update network status and notify listeners
   */
  private updateNetworkStatus(status: Partial<NetworkStatus>) {
    this.networkStatus = { ...this.networkStatus, ...status }
    this.listeners.forEach(listener => listener(this.networkStatus))
  }

  /**
   * Handle network reconnection
   */
  private async onNetworkReconnect() {
    console.log('Network reconnected, starting sync...')
    toast({
      title: 'Back Online',
      description: 'Syncing your data...',
      duration: 3000
    })

    await this.syncPendingActions()
  }

  /**
   * Handle network disconnection
   */
  private onNetworkDisconnect() {
    console.log('Network disconnected, entering offline mode...')
    toast({
      title: 'Offline Mode',
      description: 'Your actions will be synced when connection is restored.',
      duration: 5000
    })
  }

  /**
   * Add listener for network status changes
   */
  addNetworkListener(listener: (status: NetworkStatus) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus }
  }

  /**
   * Check if we're currently online
   */
  isOnline(): boolean {
    return this.networkStatus.isOnline
  }

  /**
   * Queue an action for later synchronization
   */
  queueAction(type: string, data: any, maxRetries: number = 3): string {
    const action: OfflineAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries
    }

    this.syncQueue.push(action)
    this.saveToStorage()

    console.log(`Queued offline action: ${type}`, action)
    return action.id
  }

  /**
   * Remove action from queue
   */
  removeAction(actionId: string) {
    this.syncQueue = this.syncQueue.filter(action => action.id !== actionId)
    this.saveToStorage()
  }

  /**
   * Get pending actions count
   */
  getPendingActionsCount(): number {
    return this.syncQueue.length
  }

  /**
   * Get all pending actions
   */
  getPendingActions(): OfflineAction[] {
    return [...this.syncQueue]
  }

  /**
   * Sync all pending actions
   */
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline() || this.syncQueue.length === 0) {
      return
    }

    this.syncInProgress = true
    const actionsToSync = [...this.syncQueue]

    console.log(`Syncing ${actionsToSync.length} pending actions...`)

    for (const action of actionsToSync) {
      try {
        await this.syncAction(action)
        this.removeAction(action.id)
        console.log(`Successfully synced action: ${action.type}`)
      } catch (error) {
        console.error(`Failed to sync action ${action.type}:`, error)
        
        action.retryCount++
        if (action.retryCount >= action.maxRetries) {
          console.error(`Max retries reached for action ${action.type}, removing from queue`)
          this.removeAction(action.id)
          
          toast({
            title: 'Sync Failed',
            description: `Failed to sync ${action.type} after ${action.maxRetries} attempts.`,
            variant: 'destructive'
          })
        }
      }
    }

    this.syncInProgress = false
    this.saveToStorage()

    if (this.syncQueue.length === 0) {
      toast({
        title: 'Sync Complete',
        description: 'All offline actions have been synchronized.',
        duration: 3000
      })
    }
  }

  /**
   * Sync a single action
   */
  private async syncAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'lineup_submit':
        await this.syncLineupSubmission(action.data)
        break
      case 'tournament_entry':
        await this.syncTournamentEntry(action.data)
        break
      case 'marketplace_listing':
        await this.syncMarketplaceListing(action.data)
        break
      case 'booster_purchase':
        await this.syncBoosterPurchase(action.data)
        break
      case 'premium_purchase':
        await this.syncPremiumPurchase(action.data)
        break
      default:
        console.warn(`Unknown action type: ${action.type}`)
    }
  }

  /**
   * Sync lineup submission
   */
  private async syncLineupSubmission(data: any): Promise<void> {
    const response = await fetch('/api/lineups/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to sync lineup submission: ${response.statusText}`)
    }
  }

  /**
   * Sync tournament entry
   */
  private async syncTournamentEntry(data: any): Promise<void> {
    const response = await fetch('/api/payments/tournament-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to sync tournament entry: ${response.statusText}`)
    }
  }

  /**
   * Sync marketplace listing
   */
  private async syncMarketplaceListing(data: any): Promise<void> {
    const response = await fetch('/api/marketplace/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to sync marketplace listing: ${response.statusText}`)
    }
  }

  /**
   * Sync booster purchase
   */
  private async syncBoosterPurchase(data: any): Promise<void> {
    const response = await fetch('/api/boosters/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to sync booster purchase: ${response.statusText}`)
    }
  }

  /**
   * Sync premium purchase
   */
  private async syncPremiumPurchase(data: any): Promise<void> {
    const response = await fetch('/api/premium/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to sync premium purchase: ${response.statusText}`)
    }
  }

  /**
   * Cache data for offline access
   */
  cacheData(key: string, data: any, expirationMinutes?: number): void {
    const cachedData: CachedData = {
      key,
      data,
      timestamp: new Date(),
      expiresAt: expirationMinutes ? new Date(Date.now() + expirationMinutes * 60000) : undefined
    }

    this.cache.set(key, cachedData)
    this.saveToStorage()
  }

  /**
   * Get cached data
   */
  getCachedData(key: string): any | null {
    const cached = this.cache.get(key)
    
    if (!cached) {
      return null
    }

    // Check if data has expired
    if (cached.expiresAt && cached.expiresAt < new Date()) {
      this.cache.delete(key)
      this.saveToStorage()
      return null
    }

    return cached.data
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = new Date()
    let cleared = 0

    for (const [key, cached] of this.cache.entries()) {
      if (cached.expiresAt && cached.expiresAt < now) {
        this.cache.delete(key)
        cleared++
      }
    }

    if (cleared > 0) {
      console.log(`Cleared ${cleared} expired cache entries`)
      this.saveToStorage()
    }
  }

  /**
   * Get cache size and statistics
   */
  getCacheStats() {
    const now = new Date()
    let expired = 0
    let total = this.cache.size

    for (const cached of this.cache.values()) {
      if (cached.expiresAt && cached.expiresAt < now) {
        expired++
      }
    }

    return {
      total,
      expired,
      valid: total - expired,
      pendingActions: this.syncQueue.length
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear()
    this.saveToStorage()
  }

  /**
   * Save state to localStorage
   */
  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const state = {
        syncQueue: this.syncQueue,
        cache: Array.from(this.cache.entries())
      }
      localStorage.setItem('shotcaller_offline_state', JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save offline state:', error)
    }
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('shotcaller_offline_state')
      if (stored) {
        const state = JSON.parse(stored)
        this.syncQueue = state.syncQueue || []
        this.cache = new Map(state.cache || [])
        
        // Convert timestamp strings back to Date objects
        this.syncQueue.forEach(action => {
          action.timestamp = new Date(action.timestamp)
        })
        
        this.cache.forEach(cached => {
          cached.timestamp = new Date(cached.timestamp)
          if (cached.expiresAt) {
            cached.expiresAt = new Date(cached.expiresAt)
          }
        })
      }
    } catch (error) {
      console.error('Failed to load offline state:', error)
    }
  }

  /**
   * Start periodic sync attempts
   */
  private startPeriodicSync(): void {
    setInterval(() => {
      if (this.isOnline() && this.syncQueue.length > 0) {
        this.syncPendingActions()
      }
      this.clearExpiredCache()
    }, 30000) // Check every 30 seconds
  }
}

// Create singleton instance
export const offlineModeManager = new OfflineModeManager()

/**
 * Hook for using offline mode in React components
 */
export function useOfflineMode() {
  const [networkStatus, setNetworkStatus] = React.useState<NetworkStatus>(
    offlineModeManager.getNetworkStatus()
  )
  const [pendingActions, setPendingActions] = React.useState(
    offlineModeManager.getPendingActionsCount()
  )

  React.useEffect(() => {
    const unsubscribe = offlineModeManager.addNetworkListener(setNetworkStatus)
    
    const updatePendingActions = () => {
      setPendingActions(offlineModeManager.getPendingActionsCount())
    }

    // Update pending actions count periodically
    const interval = setInterval(updatePendingActions, 1000)
    updatePendingActions()

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  return {
    networkStatus,
    pendingActions,
    isOnline: networkStatus.isOnline,
    queueAction: offlineModeManager.queueAction.bind(offlineModeManager),
    syncPendingActions: offlineModeManager.syncPendingActions.bind(offlineModeManager),
    getCachedData: offlineModeManager.getCachedData.bind(offlineModeManager),
    cacheData: offlineModeManager.cacheData.bind(offlineModeManager),
    getCacheStats: offlineModeManager.getCacheStats.bind(offlineModeManager)
  }
}

// Import React for the hook
import React from 'react'