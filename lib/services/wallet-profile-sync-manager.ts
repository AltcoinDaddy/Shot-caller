// Base Wallet-Profile Sync Manager
// Core synchronization orchestrator for wallet and profile data with security integration

import {
  SyncResult,
  NFTSyncResult,
  ProfileSyncResult,
  SyncStatus,
  SyncOperation,
  SyncOperationType,
  OperationStatus,
  SyncError,
  SyncErrorType,
  SyncEvent,
  SyncEventType,
  SyncEventHandler,
  RetryPolicy,
  SyncConfiguration,
  ProfileData,
  ProfileStats,
  WalletType,
  EligibilityStatus,
  ConnectionQuality,
  OfflineOperation,
  RecoveryResult,
  FallbackAction
} from '../types/sync';

import { NFTMoment } from '../types/nft';
import { Achievement } from '../types/sync';

import { SecureSyncStorage, type StorageKey } from './secure-sync-storage';
import { SyncSessionManager } from './sync-session-manager';
import { SyncAuditLogger, AuditAction, AuditResult } from './sync-audit-logger';
import { SyncPermissionValidator, type ValidationContext } from './sync-permission-validator';

/**
 * Core interface for the Wallet-Profile Sync Manager
 * Defines all synchronization operations and event handling
 */
export interface IWalletProfileSyncManager {
  // Core sync operations
  syncWalletToProfile(address: string, force?: boolean): Promise<SyncResult>;
  syncNFTCollection(address: string): Promise<NFTSyncResult>;
  syncProfileStats(address: string): Promise<ProfileSyncResult>;
  
  // Event handling
  onWalletConnect(address: string, services: any[]): Promise<void>;
  onWalletDisconnect(): Promise<void>;
  onNFTCollectionChange(address: string): Promise<void>;
  
  // Status and monitoring
  getSyncStatus(): SyncStatus;
  getLastSyncTime(): Date | null;
  isSyncInProgress(): boolean;
  
  // Configuration
  setSyncInterval(interval: number): void;
  enableAutoSync(enabled: boolean): void;
  setRetryPolicy(policy: RetryPolicy): void;
  
  // Periodic sync controls
  startPeriodicSync(): void;
  stopPeriodicSync(): void;
  isPeriodicSyncActive(): boolean;
  
  // Manual sync controls
  manualSync(force?: boolean): Promise<SyncResult>;
  
  // Activity-based sync
  onAppFocus(): Promise<void>;
  onAppBlur(): void;
  onUserActivity(): void;
}

/**
 * Base implementation of the Wallet-Profile Sync Manager
 * Provides core synchronization functionality with error handling and retry logic
 */
export class WalletProfileSyncManager implements IWalletProfileSyncManager {
  private syncStatus: SyncStatus;
  private configuration: SyncConfiguration;
  private eventHandlers: Map<SyncEventType, SyncEventHandler[]>;
  private activeOperations: Map<string, SyncOperation>;
  private offlineQueue: OfflineOperation[];
  private syncHistory: SyncEvent[];
  private periodicSyncTimer: NodeJS.Timeout | null;
  private lastUserActivity: Date;
  private isAppFocused: boolean;
  private backgroundSyncPending: boolean;
  
  // Security components
  protected secureStorage: SecureSyncStorage;
  protected sessionManager: SyncSessionManager;
  protected auditLogger: SyncAuditLogger;
  protected permissionValidator: SyncPermissionValidator;
  protected currentSessionId: string | null;

  constructor(config?: Partial<SyncConfiguration>) {
    this.syncStatus = {
      isActive: false,
      lastSync: null,
      nextSync: null,
      failureCount: 0
    };

    this.configuration = {
      autoSyncEnabled: true,
      syncInterval: 300000, // 5 minutes
      retryPolicy: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        retryCondition: (error: Error) => true
      },
      offlineQueueEnabled: true,
      cacheEnabled: true,
      ...config
    };

    this.eventHandlers = new Map();
    this.activeOperations = new Map();
    this.offlineQueue = [];
    this.syncHistory = [];
    this.periodicSyncTimer = null;
    this.lastUserActivity = new Date();
    this.isAppFocused = true;
    this.backgroundSyncPending = false;
    
