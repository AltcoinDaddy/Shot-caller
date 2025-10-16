/**
 * Tests for error handling utilities
 */

import { 
  classifyError, 
  ErrorType, 
  ErrorSeverity, 
  retryWithBackoff, 
  handleError,
  DEFAULT_RETRY_CONFIGS 
} from '../error-handling'

// Mock toast function
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}))

describe('Error Handling Utilities', () => {
  describe('classifyError', () => {
    it('should classify wallet connection errors', () => {
      const error = new Error('wallet connection failed')
      const classified = classifyError(error)
      
      expect(classified.type).toBe(ErrorType.WALLET_CONNECTION)
      expect(classified.severity).toBe(ErrorSeverity.HIGH)
      expect(classified.retryable).toBe(true)
      expect(classified.userMessage).toContain('wallet')
    })

    it('should classify blockchain transaction errors', () => {
      const error = new Error('transaction failed on flow blockchain')
      const classified = classifyError(error)
      
      expect(classified.type).toBe(ErrorType.BLOCKCHAIN_TRANSACTION)
      expect(classified.severity).toBe(ErrorSeverity.HIGH)
      expect(classified.retryable).toBe(true)
      expect(classified.userMessage).toContain('Transaction failed')
    })

    it('should classify API request errors', () => {
      const error = { status: 500, message: 'Internal server error' }
      const classified = classifyError(error)
      
      expect(classified.type).toBe(ErrorType.API_REQUEST)
      expect(classified.severity).toBe(ErrorSeverity.HIGH)
      expect(classified.retryable).toBe(true)
      expect(classified.fallbackAvailable).toBe(true)
    })

    it('should classify validation errors as non-retryable', () => {
      const error = { name: 'ValidationError', message: 'Invalid input' }
      const classified = classifyError(error)
      
      expect(classified.type).toBe(ErrorType.VALIDATION)
      expect(classified.severity).toBe(ErrorSeverity.LOW)
      expect(classified.retryable).toBe(false)
    })

    it('should classify payment errors', () => {
      const error = new Error('insufficient funds for transaction')
      const classified = classifyError(error)
      
      expect(classified.type).toBe(ErrorType.PAYMENT)
      expect(classified.severity).toBe(ErrorSeverity.HIGH)
      expect(classified.retryable).toBe(false) // insufficient funds shouldn't retry
    })
  })

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')
      const config = DEFAULT_RETRY_CONFIGS[ErrorType.API_REQUEST]
      
      const result = await retryWithBackoff(mockFn, config)
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('temporary failure'))
        .mockResolvedValue('success')
      
      const config = { ...DEFAULT_RETRY_CONFIGS[ErrorType.API_REQUEST], baseDelay: 10 }
      
      const result = await retryWithBackoff(mockFn, config)
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should respect maxAttempts', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('persistent failure'))
      const config = { maxAttempts: 2, baseDelay: 10, maxDelay: 100, backoffMultiplier: 2 }
      
      await expect(retryWithBackoff(mockFn, config)).rejects.toThrow('persistent failure')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should respect retry condition', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('user rejected'))
      const config = {
        ...DEFAULT_RETRY_CONFIGS[ErrorType.WALLET_CONNECTION],
        baseDelay: 10
      }
      
      await expect(retryWithBackoff(mockFn, config)).rejects.toThrow('user rejected')
      expect(mockFn).toHaveBeenCalledTimes(1) // Should not retry user rejections
    })

    it('should call onRetry callback', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('temporary failure'))
        .mockResolvedValue('success')
      
      const onRetry = jest.fn()
      const config = { ...DEFAULT_RETRY_CONFIGS[ErrorType.API_REQUEST], baseDelay: 10 }
      
      await retryWithBackoff(mockFn, config, onRetry)
      
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))
    })
  })

  describe('handleError', () => {
    it('should handle successful execution', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')
      
      const result = await handleError(mockFn, {
        errorType: ErrorType.API_REQUEST,
        showToast: false
      })
      
      expect(result).toBe('success')
    })

    it('should use fallback on error', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('API failure'))
      const fallbackFn = jest.fn().mockResolvedValue('fallback result')
      
      const result = await handleError(mockFn, {
        errorType: ErrorType.API_REQUEST,
        showToast: false,
        fallbackFn
      })
      
      expect(result).toBe('fallback result')
      expect(fallbackFn).toHaveBeenCalled()
    })

    it('should throw error when no fallback available', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('API failure'))
      
      await expect(handleError(mockFn, {
        errorType: ErrorType.API_REQUEST,
        showToast: false
      })).rejects.toThrow('API failure')
    })
  })

  describe('DEFAULT_RETRY_CONFIGS', () => {
    it('should have configs for all error types', () => {
      const errorTypes = Object.values(ErrorType)
      
      errorTypes.forEach(errorType => {
        expect(DEFAULT_RETRY_CONFIGS[errorType]).toBeDefined()
        expect(DEFAULT_RETRY_CONFIGS[errorType].maxAttempts).toBeGreaterThan(0)
        expect(DEFAULT_RETRY_CONFIGS[errorType].baseDelay).toBeGreaterThanOrEqual(0)
      })
    })

    it('should have reasonable retry limits', () => {
      Object.values(DEFAULT_RETRY_CONFIGS).forEach(config => {
        expect(config.maxAttempts).toBeLessThanOrEqual(5) // Reasonable upper limit
        expect(config.maxDelay).toBeGreaterThanOrEqual(config.baseDelay)
        expect(config.backoffMultiplier).toBeGreaterThanOrEqual(1)
      })
    })
  })
})

describe('CircuitBreaker', () => {
  let CircuitBreaker: any
  
  beforeAll(async () => {
    const module = await import('../error-handling')
    CircuitBreaker = module.CircuitBreaker
  })

  it('should allow requests when closed', async () => {
    const breaker = new CircuitBreaker(3, 60000, 30000)
    const mockFn = jest.fn().mockResolvedValue('success')
    
    const result = await breaker.execute(mockFn)
    
    expect(result).toBe('success')
    expect(breaker.getState().state).toBe('closed')
  })

  it('should open after threshold failures', async () => {
    const breaker = new CircuitBreaker(2, 60000, 30000) // threshold of 2
    const mockFn = jest.fn().mockRejectedValue(new Error('failure'))
    
    // First failure
    await expect(breaker.execute(mockFn)).rejects.toThrow('failure')
    expect(breaker.getState().state).toBe('closed')
    
    // Second failure - should open circuit
    await expect(breaker.execute(mockFn)).rejects.toThrow('failure')
    expect(breaker.getState().state).toBe('open')
    
    // Third attempt should be rejected immediately
    await expect(breaker.execute(mockFn)).rejects.toThrow('Circuit breaker is open')
    expect(mockFn).toHaveBeenCalledTimes(2) // Should not call function when open
  })

  it('should reset on success', async () => {
    const breaker = new CircuitBreaker(3, 60000, 30000)
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('failure'))
      .mockResolvedValue('success')
    
    // Failure
    await expect(breaker.execute(mockFn)).rejects.toThrow('failure')
    expect(breaker.getState().failures).toBe(1)
    
    // Success should reset
    const result = await breaker.execute(mockFn)
    expect(result).toBe('success')
    expect(breaker.getState().failures).toBe(0)
    expect(breaker.getState().state).toBe('closed')
  })
})