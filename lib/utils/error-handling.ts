/**
 * Comprehensive error handling utilities for ShotCaller
 * Provides graceful error handling, retry mechanisms, and user-friendly error messages
 */

import { toast } from '@/hooks/use-toast'

// Error types
export enum ErrorType {
  WALLET_CONNECTION = 'wallet_connection',
  BLOCKCHAIN_TRANSACTION = 'blockchain_transaction',
  API_REQUEST = 'api_request',
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  PAYMENT = 'payment',
  NFT_VERIFICATION = 'nft_verification',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorInfo {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string
  code?: string
  details?: any
  timestamp: Date
  retryable: boolean
  fallbackAvailable: boolean
}

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryCondition?: (error: any) => boolean
}

// Default retry configurations for different error types
export const DEFAULT_RETRY_CONFIGS: Record<ErrorType, RetryConfig> = {
  [ErrorType.WALLET_CONNECTION]: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    retryCondition: (error) => !error.message?.includes('user rejected')
  },
  [ErrorType.BLOCKCHAIN_TRANSACTION]: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 1.5,
    retryCondition: (error) => !error.message?.includes('insufficient funds')
  },
  [ErrorType.API_REQUEST]: {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 3000,
    backoffMultiplier: 2,
    retryCondition: (error) => error.status >= 500 || error.code === 'NETWORK_ERROR'
  },
  [ErrorType.DATABASE]: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 3000,
    backoffMultiplier: 2,
    retryCondition: (error) => error.code !== 'PGRST116' // Not found errors shouldn't retry
  },
  [ErrorType.NETWORK]: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffMultiplier: 2
  },
  [ErrorType.VALIDATION]: {
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    retryCondition: () => false // Validation errors shouldn't retry
  },
  [ErrorType.AUTHENTICATION]: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 3000,
    backoffMultiplier: 2,
    retryCondition: (error) => !error.message?.includes('invalid credentials')
  },
  [ErrorType.PAYMENT]: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 8000,
    backoffMultiplier: 2,
    retryCondition: (error) => !error.message?.includes('insufficient funds')
  },
  [ErrorType.NFT_VERIFICATION]: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2
  },
  [ErrorType.UNKNOWN]: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 3000,
    backoffMultiplier: 2
  }
}

/**
 * Classify error and return structured error information
 */
