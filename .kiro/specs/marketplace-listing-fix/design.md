# Design Document

## Overview

The marketplace listing display issue stems from inconsistent data formats between the API endpoints and frontend components. The current implementation has multiple data transformation layers that don't align properly, causing listings to not display correctly. This design addresses the data flow inconsistencies and ensures proper marketplace functionality.

## Architecture

### Current Issues Identified

1. **API Response Format Mismatch**: The `/api/marketplace/listings` endpoint returns data in a different format than what the frontend components expect
2. **Database Service Integration**: The marketplace service tries to use both localStorage and database service simultaneously, causing conflicts
3. **NFT Details Population**: NFT metadata is not being properly populated in the listing responses
4. **Error Handling**: Insufficient error handling when API calls fail or return unexpected data

### Proposed Solution Architecture

```
Frontend Component → useMarketplaceListings Hook → API Endpoint → Database Service → Database
                                                                      ↓
                                                              NFT Details Service
```

## Components and Interfaces

### API Response Standardization

**Current API Response Structure:**
```typescript
{
  success: boolean,
  listings: MarketplaceListing[],
  pagination: {
    currentPage: number,
    totalPages: number,
    totalCount: number,
    hasMore: boolean
  }
}
```

**Expected Frontend Structure:**
```typescript
{
  items: MarketplaceListing[],
  totalCount: number,
  hasMore: boolean,
  currentPage: number,
  totalPages: number
}
```

### Marketplace Listing Data Model

```typescript
interface MarketplaceListing {
  id: string
  sellerAddress: string
  momentId: number
  price: number
  status: 'active' | 'sold' | 'cancelled' | 'expired'
  createdAt: string | Date
  soldAt?: string | Date
  buyerAddress?: string
  nftDetails: {
    playerName: string
    team: string
    sport: 'NBA' | 'NFL'
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
    imageUrl: string
    metadata: Record<string, any>
  }
}
```

### Service Layer Improvements

1. **Marketplace Service Refactoring**
   - Remove localStorage dependency for server-side operations
   - Standardize database service integration
   - Implement proper error handling and logging

2. **NFT Details Integration**
   - Ensure NFT metadata is populated from the database
   - Add image URL resolution from NFT metadata
   - Handle missing or incomplete NFT data gracefully

## Data Models

### Database Schema Alignment

The marketplace listings should align with the existing database schema:

```sql
marketplace_listings:
- id (string, primary key)
- seller_address (string)
- moment_id (integer)
- price (decimal)
- status (string)
- created_at (timestamp)
- sold_at (timestamp, nullable)
- buyer_address (string, nullable)

nfts:
- moment_id (integer, primary key)
- player_name (string)
- team (string)
- sport (string)
- rarity (string)
- metadata (json)
```

### API Response Transformation

Transform database results to match frontend expectations:

```typescript
// Database result transformation
const transformListingResponse = (dbListings: any[], totalCount: number, page: number, limit: number) => {
  return {
    items: dbListings.map(transformListing),
    totalCount,
    hasMore: page * limit < totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit)
  }
}
```

## Error Handling

### API Error Responses

Standardize error responses across all marketplace endpoints:

```typescript
interface APIErrorResponse {
  success: false
  error: string
  details?: string[]
  timestamp: number
}
```

### Frontend Error States

1. **Loading States**: Show skeleton loaders while fetching data
2. **Empty States**: Display appropriate messages when no listings exist
3. **Error States**: Show user-friendly error messages with retry options
4. **Network Errors**: Handle offline scenarios and connection issues

## Testing Strategy

### Unit Tests
- API endpoint response format validation
- Data transformation function testing
- Error handling scenario coverage
- Database service integration tests

### Integration Tests
- End-to-end marketplace listing flow
- Filter and search functionality
- Pagination behavior
- Real-time data updates

### Component Tests
- Marketplace page rendering with various data states
- Loading state displays
- Error state handling
- User interaction flows

## Implementation Approach

### Phase 1: API Response Standardization
1. Fix `/api/marketplace/listings` response format
2. Update `/api/marketplace/stats` response handling
3. Standardize `/api/marketplace/user-listings` response

### Phase 2: Service Layer Cleanup
1. Remove localStorage dependencies from marketplace service
2. Implement proper database service integration
3. Add comprehensive error handling

### Phase 3: Frontend Integration
1. Update marketplace hooks to handle new response format
2. Improve error state handling in components
3. Add proper loading states and empty states

### Phase 4: NFT Details Enhancement
1. Ensure NFT metadata is properly populated
2. Add image URL resolution
3. Handle missing NFT data scenarios

## Performance Considerations

1. **Caching Strategy**: Implement proper caching for marketplace listings
2. **Pagination Optimization**: Ensure efficient database queries for large datasets
3. **Image Loading**: Optimize NFT image loading and display
4. **Real-time Updates**: Implement efficient polling or WebSocket updates for listing changes