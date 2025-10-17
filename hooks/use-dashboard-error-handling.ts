"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDashboard } from '@/contexts/dashboard-context'
import { parseError, ErrorInfo, RetryManager } from '@/components/dashboard-loading-states'

interface UseErrorHandlingOptions {
  maxRetries?: number
  retryDelay?: number
  component?: string
  onError?: (error: ErrorInfo) => void
  onRetry?: (attempt: number) => void
  onSuccess?: () => void
}

interface ErrorHandlingState {
  isLoading: boolean
  error: ErrorInfo | null
  retryCount: number
  canRetry: boolean
}

export function useDashboardErrorHandling(options: UseErrorHandlingOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    component,
    onError,
    onRetry,
    onSuccess
  } = options

  const { addError } = useDashboard()
  const [state, setState] = useState<ErrorHandlingState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    canRetry: true
  })

  const retryManagerRef = useRef(new RetryManager(maxRetries, retryDelay))
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const executeWithErrorHandling = useCallback(async <T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    operationName?: string
  ): Promise<T | null> => {
    // Cancel any ongoing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))

    try {
      const result = await retryManagerRef.current.executeWithRetry(
        () => operation(signal),
        (attempt, error) => {
          setState(prev => ({
            ...prev,
            retryCount: attempt
          }))
          
          if (onRetry) {
            onRetry(attempt)
          }
          
          console.warn(`${operationName || 'Operation'} retry attempt ${attempt}:`, error)
        }
      )

      // Success
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        retryCount: 0,
        canRetry: true
      }))

      if (onSuccess) {
        onSuccess()
      }

      return result
    } catch (error) {
      // Check if operation was aborted
      if (signal.aborted) {
        console.log(`${operationName || 'Operation'} was aborted`)
        return null
      }

      const errorInfo = parseError(error)
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorInfo,
        canRetry: errorInfo.retryable && prev.retryCount < maxRetries
      }))

      // Add error to dashboard context
      addError(error, component)

      // Call custom error handler
      if (onError) {
        onError(errorInfo)
      }

      console.error(`${operationName || 'Operation'} failed:`, error)
      
      return null
    }
  }, [maxRetries, component, addError, onError, onRetry, onSuccess])

  const retry = useCallback(async <T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    operationName?: string
  ): Promise<T | null> => {
    if (!state.canRetry) {
      console.warn('Cannot retry: max retries exceeded or error is not retryable')
      return null
    }

    return executeWithErrorHandling(operation, operationName)
  }, [state.canRetry, executeWithErrorHandling])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      retryCount: 0,
      canRetry: true
    })
    retryManagerRef.current.reset()
  }, [])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setState(prev => ({
      ...prev,
      isLoading: false
    }))
  }, [])

  return {
    ...state,
    executeWithErrorHandling,
    retry,
    reset,
    cancel,
    // Convenience methods
    isRetryable: state.error?.retryable ?? false,
    errorMessage: state.error?.message,
    errorType: state.error?.type,
    suggestion: state.error?.suggestion
  }
}

// Specialized hook for API calls
export function useApiErrorHandling(baseUrl?: string, options: UseErrorHandlingOptions = {}) {
  const errorHandling = useDashboardErrorHandling(options)

  const apiCall = useCallback(async <T>(
    endpoint: string,
    requestOptions: RequestInit = {},
    operationName?: string
  ): Promise<T | null> => {
    return errorHandling.executeWithErrorHandling(
      async (signal) => {
        const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint
        
        const response = await fetch(url, {
          ...requestOptions,
          signal,
          headers: {
            'Content-Type': 'application/json',
            ...requestOptions.headers
          }
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        return response.json()
      },
      operationName || `API call to ${endpoint}`
    )
  }, [baseUrl, errorHandling])

  return {
    ...errorHandling,
    apiCall
  }
}

// Hook for handling multiple concurrent operations
export function useBatchErrorHandling(options: UseErrorHandlingOptions = {}) {
  const [operations, setOperations] = useState<Map<string, ErrorHandlingState>>(new Map())
  const { addError } = useDashboard()

  const executeOperation = useCallback(async <T>(
    operationId: string,
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T | null> => {
    setOperations(prev => new Map(prev).set(operationId, {
      isLoading: true,
      error: null,
      retryCount: 0,
      canRetry: true
    }))

    try {
      const result = await operation()
      
      setOperations(prev => new Map(prev).set(operationId, {
        isLoading: false,
        error: null,
        retryCount: 0,
        canRetry: true
      }))

      return result
    } catch (error) {
      const errorInfo = parseError(error)
      
      setOperations(prev => new Map(prev).set(operationId, {
        isLoading: false,
        error: errorInfo,
        retryCount: 0,
        canRetry: errorInfo.retryable
      }))

      addError(error, options.component)
      console.error(`Operation ${operationId} failed:`, error)
      
      return null
    }
  }, [addError, options.component])

  const getOperationState = useCallback((operationId: string): ErrorHandlingState => {
    return operations.get(operationId) || {
      isLoading: false,
      error: null,
      retryCount: 0,
      canRetry: true
    }
  }, [operations])

  const isAnyLoading = Array.from(operations.values()).some(op => op.isLoading)
  const hasAnyError = Array.from(operations.values()).some(op => op.error !== null)
  const allErrors = Array.from(operations.values())
    .map(op => op.error)
    .filter(Boolean) as ErrorInfo[]

  return {
    executeOperation,
    getOperationState,
    isAnyLoading,
    hasAnyError,
    allErrors,
    operations: Object.fromEntries(operations)
  }
}