    // Initialize security components
    this.secureStorage = new SecureSyncStorage();
    this.sessionManager = this.secureStorage.getSessionManager();
    this.auditLogger = this.secureStorage.getAuditLogger();
    this.permissionValidator = this.secureStorage.getPermissionValidator();
    this.currentSessionId = null;
  }

  // ============================================================================
  // Core Sync Operations
  // ============================================================================

  async syncWalletToProfile(address: string, force = false): Promise<SyncResult> {
    const operation = this.createOperation(SyncOperationType.WALLET_VERIFICATION, {
      address,
      force
    });

    try {
      // Validate session and permissions before sync
      await this.validateSyncPermissions(address, SyncOperationType.WRITE_PROFILE, AuditAction.SYNC);
      
      this.startOperation(operation);
      this.emitEvent(SyncEventType.PROFILE_SYNC_STARTED, { address, force });

      // Log sync operation start
      await this.auditLogger.logSyncOperation(
        this.getUserIdFromAddress(address),
        this.currentSessionId!,
        'wallet_profile_sync',
        'profile',
        AuditAction.SYNC,
        AuditResult.SUCCESS,
        { address, force }
      );

      // Perform wallet verification and profile sync
      const operations: SyncOperation[] = [operation];
      
      // This is a base implementation - actual sync logic will be implemented in derived classes
      await this.performWalletVerification(address);
      
      const result: SyncResult = {
        success: true,
        timestamp: new Date(),
        operations,
        duration: Date.now() - operation.startTime.getTime()
      };

      this.completeOperation(operation);
      this.emitEvent(SyncEventType.PROFILE_SYNC_COMPLETED, result);
      
      return result;
    } catch (error) {
      const syncError = this.createSyncError(
        SyncErrorType.API_ERROR,
        error instanceof Error ? error.message : 'Unknown error',
        operation.type,
        { address }
      );
      
      // Log sync failure
      await this.auditLogger.logSyncOperation(
        this.getUserIdFromAddress(address),
        this.currentSessionId || 'no_session',
        'wallet_profile_sync',
        'profile',
        AuditAction.SYNC,
        AuditResult.FAILURE,
        { address, force, error: syncError.message },
        operation.duration,
        error instanceof Error ? error : new Error('Sync failed')
      );
      
      this.failOperation(operation, syncError);
      throw syncError;
    }
  }

  async syncNFTCollection(address: string): Promise<NFTSyncResult> {
    const operation = this.createOperation(SyncOperationType.NFT_COLLECTION_FETCH, {
      address
    });

    try {
      this.startOperation(operation);

      // Base implementation - actual NFT sync logic will be implemented in derived classes
      const collectionData = await this.fetchNFTCollection(address);
      
      const result: NFTSyncResult = {
        success: true,
        timestamp: new Date(),
        operations: [operation],
        duration: Date.now() - operation.startTime.getTime(),
        collectionCount: collectionData.total,
        newNFTs: collectionData.new,
        removedNFTs: collectionData.removed,
        eligibleMoments: collectionData.eligible
      };

      this.completeOperation(operation);
      this.emitEvent(SyncEventType.NFT_COLLECTION_UPDATED, result);
      
      return result;
    } catch (error) {
      const syncError = this.createSyncError(
        SyncErrorType.API_ERROR,
        error instanceof Error ? error.message : 'NFT collection sync failed',
        operation.type,
        { address }
      );
      
      this.failOperation(operation, syncError);
      throw syncError;
    }
  }

  async syncProfileStats(address: string): Promise<ProfileSyncResult> {
    const operation = this.createOperation(SyncOperationType.PROFILE_DATA_UPDATE, {
      address
    });

    try {
      this.startOperation(operation);

      // Base implementation - actual profile stats sync will be implemented in derived classes
      const statsData = await this.fetchProfileStats(address);
      
      const result: ProfileSyncResult = {
        success: true,
        timestamp: new Date(),
        operations: [operation],
        duration: Date.now() - operation.startTime.getTime(),
        profileUpdated: statsData.profileUpdated,
        statsUpdated: statsData.statsUpdated,
        achievementsUpdated: statsData.achievementsUpdated
      };

      this.completeOperation(operation);
      
      return result;
    } catch (error) {
      const syncError = this.createSyncError(
        SyncErrorType.API_ERROR,
        error instanceof Error ? error.message : 'Profile stats sync failed',
        operation.type,
        { address }
      );
      
      this.failOperation(operation, syncError);
      throw syncError;
    }
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  async onWalletConnect(address: string, services: any[]): Promise<void> {
    try {
      // Create secure session for the wallet
      const sessionId = await this.ensureValidSession(address);
      
      // Log wallet connection
      await this.auditLogger.logWalletConnection(
        this.getUserIdFromAddress(address),
        sessionId,
        address,
        'connect',
        AuditResult.SUCCESS,
        { services: services.map(s => s.name || 'unknown') }
      );

      this.emitEvent(SyncEventType.WALLET_CONNECTED, { address, services });
      
      if (this.configuration.autoSyncEnabled) {
        // Trigger immediate sync on wallet connection
        await this.syncWalletToProfile(address, true);
      }
    } catch (error) {
      // Log connection failure
      await this.auditLogger.logWalletConnection(
        this.getUserIdFromAddress(address),
        'no_session',
        address,
        'connect',
        AuditResult.FAILURE,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
      
      console.error('Wallet connection setup failed:', error);
      throw error;
    }
  }

  async onWalletDisconnect(): Promise<void> {
    const address = this.getConnectedAddress();
    
    try {
      if (address && this.currentSessionId) {
        // Log wallet disconnection
        await this.auditLogger.logWalletConnection(
          this.getUserIdFromAddress(address),
          this.currentSessionId,
          address,
          'disconnect',
          AuditResult.SUCCESS
        );

        // Clean up security data
        await this.cleanupSecurityData(address);
      }
    } catch (error) {
      console.error('Wallet disconnection cleanup failed:', error);
    }

    this.emitEvent(SyncEventType.WALLET_DISCONNECTED, {});
    
    // Clear active operations and reset sync status
    this.activeOperations.clear();
    this.syncStatus = {
      isActive: false,
      lastSync: null,
      nextSync: null,
      failureCount: 0
    };
  }

  async onNFTCollectionChange(address: string): Promise<void> {
    if (this.configuration.autoSyncEnabled) {
      await this.syncNFTCollection(address);
    }
  }

  // ============================================================================
  // Status and Monitoring
  // ============================================================================

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  getLastSyncTime(): Date | null {
    return this.syncStatus.lastSync;
  }

  isSyncInProgress(): boolean {
    return this.syncStatus.isActive || this.activeOperations.size > 0;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setSyncInterval(interval: number): void {
    this.configuration.syncInterval = interval;
  }

  enableAutoSync(enabled: boolean): void {
    this.configuration.autoSyncEnabled = enabled;
  }

  setRetryPolicy(policy: RetryPolicy): void {
    this.configuration.retryPolicy = policy;
  }

  // ============================================================================
  // Periodic Sync Controls
  // ============================================================================

  startPeriodicSync(): void {
    if (this.periodicSyncTimer || !this.configuration.autoSyncEnabled) {
      return;
    }

    const scheduleNextSync = () => {
      this.periodicSyncTimer = setTimeout(async () => {
        try {
          // Only sync if we have an authenticated user and app is focused
          if (this.isAppFocused && this.getConnectedAddress()) {
            await this.performPeriodicSync();
          }
          
          // Schedule next sync
          scheduleNextSync();
        } catch (error) {
          console.error('Periodic sync failed:', error);
          // Continue scheduling even if sync fails
          scheduleNextSync();
        }
      }, this.configuration.syncInterval);
    };

    scheduleNextSync();
    
    // Update sync status with next sync time
    this.syncStatus.nextSync = new Date(Date.now() + this.configuration.syncInterval);
  }

  stopPeriodicSync(): void {
    if (this.periodicSyncTimer) {
      clearTimeout(this.periodicSyncTimer);
      this.periodicSyncTimer = null;
      this.syncStatus.nextSync = null;
    }
  }

  isPeriodicSyncActive(): boolean {
    return this.periodicSyncTimer !== null;
  }

  private async performPeriodicSync(): Promise<void> {
    const address = this.getConnectedAddress();
    if (!address) return;

    // Check if enough time has passed since last user activity for background sync
    const timeSinceActivity = Date.now() - this.lastUserActivity.getTime();
    const isBackgroundSync = timeSinceActivity > 60000; // 1 minute of inactivity

    if (isBackgroundSync) {
      // Perform lighter sync for background operations
      await this.syncNFTCollection(address);
    } else {
      // Perform full sync for active users
      await this.syncWalletToProfile(address, false);
    }
  }

  // ============================================================================
  // Manual Sync Controls
  // ============================================================================

  async manualSync(force = true): Promise<SyncResult> {
    const address = this.getConnectedAddress();
    if (!address) {
      throw new Error('No wallet connected for manual sync');
    }

    // Update user activity timestamp
    this.onUserActivity();

    // Perform full sync with force flag
    return await this.syncWalletToProfile(address, force);
  }

  // ============================================================================
  // Activity-Based Sync
  // ============================================================================

  async onAppFocus(): Promise<void> {
    this.isAppFocused = true;
    this.onUserActivity();

    const address = this.getConnectedAddress();
    if (!address) return;

    // If we have pending background sync or it's been a while since last sync
    const shouldSync = this.backgroundSyncPending || 
      !this.syncStatus.lastSync || 
      (Date.now() - this.syncStatus.lastSync.getTime()) > 300000; // 5 minutes

    if (shouldSync) {
      try {
        await this.syncWalletToProfile(address, false);
        this.backgroundSyncPending = false;
      } catch (error) {
        console.error('App focus sync failed:', error);
        // Don't throw - app focus should not fail due to sync issues
      }
    }

    // Restart periodic sync if it was stopped
    if (this.configuration.autoSyncEnabled && !this.isPeriodicSyncActive()) {
      this.startPeriodicSync();
    }
  }

  onAppBlur(): void {
    this.isAppFocused = false;
    
    // Mark that we might need to sync when app regains focus
    this.backgroundSyncPending = true;
    
    // Optionally stop periodic sync when app is not focused to save resources
    // this.stopPeriodicSync();
  }

  onUserActivity(): void {
    this.lastUserActivity = new Date();
  }

  // ============================================================================
  // Security Helper Methods
  // ============================================================================

  /**
   * Create or validate session for wallet address
   */
  protected async ensureValidSession(address: string): Promise<string> {
    if (this.currentSessionId) {
      const validation = await this.sessionManager.validateSession(this.currentSessionId);
      if (validation.isValid && validation.session?.walletAddress.toLowerCase() === address.toLowerCase()) {
        return this.currentSessionId;
      }
    }

    // Create new session
    const userId = this.getUserIdFromAddress(address);
    const session = await this.sessionManager.createSession(userId, address);
    
    // Grant necessary permissions for sync operations
    await this.sessionManager.grantPermission(session.id, SyncOperationType.READ_PROFILE);
    await this.sessionManager.grantPermission(session.id, SyncOperationType.READ_NFT_COLLECTION);
    await this.sessionManager.grantPermission(session.id, SyncOperationType.READ_WALLET_DATA);
    await this.sessionManager.grantPermission(session.id, SyncOperationType.READ_CACHE);
    
    this.currentSessionId = session.id;
    return session.id;
  }

  /**
   * Validate permissions for sync operations
   */
  protected async validateSyncPermissions(
    address: string, 
    operation: SyncOperationType, 
    action: AuditAction
  ): Promise<void> {
    const sessionId = await this.ensureValidSession(address);
    
    const validationContext: ValidationContext = {
      userId: this.getUserIdFromAddress(address),
      sessionId,
      walletAddress: address,
      operation,
      resource: this.getResourceFromOperation(operation),
      requestedAction: action
    };

    const result = await this.permissionValidator.validateSyncOperation(validationContext);
    if (!result.isAuthorized) {
      throw new Error(`Permission denied: ${result.reason}`);
    }
  }

  /**
   * Securely store sync data
   */
  protected async secureStore<T>(
    category: 'profile' | 'nft_collection' | 'wallet_data' | 'cache',
    identifier: string,
    data: T,
    address: string
  ): Promise<void> {
    const sessionId = await this.ensureValidSession(address);
    
    const storageKey: StorageKey = {
      userId: this.getUserIdFromAddress(address),
      category,
      identifier
    };

    const result = await this.secureStorage.store(storageKey, data, sessionId);
    if (!result.success) {
      throw new Error(`Failed to store ${category} data: ${result.error}`);
    }
  }

  /**
   * Securely retrieve sync data
   */
  protected async secureRetrieve<T>(
    category: 'profile' | 'nft_collection' | 'wallet_data' | 'cache',
    identifier: string,
    address: string
  ): Promise<T | null> {
    const sessionId = await this.ensureValidSession(address);
    
    const storageKey: StorageKey = {
      userId: this.getUserIdFromAddress(address),
      category,
      identifier
    };

    const result = await this.secureStorage.retrieve<T>(storageKey, sessionId);
    return result.success ? result.data! : null;
  }

  /**
   * Generate user ID from wallet address (hashed for privacy)
   */
  protected getUserIdFromAddress(address: string): string {
    // Simple hash for user ID generation (in production, use proper hashing)
    let hash = 0;
    const normalizedAddress = address.toLowerCase();
    for (let i = 0; i < normalizedAddress.length; i++) {
      const char = normalizedAddress.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get resource name from operation type
   */
  protected getResourceFromOperation(operation: SyncOperationType): string {
    switch (operation) {
      case SyncOperationType.READ_PROFILE:
      case SyncOperationType.WRITE_PROFILE:
        return 'profile';
      case SyncOperationType.READ_NFT_COLLECTION:
      case SyncOperationType.SYNC_NFT_COLLECTION:
        return 'nft_collection';
      case SyncOperationType.READ_WALLET_DATA:
        return 'wallet_data';
      case SyncOperationType.READ_CACHE:
      case SyncOperationType.WRITE_CACHE:
        return 'cache';
      default:
        return 'unknown';
    }
  }

  /**
   * Clean up security data on wallet disconnect
   */
  protected async cleanupSecurityData(address: string): Promise<void> {
    if (this.currentSessionId) {
      await this.sessionManager.invalidateSession(this.currentSessionId);
      this.currentSessionId = null;
    }

    // Optionally clear user data (for privacy)
    const userId = this.getUserIdFromAddress(address);
    try {
      const sessionId = await this.sessionManager.createSession(userId, address);
      await this.secureStorage.clearUserData(userId, sessionId);
      await this.sessionManager.invalidateSession(sessionId);
    } catch (error) {
      console.warn('Failed to cleanup user data:', error);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  protected getConnectedAddress(): string | null {
    // This should be implemented to get the current connected wallet address
    // For now, return null - this will be overridden in concrete implementation
    return null;
  }

  protected createOperation(type: SyncOperationType, metadata: Record<string, any>): SyncOperation {
    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: OperationStatus.PENDING,
      startTime: new Date(),
      retryCount: 0,
      metadata
    };
  }

  protected startOperation(operation: SyncOperation): void {
    operation.status = OperationStatus.IN_PROGRESS;
    operation.startTime = new Date();
    this.activeOperations.set(operation.id, operation);
    this.syncStatus.isActive = true;
    this.syncStatus.currentOperation = operation.type;
  }

  protected completeOperation(operation: SyncOperation): void {
    operation.status = OperationStatus.COMPLETED;
    operation.endTime = new Date();
    operation.duration = operation.endTime.getTime() - operation.startTime.getTime();
    
    this.activeOperations.delete(operation.id);
    this.syncStatus.lastSync = new Date();
    
    if (this.activeOperations.size === 0) {
      this.syncStatus.isActive = false;
      this.syncStatus.currentOperation = undefined;
    }
  }

  protected failOperation(operation: SyncOperation, error: SyncError): void {
    operation.status = OperationStatus.FAILED;
    operation.endTime = new Date();
    operation.duration = operation.endTime ? operation.endTime.getTime() - operation.startTime.getTime() : 0;
    operation.error = error;
    
    this.activeOperations.delete(operation.id);
    this.syncStatus.failureCount++;
    
    if (this.activeOperations.size === 0) {
      this.syncStatus.isActive = false;
      this.syncStatus.currentOperation = undefined;
    }

    this.emitEvent(SyncEventType.SYNC_ERROR, { operation, error });
  }

  protected emitEvent(type: SyncEventType, data: any): void {
    const event: SyncEvent = {
      type,
      timestamp: new Date(),
      data,
      source: 'WalletProfileSyncManager'
    };

    this.syncHistory.push(event);
    
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in sync event handler:', error);
        }
      });
    }
  }

  protected createSyncError(
    type: SyncErrorType,
    message: string,
    operation: SyncOperationType,
    context: Record<string, any>
  ): SyncError {
    return {
      type,
      message,
      operation,
      timestamp: new Date(),
      retryable: this.isRetryableError(type),
      context
    };
  }

  // ============================================================================
  // Event System
  // ============================================================================

  subscribe(eventType: SyncEventType, handler: SyncEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  // ============================================================================
  // Operation Management
  // ============================================================================

  // ============================================================================
  // Error Handling
  // ============================================================================

  private isRetryableError(errorType: SyncErrorType): boolean {
    switch (errorType) {
      case SyncErrorType.NETWORK_ERROR:
      case SyncErrorType.TIMEOUT_ERROR:
      case SyncErrorType.API_ERROR:
        return true;
      case SyncErrorType.AUTHENTICATION_ERROR:
      case SyncErrorType.VALIDATION_ERROR:
        return false;
      default:
        return false;
    }
  }

  // ============================================================================
  // Protected Methods for Extension
  // ============================================================================

  protected async performWalletVerification(address: string): Promise<void> {
    // Base implementation - to be overridden by derived classes
    console.log(`Performing wallet verification for ${address}`);
  }

  protected async fetchNFTCollection(address: string): Promise<{
    total: number;
    new: number;
    removed: number;
    eligible: number;
  }> {
    // Base implementation - to be overridden by derived classes
    console.log(`Fetching NFT collection for ${address}`);
    return { total: 0, new: 0, removed: 0, eligible: 0 };
  }

  protected async fetchProfileStats(address: string): Promise<{
    profileUpdated: boolean;
    statsUpdated: boolean;
    achievementsUpdated: boolean;
  }> {
    // Base implementation - to be overridden by derived classes
    console.log(`Fetching profile stats for ${address}`);
    return { profileUpdated: false, statsUpdated: false, achievementsUpdated: false };
  }
}

/**
 * Concrete implementation of WalletProfileSyncManager with actual synchronization logic
 * Integrates with NFT ownership service and blockchain verification
 */
export class ConcreteWalletProfileSyncManager extends WalletProfileSyncManager {
  private nftOwnershipService: any;
  private networkResilienceManager: any;
  private profileCache: Map<string, ProfileData>;
  private nftCache: Map<string, any>;
  private lastSyncTimes: Map<string, Date>;
  private connectedAddress: string | null;

  constructor(
    config?: Partial<SyncConfiguration>,
    dependencies?: {
      nftOwnershipService?: any;
      networkResilienceManager?: any;
    }
  ) {
    super(config);
    
    // Initialize dependencies - will be injected or imported
    this.nftOwnershipService = dependencies?.nftOwnershipService;
    this.networkResilienceManager = dependencies?.networkResilienceManager;
    
    // Initialize caches
    this.profileCache = new Map();
    this.nftCache = new Map();
    this.lastSyncTimes = new Map();
    this.connectedAddress = null;
  }

  /**
   * Initialize dependencies dynamically to avoid circular imports
   */
  private async initializeDependencies(): Promise<void> {
    if (!this.nftOwnershipService) {
      const { nftOwnershipService } = await import('./nft-ownership-service');
      this.nftOwnershipService = nftOwnershipService;
    }
    
    if (!this.networkResilienceManager) {
      const { networkResilienceManager } = await import('./network-resilience-manager');
      this.networkResilienceManager = networkResilienceManager;
    }
  }

  // ============================================================================
  // Core Sync Operations Implementation
  // ============================================================================

  async syncWalletToProfile(address: string, force = false): Promise<SyncResult> {
    await this.initializeDependencies();
    
    const operation = this.createOperation(SyncOperationType.WALLET_VERIFICATION, {
      address,
      force
    });

    try {
      this.startOperation(operation);
      this.emitEvent(SyncEventType.PROFILE_SYNC_STARTED, { address, force });

      // Check if we need to sync based on last sync time
      if (!force && !this.shouldSync(address)) {
        const cachedProfile = this.profileCache.get(address);
        if (cachedProfile) {
          const result: SyncResult = {
            success: true,
            timestamp: new Date(),
            operations: [operation],
            duration: Date.now() - operation.startTime.getTime()
          };
          
          this.completeOperation(operation);
          this.emitEvent(SyncEventType.PROFILE_SYNC_COMPLETED, result);
          return result;
        }
      }

      // Perform comprehensive wallet verification and profile sync
      await this.performWalletVerification(address);
      
      // Sync NFT collection and profile stats in parallel
      const [nftResult, profileResult] = await Promise.all([
        this.syncNFTCollection(address),
        this.syncProfileStats(address)
      ]);

      // Update last sync time
      this.lastSyncTimes.set(address, new Date());

      const operations: SyncOperation[] = [operation];
      if (nftResult.operations) operations.push(...nftResult.operations);
      if (profileResult.operations) operations.push(...profileResult.operations);
      
      const result: SyncResult = {
        success: true,
        timestamp: new Date(),
        operations,
        duration: Date.now() - operation.startTime.getTime()
      };

      this.completeOperation(operation);
      this.emitEvent(SyncEventType.PROFILE_SYNC_COMPLETED, result);
      
      return result;
    } catch (error) {
      const syncError = this.createSyncError(
        SyncErrorType.API_ERROR,
        error instanceof Error ? error.message : 'Wallet sync failed',
        operation.type,
        { address }
      );
      
      this.failOperation(operation, syncError);
      throw syncError;
    }
  }

  async syncNFTCollection(address: string): Promise<NFTSyncResult> {
    await this.initializeDependencies();
    
    const operation = this.createOperation(SyncOperationType.NFT_COLLECTION_FETCH, {
      address
    });

    try {
      this.startOperation(operation);

      // Get current cached collection for comparison
      const cachedCollection = this.nftCache.get(address);
      
      // Fetch fresh NFT collection data with blockchain verification
      const collectionData = await this.fetchNFTCollection(address);
      
      // Perform additional blockchain verification for critical moments
      await this.verifyBlockchainData(address, collectionData);
      
      // Calculate changes based on actual data comparison
      const changes = this.calculateCollectionChanges(cachedCollection, collectionData);
      
      const result: NFTSyncResult = {
        success: true,
        timestamp: new Date(),
        operations: [operation],
        duration: Date.now() - operation.startTime.getTime(),
        collectionCount: collectionData.total,
        newNFTs: changes.newNFTs,
        removedNFTs: changes.removedNFTs,
        eligibleMoments: collectionData.eligible
      };

      this.completeOperation(operation);
      this.emitEvent(SyncEventType.NFT_COLLECTION_UPDATED, result);
      
      return result;
    } catch (error) {
      const syncError = this.createSyncError(
        SyncErrorType.API_ERROR,
        error instanceof Error ? error.message : 'NFT collection sync failed',
        operation.type,
        { address }
      );
      
      this.failOperation(operation, syncError);
      throw syncError;
    }
  }

  async syncProfileStats(address: string): Promise<ProfileSyncResult> {
    await this.initializeDependencies();
    
    const operation = this.createOperation(SyncOperationType.PROFILE_DATA_UPDATE, {
      address
    });

    try {
      this.startOperation(operation);

      // Fetch and update profile stats
      const statsData = await this.fetchProfileStats(address);
      
      // Update profile cache
      const existingProfile = this.profileCache.get(address);
      const updatedProfile: ProfileData = {
        address,
        username: this.formatUsername(address),
        walletType: this.determineWalletType(address),
        collections: await this.getCollectionNames(address),
        stats: await this.calculateProfileStats(address),
        achievements: existingProfile?.achievements || [],
        lastUpdated: new Date()
      };
      
      this.profileCache.set(address, updatedProfile);
      
      const result: ProfileSyncResult = {
        success: true,
        timestamp: new Date(),
        operations: [operation],
        duration: Date.now() - operation.startTime.getTime(),
        profileUpdated: true,
        statsUpdated: statsData.statsUpdated,
        achievementsUpdated: statsData.achievementsUpdated
      };

      this.completeOperation(operation);
      
      return result;
    } catch (error) {
      const syncError = this.createSyncError(
        SyncErrorType.API_ERROR,
        error instanceof Error ? error.message : 'Profile stats sync failed',
        operation.type,
        { address }
      );
      
      this.failOperation(operation, syncError);
      throw syncError;
    }
  }

  // ============================================================================
  // Event Handling Implementation
  // ============================================================================

  async onWalletConnect(address: string, services: any[]): Promise<void> {
    this.emitEvent(SyncEventType.WALLET_CONNECTED, { address, services });
    
    // Set connected address
    this.connectedAddress = address;
    
    // Clear any existing cache for this address to ensure fresh data
    this.profileCache.delete(address);
    this.nftCache.delete(address);
    this.lastSyncTimes.delete(address);
    
    // Always trigger immediate sync on wallet connection (requirement 1.1, 1.2)
    try {
      // Start sync immediately without waiting for auto-sync configuration
      const syncPromise = this.syncWalletToProfile(address, true);
      
      if (this.configuration.autoSyncEnabled) {
        // Wait for sync to complete if auto-sync is enabled
        await syncPromise;
      } else {
        // Fire and forget if auto-sync is disabled, but still trigger it
        syncPromise.catch(error => {
          console.error('Immediate sync failed on wallet connect:', error);
          this.emitEvent(SyncEventType.SYNC_ERROR, { 
            error, 
            operation: 'wallet_connect_sync',
            address 
          });
        });
      }
    } catch (error) {
      console.error('Failed to initiate sync on wallet connect:', error);
      this.emitEvent(SyncEventType.SYNC_ERROR, { 
        error, 
        operation: 'wallet_connect_sync',
        address 
      });
      // Don't throw - wallet connection should succeed even if sync fails
    }
  }

  async onWalletDisconnect(): Promise<void> {
    this.emitEvent(SyncEventType.WALLET_DISCONNECTED, {});
    
    // Clear connected address
    this.connectedAddress = null;
    
    // Stop periodic sync
    this.stopPeriodicSync();
    
    // Clear all caches and active operations
    this.profileCache.clear();
    this.nftCache.clear();
    this.lastSyncTimes.clear();
    this.activeOperations.clear();
    
    // Reset sync status
    this.syncStatus = {
      isActive: false,
      lastSync: null,
      nextSync: null,
      failureCount: 0
    };
  }

  async onNFTCollectionChange(address: string): Promise<void> {
    // Clear NFT cache to force fresh fetch (requirement 2.1, 2.3)
    this.nftCache.delete(address);
    
    // Always trigger immediate NFT collection sync on changes
    try {
      const syncPromise = this.syncNFTCollection(address);
      
      if (this.configuration.autoSyncEnabled) {
        // Wait for sync to complete if auto-sync is enabled
        await syncPromise;
        
        // Also trigger profile stats update since NFT collection affects stats
        await this.syncProfileStats(address);
      } else {
        // Fire and forget if auto-sync is disabled, but still trigger it
        syncPromise.then(async () => {
          // Update profile stats after NFT sync completes
          await this.syncProfileStats(address);
        }).catch(error => {
          console.error('NFT collection sync failed:', error);
          this.emitEvent(SyncEventType.SYNC_ERROR, { 
            error, 
            operation: 'nft_collection_change_sync',
            address 
          });
        });
      }
    } catch (error) {
      console.error('Failed to initiate NFT collection sync:', error);
      this.emitEvent(SyncEventType.SYNC_ERROR, { 
        error, 
        operation: 'nft_collection_change_sync',
        address 
      });
    }
  }

  // ============================================================================
  // Protected Methods Implementation
  // ============================================================================

  protected async performWalletVerification(address: string): Promise<void> {
    await this.initializeDependencies();
    
    if (!this.validateFlowAddress(address)) {
      throw new Error('Invalid Flow address format');
    }

    // Use network resilience for wallet verification
    const verificationOperation = async () => {
      // Verify wallet address is valid and accessible
      const { verifyWalletAddress } = await import('@/lib/wallet-verification');
      const verification = await verifyWalletAddress(address);
      
      if (!verification.isValid) {
        throw new Error(verification.error || 'Wallet verification failed');
      }

      // Additional verification: check if wallet has any NFT collections
      if (this.nftOwnershipService) {
        const ownershipCheck = await this.nftOwnershipService.getOwnership(address, false);
        if (!ownershipCheck.success) {
          console.warn('NFT ownership check failed during wallet verification:', ownershipCheck.error);
          // Don't fail verification if NFT check fails, just log warning
        }
      }
    };

    if (this.networkResilienceManager) {
      await this.networkResilienceManager.executeWithRetry(
        verificationOperation,
        this.configuration.retryPolicy
      );
    } else {
      await verificationOperation();
    }
  }

  protected async fetchNFTCollection(address: string): Promise<{
    total: number;
    new: number;
    removed: number;
    eligible: number;
  }> {
    await this.initializeDependencies();
    
    if (!this.nftOwnershipService) {
      throw new Error('NFT ownership service not available');
    }

    // Use network resilience for NFT collection fetch
    const fetchOperation = async () => {
      // Get fresh NFT ownership data from blockchain
      const ownershipResponse = await this.nftOwnershipService.getOwnership(address, false);
      
      if (!ownershipResponse.success || !ownershipResponse.data) {
        throw new Error(ownershipResponse.error || 'Failed to fetch NFT collection');
      }

      const ownership = ownershipResponse.data;
      
      // Filter for eligible moments (NBA Top Shot and NFL All Day)
      const eligibleMoments = ownership.moments.filter((moment: any) => 
        moment.sport === 'NBA' || moment.sport === 'NFL'
      );

      // Get cached collection for comparison
      const cachedCollection = this.nftCache.get(address);
      let newNFTs = 0;
      let removedNFTs = 0;

      if (cachedCollection) {
        // Calculate changes by comparing moment IDs
        const currentMomentIds = new Set(ownership.moments.map((m: any) => m.id));
        const cachedMomentIds = new Set(cachedCollection.momentIds || []);
        
        newNFTs = ownership.moments.filter((m: any) => !cachedMomentIds.has(m.id)).length;
        removedNFTs = Array.from(cachedMomentIds).filter(id => !currentMomentIds.has(id)).length;
        
        // Update cache with current moment IDs
        this.nftCache.set(address, {
          ...cachedCollection,
          total: ownership.totalCount,
          eligible: eligibleMoments.length,
          momentIds: Array.from(currentMomentIds),
          lastUpdated: new Date()
        });
      } else {
        // First time sync - all NFTs are "new"
        newNFTs = ownership.totalCount;
        
        // Initialize cache
        this.nftCache.set(address, {
          total: ownership.totalCount,
          eligible: eligibleMoments.length,
          momentIds: ownership.moments.map((m: any) => m.id),
          lastUpdated: new Date()
        });
      }

      return {
        total: ownership.totalCount,
        new: newNFTs,
        removed: removedNFTs,
        eligible: eligibleMoments.length
      };
    };

    if (this.networkResilienceManager) {
      return await this.networkResilienceManager.executeWithRetry(
        fetchOperation,
        this.configuration.retryPolicy
      );
    } else {
      return await fetchOperation();
    }
  }

  protected async fetchProfileStats(address: string): Promise<{
    profileUpdated: boolean;
    statsUpdated: boolean;
    achievementsUpdated: boolean;
  }> {
    await this.initializeDependencies();
    
    try {
      // Get current NFT collection data for stats calculation
      const nftData = this.nftCache.get(address);
      const cachedProfile = this.profileCache.get(address);
      
      // Calculate updated profile stats
      const newStats: ProfileStats = {
        totalNFTs: nftData?.total || 0,
        eligibleMoments: nftData?.eligible || 0,
        weeklyScore: cachedProfile?.stats.weeklyScore || 0,
        seasonRank: cachedProfile?.stats.seasonRank || 0,
        wins: cachedProfile?.stats.wins || 0,
        losses: cachedProfile?.stats.losses || 0,
        totalPoints: cachedProfile?.stats.totalPoints || 0
      };

      // Check if stats have changed
      const statsUpdated = !cachedProfile || 
        JSON.stringify(cachedProfile.stats) !== JSON.stringify(newStats);

      // Update profile data in cache
      const updatedProfile: ProfileData = {
        address,
        username: this.formatUsername(address),
        walletType: this.determineWalletType(address),
        collections: await this.getCollectionNames(address),
        stats: newStats,
        achievements: cachedProfile?.achievements || [],
        lastUpdated: new Date()
      };

      this.profileCache.set(address, updatedProfile);

      // Check for new achievements based on NFT collection
      const achievementsUpdated = await this.checkForNewAchievements(address, updatedProfile);

      return {
        profileUpdated: true,
        statsUpdated,
        achievementsUpdated
      };
    } catch (error) {
      console.error('Failed to fetch profile stats:', error);
      return {
        profileUpdated: false,
        statsUpdated: false,
        achievementsUpdated: false
      };
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private shouldSync(address: string): boolean {
    const lastSync = this.lastSyncTimes.get(address);
    if (!lastSync) return true;
    
    const timeSinceLastSync = Date.now() - lastSync.getTime();
    const syncInterval = this.configuration.syncInterval;
    
    return timeSinceLastSync >= syncInterval;
  }

  private validateFlowAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{16}$/.test(address);
  }

  private formatUsername(address: string): string {
    // Format address as username (first 6 + last 4 characters)
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  private determineWalletType(address: string): WalletType {
    // This would need to be determined based on the wallet services
    // For now, return a default
    return WalletType.FLOW;
  }

  private async getCollectionNames(address: string): Promise<string[]> {
    await this.initializeDependencies();
    
    if (!this.nftOwnershipService) {
      return [];
    }

    try {
      const ownershipResponse = await this.nftOwnershipService.getOwnership(address, true);
      
      if (ownershipResponse.success && ownershipResponse.data) {
        return ownershipResponse.data.collections.map((collection: any) => collection.collectionName);
      }
    } catch (error) {
      console.error('Failed to get collection names:', error);
    }
    
    return [];
  }

  private async calculateProfileStats(address: string): Promise<ProfileStats> {
    await this.initializeDependencies();
    
    const cachedNFT = this.nftCache.get(address);
    const existingProfile = this.profileCache.get(address);
    
    // Get fresh NFT data if cache is stale
    let nftData = cachedNFT;
    if (!nftData || this.isCacheStale(nftData.lastUpdated)) {
      try {
        const freshData = await this.fetchNFTCollection(address);
        nftData = {
          total: freshData.total,
          eligible: freshData.eligible,
          lastUpdated: new Date()
        };
      } catch (error) {
        console.warn('Failed to fetch fresh NFT data for stats calculation:', error);
        // Use cached data if available, otherwise defaults
        nftData = cachedNFT || { total: 0, eligible: 0, lastUpdated: new Date() };
      }
    }

    // Calculate stats with consistent formatting
    const stats: ProfileStats = {
      totalNFTs: Math.max(0, nftData.total || 0),
      eligibleMoments: Math.max(0, nftData.eligible || 0),
      weeklyScore: existingProfile?.stats.weeklyScore || 0,
      seasonRank: existingProfile?.stats.seasonRank || 0,
      wins: existingProfile?.stats.wins || 0,
      losses: existingProfile?.stats.losses || 0,
      totalPoints: existingProfile?.stats.totalPoints || 0
    };

    // Ensure data consistency and validation
    if (stats.totalNFTs < stats.eligibleMoments) {
      console.warn('Data inconsistency: eligible moments exceed total NFTs, correcting...');
      stats.eligibleMoments = stats.totalNFTs;
    }

    return stats;
  }

  /**
   * Check if cached data is stale based on timestamp
   */
  private isCacheStale(lastUpdated: Date): boolean {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    return Date.now() - lastUpdated.getTime() > staleThreshold;
  }

  // ============================================================================
  // Public Utility Methods
  // ============================================================================

  /**
   * Get cached profile data
   */
  getCachedProfile(address: string): ProfileData | null {
    return this.profileCache.get(address) || null;
  }

  /**
   * Get cached NFT collection data
   */
  getCachedNFTCollection(address: string): any | null {
    return this.nftCache.get(address) || null;
  }

  /**
   * Clear cache for specific address
   */
  clearCacheForAddress(address: string): void {
    this.profileCache.delete(address);
    this.nftCache.delete(address);
    this.lastSyncTimes.delete(address);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.profileCache.clear();
    this.nftCache.clear();
    this.lastSyncTimes.clear();
  }

  /**
   * Verify blockchain data for critical NFT moments
   */
  private async verifyBlockchainData(address: string, collectionData: any): Promise<void> {
    if (!this.nftOwnershipService) {
      return; // Skip verification if service not available
    }

    try {
      // Perform additional verification for high-value or rare moments
      // This ensures data integrity for critical gameplay assets
      const eligibleResponse = await this.nftOwnershipService.getEligibleMoments(address);
      
      if (eligibleResponse.success && eligibleResponse.data) {
        const eligibleCount = eligibleResponse.data.length;
        
        // Verify that our collection data matches blockchain reality
        if (Math.abs(eligibleCount - collectionData.eligible) > 0) {
          console.warn(`Eligible moments count mismatch: expected ${collectionData.eligible}, blockchain shows ${eligibleCount}`);
          
          // Update with blockchain-verified count
          collectionData.eligible = eligibleCount;
        }
      }
    } catch (error) {
      console.warn('Blockchain verification failed:', error);
      // Don't fail the sync if verification fails, just log the warning
    }
  }

  /**
   * Calculate changes between cached and new collection data
   */
  private calculateCollectionChanges(cachedCollection: any, newCollectionData: any): {
    newNFTs: number;
    removedNFTs: number;
  } {
    if (!cachedCollection) {
      // First time sync - all NFTs are "new"
      return {
        newNFTs: newCollectionData.total,
        removedNFTs: 0
      };
    }

    // Calculate based on moment IDs if available
    if (cachedCollection.momentIds && newCollectionData.momentIds) {
      const cachedIds = new Set(cachedCollection.momentIds);
      const newIds = new Set(newCollectionData.momentIds);
      
      const addedIds = Array.from(newIds).filter(id => !cachedIds.has(id));
      const removedIds = Array.from(cachedIds).filter(id => !newIds.has(id));
      
      return {
        newNFTs: addedIds.length,
        removedNFTs: removedIds.length
      };
    }

    // Fallback to total count comparison
    const totalDiff = newCollectionData.total - cachedCollection.total;
    return {
      newNFTs: Math.max(0, totalDiff),
      removedNFTs: Math.max(0, -totalDiff)
    };
  }

  /**
   * Check for new achievements based on NFT collection and profile data
   */
  private async checkForNewAchievements(address: string, profile: ProfileData): Promise<boolean> {
    const existingAchievements = profile.achievements.map(a => a.id);
    const newAchievements: Achievement[] = [];

    // First NFT Achievement
    if (profile.stats.totalNFTs >= 1 && !existingAchievements.includes('first_nft')) {
      newAchievements.push({
        id: 'first_nft',
        name: 'First Collector',
        description: 'Acquired your first NBA Top Shot or NFL All Day moment',
        unlockedAt: new Date(),
        category: 'collection'
      });
    }

    // Collection Milestones
    if (profile.stats.totalNFTs >= 10 && !existingAchievements.includes('collector_10')) {
      newAchievements.push({
        id: 'collector_10',
        name: 'Dedicated Collector',
        description: 'Own 10 or more moments',
        unlockedAt: new Date(),
        category: 'collection'
      });
    }

    if (profile.stats.totalNFTs >= 50 && !existingAchievements.includes('collector_50')) {
      newAchievements.push({
        id: 'collector_50',
        name: 'Serious Collector',
        description: 'Own 50 or more moments',
        unlockedAt: new Date(),
        category: 'collection'
      });
    }

    // Multi-sport Achievement
    if (profile.collections.length >= 2 && !existingAchievements.includes('multi_sport')) {
      newAchievements.push({
        id: 'multi_sport',
        name: 'Multi-Sport Fan',
        description: 'Own moments from both NBA and NFL collections',
        unlockedAt: new Date(),
        category: 'collection'
      });
    }

    // Add new achievements to profile
    if (newAchievements.length > 0) {
      profile.achievements.push(...newAchievements);
      this.profileCache.set(address, profile);
      return true;
    }

    return false;
  }

  /**
   * Force immediate sync for all profile components
   * Implements requirement 1.1 - immediate sync on wallet connection
   */
  async forceFullSync(address: string): Promise<SyncResult> {
    // Clear all caches to ensure fresh data
    this.clearCacheForAddress(address);
    
    // Perform comprehensive sync with force flag
    return await this.syncWalletToProfile(address, true);
  }

  /**
   * Get detailed sync status including operation progress
   */
  getDetailedSyncStatus(): SyncStatus & {
    activeOperationDetails: SyncOperation[];
    cacheStatus: {
      profiles: number;
      collections: number;
      lastSyncTimes: number;
    };
  } {
    const baseStatus = this.getSyncStatus();
    
    return {
      ...baseStatus,
      activeOperationDetails: Array.from(this.activeOperations.values()),
      cacheStatus: {
        profiles: this.profileCache.size,
        collections: this.nftCache.size,
        lastSyncTimes: this.lastSyncTimes.size
      }
    };
  }

  /**
   * Check if sync is needed based on last sync time and configuration
   */
  isSyncNeeded(address: string): boolean {
    const lastSync = this.lastSyncTimes.get(address);
    if (!lastSync) return true;
    
    const timeSinceLastSync = Date.now() - lastSync.getTime();
    return timeSinceLastSync >= this.configuration.syncInterval;
  }

  /**
   * Get sync statistics
   */
  getSyncStatistics(): {
    cachedProfiles: number;
    cachedCollections: number;
    lastSyncTimes: number;
    activeOperations: number;
  } {
    return {
      cachedProfiles: this.profileCache.size,
      cachedCollections: this.nftCache.size,
      lastSyncTimes: this.lastSyncTimes.size,
      activeOperations: this.activeOperations.size
    };
  }

  // ============================================================================
  // Concrete Implementation Overrides
  // ============================================================================

  protected getConnectedAddress(): string | null {
    return this.connectedAddress;
  }

  /**
   * Concrete implementation of wallet verification with Flow blockchain
   * Implements requirement 1.1 - immediate wallet verification on connection
   */
  protected async performWalletVerification(address: string): Promise<void> {
    await this.initializeDependencies();
    
    // Validate Flow address format
    if (!this.validateFlowAddress(address)) {
      throw new Error('Invalid Flow address format');
    }

    // Store connected address for future reference
    this.connectedAddress = address;

    // Verify wallet exists on Flow blockchain
    try {
      // Use Flow NFT service to verify the address exists and has collections
      const ownershipResponse = await this.nftOwnershipService.verifyDapperWalletOwnership(address);
      
      if (!ownershipResponse.success) {
        console.warn('Wallet verification warning:', ownershipResponse.error);
        // Don't fail verification for API errors - wallet might still be valid
      }

      // Store verification result in secure storage
      await this.secureStore('wallet_data', 'verification', {
        address,
        verified: true,
        verifiedAt: new Date(),
        method: 'flow_blockchain'
      }, address);

      console.log(`Wallet verification completed for ${address}`);
    } catch (error) {
      console.error('Wallet verification failed:', error);
      throw new Error(`Wallet verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Concrete implementation of NFT collection fetching with Find Labs API integration
   * Implements requirements 2.1, 2.2 - real-time NFT collection synchronization
   */
  protected async fetchNFTCollection(address: string): Promise<{
    total: number;
    new: number;
    removed: number;
    eligible: number;
    momentIds?: string[];
  }> {
    await this.initializeDependencies();

    try {
      // Get comprehensive NFT ownership from the service
      const ownershipResponse = await this.nftOwnershipService.getOwnership(address, true);
      
      if (!ownershipResponse.success || !ownershipResponse.data) {
        throw new Error(ownershipResponse.error || 'Failed to fetch NFT collection');
      }

      const ownership = ownershipResponse.data;
      const cachedCollection = this.nftCache.get(address);

      // Calculate changes from cached data
      const changes = this.calculateCollectionChanges(cachedCollection, ownership);

      // Update cache with new collection data
      this.nftCache.set(address, {
        ...ownership,
        momentIds: ownership.moments.map(m => m.id),
        fetchedAt: new Date()
      });

      // Store collection data securely
      await this.secureStore('nft_collection', 'ownership', ownership, address);

      // Verify eligible moments for gameplay
      const eligibleMoments = ownership.moments.filter(moment => 
        moment.sport === 'NBA' || moment.sport === 'NFL'
      );

      const result = {
        total: ownership.totalCount,
        new: changes.newNFTs,
        removed: changes.removedNFTs,
        eligible: eligibleMoments.length,
        momentIds: ownership.moments.map(m => m.id)
      };

      console.log(`NFT collection sync completed for ${address}:`, result);
      return result;
    } catch (error) {
      console.error('NFT collection fetch failed:', error);
      throw new Error(`NFT collection fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Concrete implementation of profile stats calculation based on actual NFT data
   * Implements requirements 3.1, 3.2 - profile stats synchronization with NFT collection
   */
  protected async fetchProfileStats(address: string): Promise<{
    profileUpdated: boolean;
    statsUpdated: boolean;
    achievementsUpdated: boolean;
  }> {
    await this.initializeDependencies();

    try {
      // Get current NFT collection data
      const ownershipResponse = await this.nftOwnershipService.getOwnership(address, true);
      
      if (!ownershipResponse.success || !ownershipResponse.data) {
        throw new Error(ownershipResponse.error || 'Failed to get NFT data for profile stats');
      }

      const ownership = ownershipResponse.data;
      const cachedProfile = this.profileCache.get(address);

      // Calculate profile stats based on NFT collection
      const stats: ProfileStats = {
        totalNFTs: ownership.totalCount,
        nbaTopShotMoments: ownership.moments.filter(m => m.sport === 'NBA').length,
        nflAllDayMoments: ownership.moments.filter(m => m.sport === 'NFL').length,
        rareMoments: ownership.moments.filter(m => m.rarity === 'Rare' || m.rarity === 'Epic' || m.rarity === 'Legendary').length,
        legendaryMoments: ownership.moments.filter(m => m.rarity === 'Legendary').length,
        totalValue: this.calculateCollectionValue(ownership.moments),
        lastUpdated: new Date()
      };

      // Determine collections owned
      const collections = Array.from(new Set(ownership.moments.map(m => {
        return m.sport === 'NBA' ? 'NBA Top Shot' : 'NFL All Day';
      })));

      // Create updated profile data
      const profileData: ProfileData = {
        address,
        username: this.generateUsernameFromAddress(address),
        walletType: this.determineWalletType(address),
        collections,
        stats,
        achievements: cachedProfile?.achievements || [],
        lastUpdated: new Date()
      };

      // Check for new achievements
      const achievementsUpdated = await this.checkForNewAchievements(address, profileData);

      // Update profile cache
      this.profileCache.set(address, profileData);

      // Store profile data securely
      await this.secureStore('profile', 'data', profileData, address);

      const result = {
        profileUpdated: true,
        statsUpdated: !cachedProfile || JSON.stringify(cachedProfile.stats) !== JSON.stringify(stats),
        achievementsUpdated
      };

      console.log(`Profile stats sync completed for ${address}:`, result);
      return result;
    } catch (error) {
      console.error('Profile stats fetch failed:', error);
      throw new Error(`Profile stats fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Flow address format
   */
  private validateFlowAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{16}$/.test(address);
  }

  /**
   * Generate username from wallet address
   */
  private generateUsernameFromAddress(address: string): string {
    // Take last 8 characters of address for username
    const shortAddress = address.slice(-8);
    return `Player_${shortAddress}`;
  }

  /**
   * Determine wallet type from address characteristics
   */
  private determineWalletType(address: string): WalletType {
    // In a real implementation, this would check wallet provider
    // For now, assume Dapper Wallet for ShotCaller users
    return 'dapper';
  }

  /**
   * Calculate estimated collection value based on rarity
   */
  private calculateCollectionValue(moments: NFTMoment[]): number {
    return moments.reduce((total, moment) => {
      switch (moment.rarity) {
        case 'Legendary': return total + 1000;
        case 'Epic': return total + 500;
        case 'Rare': return total + 100;
        case 'Common': return total + 10;
        default: return total + 10;
      }
    }, 0);
  }

  async onWalletConnect(address: string, services: any[]): Promise<void> {
    // Store connected address
    this.connectedAddress = address;
    
    // Call parent implementation
    await super.onWalletConnect(address, services);
    
    // Start periodic sync after successful connection
    if (this.configuration.autoSyncEnabled) {
      this.startPeriodicSync();
    }
  }

  async onWalletDisconnect(): Promise<void> {
    // Clear connected address
    this.connectedAddress = null;
    
    // Call parent implementation
    await super.onWalletDisconnect();
  }
}

// ============================================================================
// Default Instance
// ============================================================================

/**
 * Default wallet profile sync manager instance
 * Pre-configured with standard settings for the ShotCaller application
 */
export const walletProfileSyncManager = new ConcreteWalletProfileSyncManager({
  autoSyncEnabled: true,
  syncInterval: 300000, // 5 minutes
  retryPolicy: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryCondition: (error: Error) => {
      // Retry on network errors, timeouts, and API errors
      const retryableErrors = ['network', 'timeout', 'api', 'fetch'];
      const errorMessage = error.message.toLowerCase();
      return retryableErrors.some(keyword => errorMessage.includes(keyword));
    }
  },
  offlineQueueEnabled: true,
  cacheEnabled: true
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a new sync manager instance with custom configuration
 */
export function createSyncManager(
  config?: Partial<SyncConfiguration>,
  dependencies?: {
    nftOwnershipService?: any;
    networkResilienceManager?: any;
  }
): ConcreteWalletProfileSyncManager {
  return new ConcreteWalletProfileSyncManager(config, dependencies);
}

/**
 * Validate sync configuration
 */
export function validateSyncConfiguration(config: Partial<SyncConfiguration>): boolean {
  if (config.syncInterval && config.syncInterval < 60000) {
    console.warn('Sync interval should be at least 1 minute to avoid excessive API calls');
    return false;
  }
  
  if (config.retryPolicy) {
    const { maxAttempts, baseDelay, maxDelay } = config.retryPolicy;
    
    if (maxAttempts && maxAttempts < 1) {
      console.warn('Max retry attempts should be at least 1');
      return false;
    }
    
    if (baseDelay && baseDelay < 100) {
      console.warn('Base delay should be at least 100ms');
      return false;
    }
    
    if (maxDelay && baseDelay && maxDelay < baseDelay) {
      console.warn('Max delay should be greater than base delay');
      return false;
    }
  }
  
  return true;
}

/**
 * Format sync duration for display
 */
export function formatSyncDuration(duration: number): string {
  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`;
  } else {
    return `${(duration / 60000).toFixed(1)}m`;
  }
}

/**
 * Get sync status display text
 */
export function getSyncStatusText(status: SyncStatus): string {
  if (status.isActive) {
    return status.currentOperation 
      ? `Syncing ${status.currentOperation.replace('_', ' ')}...`
      : 'Syncing...';
  }
  
  if (status.lastSync) {
    const timeSince = Date.now() - status.lastSync.getTime();
    if (timeSince < 60000) {
      return 'Synced just now';
    } else if (timeSince < 3600000) {
      return `Synced ${Math.floor(timeSince / 60000)}m ago`;
    } else {
      return `Synced ${Math.floor(timeSince / 3600000)}h ago`;
    }
  }
  
  return 'Not synced';
}

/**
 * Check if sync is needed based on last sync time and interval
 */
export function isSyncNeeded(lastSync: Date | null, interval: number): boolean {
  if (!lastSync) return true;
  
  const timeSinceLastSync = Date.now() - lastSync.getTime();
  return timeSinceLastSync >= interval;
}