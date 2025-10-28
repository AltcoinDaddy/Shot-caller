// Core sync infrastructure types for wallet-profile synchronization

// ============================================================================
// Sync Operation Types
// ============================================================================

export enum SyncOperationType {
  WALLET_VERIFICATION = 'wallet_verification',
  NFT_COLLECTION_FETCH = 'nft_collection_fetch',
  PROFILE_DATA_UPDATE = 'profile_data_update',
  CACHE_INVALIDATION = 'cache_invalidation',
  ELIGIBILITY_CHECK = 'eligibility_check',
  READ_PROFILE = 'read_profile',
  WRITE_PROFILE = 'write_profile',
  READ_NFT_COLLECTION = 'read_nft_collection',
  SYNC_NFT_COLLECTION = 'sync_nft_collection',
  READ_WALLET_DATA = 'read_wallet_data',
  READ_CACHE = 'read_cache',
  WRITE_CACHE = 'write_cache'
}

export enum OperationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  status: OperationStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  retryCount: number;
  error?: SyncError;
  metadata: Record<string, any>;
}

// ============================================================================
// Sync Result Types
// ============================================================================

export interface SyncResult {
  success: boolean;
  timestamp: Date;
  operations: SyncOperation[];
  errors?: SyncError[];
  duration: number;
}

export interface NFTSyncResult extends SyncResult {
  collectionCount: number;
  newNFTs: number;
  removedNFTs: number;
  eligibleMoments: number;
}

export interface ProfileSyncResult extends SyncResult {
  profileUpdated: boolean;
  statsUpdated: boolean;
  achievementsUpdated: boolean;
}

// ============================================================================
// Sync Status Types
// ============================================================================

export interface SyncStatus {
  isActive: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  failureCount: number;
  currentOperation?: string;
}

// ============================================================================
// Error Handling Types
// ============================================================================

export enum SyncErrorType {
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  API_ERROR = 'api_error',
  VALIDATION_ERROR = 'validation_error',
  CACHE_ERROR = 'cache_error',
  TIMEOUT_ERROR = 'timeout_error'
}

export interface SyncError {
  type: SyncErrorType;
  message: string;
  code?: string;
  operation: SyncOperationType;
  timestamp: Date;
  retryable: boolean;
  context: Record<string, any>;
}

// ============================================================================
// Event System Types
// ============================================================================

export enum SyncEventType {
  WALLET_CONNECTED = 'wallet_connected',
  WALLET_DISCONNECTED = 'wallet_disconnected',
  NFT_COLLECTION_UPDATED = 'nft_collection_updated',
  PROFILE_SYNC_STARTED = 'profile_sync_started',
  PROFILE_SYNC_COMPLETED = 'profile_sync_completed',
  SYNC_ERROR = 'sync_error'
}

export interface SyncEvent {
  type: SyncEventType;
  timestamp: Date;
  data: any;
  source: string;
}

export type SyncEventHandler = (event: SyncEvent) => void;

// ============================================================================
// Profile Data Types
// ============================================================================

export type WalletType = 'dapper' | 'flow' | 'other';

export interface ProfileData {
  address: string;
  username: string;
  walletType: WalletType;
  collections: string[];
  stats: ProfileStats;
  achievements: Achievement[];
  lastUpdated: Date;
}

export interface ProfileStats {
  totalNFTs: number;
  nbaTopShotMoments: number;
  nflAllDayMoments: number;
  rareMoments: number;
  legendaryMoments: number;
  totalValue: number;
  eligibleMoments?: number;
  weeklyScore?: number;
  seasonRank?: number;
  wins?: number;
  losses?: number;
  totalPoints?: number;
  lastUpdated: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: Date;
  category: string;
}

// ============================================================================
// Sync Configuration Types
// ============================================================================

export interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition: (error: Error) => boolean;
}

export interface SyncConfiguration {
  autoSyncEnabled: boolean;
  syncInterval: number;
  retryPolicy: RetryPolicy;
  offlineQueueEnabled: boolean;
  cacheEnabled: boolean;
}

// ============================================================================
// Sync Metadata Types
// ============================================================================

export enum DataSource {
  BLOCKCHAIN = 'blockchain',
  API = 'api',
  CACHE = 'cache',
  FALLBACK = 'fallback'
}

export enum CacheStatus {
  FRESH = 'fresh',
  STALE = 'stale',
  EXPIRED = 'expired',
  INVALID = 'invalid'
}

export interface SyncMetadata {
  lastFullSync: Date;
  lastNFTSync: Date;
  lastStatsSync: Date;
  syncVersion: string;
  dataSource: DataSource;
  cacheStatus: CacheStatus;
}

// ============================================================================
// Eligibility Types
// ============================================================================

export interface EligibilityStatus {
  isEligible: boolean;
  reason?: string;
  collections: string[];
  eligibleMoments: number;
  lastChecked: Date;
}

// ============================================================================
// Network Resilience Types
// ============================================================================

export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  OFFLINE = 'offline'
}

export interface OfflineOperation {
  id: string;
  operation: () => Promise<any>;
  priority: number;
  timestamp: Date;
  retryCount: number;
}

// ============================================================================
// Recovery Types
// ============================================================================

export interface RecoveryResult {
  success: boolean;
  action: string;
  timestamp: Date;
  fallbackUsed: boolean;
}

export enum FallbackAction {
  USE_CACHE = 'use_cache',
  RETRY_LATER = 'retry_later',
  PROMPT_USER = 'prompt_user',
  SKIP_OPERATION = 'skip_operation'
}