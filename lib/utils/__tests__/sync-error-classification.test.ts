/**
 * Tests for Sync Error Classification System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SyncErrorType,
  SyncErrorSeverity,
  RecoveryStrategy,
  classifyError,
  shouldRetryAutomatically,
  getUserFriendlyMessage,
  getActionableSteps,
  ERROR_CLASSIFICATION_RULES
} from '../sync-error-classification';

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true,
    userAgent: 'test-agent'
  },
  writable: true
});

Object.defineProperty(window, 'location', {
  value: {
    href: 'https://test.com'
  },
  writable: true
});

describe('Sync Error Classification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('classifyError', () => {
    it('should classify network errors correctly', () => {
      const networkError = new Error('fetch failed');
      const classified = classifyError(networkError, 'syncNFTCollection');

      expect(classified.type).toBe(SyncErrorType.NETWORK_ERROR);
      expect(classified.severity).toBe(SyncErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(true);
      expect(classified.recoveryStrategy).toBe(RecoveryStrategy.FALLBACK_CACHE);
      expect(classified.operation).toBe('syncNFTCollection');
    });

    it('should classify authentication errors correctly', () => {
      const authError = { status: 401, message: 'Unauthorized' };
      const classified = classifyError(authError, 'syncWalletToProfile');

      expect(classified.type).toBe(SyncErrorType.AUTHENTICATION_ERROR);
      expect(classified.severity).toBe(SyncErrorSeverity.HIGH);
      expect(classified.retryable).toBe(false);
      expect(classified.recoveryStrategy).toBe(RecoveryStrategy.REQUIRE_RECONNECTION);
    });

    it('should classify API errors correctly', () => {
      const apiError = { status: 500, message: 'Internal Server Error' };
      const classified = classifyError(apiError, 'syncProfileStats');

      expect(classified.type).toBe(SyncErrorType.API_ERROR);
      expect(classified.severity).toBe(SyncErrorSeverity.HIGH);
      expect(classified.retryable).toBe(true);
      expect(classified.recoveryStrategy).toBe(RecoveryStrategy.FALLBACK_CACHE);
    });

    it('should classify rate limit errors correctly', () => {
      const rateLimitError = { status: 429, message: 'Too Many Requests' };
      const classified = classifyError(rateLimitError, 'syncNFTCollection');

      expect(classified.type).toBe(SyncErrorType.API_ERROR);
      expect(classified.severity).toBe(SyncErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(true);
      expect(classified.recoveryStrategy).toBe(RecoveryStrategy.RETRY_AUTOMATIC);
    });

    it('should classify timeout errors correctly', () => {
      const timeoutError = { code: 'TIMEOUT', message: 'Request timeout' };
      const classified = classifyError(timeoutError, 'syncWalletToProfile');

      expect(classified.type).toBe(SyncErrorType.TIMEOUT_ERROR);
      expect(classified.severity).toBe(SyncErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(true);
      expect(classified.recoveryStrategy).toBe(RecoveryStrategy.RETRY_AUTOMATIC);
    });

    it('should classify blockchain errors correctly', () => {
      const blockchainError = { message: 'Flow blockchain connection failed' };
      const classified = classifyError(blockchainError, 'syncNFTCollection');

      expect(classified.type).toBe(SyncErrorType.BLOCKCHAIN_ERROR);
      expect(classified.severity).toBe(SyncErrorSeverity.HIGH);
      expect(classified.retryable).toBe(true);
      expect(classified.recoveryStrategy).toBe(RecoveryStrategy.FALLBACK_CACHE);
    });

    it('should classify wallet errors correctly', () => {
      const walletError = { code: 'WALLET_ERROR', message: 'Wallet connection failed' };
      const classified = classifyError(walletError, 'syncWalletToProfile');

      expect(classified.type).toBe(SyncErrorType.WALLET_ERROR);
      expect(classified.severity).toBe(SyncErrorSeverity.HIGH);
      expect(classified.retryable).toBe(false);
      expect(classified.recoveryStrategy).toBe(RecoveryStrategy.REQUIRE_USER_ACTION);
    });

    it('should classify validation errors correctly', () => {
      const validationError = { code: 'VALIDATION_ERROR', message: 'Invalid data format' };
      const classified = classifyError(validationError, 'syncProfileStats');

      expect(classified.type).toBe(SyncErrorType.VALIDATION_ERROR);
      expect(classified.severity).toBe(SyncErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(false);
      expect(classified.recoveryStrategy).toBe(RecoveryStrategy.REQUIRE_USER_ACTION);
    });

    it('should classify cache errors correctly', () => {
      const cacheError = { message: 'Cache storage failed' };
      const classified = classifyError(cacheError, 'syncNFTCollection');

      expect(classified.type).toBe(SyncErrorType.CACHE_ERROR);
      expect(classified.severity).toBe(SyncErrorSeverity.LOW);
      expect(classified.retryable).toBe(true);
      expect(classified.recoveryStrategy).toBe(RecoveryStrategy.RETRY_MANUAL);
    });

    it('should handle unknown errors with default classification', () => {
      const unknownError = { message: 'Unknown error occurred' };
      const classified = classifyError(unknownError, 'unknownOperation');

      expect(classified.type).toBe(SyncErrorType.API_ERROR);
      expect(classified.severity).toBe(SyncErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(true);
      expect(classified.recoveryStrategy).toBe(RecoveryStrategy.RETRY_AUTOMATIC);
    });

    it('should include context information', () => {
      const error = new Error('Test error');
      const classified = classifyError(error, 'testOperation');

      expect(classified.context).toHaveProperty('originalError', error);
      expect(classified.context).toHaveProperty('userAgent');
      expect(classified.context).toHaveProperty('url');
      expect(classified.context).toHaveProperty('online');
    });

    it('should generate unique error IDs', () => {
      const error1 = classifyError(new Error('Error 1'), 'op1');
      const error2 = classifyError(new Error('Error 2'), 'op2');

      expect(error1.id).not.toBe(error2.id);
      expect(error1.id).toMatch(/^sync_error_\d+_[a-z0-9]+$/);
    });
  });

  describe('shouldRetryAutomatically', () => {
    it('should return true for retryable errors with automatic retry strategy', () => {
      const error = {
        retryable: true,
        recoveryStrategy: RecoveryStrategy.RETRY_AUTOMATIC,
        severity: SyncErrorSeverity.MEDIUM
      } as any;

      expect(shouldRetryAutomatically(error)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error = {
        retryable: false,
        recoveryStrategy: RecoveryStrategy.RETRY_AUTOMATIC,
        severity: SyncErrorSeverity.MEDIUM
      } as any;

      expect(shouldRetryAutomatically(error)).toBe(false);
    });

    it('should return false for critical errors', () => {
      const error = {
        retryable: true,
        recoveryStrategy: RecoveryStrategy.RETRY_AUTOMATIC,
        severity: SyncErrorSeverity.CRITICAL
      } as any;

      expect(shouldRetryAutomatically(error)).toBe(false);
    });

    it('should return false for manual retry strategy', () => {
      const error = {
        retryable: true,
        recoveryStrategy: RecoveryStrategy.RETRY_MANUAL,
        severity: SyncErrorSeverity.MEDIUM
      } as any;

      expect(shouldRetryAutomatically(error)).toBe(false);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user message with offline context', () => {
      const error = {
        userMessage: 'Connection issue detected',
        context: { online: false }
      } as any;

      const message = getUserFriendlyMessage(error);
      expect(message).toBe('Connection issue detected (You appear to be offline)');
    });

    it('should return user message without context when online', () => {
      const error = {
        userMessage: 'Sync completed successfully',
        context: { online: true }
      } as any;

      const message = getUserFriendlyMessage(error);
      expect(message).toBe('Sync completed successfully');
    });
  });

  describe('getActionableSteps', () => {
    it('should include offline-specific steps when offline', () => {
      const error = {
        actionableSteps: ['Try again', 'Contact support'],
        context: { online: false },
        type: SyncErrorType.NETWORK_ERROR
      } as any;

      const steps = getActionableSteps(error);
      expect(steps[0]).toBe('Check your internet connection');
      expect(steps).toContain('Try again');
      expect(steps).toContain('Contact support');
    });

    it('should include rate limit specific steps for rate limit errors', () => {
      const error = {
        actionableSteps: ['Wait and retry'],
        context: { online: true },
        type: SyncErrorType.RATE_LIMIT_ERROR
      } as any;

      const steps = getActionableSteps(error);
      expect(steps).toContain('Consider reducing sync frequency');
    });

    it('should return base steps for normal errors', () => {
      const error = {
        actionableSteps: ['Try again', 'Check settings'],
        context: { online: true },
        type: SyncErrorType.API_ERROR
      } as any;

      const steps = getActionableSteps(error);
      expect(steps).toEqual(['Try again', 'Check settings']);
    });
  });

  describe('ERROR_CLASSIFICATION_RULES', () => {
    it('should have rules for all major error types', () => {
      const ruleTypes = ERROR_CLASSIFICATION_RULES.map(rule => {
        // Test with sample errors to see what type they classify as
        const sampleErrors = [
          { code: 'NETWORK_ERROR' },
          { status: 401 },
          { status: 500 },
          { code: 'TIMEOUT' },
          { message: 'blockchain error' },
          { message: 'wallet error' },
          { code: 'VALIDATION_ERROR', message: 'Invalid data format' },
          { message: 'Cache storage failed' }
        ];

        return sampleErrors
          .filter(error => rule.condition(error))
          .map(error => rule.classify(error).type);
      }).flat();

      expect(ruleTypes).toContain(SyncErrorType.NETWORK_ERROR);
      expect(ruleTypes).toContain(SyncErrorType.AUTHENTICATION_ERROR);
      expect(ruleTypes).toContain(SyncErrorType.API_ERROR);
      expect(ruleTypes).toContain(SyncErrorType.TIMEOUT_ERROR);
      expect(ruleTypes).toContain(SyncErrorType.BLOCKCHAIN_ERROR);
      expect(ruleTypes).toContain(SyncErrorType.WALLET_ERROR);
      expect(ruleTypes).toContain(SyncErrorType.VALIDATION_ERROR);
      expect(ruleTypes).toContain(SyncErrorType.CACHE_ERROR);
    });

    it('should provide actionable steps for each rule', () => {
      ERROR_CLASSIFICATION_RULES.forEach(rule => {
        const sampleError = { message: 'test error' };
        if (rule.condition(sampleError)) {
          const classification = rule.classify(sampleError);
          expect(classification.actionableSteps).toBeDefined();
          expect(Array.isArray(classification.actionableSteps)).toBe(true);
          expect(classification.actionableSteps!.length).toBeGreaterThan(0);
        }
      });
    });

    it('should provide user messages for each rule', () => {
      ERROR_CLASSIFICATION_RULES.forEach(rule => {
        const sampleError = { message: 'test error' };
        if (rule.condition(sampleError)) {
          const classification = rule.classify(sampleError);
          expect(classification.userMessage).toBeDefined();
          expect(typeof classification.userMessage).toBe('string');
          expect(classification.userMessage!.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Offline Detection', () => {
    it('should classify errors as network errors when offline', () => {
      // Mock offline state
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true
      });

      const error = new Error('Some error');
      const classified = classifyError(error, 'syncTest');

      expect(classified.type).toBe(SyncErrorType.NETWORK_ERROR);
      expect(classified.context.online).toBe(false);

      // Restore online state
      Object.defineProperty(window.navigator, 'onLine', {
        value: true,
        writable: true
      });
    });
  });
});