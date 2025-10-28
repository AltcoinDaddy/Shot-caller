'use client';

/**
 * React hook for managing sync errors and recovery
 * Provides state management and UI integration for sync error handling
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { 
  SyncError, 
  SyncErrorType, 
  SyncErrorSeverity,
  classifyError 
} from '@/lib/utils/sync-error-classification';
import { 
  syncErrorRecoveryManager, 
  RecoveryResult, 
  RecoveryOptions 
} from '@/lib/services/sync-error-recovery-manager';
import { 
  createErrorNotification,
  ErrorNotification,
  shouldShowDetailedTroubleshooting 
} from '@/lib/utils/sync-error-handling';

export interface SyncErrorState {
  errors: SyncError[];
  activeError: SyncError | null;
  isRecovering: boolean;
  recoveryAttempts: Map<string, number>;
}

export interface SyncErrorHandlingOptions {
  maxRetries?: number;
  retryDelay?: number;
  showToasts?: boolean;
  autoRecovery?: boolean;
  onError?: (error: SyncError) => void;
  onRecovery?: (error: SyncError, result: RecoveryResult) => void;
}

export interface UseSyncErrorHandlingReturn {
  // State
  errors: SyncError[];
  activeError: SyncError | null;
  isRecovering: boolean;
  hasErrors: boolean;
  hasCriticalErrors: boolean;
  
  // Actions
  handleError: (error: any, operation: string, options?: RecoveryOptions) => Promise<RecoveryResult>;
  retryError: (errorId: string) => Promise<RecoveryResult | null>;
  dismissError: (errorId: string) => void;
  clearErrors: () => void;
  clearErrorsByType: (type: SyncErrorType) => void;
  
  // Recovery
  recoverFromError: (errorId: string, options?: RecoveryOptions) => Promise<RecoveryResult | null>;
  setFallbackData: (operation: string, context: any, data: any) => void;
  
  // UI helpers
  getErrorNotification: (errorId: string) => ErrorNotification | null;
  shouldShowTroubleshooting: (errorId: string) => boolean;
}

/**
 * Hook for comprehensive sync error handling
 */
