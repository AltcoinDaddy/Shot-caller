/**
 * Sync Error Recovery Manager
 * Handles automatic and manual recovery strategies for sync operations
 */

import { 
  SyncError, 
  SyncErrorType, 
  RecoveryStrategy, 
  classifyError,
  shouldRetryAutomatically 
} from '@/lib/utils/sync-error-classification';

export interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  message: string;
  data?: any;
  retryAfter?: number;
}

export interface RecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackData?: any;
  forceManual?: boolean;
}

export interface CachedData {
  data: any;
  timestamp: Date;
  isStale: boolean;
  source: string;
}

export class SyncErrorRecoveryManager {
  private retryAttempts = new Map<string, number>();
  private cachedData = new Map<string, CachedData>();
  private recoveryCallbacks = new Map<RecoveryStrategy, (error: SyncError, options?: RecoveryOptions) => Promise<RecoveryResult>>();

  constructor() {
    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize recovery strategy handlers
   */
  private initializeRecoveryStrategies(): void {
    this.recoveryCallbacks.set(RecoveryStrategy.RETRY_AUTOMATIC, this.handleAutomaticRetry.bind(this));
    this.recoveryCallbacks.set(RecoveryStrategy.RETRY_MANUAL, this.handleManualRetry.bind(this));
    this.recoveryCallbacks.set(RecoveryStrategy.FALLBACK_CACHE, this.handleCacheFallback.bind(this));
    this.recoveryCallbacks.set(RecoveryStrategy.FALLBACK_PARTIAL, this.handlePartialFallback.bind(this));
    this.recoveryCallbacks.set(RecoveryStrategy.REQUIRE_RECONNECTION, this.handleReconnectionRequired.bind(this));
    this.recoveryCallbacks.set(RecoveryStrategy.REQUIRE_USER_ACTION, this.handleUserActionRequired.bind(this));
    this.recoveryCallbacks.set(RecoveryStrategy.NO_RECOVERY, this.handleNoRecovery.bind(this));
  }

  /**
   * Attempt to recover from a sync error
   */
  async recoverFromError(
    error: any, 
    operation: string, 
    options: RecoveryOptions = {}
  ): Promise<RecoveryResult> {
    const classifiedError = classifyError(error, operation);
    
    // Log error for monitoring
    this.logError(classifiedError);
    
    // Get recovery handler
    const recoveryHandler = this.recoveryCallbacks.get(classifiedError.recoveryStrategy);
    
    if (!recoveryHandler) {
      return {
        success: false,
        strategy: classifiedError.recoveryStrategy,
        message: 'No recovery strategy available for this error type'
      };
    }

    try {
      const result = await recoveryHandler(classifiedError, options);
      
      // Reset retry count on successful recovery (only if no retry needed)
      if (result.success && !result.retryAfter) {
        this.retryAttempts.delete(classifiedError.id);
      }
      
      return result;
    } catch (recoveryError) {
      console.error('Recovery strategy failed:', recoveryError);
      return {
        success: false,
        strategy: classifiedError.recoveryStrategy,
        message: 'Recovery strategy execution failed'
      };
    }
  }

  /**
   * Handle automatic retry strategy
   */
  private async handleAutomaticRetry(
    error: SyncError, 
    options: RecoveryOptions = {}
  ): Promise<RecoveryResult> {
    const maxRetries = options.maxRetries || 3;
    const currentRetries = this.retryAttempts.get(error.id) || 0;
    
    if (currentRetries >= maxRetries) {
      return {
        success: false,
        strategy: RecoveryStrategy.RETRY_AUTOMATIC,
        message: `Maximum retry attempts (${maxRetries}) exceeded`
      };
    }

    // Increment retry count
    this.retryAttempts.set(error.id, currentRetries + 1);
    
    // Calculate exponential backoff delay
    const baseDelay = options.retryDelay || 1000;
    const delay = baseDelay * Math.pow(2, currentRetries);
    
    return {
      success: true,
      strategy: RecoveryStrategy.RETRY_AUTOMATIC,
      message: `Retrying in ${delay}ms (attempt ${currentRetries + 1}/${maxRetries})`,
      retryAfter: delay
    };
  }

  /**
   * Handle manual retry strategy
   */
  private async handleManualRetry(
    error: SyncError, 
    options: RecoveryOptions = {}
  ): Promise<RecoveryResult> {
    return {
      success: true,
      strategy: RecoveryStrategy.RETRY_MANUAL,
      message: 'Manual retry required. Please try the operation again.'
    };
  }

  /**
   * Handle cache fallback strategy
   */
  private async handleCacheFallback(
    error: SyncError, 
    options: RecoveryOptions = {}
  ): Promise<RecoveryResult> {
    const cacheKey = this.getCacheKey(error.operation, error.context);
    const cachedData = this.cachedData.get(cacheKey);
    
    if (cachedData) {
      const staleness = Date.now() - cachedData.timestamp.getTime();
      const isVeryStale = staleness > 24 * 60 * 60 * 1000; // 24 hours
      
      return {
        success: true,
        strategy: RecoveryStrategy.FALLBACK_CACHE,
        message: isVeryStale 
          ? 'Using cached data (may be outdated). Please try refreshing later.'
          : 'Using recent cached data while resolving sync issue.',
        data: cachedData.data
      };
    }

    // No cached data available, try partial fallback
    if (options.fallbackData) {
      return {
        success: true,
        strategy: RecoveryStrategy.FALLBACK_CACHE,
        message: 'Using default data while resolving sync issue.',
        data: options.fallbackData
      };
    }

    return {
      success: false,
      strategy: RecoveryStrategy.FALLBACK_CACHE,
      message: 'No cached data available for fallback'
    };
  }

  /**
   * Handle partial fallback strategy
   */
  private async handlePartialFallback(
    error: SyncError, 
    options: RecoveryOptions = {}
  ): Promise<RecoveryResult> {
    // Check if we should use partial fallback based on error type
    if (error.recoveryStrategy !== RecoveryStrategy.FALLBACK_PARTIAL) {
      // If not explicitly partial fallback, try cache first
      const cacheResult = await this.handleCacheFallback(error, options);
      if (cacheResult.success) {
        return cacheResult;
      }
    }
    
    // Attempt to provide partial functionality
    const partialData = this.getPartialData(error.operation, error.context);
    
    return {
      success: true,
      strategy: RecoveryStrategy.FALLBACK_PARTIAL,
      message: 'Some features may be limited while resolving sync issues.',
      data: partialData
    };
  }

  /**
   * Handle reconnection required strategy
   */
  private async handleReconnectionRequired(
    error: SyncError, 
    options: RecoveryOptions = {}
  ): Promise<RecoveryResult> {
    return {
      success: false,
      strategy: RecoveryStrategy.REQUIRE_RECONNECTION,
      message: 'Please disconnect and reconnect your wallet to continue.'
    };
  }

  /**
   * Handle user action required strategy
   */
  private async handleUserActionRequired(
    error: SyncError, 
    options: RecoveryOptions = {}
  ): Promise<RecoveryResult> {
    return {
      success: false,
      strategy: RecoveryStrategy.REQUIRE_USER_ACTION,
      message: 'User action required to resolve this issue.'
    };
  }

  /**
   * Handle no recovery strategy
   */
  private async handleNoRecovery(
    error: SyncError, 
    options: RecoveryOptions = {}
  ): Promise<RecoveryResult> {
    return {
      success: false,
      strategy: RecoveryStrategy.NO_RECOVERY,
      message: 'This error cannot be automatically recovered from.'
    };
  }

  /**
   * Cache data for fallback purposes
   */
  setCachedData(operation: string, context: any, data: any): void {
    const cacheKey = this.getCacheKey(operation, context);
    this.cachedData.set(cacheKey, {
      data,
      timestamp: new Date(),
      isStale: false,
      source: operation
    });
  }

  /**
   * Get cached data if available
   */
  getCachedData(operation: string, context: any): CachedData | null {
    const cacheKey = this.getCacheKey(operation, context);
    const cached = this.cachedData.get(cacheKey);
    
    if (cached) {
      // Mark as stale if older than 1 hour
      const staleness = Date.now() - cached.timestamp.getTime();
      cached.isStale = staleness > 60 * 60 * 1000;
    }
    
    return cached || null;
  }

  /**
   * Clear cached data
   */
  clearCache(operation?: string): void {
    if (operation) {
      // Clear specific operation cache
      for (const [key] of this.cachedData) {
        if (key.includes(operation)) {
          this.cachedData.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cachedData.clear();
    }
  }

  /**
   * Get retry count for an error
   */
  getRetryCount(errorId: string): number {
    return this.retryAttempts.get(errorId) || 0;
  }

  /**
   * Reset retry count for an error
   */
  resetRetryCount(errorId: string): void {
    this.retryAttempts.delete(errorId);
  }

  /**
   * Generate cache key from operation and context
   */
  private getCacheKey(operation: string, context: any): string {
    const contextKey = context?.address || context?.walletAddress || 'default';
    return `${operation}_${contextKey}`;
  }

  /**
   * Get partial data for graceful degradation
   */
  private getPartialData(operation: string, context: any): any {
    switch (operation) {
      case 'syncNFTCollection':
        return {
          nfts: [],
          count: 0,
          eligibleMoments: 0,
          message: 'NFT collection temporarily unavailable'
        };
      case 'syncProfileStats':
        return {
          stats: {
            gamesPlayed: 0,
            totalScore: 0,
            rank: 'N/A'
          },
          message: 'Profile stats temporarily unavailable'
        };
      case 'syncWalletToProfile':
        return {
          address: context.address || 'Unknown',
          connected: false,
          message: 'Wallet sync temporarily unavailable'
        };
      default:
        return {
          message: 'Data temporarily unavailable'
        };
    }
  }

  /**
   * Log error for monitoring and debugging
   */
  private logError(error: SyncError): void {
    const logData = {
      errorId: error.id,
      type: error.type,
      severity: error.severity,
      operation: error.operation,
      timestamp: error.timestamp,
      retryable: error.retryable,
      strategy: error.recoveryStrategy,
      context: {
        ...error.context,
        // Remove sensitive data
        originalError: undefined
      }
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sync Error:', logData);
    }

    // In production, this would send to monitoring service
    // Example: sendToMonitoringService(logData);
  }
}

// Export singleton instance
export const syncErrorRecoveryManager = new SyncErrorRecoveryManager();