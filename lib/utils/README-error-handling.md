# Comprehensive Sync Error Handling System

This document describes the comprehensive error handling and recovery system implemented for wallet-profile synchronization in ShotCaller.

## Overview

The error handling system provides:
- **Automatic error classification** based on error type and context
- **Intelligent recovery strategies** with fallback mechanisms
- **User-friendly error messaging** with actionable troubleshooting steps
- **Graceful degradation** for network issues with cached data fallbacks
- **React integration** with hooks and components for seamless UI integration

## Architecture

### Core Components

1. **Error Classification System** (`sync-error-classification.ts`)
   - Classifies errors into specific types with appropriate severity levels
   - Determines recovery strategies based on error characteristics
   - Provides user-friendly messages and actionable steps

2. **Error Recovery Manager** (`sync-error-recovery-manager.ts`)
   - Implements recovery strategies (retry, cache fallback, partial data)
   - Manages retry attempts with exponential backoff
   - Handles offline operation queuing and cache management

3. **Error Handling Utilities** (`sync-error-handling.ts`)
   - Provides troubleshooting guides for different error types
   - Formats errors for support tickets and user display
   - Creates error notifications with appropriate actions

4. **React Integration** (`use-sync-error-handling.ts`, `sync-error-display.tsx`)
   - React hook for managing error state and recovery
   - UI components for displaying errors and troubleshooting guides
   - Toast notifications and error indicators

## Error Types and Classification

### Supported Error Types

- **Network Errors**: Connection issues, offline state
- **Authentication Errors**: Expired tokens, unauthorized access
- **API Errors**: Server errors, rate limiting, service unavailable
- **Blockchain Errors**: Flow network issues, RPC failures
- **Wallet Errors**: Wallet connection problems, extension issues
- **Validation Errors**: Invalid data formats, schema violations
- **Cache Errors**: Storage issues, corruption
- **Timeout Errors**: Request timeouts, slow connections

### Error Severity Levels

- **Low**: Minor issues that don't significantly impact functionality
- **Medium**: Issues that may limit some features but allow continued use
- **High**: Significant issues that impact core functionality
- **Critical**: Severe issues that prevent normal operation

### Recovery Strategies

- **Automatic Retry**: Retry with exponential backoff for transient issues
- **Manual Retry**: Require user action to retry the operation
- **Cache Fallback**: Use cached data when fresh data is unavailable
- **Partial Fallback**: Provide limited functionality with partial data
- **Require Reconnection**: Need wallet reconnection to continue
- **Require User Action**: Need specific user intervention
- **No Recovery**: Error cannot be automatically resolved

## Usage Examples

### Basic Error Handling with React Hook

```typescript
import { useSyncErrorHandling } from '@/hooks/use-sync-error-handling';

function MyComponent() {
  const {
    errors,
    hasErrors,
    handleError,
    clearErrors,
    setFallbackData
  } = useSyncErrorHandling({
    maxRetries: 3,
    retryDelay: 1000,
    showToasts: true,
    autoRecovery: true
  });

  const performSyncOperation = async () => {
    try {
      // Set fallback data before operation
      setFallbackData('syncNFTCollection', { address: userAddress }, cachedNFTs);
      
      // Perform sync operation
      const result = await syncNFTCollection(userAddress);
      return result;
    } catch (error) {
      // Handle error with automatic recovery
      const recoveryResult = await handleError(error, 'syncNFTCollection');
      
      if (recoveryResult.success && recoveryResult.data) {
        return recoveryResult.data; // Use recovered data
      }
      
      throw error; // Re-throw if recovery failed
    }
  };

  return (
    <div>
      {hasErrors && (
        <SyncErrorSummary 
          errors={errors}
          onViewDetails={(error) => showErrorDetails(error)}
        />
      )}
      
      <Button onClick={performSyncOperation}>
        Sync Data
      </Button>
    </div>
  );
}
```

### Manual Error Classification and Recovery

```typescript
import { classifyError } from '@/lib/utils/sync-error-classification';
import { syncErrorRecoveryManager } from '@/lib/services/sync-error-recovery-manager';

async function handleSyncError(error: any, operation: string) {
  // Classify the error
  const classifiedError = classifyError(error, operation);
  
  console.log('Error type:', classifiedError.type);
  console.log('Severity:', classifiedError.severity);
  console.log('Recovery strategy:', classifiedError.recoveryStrategy);
  
  // Attempt recovery
  const recoveryResult = await syncErrorRecoveryManager.recoverFromError(
    error,
    operation,
    { maxRetries: 3, retryDelay: 1000 }
  );
  
  if (recoveryResult.success) {
    console.log('Recovery successful:', recoveryResult.message);
    return recoveryResult.data;
  } else {
    console.error('Recovery failed:', recoveryResult.message);
    throw new Error(recoveryResult.message);
  }
}
```

