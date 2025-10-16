# Error Handling and Offline Mode System

This directory contains comprehensive error handling, retry mechanisms, and offline mode support for the ShotCaller application.

## Overview

The error handling system provides:
- **Graceful error handling** with user-friendly messages
- **Automatic retry mechanisms** with exponential backoff
- **Offline mode support** with data synchronization
- **Fallback mechanisms** for API outages
- **Circuit breaker pattern** for external services
- **Payment error handling** for FLOW token transactions

## Components

### 1. Error Handling (`error-handling.ts`)

Core error handling utilities with classification, retry logic, and user feedback.

#### Key Features:
- **Error Classification**: Automatically categorizes errors by type and severity
- **Retry Logic**: Configurable retry mechanisms with exponential backoff
- **Circuit Breaker**: Prevents cascading failures from external services
- **User-Friendly Messages**: Converts technical errors to user-understandable messages

#### Usage:
```typescript
import { handleError, ErrorType } from '@/lib/utils/error-handling'

// Basic error handling with retry
const result = await handleError(
  () => apiCall(),
  {
    errorType: ErrorType.API_REQUEST,
    showToast: true,
    fallbackFn: () => getCachedData()
  }
)

// Wrap functions with error handling
const safeApiCall = withErrorHandling(
  apiCall,
  ErrorType.API_REQUEST,
  { fallbackFn: getCachedData }
)
```

#### Error Types:
- `WALLET_CONNECTION`: Wallet authentication failures
- `BLOCKCHAIN_TRANSACTION`: Flow blockchain transaction errors
- `API_REQUEST`: HTTP API request failures
- `DATABASE`: Database operation errors
- `NETWORK`: Network connectivity issues
- `VALIDATION`: Input validation errors
- `AUTHENTICATION`: User authentication errors
- `PAYMENT`: FLOW token payment failures
- `NFT_VERIFICATION`: NFT ownership verification errors

### 2. Offline Mode (`offline-mode.ts`)

Comprehensive offline support with action queuing and data synchronization.

#### Key Features:
- **Network Status Detection**: Monitors online/offline state
- **Action Queuing**: Queues user actions when offline
- **Automatic Sync**: Syncs queued actions when back online
- **Data Caching**: Caches API responses for offline access
- **Background Sync**: Periodic sync attempts

#### Usage:
```typescript
import { useOfflineMode } from '@/lib/utils/offline-mode'

function MyComponent() {
  const { 
    isOnline, 
    pendingActions, 
    queueAction, 
    syncPendingActions 
  } = useOfflineMode()

  const handleSubmit = async (data) => {
    if (!isOnline) {
      queueAction('lineup_submit', data)
      return
    }
    
    // Normal online processing
    await submitLineup(data)
  }
}
```

#### Supported Offline Actions:
- `lineup_submit`: Lineup submissions
- `tournament_entry`: Tournament entry payments
- `marketplace_listing`: NFT marketplace listings
- `booster_purchase`: Booster purchases
- `premium_purchase`: Premium access purchases

### 3. API Client (`api-client.ts`)

Enhanced API client with built-in error handling, caching, and offline support.

#### Key Features:
- **Automatic Retry**: Built-in retry logic for failed requests
- **Response Caching**: Caches GET responses for offline access
- **Offline Queuing**: Queues mutations when offline
- **Circuit Breaker**: Per-endpoint circuit breakers
- **Fallback Data**: Returns cached or mock data on failures

#### Usage:
```typescript
import { api } from '@/lib/utils/api-client'

// API calls with built-in error handling
const nfts = await api.nfts.getOwned(walletAddress)
const contests = await api.contests.getAvailable()

// Batch requests with error handling
const results = await batchApiRequests({
  nfts: api.nfts.getOwned(walletAddress),
  contests: api.contests.getAvailable(),
  leaderboard: api.leaderboard.getWeekly()
})
```

### 4. Fallback Service (`fallback-service.ts`)

Provides fallback data when APIs are unavailable.

#### Key Features:
- **Cache-First**: Uses cached data when available
- **Mock Data**: Provides realistic mock data as fallback
- **Configurable**: Adjustable cache expiration and fallback behavior
- **Preloading**: Can preload fallback data for better offline experience

#### Usage:
```typescript
import { fallbackService } from '@/lib/services/fallback-service'

// Get fallback data
const nfts = await fallbackService.getNFTsFallback(walletAddress)
const contests = await fallbackService.getContestsFallback()

// Preload fallback data
await fallbackService.preloadFallbackData()
```

