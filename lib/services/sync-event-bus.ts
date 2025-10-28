import { 
  SyncEvent, 
  SyncEventType, 
  SyncEventHandler 
} from '@/lib/types/sync';

/**
 * Sync Event Bus - Manages sync-related events across components
 * 
 * Provides type-safe event subscription and emission for wallet-profile
 * synchronization operations with logging and debugging capabilities.
 */
export class SyncEventBus {
  private listeners: Map<SyncEventType, Set<SyncEventHandler>> = new Map();
  private eventHistory: SyncEvent[] = [];
  private maxHistorySize: number = 100;
  private debugMode: boolean = false;

  constructor(options?: { maxHistorySize?: number; debugMode?: boolean }) {
    this.maxHistorySize = options?.maxHistorySize ?? 100;
    this.debugMode = options?.debugMode ?? false;
  }

  /**
   * Subscribe to a specific sync event type
   * @param eventType - The type of sync event to listen for
   * @param handler - The callback function to execute when event is emitted
   * @returns Unsubscribe function
   */
  subscribe(eventType: SyncEventType, handler: SyncEventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const handlers = this.listeners.get(eventType)!;
    handlers.add(handler);

    if (this.debugMode) {
      console.log(`[SyncEventBus] Subscribed to ${eventType}. Total listeners: ${handlers.size}`);
    }

    // Return unsubscribe function
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
      
      if (this.debugMode) {
        console.log(`[SyncEventBus] Unsubscribed from ${eventType}. Remaining listeners: ${handlers.size}`);
      }
    };
  }

  /**
   * Emit a sync event to all registered listeners
   * @param event - The sync event to emit
   */
  emit(event: SyncEvent): void {
    // Add to event history
    this.addToHistory(event);

    // Get listeners for this event type
    const handlers = this.listeners.get(event.type);
    
    if (!handlers || handlers.size === 0) {
      if (this.debugMode) {
        console.log(`[SyncEventBus] No listeners for event ${event.type}`);
      }
      return;
    }

    if (this.debugMode) {
      console.log(`[SyncEventBus] Emitting ${event.type} to ${handlers.size} listeners`, event);
    }

    // Execute all handlers
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`[SyncEventBus] Error in event handler for ${event.type}:`, error);
      }
    });
  }

  /**
   * Create and emit a sync event
   * @param type - The event type
   * @param data - The event data
   * @param source - The source component/service that triggered the event
   */
  emitEvent(type: SyncEventType, data: any, source: string): void {
    const event: SyncEvent = {
      type,
      timestamp: new Date(),
      data,
      source
    };

    this.emit(event);
  }

  /**
   * Subscribe to multiple event types with the same handler
   * @param eventTypes - Array of event types to listen for
   * @param handler - The callback function to execute
   * @returns Unsubscribe function that removes all subscriptions
   */
  subscribeToMultiple(eventTypes: SyncEventType[], handler: SyncEventHandler): () => void {
    const unsubscribeFunctions = eventTypes.map(eventType => 
      this.subscribe(eventType, handler)
    );

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Get the event history
   * @param eventType - Optional filter by event type
   * @param limit - Maximum number of events to return
   * @returns Array of sync events
   */
  getEventHistory(eventType?: SyncEventType, limit?: number): SyncEvent[] {
    let events = eventType 
      ? this.eventHistory.filter(event => event.type === eventType)
      : this.eventHistory;

    if (limit) {
      events = events.slice(-limit);
    }

    return [...events]; // Return copy to prevent mutation
  }

  /**
   * Clear the event history
   * @param eventType - Optional: only clear events of this type
   */
  clearHistory(eventType?: SyncEventType): void {
    if (eventType) {
      this.eventHistory = this.eventHistory.filter(event => event.type !== eventType);
    } else {
      this.eventHistory = [];
    }

    if (this.debugMode) {
      console.log(`[SyncEventBus] Cleared event history${eventType ? ` for ${eventType}` : ''}`);
    }
  }

  /**
   * Get current listener count for an event type
   * @param eventType - The event type to check
   * @returns Number of active listeners
   */
  getListenerCount(eventType: SyncEventType): number {
    return this.listeners.get(eventType)?.size ?? 0;
  }

  /**
   * Get all active event types with listener counts
   * @returns Map of event types to listener counts
   */
  getActiveEventTypes(): Map<SyncEventType, number> {
    const activeTypes = new Map<SyncEventType, number>();
    
    this.listeners.forEach((handlers, eventType) => {
      if (handlers.size > 0) {
        activeTypes.set(eventType, handlers.size);
      }
    });

    return activeTypes;
  }

  /**
   * Enable or disable debug mode
   * @param enabled - Whether to enable debug logging
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`[SyncEventBus] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Remove all listeners and clear history
   */
  destroy(): void {
    this.listeners.clear();
    this.eventHistory = [];
    
    if (this.debugMode) {
      console.log('[SyncEventBus] Event bus destroyed');
    }
  }

  /**
   * Wait for a specific event to be emitted
   * @param eventType - The event type to wait for
   * @param timeout - Optional timeout in milliseconds
   * @returns Promise that resolves with the event
   */
  waitForEvent(eventType: SyncEventType, timeout?: number): Promise<SyncEvent> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;
      
      const unsubscribe = this.subscribe(eventType, (event) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        unsubscribe();
        resolve(event);
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          reject(new Error(`Timeout waiting for event ${eventType} after ${timeout}ms`));
        }, timeout);
      }
    });
  }

  /**
   * Add event to history with size management
   * @private
   */
  private addToHistory(event: SyncEvent): void {
    this.eventHistory.push(event);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
}

// Create and export a singleton instance
export const syncEventBus = new SyncEventBus({
  debugMode: process.env.NODE_ENV === 'development'
});

// Export event type constants for convenience
export const SYNC_EVENTS = {
  WALLET_CONNECTED: SyncEventType.WALLET_CONNECTED,
  WALLET_DISCONNECTED: SyncEventType.WALLET_DISCONNECTED,
  NFT_COLLECTION_UPDATED: SyncEventType.NFT_COLLECTION_UPDATED,
  PROFILE_SYNC_STARTED: SyncEventType.PROFILE_SYNC_STARTED,
  PROFILE_SYNC_COMPLETED: SyncEventType.PROFILE_SYNC_COMPLETED,
  SYNC_ERROR: SyncEventType.SYNC_ERROR
} as const;