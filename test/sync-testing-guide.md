# Comprehensive Sync Testing Suite

This document describes the comprehensive testing suite for the wallet-profile synchronization system in ShotCaller.

## Overview

The sync testing suite provides complete coverage of all synchronization operations, error scenarios, and performance characteristics. It includes unit tests, integration tests, performance tests, and mock services for testing network failures and API errors.

## Test Structure

### 1. Unit Tests (`sync-manager-unit.test.ts`)

Tests core sync manager functionality:

- **Initialization and Configuration**
  - Default configuration setup
  - Custom configuration acceptance
  - Configuration updates at runtime

- **Core Sync Operations**
  - Wallet-to-profile synchronization
  - NFT collection synchronization
  - Profile stats synchronization
  - Force sync parameter handling

- **Event System**
  - Event subscription and unsubscription
  - Event emission during sync operations
  - Multiple subscribers handling
  - Error handling in event handlers

- **Wallet Event Handling**
  - Wallet connection events
  - Wallet disconnection events
  - NFT collection change events
  - Auto-sync triggering

- **Status and Monitoring**
  - Sync status tracking
  - In-progress state detection
  - Last sync time tracking

- **Periodic Sync Controls**
  - Starting and stopping periodic sync
  - Multiple timer prevention
  - Auto-sync configuration handling

- **Manual Sync Controls**
  - Manual sync with connected wallet
  - Error handling for disconnected wallet
  - Force sync parameter

- **Activity-Based Sync**
  - App focus event handling
  - App blur event handling
  - User activity tracking
  - Background sync behavior

### 2. Error Scenarios (`sync-error-scenarios.test.ts`)

Tests comprehensive error handling:

- **Network Error Scenarios**
  - Timeout errors
  - Connectivity loss
  - Offline operation queuing
  - Fallback data usage

- **API Error Scenarios**
  - Rate limiting
  - Server errors (5xx)
  - Authentication errors
  - Malformed responses

- **Validation Error Scenarios**
  - Invalid wallet addresses
  - Empty/null addresses
  - Invalid NFT collection data

- **Concurrent Operation Errors**
  - Multiple concurrent syncs
  - Sync during wallet disconnection

- **Cache Error Scenarios**
  - Cache corruption
  - Storage failures

- **Error Event Emission**
  - Error event emission on failures
  - Error context inclusion

- **Error Recovery**
  - Retry policy implementation
  - Non-retryable error handling
  - Error state clearing

### 3. Integration Flows (`sync-integration-flows.test.ts`)

Tests end-to-end synchronization scenarios:

- **Complete Wallet Connection Flow**
  - Full sync on wallet connection
  - Wallet switching
  - Wallet reconnection

- **NFT Collection Change Detection**
  - New NFT acquisitions
  - NFT sales/transfers
  - Eligibility changes

- **Multi-Wallet Type Support**
  - Dapper wallet sync
  - Flow wallet sync
  - Consistent behavior across wallet types

- **Real-time Profile Updates**
  - Profile component updates
  - Smooth data transitions

- **Periodic and Background Sync**
  - Periodic sync execution
  - App focus sync
  - Background sync with reduced frequency

- **Network Resilience Integration**
  - Network quality adaptation
  - Offline operation queuing
  - Connection restoration handling

### 4. Performance Tests (`sync-performance.test.ts`)

Tests performance under various conditions:

- **Basic Sync Operation Performance**
  - Wallet sync timing
  - NFT collection sync timing
  - Profile stats sync timing

- **Large Collection Performance**
  - Large NFT collections (1000+ NFTs)
  - Incremental sync performance

- **Concurrent Operations Performance**
  - Multiple concurrent syncs
  - High event load handling

- **Memory Performance**
  - Memory leak detection
  - Cache memory management

- **Event System Performance**
  - Event emission efficiency
  - Rapid event handling

- **Network Condition Performance**
  - Poor network conditions
  - Network quality optimization

- **Cache Performance**
  - Cache lookup speed
  - Sync necessity determination

### 5. Event Bus Tests (`sync-event-bus.test.ts`)

Tests event system functionality:

- **Event Subscription**
  - Basic subscription
  - Multiple subscribers
  - Listener count tracking

- **Event Emission**
  - Event emission to subscribers
  - Helper method usage
  - Multiple subscriber calling
  - Error handling in handlers

- **Event Unsubscription**
  - Proper unsubscription
  - Non-existent handler handling
  - Empty event type cleanup

- **Multiple Event Subscription**
  - Same handler for multiple events

- **Event History**
  - History maintenance
  - Type filtering
  - History limiting
  - History clearing

- **Active Event Types**
  - Active type tracking with counts

- **Wait for Event**
  - Event waiting functionality
  - Timeout handling

- **Debug Mode**
  - Debug logging
  - Debug mode toggling

- **Cleanup**
  - Resource cleanup

### 6. Network Resilience Tests (`network-resilience-manager.test.ts`)

Tests network monitoring and resilience:

- **Initialization**
  - Default configuration
  - Custom configuration
  - Event listener setup

- **Network Status Monitoring**
  - Status reporting
  - Online/offline detection
  - Connection quality assessment

- **Retry Logic**
  - Successful operations
  - Failed operation retries
  - Non-retryable errors
  - Maximum retry attempts
  - Exponential backoff

- **Offline Operations**
  - Operation queuing
  - Queue processing
  - Failed operation handling
  - Priority handling
  - Queue size limiting

- **Fallback Data Management**
  - Data storage and retrieval
  - Corrupted data handling
  - Storage error handling

