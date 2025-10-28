/**
 * Example usage of the SyncEventBus for wallet-profile synchronization
 * 
 * This file demonstrates how to use the event bus system for managing
 * sync-related events across different components in the application.
 */

import { syncEventBus, SYNC_EVENTS } from './sync-event-bus';
import { SyncEventType, SyncEvent } from '@/lib/types/sync';

// ============================================================================
// Example: Wallet Connection Handler
// ============================================================================

export class WalletConnectionHandler {
  private unsubscribeFunctions: (() => void)[] = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for wallet connection events
    const unsubscribeConnect = syncEventBus.subscribe(
      SYNC_EVENTS.WALLET_CONNECTED,
      this.handleWalletConnected.bind(this)
    );

    // Listen for wallet disconnection events
    const unsubscribeDisconnect = syncEventBus.subscribe(
      SYNC_EVENTS.WALLET_DISCONNECTED,
      this.handleWalletDisconnected.bind(this)
    );

    // Listen for sync errors
    const unsubscribeError = syncEventBus.subscribe(
      SYNC_EVENTS.SYNC_ERROR,
      this.handleSyncError.bind(this)
    );

    this.unsubscribeFunctions.push(
      unsubscribeConnect,
      unsubscribeDisconnect,
      unsubscribeError
    );
  }

  private handleWalletConnected(event: SyncEvent) {
    console.log('Wallet connected:', event.data.address);
    
    // Trigger profile sync when wallet connects
    syncEventBus.emitEvent(
      SYNC_EVENTS.PROFILE_SYNC_STARTED,
      { 
        address: event.data.address,
        trigger: 'wallet_connection'
      },
      'WalletConnectionHandler'
    );
  }

  private handleWalletDisconnected(event: SyncEvent) {
    console.log('Wallet disconnected');
    
    // Clear any ongoing sync operations
    // Reset profile state
  }

  private handleSyncError(event: SyncEvent) {
    console.error('Sync error occurred:', event.data.error);
    
    // Handle error recovery
    // Show user notification
  }

  destroy() {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }
}

// ============================================================================
// Example: Profile Sync Manager
// ============================================================================

export class ProfileSyncManager {
  private isSyncInProgress = false;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for sync start requests
    syncEventBus.subscribe(
      SYNC_EVENTS.PROFILE_SYNC_STARTED,
      this.handleSyncStart.bind(this)
    );

    // Listen for NFT collection updates
    syncEventBus.subscribe(
      SYNC_EVENTS.NFT_COLLECTION_UPDATED,
      this.handleNFTCollectionUpdate.bind(this)
    );
  }

  private async handleSyncStart(event: SyncEvent) {
    if (this.isSyncInProgress) {
      console.log('Sync already in progress, skipping');
      return;
    }

    this.isSyncInProgress = true;
    
    try {
      console.log('Starting profile sync for:', event.data.address);
      
      // Simulate sync operations
      await this.syncNFTCollection(event.data.address);
      await this.syncProfileStats(event.data.address);
      
      // Emit completion event
      syncEventBus.emitEvent(
        SYNC_EVENTS.PROFILE_SYNC_COMPLETED,
        {
          address: event.data.address,
          success: true,
          duration: Date.now() - event.timestamp.getTime()
        },
        'ProfileSyncManager'
      );
      
    } catch (error) {
      // Emit error event
      syncEventBus.emitEvent(
        SYNC_EVENTS.SYNC_ERROR,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'profile_sync',
          address: event.data.address
        },
        'ProfileSyncManager'
      );
    } finally {
      this.isSyncInProgress = false;
    }
  }

  private async syncNFTCollection(address: string) {
    // Simulate NFT collection sync
    console.log('Syncing NFT collection for:', address);
    
    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Emit NFT collection update
    syncEventBus.emitEvent(
      SYNC_EVENTS.NFT_COLLECTION_UPDATED,
      {
        address,
        newNFTs: 5,
        totalNFTs: 25,
        eligibleMoments: 20
      },
      'ProfileSyncManager'
    );
  }

  private async syncProfileStats(address: string) {
    // Simulate profile stats sync
    console.log('Syncing profile stats for:', address);
    
    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private handleNFTCollectionUpdate(event: SyncEvent) {
    console.log('NFT collection updated:', event.data);
    
    // Update UI components
    // Refresh eligibility status
    // Update profile display
  }
}

// ============================================================================
// Example: UI Component Integration
// ============================================================================

