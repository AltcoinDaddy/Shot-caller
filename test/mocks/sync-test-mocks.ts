/**
 * Mock Services for Sync Testing
 * Provides configurable mock implementations for testing network failures and API errors
 */

import { vi } from 'vitest';
import { 
  SyncEventType, 
  SyncErrorType, 
  ConnectionQuality,
  RetryPolicy 
} from '@/lib/types/sync';

export interface MockConfig {
  shouldFail?: boolean;
  failureType?: 'network' | 'api' | 'timeout' | 'validation' | 'auth';
  delay?: number;
  failureRate?: number; // 0-1, probability of failure
  collectionSize?: number;
  retryCount?: number;
}

/**
 * Mock NFT Ownership Service with configurable failure scenarios
 */
export class MockNFTOwnershipService {
  private config: MockConfig;
  private callCount = 0;

  constructor(config: MockConfig = {}) {
    this.config = {
      shouldFail: false,
      delay: 100,
      failureRate: 0,
      collectionSize: 10,
      retryCount: 0,
      ...config
    };
  }

  updateConfig(newConfig: Partial<MockConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getOwnership = vi.fn().mockImplementation(async (address: string, forceRefresh?: boolean) => {
    this.callCount++;
    
    // Simulate network delay
    if (this.config.delay! > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.delay));
    }

    // Check if should fail based on failure rate
    const shouldFail = this.config.shouldFail || 
                      (Math.random() < this.config.failureRate!);

    if (shouldFail) {
      throw this.createError(this.config.failureType || 'network');
    }

    return {
      success: true,
      data: {
        address,
        moments: this.generateMockNFTs(this.config.collectionSize!),
        collections: [
          { collectionName: 'NBA Top Shot', sport: 'NBA', count: Math.floor(this.config.collectionSize! / 2) },
          { collectionName: 'NFL All Day', sport: 'NFL', count: Math.ceil(this.config.collectionSize! / 2) }
        ],
        totalCount: this.config.collectionSize,
        lastVerified: new Date(),
        isEligible: true,
        forceRefresh
      }
    };
  });

  getEligibleMoments = vi.fn().mockImplementation(async (address: string) => {
    this.callCount++;
    
    if (this.config.delay! > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.delay! / 2));
    }

    const shouldFail = this.config.shouldFail || 
                      (Math.random() < this.config.failureRate!);

    if (shouldFail) {
      throw this.createError(this.config.failureType || 'api');
    }

    return {
      success: true,
      data: this.generateMockNFTs(this.config.collectionSize!).map(nft => ({
        id: nft.id,
        sport: nft.sport,
        eligible: true
      }))
    };
  });

  verifyOwnership = vi.fn().mockImplementation(async (address: string, nftId: string) => {
    this.callCount++;
    
    if (this.config.delay! > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.delay! / 3));
    }

    const shouldFail = this.config.shouldFail || 
                      (Math.random() < this.config.failureRate!);

    if (shouldFail) {
      throw this.createError(this.config.failureType || 'validation');
    }

    return {
      success: true,
      verified: true,
      timestamp: new Date()
    };
  });

  private generateMockNFTs(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `nft_${i}`,
      sport: i % 2 === 0 ? 'NBA' : 'NFL',
      playerName: `Player ${i}`,
      team: `Team ${i % 10}`,
      series: `Series ${Math.floor(i / 5)}`,
      playType: i % 3 === 0 ? 'Dunk' : i % 3 === 1 ? 'Three Pointer' : 'Touchdown',
      rarity: i % 5 === 0 ? 'Legendary' : i % 3 === 0 ? 'Rare' : 'Common'
    }));
  }

  private createError(type: string): Error {
    const errors = {
      network: () => {
        const error = new Error('Network connection failed');
        error.name = 'NetworkError';
        return error;
      },
      api: () => {
        const error = new Error('API server error');
        error.name = 'APIError';
        return error;
      },
      timeout: () => {
        const error = new Error('Request timeout');
        error.name = 'TimeoutError';
        return error;
      },
      validation: () => {
        const error = new Error('Invalid data format');
        error.name = 'ValidationError';
        return error;
      },
      auth: () => {
        const error = new Error('Authentication failed');
        error.name = 'AuthenticationError';
        return error;
      }
    };

    return errors[type as keyof typeof errors]?.() || new Error('Unknown error');
  }

  getCallCount(): number {
    return this.callCount;
  }

  resetCallCount(): void {
    this.callCount = 0;
  }
}

