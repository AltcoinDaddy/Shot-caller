# ShotCaller Testing Suite

This directory contains a comprehensive testing suite for the ShotCaller fantasy sports application.

## Test Structure

### Unit Tests (`test/components/`)
- **Navigation Tests**: Tests for main navigation component
- **Wallet Connector Tests**: Tests for wallet connection functionality
- **Booster Inventory Tests**: Tests for booster management components
- **Marketplace Listing Card Tests**: Tests for NFT marketplace components
- **Payment Error Handler Tests**: Tests for payment error handling
- **Scoring Breakdown Tests**: Tests for fantasy scoring display
- **Create Listing Dialog Tests**: Tests for NFT listing creation

### Integration Tests (`test/integration/api/`)
- **Auth API Tests**: Tests for authentication endpoints
- **Marketplace API Tests**: Tests for marketplace API endpoints
- **Treasury API Tests**: Tests for treasury and payment endpoints

### End-to-End Tests (`test/e2e/`)
- **Wallet Connection Flow**: Complete wallet connection user journey
- **Marketplace Flow**: Complete marketplace interaction flow
- **Complete Game Flow**: Full game participation workflow

### Smart Contract Tests (`test/contracts/`)
- **ShotCaller Contract Tests**: Comprehensive Cadence contract tests

## Running Tests

```bash
# Run all unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run end-to-end tests
pnpm test:e2e

# Run smart contract tests
pnpm test:contracts

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

## Test Coverage

The testing suite covers:

### Frontend Components (Unit Tests)
- ✅ Navigation and routing
- ✅ Wallet connection and authentication
- ✅ NFT marketplace interactions
- ✅ Booster inventory management
- ✅ Payment error handling
- ✅ Fantasy scoring displays
- ✅ Form validation and submission

### API Endpoints (Integration Tests)
- ✅ Authentication and authorization
- ✅ NFT marketplace operations
- ✅ Treasury and payment processing
- ✅ Tournament entry and management
- ✅ Reward distribution
- ✅ Booster purchases

### User Workflows (E2E Tests)
- ✅ Complete wallet connection flow
- ✅ NFT marketplace buying/selling
- ✅ Tournament participation
- ✅ Team building and lineup submission
- ✅ Premium feature access
- ✅ Error handling scenarios

### Smart Contracts (Contract Tests)
- ✅ Tournament creation and management
- ✅ Fee routing (70% reward pool, 30% treasury)
- ✅ Lineup submission and validation
- ✅ Reward distribution structure
- ✅ Marketplace NFT trading
- ✅ Booster purchase and activation
- ✅ Premium access management

## Test Configuration

### Vitest Configuration
- **Environment**: jsdom for component tests, node for integration tests
- **Setup Files**: Comprehensive mocking of external dependencies
- **Coverage**: V8 coverage provider
- **Timeout**: 30 seconds for integration tests

### Playwright Configuration
- **Browsers**: Chrome, Firefox, Safari (desktop and mobile)
- **Base URL**: http://localhost:3000
- **Retries**: 2 retries in CI environment
- **Trace**: On first retry for debugging

### Mock Setup
- **Flow FCL**: Mocked for blockchain interactions
- **Supabase**: Mocked for database operations
- **Next.js**: Router and Image components mocked
- **External APIs**: NBA/NFL stats APIs mocked

## Key Testing Patterns

### Component Testing
- Mock external dependencies (hooks, contexts, APIs)
- Test user interactions with fireEvent and userEvent
- Verify component rendering and state changes
- Test error states and loading states

### API Testing
- Mock HTTP handlers with proper request/response cycles
- Test success and error scenarios
- Validate request parameters and response formats
- Test authentication and authorization

### E2E Testing
- Mock blockchain and wallet interactions
- Test complete user workflows
- Verify cross-page navigation
- Test error recovery and retry mechanisms

### Contract Testing
- Test all contract functions and state changes
- Verify fee routing and reward distribution
- Test access control and permissions
- Validate transaction success and failure scenarios

## Notes

- Some tests may require additional component implementations to pass
- Integration tests use mocked API handlers for isolated testing
- E2E tests include comprehensive error scenario coverage
- Smart contract tests follow Flow testing best practices
- All tests include proper cleanup and teardown procedures