export function classifyError(error: any): ErrorInfo {
  const timestamp = new Date()
  
  // Wallet connection errors
  if (error.message?.includes('wallet') || error.message?.includes('authentication')) {
    return {
      type: ErrorType.WALLET_CONNECTION,
      severity: ErrorSeverity.HIGH,
      message: error.message,
      userMessage: 'Failed to connect wallet. Please check your wallet connection and try again.',
      code: error.code,
      details: error,
      timestamp,
      retryable: true,
      fallbackAvailable: false
    }
  }

  // Blockchain transaction errors
  if (error.message?.includes('transaction') || error.message?.includes('gas') || error.message?.includes('flow')) {
    return {
      type: ErrorType.BLOCKCHAIN_TRANSACTION,
      severity: ErrorSeverity.HIGH,
      message: error.message,
      userMessage: 'Transaction failed. Please check your FLOW balance and try again.',
      code: error.code,
      details: error,
      timestamp,
      retryable: true,
      fallbackAvailable: false
    }
  }

  // API request errors
  if (error.status || error.response?.status) {
    const status = error.status || error.response?.status
    return {
      type: ErrorType.API_REQUEST,
      severity: status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      message: error.message,
      userMessage: status >= 500 
        ? 'Server error occurred. Please try again in a moment.'
        : 'Request failed. Please check your input and try again.',
      code: error.code || status.toString(),
      details: error,
      timestamp,
      retryable: status >= 500,
      fallbackAvailable: true
    }
  }

  // Database errors
  if (error.name === 'DatabaseError' || error.code?.startsWith('PGRST')) {
    return {
      type: ErrorType.DATABASE,
      severity: ErrorSeverity.HIGH,
      message: error.message,
      userMessage: 'Database error occurred. Please try again.',
      code: error.code,
      details: error,
      timestamp,
      retryable: error.code !== 'PGRST116', // Not found errors shouldn't retry
      fallbackAvailable: true
    }
  }

  // Network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('network') || error.message?.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      message: error.message,
      userMessage: 'Network error. Please check your connection and try again.',
      code: error.code,
      details: error,
      timestamp,
      retryable: true,
      fallbackAvailable: true
    }
  }

  // Validation errors
  if (error.name === 'ValidationError' || error.name === 'ZodError') {
    return {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      message: error.message,
      userMessage: 'Invalid input. Please check your data and try again.',
      code: error.code,
      details: error,
      timestamp,
      retryable: false,
      fallbackAvailable: false
    }
  }

  // Payment errors
  if (error.message?.includes('payment') || error.message?.includes('insufficient funds')) {
    return {
      type: ErrorType.PAYMENT,
      severity: ErrorSeverity.HIGH,
      message: error.message,
      userMessage: 'Payment failed. Please check your FLOW balance and try again.',
      code: error.code,
      details: error,
      timestamp,
      retryable: !error.message?.includes('insufficient funds'),
      fallbackAvailable: false
    }
  }

  // NFT verification errors
  if (error.message?.includes('NFT') || error.message?.includes('ownership')) {
    return {
      type: ErrorType.NFT_VERIFICATION,
      severity: ErrorSeverity.MEDIUM,
      message: error.message,
      userMessage: 'Failed to verify NFT ownership. Please try again.',
      code: error.code,
      details: error,
      timestamp,
      retryable: true,
      fallbackAvailable: true
    }
  }

  // Unknown errors
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    message: error.message || 'Unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again.',
    code: error.code,
    details: error,
    timestamp,
    retryable: true,
    fallbackAvailable: false
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  onRetry?: (attempt: number, error: any) => void
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Check if we should retry this error
      if (config.retryCondition && !config.retryCondition(error)) {
        throw error
      }
      
      // Don't wait after the last attempt
      if (attempt === config.maxAttempts) {
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      )
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, error)
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Handle error with appropriate user feedback and retry logic
 */
export async function handleError<T>(
  fn: () => Promise<T>,
  options: {
    errorType?: ErrorType
    showToast?: boolean
    retryConfig?: Partial<RetryConfig>
    onRetry?: (attempt: number, error: any) => void
    fallbackFn?: () => Promise<T>
  } = {}
): Promise<T> {
  const {
    errorType,
    showToast = true,
    retryConfig = {},
    onRetry,
    fallbackFn
  } = options

  try {
    // Get retry configuration
    const config = errorType 
      ? { ...DEFAULT_RETRY_CONFIGS[errorType], ...retryConfig }
      : { maxAttempts: 1, baseDelay: 0, maxDelay: 0, backoffMultiplier: 1, ...retryConfig }

    // Execute function with retry logic
    return await retryWithBackoff(fn, config, onRetry)
  } catch (error) {
    const errorInfo = classifyError(error)
    
    // Show user-friendly error message
    if (showToast) {
      toast({
        title: 'Error',
        description: errorInfo.userMessage,
        variant: 'destructive'
      })
    }
    
    // Log error for debugging
    console.error(`[${errorInfo.type}] ${errorInfo.message}`, {
      code: errorInfo.code,
      severity: errorInfo.severity,
      details: errorInfo.details,
      timestamp: errorInfo.timestamp
    })
    
    // Try fallback if available and error supports it
    if (fallbackFn && errorInfo.fallbackAvailable) {
      try {
        console.log(`Attempting fallback for ${errorInfo.type} error`)
        return await fallbackFn()
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        // Fall through to throw original error
      }
    }
    
    throw error
  }
}

/**
 * Create a wrapper function with built-in error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorType: ErrorType,
  options: {
    showToast?: boolean
    retryConfig?: Partial<RetryConfig>
    fallbackFn?: (...args: T) => Promise<R>
  } = {}
) {
  return async (...args: T): Promise<R> => {
    return handleError(
      () => fn(...args),
      {
        errorType,
        ...options,
        fallbackFn: options.fallbackFn ? () => options.fallbackFn!(...args) : undefined
      }
    )
  }
}

/**
 * Circuit breaker pattern for external API calls
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.threshold) {
      this.state = 'open'
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}