export class SyncStatusComponent {
  private syncStatus = {
    isActive: false,
    lastSync: null as Date | null,
    error: null as string | null
  };

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen to multiple sync events
    syncEventBus.subscribeToMultiple(
      [
        SYNC_EVENTS.PROFILE_SYNC_STARTED,
        SYNC_EVENTS.PROFILE_SYNC_COMPLETED,
        SYNC_EVENTS.SYNC_ERROR
      ],
      this.handleSyncStatusChange.bind(this)
    );
  }

  private handleSyncStatusChange(event: SyncEvent) {
    switch (event.type) {
      case SYNC_EVENTS.PROFILE_SYNC_STARTED:
        this.syncStatus.isActive = true;
        this.syncStatus.error = null;
        break;
        
      case SYNC_EVENTS.PROFILE_SYNC_COMPLETED:
        this.syncStatus.isActive = false;
        this.syncStatus.lastSync = event.timestamp;
        this.syncStatus.error = null;
        break;
        
      case SYNC_EVENTS.SYNC_ERROR:
        this.syncStatus.isActive = false;
        this.syncStatus.error = event.data.error;
        break;
    }
    
    this.updateUI();
  }

  private updateUI() {
    // Update component state
    // Trigger re-render
    console.log('Sync status updated:', this.syncStatus);
  }

  getSyncStatus() {
    return { ...this.syncStatus };
  }
}

// ============================================================================
// Example: Event History and Debugging
// ============================================================================

export class SyncDebugger {
  constructor() {
    // Enable debug mode in development
    if (process.env.NODE_ENV === 'development') {
      syncEventBus.setDebugMode(true);
    }
  }

  // Get recent sync events for debugging
  getRecentSyncEvents(limit = 10) {
    return syncEventBus.getEventHistory(undefined, limit);
  }

  // Get events of a specific type
  getEventsByType(eventType: SyncEventType, limit = 5) {
    return syncEventBus.getEventHistory(eventType, limit);
  }

  // Get sync error history
  getSyncErrors(limit = 5) {
    return syncEventBus.getEventHistory(SYNC_EVENTS.SYNC_ERROR, limit);
  }

  // Get listener statistics
  getListenerStats() {
    const activeTypes = syncEventBus.getActiveEventTypes();
    const stats: Record<string, number> = {};
    
    activeTypes.forEach((count, eventType) => {
      stats[eventType] = count;
    });
    
    return stats;
  }

  // Wait for next sync completion (useful for testing)
  async waitForNextSyncCompletion(timeout = 5000) {
    try {
      const event = await syncEventBus.waitForEvent(
        SYNC_EVENTS.PROFILE_SYNC_COMPLETED,
        timeout
      );
      return event;
    } catch (error) {
      console.error('Timeout waiting for sync completion:', error);
      throw error;
    }
  }

  // Clear debug history
  clearDebugHistory() {
    syncEventBus.clearHistory();
  }
}

// ============================================================================
// Example Usage in Application
// ============================================================================

export function initializeSyncSystem() {
  // Create sync system components
  const walletHandler = new WalletConnectionHandler();
  const syncManager = new ProfileSyncManager();
  const statusComponent = new SyncStatusComponent();
  const syncDebugger = new SyncDebugger();

  // Simulate wallet connection
  setTimeout(() => {
    syncEventBus.emitEvent(
      SYNC_EVENTS.WALLET_CONNECTED,
      { address: '0x1234567890abcdef' },
      'WalletConnector'
    );
  }, 1000);

  // Return cleanup function
  return () => {
    walletHandler.destroy();
    // Other components would have similar cleanup methods
  };
}

// Example of how to use in a React component
export function useSyncEvents() {
  const [syncStatus, setSyncStatus] = React.useState({
    isActive: false,
    lastSync: null as Date | null,
    error: null as string | null
  });

  React.useEffect(() => {
    const unsubscribe = syncEventBus.subscribeToMultiple(
      [
        SYNC_EVENTS.PROFILE_SYNC_STARTED,
        SYNC_EVENTS.PROFILE_SYNC_COMPLETED,
        SYNC_EVENTS.SYNC_ERROR
      ],
      (event) => {
        switch (event.type) {
          case SYNC_EVENTS.PROFILE_SYNC_STARTED:
            setSyncStatus(prev => ({ ...prev, isActive: true, error: null }));
            break;
          case SYNC_EVENTS.PROFILE_SYNC_COMPLETED:
            setSyncStatus(prev => ({ 
              ...prev, 
              isActive: false, 
              lastSync: event.timestamp,
              error: null 
            }));
            break;
          case SYNC_EVENTS.SYNC_ERROR:
            setSyncStatus(prev => ({ 
              ...prev, 
              isActive: false, 
              error: event.data.error 
            }));
            break;
        }
      }
    );

    return unsubscribe;
  }, []);

  return syncStatus;
}

// Note: React import would be added at the top in a real implementation
declare const React: any;