/**
 * Comprehensive error classification system for wallet-profile sync operations
 * Provides structured error handling with recovery strategies and user messaging
 */

export enum SyncErrorType {
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  API_ERROR = 'api_error',
  VALIDATION_ERROR = 'validation_error',
  CACHE_ERROR = 'cache_error',
  TIMEOUT_ERROR = 'timeout_error',
  BLOCKCHAIN_ERROR = 'blockchain_error',
  WALLET_ERROR = 'wallet_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  DATA_CORRUPTION_ERROR = 'data_corruption_error'
}

export enum SyncErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RecoveryStrategy {
  RETRY_AUTOMATIC = 'retry_automatic',
  RETRY_MANUAL = 'retry_manual',
  FALLBACK_CACHE = 'fallback_cache',
  FALLBACK_PARTIAL = 'fallback_partial',
  REQUIRE_RECONNECTION = 'require_reconnection',
  REQUIRE_USER_ACTION = 'require_user_action',
  NO_RECOVERY = 'no_recovery'
}

export interface SyncError {
  id: string;
  type: SyncErrorType;
  severity: SyncErrorSeverity;
  message: string;
  code?: string;
  operation: string;
  timestamp: Date;
  retryable: boolean;
  recoveryStrategy: RecoveryStrategy;
  context: Record<string, any>;
  userMessage: string;
  actionableSteps: string[];
  technicalDetails?: string;
}

export interface ErrorClassificationRule {
  condition: (error: any) => boolean;
  classify: (error: any) => Partial<SyncError>;
}

/**
 * Error classification rules for different error types
 */
export const ERROR_CLASSIFICATION_RULES: ErrorClassificationRule[] = [
  // Network errors
  {
    condition: (error) => 
      error.code === 'NETWORK_ERROR' || 
      error.message?.includes('fetch') ||
      error.message?.includes('network') ||
      !navigator.onLine,
    classify: (error) => ({
      type: SyncErrorType.NETWORK_ERROR,
      severity: SyncErrorSeverity.MEDIUM,
      retryable: true,
      recoveryStrategy: RecoveryStrategy.FALLBACK_CACHE,
      userMessage: 'Connection issue detected. Using cached data.',
      actionableSteps: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      ]
    })
  },
  
  // Authentication errors
  {
    condition: (error) => 
      error.code === 'UNAUTHORIZED' || 
      error.status === 401 ||
      error.message?.includes('authentication'),
    classify: (error) => ({
      type: SyncErrorType.AUTHENTICATION_ERROR,
      severity: SyncErrorSeverity.HIGH,
      retryable: false,
      recoveryStrategy: RecoveryStrategy.REQUIRE_RECONNECTION,
      userMessage: 'Authentication expired. Please reconnect your wallet.',
      actionableSteps: [
        'Disconnect and reconnect your wallet',
        'Check wallet connection status',
        'Refresh the page if needed'
      ]
    })
  },
  
  // API errors (4xx and 5xx)
  {
    condition: (error) => 
      (error.status >= 400 && error.status < 600) && error.status !== 401,
    classify: (error) => ({
      type: SyncErrorType.API_ERROR,
      severity: error.status === 429 ? SyncErrorSeverity.MEDIUM : 
                error.status >= 500 ? SyncErrorSeverity.HIGH : SyncErrorSeverity.MEDIUM,
      retryable: error.status === 429 || error.status >= 500,
      recoveryStrategy: error.status === 429 ? RecoveryStrategy.RETRY_AUTOMATIC : RecoveryStrategy.FALLBACK_CACHE,
      userMessage: error.status === 429 ? 'Too many requests. Slowing down...' : 'Service temporarily unavailable.',
      actionableSteps: error.status === 429 ? [
        'Please wait a moment',
        'Reduce sync frequency if possible'
      ] : [
        'Try again in a few minutes',
        'Check service status',
        'Contact support if issue persists'
      ]
    })
  },
  
  // Timeout errors
  {
    condition: (error) => 
      error.code === 'TIMEOUT' || 
      error.message?.includes('timeout'),
    classify: (error) => ({
      type: SyncErrorType.TIMEOUT_ERROR,
      severity: SyncErrorSeverity.MEDIUM,
      retryable: true,
      recoveryStrategy: RecoveryStrategy.RETRY_AUTOMATIC,
      userMessage: 'Request timed out. Retrying...',
      actionableSteps: [
        'Check your connection speed',
        'Try again with a stable connection',
        'Reduce sync frequency if on slow connection'
      ]
    })
  },
  
  // Blockchain errors
  {
    condition: (error) => 
      error.message?.includes('blockchain') ||
      error.message?.includes('flow') ||
      error.code?.includes('FLOW'),
    classify: (error) => ({
      type: SyncErrorType.BLOCKCHAIN_ERROR,
      severity: SyncErrorSeverity.HIGH,
      retryable: true,
      recoveryStrategy: RecoveryStrategy.FALLBACK_CACHE,
      userMessage: 'Blockchain service temporarily unavailable.',
      actionableSteps: [
        'Check Flow blockchain status',
        'Try again in a few minutes',
        'Using cached NFT data temporarily'
      ]
    })
  },
  
  // Wallet errors
  {
    condition: (error) => 
      error.message?.includes('wallet') ||
      error.code?.includes('WALLET'),
    classify: (error) => ({
      type: SyncErrorType.WALLET_ERROR,
      severity: SyncErrorSeverity.HIGH,
      retryable: false,
      recoveryStrategy: RecoveryStrategy.REQUIRE_USER_ACTION,
      userMessage: 'Wallet connection issue detected.',
      actionableSteps: [
        'Check wallet extension is enabled',
        'Reconnect your wallet',
        'Try a different wallet if available'
      ]
    })
  },
  
  // Validation errors
  {
    condition: (error) => 
      error.code === 'VALIDATION_ERROR' ||
      (error.message?.includes('validation') && !error.message?.includes('wallet')),
    classify: (error) => ({
      type: SyncErrorType.VALIDATION_ERROR,
      severity: SyncErrorSeverity.MEDIUM,
      retryable: false,
      recoveryStrategy: RecoveryStrategy.REQUIRE_USER_ACTION,
      userMessage: 'Data validation failed.',
      actionableSteps: [
        'Check your wallet address format',
        'Verify NFT collection data',
        'Contact support if data appears correct'
      ]
    })
  },
  
  // Cache errors
  {
    condition: (error) => 
      error.message?.includes('Cache storage failed') ||
      error.code?.includes('CACHE'),
    classify: (error) => ({
      type: SyncErrorType.CACHE_ERROR,
      severity: SyncErrorSeverity.LOW,
      retryable: true,
      recoveryStrategy: RecoveryStrategy.RETRY_MANUAL,
      userMessage: 'Cache issue detected. Refreshing data...',
      actionableSteps: [
        'Clear browser cache',
        'Refresh the page',
        'Try incognito mode if issue persists'
      ]
    })
  }
];