- **Event Handling**
  - Event subscription
  - Status change events
  - Error handling in callbacks

- **Cleanup**
  - Resource cleanup
  - Multiple destroy handling

- **Persistence**
  - Queue persistence
  - Queue loading
  - Corrupted data handling

## Mock Services

### MockNFTOwnershipService

Configurable mock for testing various scenarios:

- **Configuration Options**
  - `shouldFail`: Force failures
  - `failureType`: Type of failure to simulate
  - `delay`: Network delay simulation
  - `failureRate`: Probability of failure (0-1)
  - `collectionSize`: Size of mock NFT collection
  - `retryCount`: Number of retries attempted

- **Methods**
  - `getOwnership()`: Mock NFT ownership retrieval
  - `getEligibleMoments()`: Mock eligible moments retrieval
  - `verifyOwnership()`: Mock ownership verification

### MockNetworkResilienceManager

Configurable mock for network conditions:

- **Configuration Options**
  - `isOnline`: Online/offline state
  - `connectionQuality`: Connection quality level
  - `retryPolicy`: Retry behavior configuration

- **Methods**
  - `executeWithRetry()`: Mock retry execution
  - `queueOfflineOperation()`: Mock operation queuing
  - `processOfflineQueue()`: Mock queue processing
  - `getFallbackData()`: Mock fallback data retrieval

### MockSyncEventBus

Mock event bus for testing:

- **Methods**
  - `subscribe()`: Mock event subscription
  - `emit()`: Mock event emission
  - `getEventHistory()`: Mock history retrieval

### Pre-configured Mock Services

- **Reliable**: Fast, reliable services for basic testing
- **Unreliable**: Services with network issues
- **Offline**: Completely offline services
- **Large Collection**: Services with large NFT collections
- **API Errors**: Services that simulate API errors

## Running Tests

### Basic Commands

```bash
# Run all sync tests
npm run test:sync

# Run with coverage analysis
npm run test:sync:coverage

# Run performance tests only
npm run test:sync:performance

# Run quick tests (unit + event bus)
npm run test:sync:quick

# Show help
npm run test:sync -- --help
```

### Individual Test Files

```bash
# Run specific test file
npx vitest run test/services/sync-manager-unit.test.ts

# Run with watch mode
npx vitest test/services/sync-error-scenarios.test.ts

# Run with UI
npx vitest --ui test/services/sync-performance.test.ts
```

## Performance Thresholds

The test suite includes performance thresholds to ensure sync operations complete within acceptable timeframes:

- **Sync Operation Max Time**: 5 seconds
- **Large Collection Sync Max Time**: 10 seconds
- **Concurrent Operations Max Time**: 15 seconds
- **Memory Leak Threshold**: 50 MB
- **Event Emission Max Time**: 100ms

## Coverage Requirements

The test suite aims for comprehensive coverage of:

- **All sync manager methods**: 100% method coverage
- **Error scenarios**: All error types and recovery paths
- **Event system**: All event types and handlers
- **Network conditions**: Online, offline, poor connection
- **Performance scenarios**: Various loads and collection sizes
- **Integration flows**: Complete wallet-to-profile sync flows

## Test Data Generation

The suite includes utilities for generating test data:

- **Wallet addresses**: Consistent test wallet generation
- **NFT collections**: Configurable collection sizes and types
- **Profile data**: Complete profile data structures

## Continuous Integration

The sync test suite is designed to run in CI/CD environments:

- **Fast execution**: Quick tests complete in under 2 minutes
- **Reliable mocking**: No external dependencies
- **Clear reporting**: Detailed success/failure reporting
- **Performance monitoring**: Performance regression detection

## Debugging Tests

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const eventBus = new SyncEventBus({ debugMode: true });
```

### Test Isolation

Each test is properly isolated:

- Fresh mock instances for each test
- Proper cleanup in `afterEach` hooks
- No shared state between tests

### Error Investigation

When tests fail:

1. Check the detailed error output
2. Review mock configurations
3. Verify test data setup
4. Check for timing issues in async operations

## Best Practices

### Writing New Tests

1. **Use descriptive test names**: Clearly describe what is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Mock external dependencies**: Use provided mock services
4. **Test edge cases**: Include boundary conditions and error scenarios
5. **Verify cleanup**: Ensure proper resource cleanup

### Mock Configuration

1. **Use realistic delays**: Simulate actual network conditions
2. **Configure appropriate failure rates**: Test resilience without excessive failures
3. **Match production data**: Use realistic NFT collection sizes
4. **Test error recovery**: Include retryable and non-retryable errors

### Performance Testing

1. **Set realistic thresholds**: Based on production requirements
2. **Test various loads**: Small, medium, and large collections
3. **Monitor memory usage**: Detect potential memory leaks
4. **Test concurrent operations**: Verify thread safety

## Troubleshooting

### Common Issues

1. **Timeout errors**: Increase test timeouts for slow operations
2. **Mock configuration**: Verify mock services are properly configured
3. **Async operations**: Ensure proper awaiting of async operations
4. **Event timing**: Account for event emission timing in tests

### Performance Issues

1. **Slow tests**: Review mock delays and test complexity
2. **Memory leaks**: Check for proper cleanup in tests
3. **Flaky tests**: Investigate timing-dependent operations

## Future Enhancements

Potential improvements to the test suite:

1. **Visual regression testing**: UI component sync state testing
2. **Load testing**: Higher concurrent operation testing
3. **Browser compatibility**: Cross-browser sync testing
4. **Real network testing**: Optional real API integration tests
5. **Chaos engineering**: Random failure injection testing