'use client';

/**
 * Example component demonstrating sync error handling usage
 * This shows how to integrate the error handling system into React components
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSyncErrorHandling } from '@/hooks/use-sync-error-handling';
import { SyncErrorDisplay, SyncErrorSummary } from './sync-error-display';

export function SyncErrorExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [syncData, setSyncData] = useState<any>(null);

  const {
    errors,
    hasErrors,
    hasCriticalErrors,
    handleError,
    clearErrors,
    setFallbackData
  } = useSyncErrorHandling({
    maxRetries: 3,
    retryDelay: 1000,
    showToasts: true,
    autoRecovery: true,
    onError: (error) => {
      console.log('Sync error occurred:', error.type, error.message);
    },
    onRecovery: (error, result) => {
      console.log('Recovery attempted:', error.type, result.success);
      if (result.success && result.data) {
        setSyncData(result.data);
      }
    }
  });

  // Simulate different types of sync operations
  const simulateNetworkError = async () => {
    setIsLoading(true);
    try {
      // Set fallback data before attempting operation
      setFallbackData('syncNFTCollection', { address: '0x123' }, {
        nfts: ['cached-nft-1', 'cached-nft-2'],
        count: 2,
        message: 'Using cached NFT data'
      });

      // Simulate network error
      const networkError = new Error('Network connection failed');
      await handleError(networkError, 'syncNFTCollection');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAuthError = async () => {
    setIsLoading(true);
    try {
      const authError = { status: 401, message: 'Authentication expired' };
      await handleError(authError, 'syncWalletToProfile');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateTimeoutError = async () => {
    setIsLoading(true);
    try {
      const timeoutError = { code: 'TIMEOUT', message: 'Request timeout' };
      await handleError(timeoutError, 'syncProfileStats');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateValidationError = async () => {
    setIsLoading(true);
    try {
      const validationError = { 
        code: 'VALIDATION_ERROR', 
        message: 'Invalid data format' 
      };
      await handleError(validationError, 'syncProfileData');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sync Error Handling Demo</CardTitle>
          <CardDescription>
            Test different error scenarios and see how the error handling system responds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Status */}
          {hasErrors && (
            <Alert className={hasCriticalErrors ? 'border-red-500' : 'border-yellow-500'}>
              <AlertDescription>
                {hasCriticalErrors 
                  ? `${errors.length} error(s) detected, including critical issues`
                  : `${errors.length} error(s) detected`
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Sync Data Display */}
          {syncData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recovered Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(syncData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Test Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={simulateNetworkError} 
              disabled={isLoading}
              variant="outline"
            >
              Test Network Error
            </Button>
            <Button 
              onClick={simulateAuthError} 
              disabled={isLoading}
              variant="outline"
            >
              Test Auth Error
            </Button>
            <Button 
              onClick={simulateTimeoutError} 
              disabled={isLoading}
              variant="outline"
            >
              Test Timeout Error
            </Button>
            <Button 
              onClick={simulateValidationError} 
              disabled={isLoading}
              variant="outline"
            >
              Test Validation Error
            </Button>
          </div>

          <Button 
            onClick={clearErrors} 
            disabled={!hasErrors}
            variant="destructive"
            className="w-full"
          >
            Clear All Errors
          </Button>
        </CardContent>
      </Card>

      {/* Error Summary */}
      {hasErrors && (
        <SyncErrorSummary 
          errors={errors}
          onViewDetails={(error) => {
            console.log('View error details:', error);
          }}
        />
      )}

      {/* Individual Error Displays */}
      {errors.map(error => (
        <SyncErrorDisplay
          key={error.id}
          error={error}
          options={{
            showTechnicalDetails: true,
            showRetryButton: true,
            showContactSupport: true
          }}
          onRetry={() => {
            console.log('Retry requested for error:', error.id);
          }}
          onDismiss={() => {
            console.log('Dismiss requested for error:', error.id);
          }}
          onContactSupport={(errorDetails) => {
            console.log('Contact support with details:', errorDetails);
          }}
        />
      ))}
    </div>
  );
}