/**
 * Mock Network Resilience Manager with configurable network conditions
 */
export class MockNetworkResilienceManager {
  private config: MockConfig & {
    isOnline?: boolean;
    connectionQuality?: ConnectionQuality;
    retryPolicy?: RetryPolicy;
  };
  private operationQueue: any[] = [];
  private fallbackData: Map<string, any> = new Map();

  constructor(config: any = {}) {
    this.config = {
      isOnline: true,
      connectionQuality: ConnectionQuality.GOOD,
      shouldFail: false,
      failureRate: 0,
      delay: 50,
      retryPolicy: {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 5000,
        backoffMultiplier: 2,
        retryCondition: () => true
      },
      ...config
    };
  }

  updateConfig(newConfig: any) {
    this.config = { ...this.config, ...newConfig };
  }

  isOnline = vi.fn().mockImplementation(() => {
    return this.config.isOnline;
  });

  getConnectionQuality = vi.fn().mockImplementation(() => {
    return this.config.connectionQuality;
  });

  executeWithRetry = vi.fn().mockImplementation(async <T>(
    operation: () => Promise<T>,
    policy?: RetryPolicy
  ): Promise<T> => {
    const retryPolicy = policy || this.config.retryPolicy!;
    let lastError: Error;
    
    for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt++) {
      try {
        // Simulate network delay
        if (this.config.delay! > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.delay));
        }

        // Check if should fail
        const shouldFail = this.config.shouldFail || 
                          (Math.random() < this.config.failureRate!);

        if (shouldFail && attempt < retryPolicy.maxAttempts) {
          throw new Error(`Network error on attempt ${attempt}`);
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (!retryPolicy.retryCondition(lastError) || attempt === retryPolicy.maxAttempts) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryPolicy.baseDelay * Math.pow(retryPolicy.backoffMultiplier, attempt - 1),
          retryPolicy.maxDelay
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  });

  queueOfflineOperation = vi.fn().mockImplementation((operation: any) => {
    this.operationQueue.push({
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0
    });
  });

  processOfflineQueue = vi.fn().mockImplementation(async () => {
    if (!this.config.isOnline || this.operationQueue.length === 0) {
      return;
    }

    const processedOperations: string[] = [];

    for (const operation of this.operationQueue) {
      try {
        await operation.operation();
        processedOperations.push(operation.id);
      } catch (error) {
        operation.retryCount++;
        
        if (operation.retryCount >= 3) {
          processedOperations.push(operation.id);
        }
      }
    }

    this.operationQueue = this.operationQueue.filter(
      op => !processedOperations.includes(op.id)
    );
  });

  getFallbackData = vi.fn().mockImplementation((key: string) => {
    return this.fallbackData.get(key) || null;
  });

  setCachedFallback = vi.fn().mockImplementation((key: string, data: any) => {
    this.fallbackData.set(key, {
      data,
      timestamp: new Date().toISOString()
    });
  });

  getOfflineQueueStatus = vi.fn().mockImplementation(() => {
    return {
      count: this.operationQueue.length,
      operations: [...this.operationQueue]
    };
  });

  clearOfflineQueue = vi.fn().mockImplementation(() => {
    this.operationQueue = [];
  });

  addEventListener = vi.fn().mockImplementation((event: string, callback: Function) => {
    // Mock event listener registration
    return () => {}; // Return unsubscribe function
  });

  destroy = vi.fn().mockImplementation(() => {
    this.operationQueue = [];
    this.fallbackData.clear();
  });

  // Utility methods for testing
  simulateNetworkFailure() {
    this.config.isOnline = false;
    this.config.connectionQuality = ConnectionQuality.OFFLINE;
  }

  simulateNetworkRecovery() {
    this.config.isOnline = true;
    this.config.connectionQuality = ConnectionQuality.GOOD;
  }

  simulatePoorConnection() {
    this.config.isOnline = true;
    this.config.connectionQuality = ConnectionQuality.POOR;
    this.config.delay = 2000; // Slow responses
    this.config.failureRate = 0.3; // 30% failure rate
  }

  getQueuedOperationCount(): number {
    return this.operationQueue.length;
  }
}

/**
 * Mock Event Bus for testing event emission and subscription
 */
export class MockSyncEventBus {
  private listeners: Map<SyncEventType, Set<Function>> = new Map();
  private eventHistory: any[] = [];

  subscribe = vi.fn().mockImplementation((eventType: SyncEventType, handler: Function) => {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(handler);
    
    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  });