### Displaying Error Information to Users

```typescript
import { SyncErrorDisplay } from '@/components/sync-error-display';
import { createErrorNotification } from '@/lib/utils/sync-error-handling';

function ErrorDisplayExample({ error }: { error: SyncError }) {
  const notification = createErrorNotification(error, {
    showRetryButton: true,
    showContactSupport: true,
    showTechnicalDetails: false
  });

  return (
    <SyncErrorDisplay
      error={error}
      options={{
        showRetryButton: error.retryable,
        showContactSupport: error.severity === 'high' || error.severity === 'critical'
      }}
      onRetry={() => retryOperation(error.operation)}
      onDismiss={() => dismissError(error.id)}
      onContactSupport={(details) => openSupportTicket(details)}
    />
  );
}
```

## Configuration

### Error Handling Options

```typescript
interface SyncErrorHandlingOptions {
  maxRetries?: number;        // Maximum retry attempts (default: 3)
  retryDelay?: number;        // Base retry delay in ms (default: 1000)
  showToasts?: boolean;       // Show toast notifications (default: true)
  autoRecovery?: boolean;     // Enable automatic recovery (default: true)
  onError?: (error: SyncError) => void;           // Error callback
  onRecovery?: (error: SyncError, result: RecoveryResult) => void; // Recovery callback
}
```

### Cache Configuration

```typescript
// Set fallback data for operations
syncErrorRecoveryManager.setCachedData(
  'syncNFTCollection',
  { address: '0x123' },
  { nfts: [], count: 0, message: 'No NFTs available' }
);

// Get cached data
const cached = syncErrorRecoveryManager.getCachedData(
  'syncNFTCollection',
  { address: '0x123' }
);

// Clear cache
syncErrorRecoveryManager.clearCache('syncNFTCollection'); // Specific operation
syncErrorRecoveryManager.clearCache(); // All cache
```

## Troubleshooting Guides

The system includes comprehensive troubleshooting guides for each error type:

### Network Errors
1. Check Internet Connection
2. Disable VPN or Proxy
3. Clear Browser Cache
4. Try Different Network

### Authentication Errors
1. Reconnect Wallet
2. Check Wallet Extension
3. Update Wallet Extension
4. Clear Wallet Cache

### API Errors
1. Wait and Retry
2. Check Service Status
3. Use Cached Data
4. Contact Support

### Blockchain Errors
1. Check Flow Network Status
2. Wait for Network Recovery
3. Use Cached NFT Data
4. Try Different RPC Endpoint

## Monitoring and Logging

### Error Logging

All errors are automatically logged with structured data:

```typescript
{
  errorId: "sync_error_1234567890_abc123",
  type: "network_error",
  severity: "medium",
  operation: "syncNFTCollection",
  timestamp: "2024-01-01T12:00:00Z",
  retryable: true,
  strategy: "fallback_cache",
  context: {
    userAgent: "...",
    url: "...",
    online: false
  }
}
```

### Performance Metrics

The system tracks:
- Error frequency by type and operation
- Recovery success rates
- Average recovery time
- Cache hit rates
- User interaction with error UI

## Best Practices

### For Developers

1. **Always set fallback data** before performing operations that might fail
2. **Use appropriate error types** when throwing custom errors
3. **Test error scenarios** in development and staging environments
4. **Monitor error rates** and recovery success in production
5. **Provide clear user feedback** during error states

### For Error Messages

1. **Be specific** about what went wrong
2. **Provide actionable steps** users can take
3. **Avoid technical jargon** in user-facing messages
4. **Include context** about what the user was trying to do
5. **Offer alternatives** when possible

### for Recovery Strategies

1. **Prefer automatic recovery** for transient issues
2. **Use cache fallback** for network-related problems
3. **Require user action** only when necessary
4. **Implement exponential backoff** for retries
5. **Limit retry attempts** to prevent infinite loops

## Testing

The error handling system includes comprehensive tests:

- **Unit tests** for error classification and recovery logic
- **Integration tests** for end-to-end error handling flows
- **UI tests** for error display components
- **Performance tests** for error handling under load

Run tests with:
```bash
npm test -- --run lib/services/__tests__/sync-error-recovery-manager.test.ts
npm test -- --run lib/utils/__tests__/sync-error-classification.test.ts
```

## Future Enhancements

Planned improvements include:
- **Machine learning** for predictive error prevention
- **Advanced analytics** for error pattern detection
- **A/B testing** for error message effectiveness
- **Integration** with external monitoring services
- **Automated** error resolution for common issues