/**
 * Classifies an error based on predefined rules
 */
export function classifyError(error: any, operation: string): SyncError {
  const errorId = `sync_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Find matching classification rule
  const rule = ERROR_CLASSIFICATION_RULES.find(rule => rule.condition(error));
  
  const baseClassification: SyncError = {
    id: errorId,
    type: SyncErrorType.API_ERROR,
    severity: SyncErrorSeverity.MEDIUM,
    message: error.message || 'Unknown sync error',
    code: error.code,
    operation,
    timestamp: new Date(),
    retryable: true,
    recoveryStrategy: RecoveryStrategy.RETRY_AUTOMATIC,
    context: {
      originalError: error,
      userAgent: navigator.userAgent,
      url: window.location.href,
      online: navigator.onLine
    },
    userMessage: 'An error occurred during sync. Retrying...',
    actionableSteps: ['Try again', 'Check your connection', 'Contact support if issue persists'],
    technicalDetails: error.stack
  };
  
  if (rule) {
    return { ...baseClassification, ...rule.classify(error) };
  }
  
  return baseClassification;
}

/**
 * Determines if an error should trigger automatic retry
 */
export function shouldRetryAutomatically(error: SyncError): boolean {
  return error.retryable && 
         error.recoveryStrategy === RecoveryStrategy.RETRY_AUTOMATIC &&
         error.severity !== SyncErrorSeverity.CRITICAL;
}

/**
 * Gets user-friendly error message with context
 */
export function getUserFriendlyMessage(error: SyncError): string {
  const contextInfo = error.context.online === false ? ' (You appear to be offline)' : '';
  return `${error.userMessage}${contextInfo}`;
}

/**
 * Gets actionable steps based on error type and context
 */
export function getActionableSteps(error: SyncError): string[] {
  const baseSteps = [...error.actionableSteps];
  
  // Add context-specific steps
  if (!error.context.online) {
    baseSteps.unshift('Check your internet connection');
  }
  
  if (error.type === SyncErrorType.RATE_LIMIT_ERROR) {
    baseSteps.push('Consider reducing sync frequency');
  }
  
  return baseSteps;
}