  emit = vi.fn().mockImplementation((event: any) => {
    this.eventHistory.push(event);
    
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in mock event handler:', error);
        }
      });
    }
  });

  emitEvent = vi.fn().mockImplementation((type: SyncEventType, data: any, source: string) => {
    const event = {
      type,
      timestamp: new Date(),
      data,
      source
    };
    
    this.emit(event);
  });

  getEventHistory = vi.fn().mockImplementation((eventType?: SyncEventType) => {
    if (eventType) {
      return this.eventHistory.filter(event => event.type === eventType);
    }
    return [...this.eventHistory];
  });

  clearHistory = vi.fn().mockImplementation(() => {
    this.eventHistory = [];
  });

  getListenerCount = vi.fn().mockImplementation((eventType: SyncEventType) => {
    return this.listeners.get(eventType)?.size || 0;
  });

  destroy = vi.fn().mockImplementation(() => {
    this.listeners.clear();
    this.eventHistory = [];
  });
}

/**
 * Factory functions for creating pre-configured mocks
 */
export const createMockServices = {
  // Fast, reliable services for basic testing
  reliable: () => ({
    nftOwnershipService: new MockNFTOwnershipService({
      shouldFail: false,
      delay: 10,
      collectionSize: 5
    }),
    networkResilienceManager: new MockNetworkResilienceManager({
      isOnline: true,
      connectionQuality: ConnectionQuality.EXCELLENT,
      shouldFail: false
    }),
    eventBus: new MockSyncEventBus()
  }),

  // Services with network issues
  unreliable: () => ({
    nftOwnershipService: new MockNFTOwnershipService({
      shouldFail: false,
      delay: 500,
      failureRate: 0.3,
      collectionSize: 10
    }),
    networkResilienceManager: new MockNetworkResilienceManager({
      isOnline: true,
      connectionQuality: ConnectionQuality.POOR,
      failureRate: 0.2,
      delay: 1000
    }),
    eventBus: new MockSyncEventBus()
  }),

  // Offline services
  offline: () => ({
    nftOwnershipService: new MockNFTOwnershipService({
      shouldFail: true,
      failureType: 'network'
    }),
    networkResilienceManager: new MockNetworkResilienceManager({
      isOnline: false,
      connectionQuality: ConnectionQuality.OFFLINE
    }),
    eventBus: new MockSyncEventBus()
  }),

  // Large collection services
  largeCollection: () => ({
    nftOwnershipService: new MockNFTOwnershipService({
      shouldFail: false,
      delay: 200,
      collectionSize: 1000
    }),
    networkResilienceManager: new MockNetworkResilienceManager({
      isOnline: true,
      connectionQuality: ConnectionQuality.GOOD,
      delay: 100
    }),
    eventBus: new MockSyncEventBus()
  }),

  // API error services
  apiErrors: () => ({
    nftOwnershipService: new MockNFTOwnershipService({
      shouldFail: true,
      failureType: 'api'
    }),
    networkResilienceManager: new MockNetworkResilienceManager({
      isOnline: true,
      connectionQuality: ConnectionQuality.GOOD
    }),
    eventBus: new MockSyncEventBus()
  })
};

/**
 * Test data generators
 */
export const generateTestData = {
  walletAddress: (index: number = 0) => `0x${index.toString().padStart(16, '0')}`,
  
  nftCollection: (size: number = 10, addressIndex: number = 0) => ({
    address: generateTestData.walletAddress(addressIndex),
    moments: Array.from({ length: size }, (_, i) => ({
      id: `nft_${addressIndex}_${i}`,
      sport: i % 2 === 0 ? 'NBA' : 'NFL',
      playerName: `Player ${i}`,
      team: `Team ${i % 5}`,
      rarity: i % 3 === 0 ? 'Rare' : 'Common'
    })),
    totalCount: size,
    isEligible: true,
    lastVerified: new Date()
  }),

  profileData: (addressIndex: number = 0, nftCount: number = 10) => ({
    address: generateTestData.walletAddress(addressIndex),
    username: `User${addressIndex}`,
    walletType: 'dapper' as const,
    collections: ['NBA Top Shot', 'NFL All Day'],
    stats: {
      totalNFTs: nftCount,
      eligibleMoments: Math.floor(nftCount * 0.8),
      gamesPlayed: Math.floor(nftCount / 2),
      totalScore: nftCount * 100,
      averageScore: 100,
      rank: addressIndex + 1,
      achievements: []
    },
    achievements: [],
    lastUpdated: new Date()
  })
};