## React Components

### 1. Error Boundary (`components/error-boundary.tsx`)

React error boundaries for catching and handling component errors.

#### Features:
- **Automatic Error Catching**: Catches React component errors
- **User-Friendly UI**: Shows helpful error messages
- **Retry Functionality**: Allows users to retry failed operations
- **Development Details**: Shows detailed error info in development
- **Bug Reporting**: Helps users report bugs

#### Usage:
```typescript
import { ErrorBoundary, withErrorBoundary } from '@/components/error-boundary'

// Wrap components
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// Or use HOC
const SafeComponent = withErrorBoundary(MyComponent)
```

### 2. Network Status (`components/network-status.tsx`)

Network status indicator and offline mode UI.

#### Features:
- **Status Indicator**: Shows online/offline status
- **Pending Actions**: Displays queued actions count
- **Manual Sync**: Allows manual synchronization
- **Cache Statistics**: Shows offline cache status
- **Network Banner**: Global offline mode notification

#### Usage:
```typescript
import { NetworkStatus, NetworkStatusBanner } from '@/components/network-status'

// Compact status indicator
<NetworkStatus />

// Detailed status card
<NetworkStatus showDetails />

// Global banner (in layout)
<NetworkStatusBanner />
```

### 3. Payment Error Handler (`components/payment-error-handler.tsx`)

Specialized error handling for FLOW token payments.

#### Features:
- **Payment-Specific Errors**: Handles FLOW transaction errors
- **Balance Information**: Shows current vs required FLOW amounts
- **Troubleshooting Tips**: Provides helpful guidance
- **Retry Logic**: Smart retry for recoverable errors
- **Get FLOW Integration**: Links to FLOW token acquisition

#### Usage:
```typescript
import { usePaymentErrorHandler } from '@/components/payment-error-handler'

function PaymentComponent() {
  const { handlePaymentError, PaymentErrorDialog } = usePaymentErrorHandler()

  const handlePayment = async () => {
    try {
      await processPayment()
    } catch (error) {
      handlePaymentError(error)
    }
  }

  return (
    <>
      <button onClick={handlePayment}>Pay with FLOW</button>
      <PaymentErrorDialog onRetry={handlePayment} />
    </>
  )
}
```

## Configuration

### Retry Configuration

Each error type has default retry configuration:

```typescript
const DEFAULT_RETRY_CONFIGS = {
  WALLET_CONNECTION: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2
  },
  API_REQUEST: {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 3000,
    backoffMultiplier: 2
  }
  // ... other configurations
}
```

### Circuit Breaker Configuration

Circuit breakers can be configured per endpoint:

```typescript
const circuitBreaker = new CircuitBreaker(
  5,      // failure threshold
  60000,  // timeout (1 minute)
  30000   // reset timeout (30 seconds)
)
```

## Best Practices

### 1. Error Handling
- Always use `handleError` for async operations
- Provide meaningful fallback functions
- Use appropriate error types for classification
- Show user-friendly error messages

### 2. Offline Support
- Queue important user actions when offline
- Cache frequently accessed data
- Provide offline indicators to users
- Sync automatically when back online

### 3. API Calls
- Use the enhanced API client for all requests
- Implement proper caching strategies
- Provide fallback data for critical features
- Handle rate limiting gracefully

### 4. Payment Handling
- Use specialized payment error handling
- Provide clear balance information
- Offer retry options for recoverable errors
- Guide users to acquire FLOW tokens when needed

## Testing

The error handling system includes comprehensive tests:

```bash
# Run error handling tests
npm test lib/utils/__tests__/error-handling.test.ts

# Run all utility tests
npm test lib/utils/
```

## Integration

The error handling system is integrated throughout the application:

1. **Layout**: Error boundaries and network status banner
2. **Auth Context**: Enhanced wallet connection error handling
3. **API Endpoints**: Server-side error handling with fallbacks
4. **Components**: Client-side error handling and retry logic
5. **Hooks**: Error-aware data fetching and state management

## Monitoring

Error information is logged for monitoring:

```typescript
console.error('Error Report:', {
  type: errorInfo.type,
  severity: errorInfo.severity,
  message: errorInfo.message,
  code: errorInfo.code,
  timestamp: errorInfo.timestamp,
  userAgent: navigator.userAgent,
  url: window.location.href
})
```

This enables tracking of error patterns and system reliability metrics.