/**
 * Network Resilience Manager
 * 
 * Handles network connectivity monitoring, retry logic, offline operations,
 * and connection quality assessment for the wallet-profile sync system.
 */

export interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition: (error: Error) => boolean;
}

export interface OfflineOperation {
  id: string;
  type: string;
  operation: () => Promise<any>;
  data: any;
  timestamp: Date;
  retryCount: number;
  priority: number;
}

export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  OFFLINE = 'offline'
}

export interface NetworkStatus {
  isOnline: boolean;
  quality: ConnectionQuality;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  lastChecked: Date;
}

export interface NetworkResilienceConfig {
  defaultRetryPolicy: RetryPolicy;
  offlineStorageKey: string;
  connectionCheckInterval: number;
  qualityCheckInterval: number;
  maxOfflineOperations: number;
}

const DEFAULT_CONFIG: NetworkResilienceConfig = {
  defaultRetryPolicy: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryCondition: (error: Error) => {
      // Retry on network errors, timeouts, and 5xx server errors
      return error.name === 'NetworkError' || 
             error.name === 'TimeoutError' ||
             (error.message && error.message.includes('fetch'));
    }
  },
  offlineStorageKey: 'shotcaller_offline_operations',
  connectionCheckInterval: 5000,
  qualityCheckInterval: 30000,
  maxOfflineOperations: 100
};

export class NetworkResilienceManager {
  private config: NetworkResilienceConfig;
  private networkStatus: NetworkStatus;
  private offlineQueue: OfflineOperation[] = [];
  private eventListeners: Map<string, Set<Function>> = new Map();
  private connectionCheckInterval?: NodeJS.Timeout;
  private qualityCheckInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: Partial<NetworkResilienceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.networkStatus = {
      isOnline: navigator.onLine,
      quality: ConnectionQuality.GOOD,
      lastChecked: new Date()
    };
    