export function useSyncErrorHandling(
  options: SyncErrorHandlingOptions = {}
): UseSyncErrorHandlingReturn {
  const [state, setState] = useState<SyncErrorState>({
    errors: [],
    activeError: null,
    isRecovering: false,
    recoveryAttempts: new Map()
  });

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Auto-recovery timer refs
  const recoveryTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Handle a new sync error
   */
  const handleError = useCallback(async (
    error: any, 
    operation: string, 
    recoveryOptions: RecoveryOptions = {}
  ): Promise<RecoveryResult> => {
    const classifiedError = classifyError(error, operation);
    
    // Add error to state
    setState(prev => ({
      ...prev,
      errors: [...prev.errors.filter(e => e.id !== classifiedError.id), classifiedError],
      activeError: classifiedError
    }));

    // Call error callback
    if (optionsRef.current.onError) {
      optionsRef.current.onError(classifiedError);
    }

    // Show toast notification if enabled
    if (optionsRef.current.showToasts !== false) {
      showErrorToast(classifiedError);
    }

    // Attempt automatic recovery if enabled
    if (optionsRef.current.autoRecovery !== false) {
      return await attemptRecovery(classifiedError, recoveryOptions);
    }

    return {
      success: false,
      strategy: classifiedError.recoveryStrategy,
      message: 'Manual recovery required'
    };
  }, []);

  /**
   * Attempt error recovery
   */
  const attemptRecovery = useCallback(async (
    error: SyncError, 
    recoveryOptions: RecoveryOptions = {}
  ): Promise<RecoveryResult> => {
    setState(prev => ({ ...prev, isRecovering: true }));

    try {
      const result = await syncErrorRecoveryManager.recoverFromError(
        error, 
        error.operation, 
        {
          maxRetries: optionsRef.current.maxRetries,
          retryDelay: optionsRef.current.retryDelay,
          ...recoveryOptions
        }
      );

      // Update recovery attempts
      setState(prev => {
        const newAttempts = new Map(prev.recoveryAttempts);
        newAttempts.set(error.id, (newAttempts.get(error.id) || 0) + 1);
        return { ...prev, recoveryAttempts: newAttempts };
      });

      // Call recovery callback
      if (optionsRef.current.onRecovery) {
        optionsRef.current.onRecovery(error, result);
      }

      // Schedule automatic retry if needed
      if (result.success && result.retryAfter) {
        scheduleRetry(error.id, result.retryAfter);
      }

      // Remove error if recovery was successful
      if (result.success && !result.retryAfter) {
        setState(prev => ({
          ...prev,
          errors: prev.errors.filter(e => e.id !== error.id),
          activeError: prev.activeError?.id === error.id ? null : prev.activeError
        }));
      }

      return result;
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return {
        success: false,
        strategy: error.recoveryStrategy,
        message: 'Recovery attempt failed'
      };
    } finally {
      setState(prev => ({ ...prev, isRecovering: false }));
    }
  }, []);

  /**
   * Retry a specific error
   */
  const retryError = useCallback(async (errorId: string): Promise<RecoveryResult | null> => {
    const error = state.errors.find(e => e.id === errorId);
    if (!error) return null;

    return await attemptRecovery(error);
  }, [state.errors, attemptRecovery]);

  /**
   * Recover from a specific error
   */
  const recoverFromError = useCallback(async (
    errorId: string, 
    recoveryOptions: RecoveryOptions = {}
  ): Promise<RecoveryResult | null> => {
    const error = state.errors.find(e => e.id === errorId);
    if (!error) return null;

    return await attemptRecovery(error, recoveryOptions);
  }, [state.errors, attemptRecovery]);

  /**
   * Dismiss an error
   */
  const dismissError = useCallback((errorId: string) => {
    setState(prev => ({
      ...prev,
      errors: prev.errors.filter(e => e.id !== errorId),
      activeError: prev.activeError?.id === errorId ? null : prev.activeError
    }));

    // Clear any pending retry timer
    const timer = recoveryTimers.current.get(errorId);
    if (timer) {
      clearTimeout(timer);
      recoveryTimers.current.delete(errorId);
    }
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: [],
      activeError: null,
      recoveryAttempts: new Map()
    }));

    // Clear all retry timers
    recoveryTimers.current.forEach(timer => clearTimeout(timer));
    recoveryTimers.current.clear();
  }, []);

  /**
   * Clear errors by type
   */
  const clearErrorsByType = useCallback((type: SyncErrorType) => {
    setState(prev => ({
      ...prev,
      errors: prev.errors.filter(e => e.type !== type),
      activeError: prev.activeError?.type === type ? null : prev.activeError
    }));
  }, []);

  /**
   * Set fallback data for recovery
   */
  const setFallbackData = useCallback((operation: string, context: any, data: any) => {
    syncErrorRecoveryManager.setCachedData(operation, context, data);
  }, []);

  /**
   * Get error notification for UI display
   */
  const getErrorNotification = useCallback((errorId: string): ErrorNotification | null => {
    const error = state.errors.find(e => e.id === errorId);
    if (!error) return null;

    return createErrorNotification(error, {
      showRetryButton: error.retryable,
      showContactSupport: error.severity === SyncErrorSeverity.HIGH || 
                          error.severity === SyncErrorSeverity.CRITICAL
    });
  }, [state.errors]);

  /**
   * Check if error should show troubleshooting
   */
  const shouldShowTroubleshooting = useCallback((errorId: string): boolean => {
    const error = state.errors.find(e => e.id === errorId);
    if (!error) return false;

    return shouldShowDetailedTroubleshooting(error);
  }, [state.errors]);

  /**
   * Schedule automatic retry
   */
  const scheduleRetry = useCallback((errorId: string, delay: number) => {
    const timer = setTimeout(() => {
      retryError(errorId);
      recoveryTimers.current.delete(errorId);
    }, delay);

    recoveryTimers.current.set(errorId, timer);
  }, [retryError]);

  /**
   * Show error toast notification
   */
  const showErrorToast = useCallback((error: SyncError) => {
    const notification = createErrorNotification(error);
    
    const toastOptions = {
      duration: error.severity === SyncErrorSeverity.LOW ? 5000 : Infinity,
      action: error.retryable ? {
        label: 'Retry',
        onClick: () => retryError(error.id)
      } : undefined
    };

    switch (error.severity) {
      case SyncErrorSeverity.LOW:
        toast.info(notification.message, toastOptions);
        break;
      case SyncErrorSeverity.MEDIUM:
        toast.warning(notification.message, toastOptions);
        break;
      case SyncErrorSeverity.HIGH:
      case SyncErrorSeverity.CRITICAL:
        toast.error(notification.message, toastOptions);
        break;
    }
  }, [retryError]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      recoveryTimers.current.forEach(timer => clearTimeout(timer));
      recoveryTimers.current.clear();
    };
  }, []);

  // Computed values
  const hasErrors = state.errors.length > 0;
  const hasCriticalErrors = state.errors.some(e => e.severity === SyncErrorSeverity.CRITICAL);

  return {
    // State
    errors: state.errors,
    activeError: state.activeError,
    isRecovering: state.isRecovering,
    hasErrors,
    hasCriticalErrors,
    
    // Actions
    handleError,
    retryError,
    dismissError,
    clearErrors,
    clearErrorsByType,
    
    // Recovery
    recoverFromError,
    setFallbackData,
    
    // UI helpers
    getErrorNotification,
    shouldShowTroubleshooting
  };
}

/**
 * Hook for handling specific operation errors
 */
export function useOperationErrorHandling(
  operation: string,
  options: SyncErrorHandlingOptions = {}
) {
  const errorHandling = useSyncErrorHandling(options);
  
  const handleOperationError = useCallback(async (
    error: any, 
    recoveryOptions?: RecoveryOptions
  ) => {
    return await errorHandling.handleError(error, operation, recoveryOptions);
  }, [errorHandling.handleError, operation]);

  const operationErrors = errorHandling.errors.filter(e => e.operation === operation);
  
  return {
    ...errorHandling,
    operationErrors,
    handleOperationError
  };
}