    this.initializeNetworkMonitoring();
    this.loadOfflineQueue();
  }

  /**
   * Initialize network monitoring and event listeners
   */
  private initializeNetworkMonitoring(): void {
    if (this.isInitialized) return;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Start periodic connection quality checks
    this.startConnectionMonitoring();
    
    this.isInitialized = true;
  }

  /**
   * Start periodic connection monitoring
   */
  private startConnectionMonitoring(): void {
    // Check basic connectivity
    this.connectionCheckInterval = setInterval(() => {
      this.checkConnectivity();
    }, this.config.connectionCheckInterval);

    // Check connection quality
    this.qualityCheckInterval = setInterval(() => {
      this.assessConnectionQuality();
    }, this.config.qualityCheckInterval);

    // Initial checks
    this.checkConnectivity();
    this.assessConnectionQuality();
  }

  /**
   * Check basic network connectivity
   */
  private async checkConnectivity(): Promise<void> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const wasOffline = !this.networkStatus.isOnline;
      this.networkStatus.isOnline = response.ok;
      this.networkStatus.lastChecked = new Date();

      if (wasOffline && this.networkStatus.isOnline) {
        this.handleConnectionRestored();
      }
    } catch (error) {
      this.networkStatus.isOnline = false;
      this.networkStatus.quality = ConnectionQuality.OFFLINE;
      this.networkStatus.lastChecked = new Date();
    }

    this.emitEvent('networkStatusChange', this.networkStatus);
  }  /*
*
   * Assess connection quality using Network Information API
   */
  private assessConnectionQuality(): void {
    if (!this.networkStatus.isOnline) {
      this.networkStatus.quality = ConnectionQuality.OFFLINE;
      return;
    }

    // Use Network Information API if available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      this.networkStatus.effectiveType = connection.effectiveType;
      this.networkStatus.downlink = connection.downlink;
      this.networkStatus.rtt = connection.rtt;

      // Determine quality based on connection metrics
      if (connection.effectiveType === '4g' && connection.downlink > 10) {
        this.networkStatus.quality = ConnectionQuality.EXCELLENT;
      } else if (connection.effectiveType === '4g' || connection.downlink > 5) {
        this.networkStatus.quality = ConnectionQuality.GOOD;
      } else if (connection.effectiveType === '3g' || connection.downlink > 1) {
        this.networkStatus.quality = ConnectionQuality.FAIR;
      } else {
        this.networkStatus.quality = ConnectionQuality.POOR;
      }
    } else {
      // Fallback: assume good quality if online
      this.networkStatus.quality = ConnectionQuality.GOOD;
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.networkStatus.isOnline = true;
    this.networkStatus.lastChecked = new Date();
    this.assessConnectionQuality();
    this.handleConnectionRestored();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.networkStatus.isOnline = false;
    this.networkStatus.quality = ConnectionQuality.OFFLINE;
    this.networkStatus.lastChecked = new Date();
    this.emitEvent('networkStatusChange', this.networkStatus);
  }

  /**
   * Handle connection restoration
   */
  private handleConnectionRestored(): void {
    this.emitEvent('connectionRestored', this.networkStatus);
    // Process offline queue when connection is restored
    this.processOfflineQueue();
  }

  /**
   * Execute operation with retry logic
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    policy: RetryPolicy = this.config.defaultRetryPolicy
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry this error
        if (!policy.retryCondition(lastError) || attempt === policy.maxAttempts) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          policy.baseDelay * Math.pow(policy.backoffMultiplier, attempt - 1),
          policy.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        await this.sleep(jitteredDelay);
      }
    }

    throw lastError!;
  }

  /**
   * Queue operation for offline execution
   */
  public queueOfflineOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>): void {
    const offlineOp: OfflineOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: new Date(),
      retryCount: 0
    };

    this.offlineQueue.push(offlineOp);
    
    // Limit queue size
    if (this.offlineQueue.length > this.config.maxOfflineOperations) {
      // Remove oldest operations
      this.offlineQueue.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      this.offlineQueue = this.offlineQueue.slice(-this.config.maxOfflineOperations);
    }

    this.saveOfflineQueue();
    this.emitEvent('operationQueued', offlineOp);
  }

  /**
   * Process offline operation queue
   */
  public async processOfflineQueue(): Promise<void> {
    if (!this.networkStatus.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    // Sort by priority (higher first) then by timestamp (older first)
    const sortedQueue = [...this.offlineQueue].sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    const processedOperations: string[] = [];

    for (const operation of sortedQueue) {
      try {
        await this.executeWithRetry(operation.operation);
        processedOperations.push(operation.id);
        this.emitEvent('operationProcessed', operation);
      } catch (error) {
        operation.retryCount++;
        
        // Remove operation if it has exceeded retry attempts
        if (operation.retryCount >= this.config.defaultRetryPolicy.maxAttempts) {
          processedOperations.push(operation.id);
          this.emitEvent('operationFailed', { operation, error });
        }
      }
    }

    // Remove processed operations from queue
    this.offlineQueue = this.offlineQueue.filter(
      op => !processedOperations.includes(op.id)
    );

    this.saveOfflineQueue();
  }

  /**
   * Get current network status
   */
  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * Check if currently online
   */
  public isOnline(): boolean {
    return this.networkStatus.isOnline;
  }

  /**
   * Get connection quality
   */
  public getConnectionQuality(): ConnectionQuality {
    return this.networkStatus.quality;
  }

  /**
   * Get offline queue status
   */
  public getOfflineQueueStatus(): { count: number; operations: OfflineOperation[] } {
    return {
      count: this.offlineQueue.length,
      operations: [...this.offlineQueue]
    };
  }

  /**
   * Clear offline queue
   */
  public clearOfflineQueue(): void {
    this.offlineQueue = [];
    this.saveOfflineQueue();
    this.emitEvent('queueCleared', null);
  }

  /**
   * Get fallback data from cache
   */
  public getFallbackData(key: string): any {
    try {
      const cached = localStorage.getItem(`fallback_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.data || parsed;
      }
      return null;
    } catch (error) {
      console.warn('Failed to retrieve fallback data:', error);
      return null;
    }
  }

  /**
   * Set cached fallback data
   */
  public setCachedFallback(key: string, data: any): void {
    try {
      localStorage.setItem(`fallback_${key}`, JSON.stringify({
        data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Failed to cache fallback data:', error);
    }
  }

  /**
   * Subscribe to network events
   */
  public addEventListener(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Load offline queue from storage
   */
  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem(this.config.offlineStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.offlineQueue = parsed.map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp),
          // Note: operation functions cannot be serialized, so they need to be re-registered
          operation: () => Promise.reject(new Error('Operation function not available after reload'))
        }));
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Save offline queue to storage
   */
  private saveOfflineQueue(): void {
    try {
      // Only save serializable data (exclude operation functions)
      const serializable = this.offlineQueue.map(op => ({
        id: op.id,
        type: op.type,
        data: op.data,
        timestamp: op.timestamp.toISOString(),
        retryCount: op.retryCount,
        priority: op.priority
      }));
      
      localStorage.setItem(this.config.offlineStorageKey, JSON.stringify(serializable));
    } catch (error) {
      console.warn('Failed to save offline queue:', error);
    }
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
    
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
    }

    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    this.eventListeners.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const networkResilienceManager = new NetworkResilienceManager();