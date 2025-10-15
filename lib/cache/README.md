# Caching and Performance Optimization

This directory contains the caching infrastructure and performance optimization tools for ShotCaller.

## Overview

The caching system is built on Redis and provides:
- Multi-layer caching for API responses, NFT data, and marketplace listings
- Efficient database query optimization with proper indexing
- Image optimization and lazy loading for NFT displays
- Background job processing for stats updates, scoring, and reward distribution
- Performance monitoring and metrics collection

## Components

### Redis Client (`redis-client.ts`)
- Singleton Redis client with connection management
- Automatic reconnection and error handling
- Support for TTL, prefixes, and batch operations
- Health monitoring

### Cache Service (`cache-service.ts`)
- High-level caching interface for different data types
- Specific methods for NFTs, marketplace, leaderboard, users, etc.
- Cache invalidation strategies
- Warmup and cleanup utilities

### Optimized Queries (`../database/optimized-queries.ts`)
- Database queries that utilize proper indexing
- Integrated caching for frequently accessed data
- Batch operations for efficiency
- Cache invalidation on data updates

### Performance Monitoring (`../monitoring/performance-monitor.ts`)
- API response time tracking
- Cache hit/miss rate monitoring
- Database query performance metrics
- Health status reporting

## Setup

### Prerequisites
- Redis server running locally or remotely
- Environment variables configured

### Environment Variables
```bash
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_if_needed
```

### Installation
```bash
# Install dependencies
pnpm install

# Start Redis (if running locally)
redis-server

# Warmup cache
pnpm cache:warmup
```

## Usage

### Basic Caching
```typescript
import { cacheService } from '@/lib/cache/cache-service';

// Get cached data
const nft = await cacheService.getNFT('12345');

// Set cache with TTL
await cacheService.setNFT('12345', nftData);

// Invalidate cache
await cacheService.invalidateUserNFTs(walletAddress);
```

### Database Queries with Caching
```typescript
import { optimizedQueries } from '@/lib/database/optimized-queries';

// Automatically cached query
const listings = await optimizedQueries.getMarketplaceListings({
  sport: 'NBA',
  rarity: 'Legendary'
});

// Cache is automatically invalidated on updates
```

### Performance Monitoring
```typescript
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor';

// Record custom metrics
PerformanceMonitor.recordMetric('nft_load_time', 150);

// Get performance summary
const summary = PerformanceMonitor.getPerformanceSummary();

// Check health status
const health = PerformanceMonitor.getHealthStatus();
```

## Background Jobs

### Job Types
- **Stats Update**: Daily sync of NBA/NFL player statistics
- **Scoring Calculation**: Weekly fantasy point calculations
- **Reward Distribution**: Automated prize distribution
- **Cache Warmup**: Preload frequently accessed data
- **Database Cleanup**: Remove old data

### Starting Workers
```bash
# Start all job workers
pnpm jobs:start

# Schedule recurring jobs
pnpm jobs:schedule
```

### Job Management API
```bash
# Get job statistics
GET /api/admin/jobs?action=stats

# Schedule manual job
POST /api/admin/jobs
{
  "action": "schedule_stats_update",
  "data": { "sport": "NBA", "date": "2024-01-15" }
}

# Retry failed jobs
POST /api/admin/jobs
{
  "action": "retry_failed",
  "queue": "stats"
}
```

## Image Optimization

### Optimized NFT Images
```typescript
import { OptimizedNFTImage, NFT_IMAGE_SIZES } from '@/components/optimized-nft-image';

<OptimizedNFTImage
  src={nft.imageUrl}
  alt={nft.playerName}
  sizes={NFT_IMAGE_SIZES.card}
  quality={85}
  priority={false}
/>
```

### Features
- Lazy loading with Intersection Observer
- Responsive image sizes
- WebP format support
- Blur placeholder while loading
- Error handling with fallbacks

## Cache Strategies

### TTL Values
- **SHORT** (5 minutes): Real-time data like marketplace listings
- **MEDIUM** (30 minutes): User data and contest information
- **LONG** (1 hour): NFT metadata and player stats
- **VERY_LONG** (24 hours): Historical data

### Cache Prefixes
- `nft:*` - NFT metadata and ownership
- `marketplace:*` - Marketplace listings and transactions
- `player_stats:*` - Player performance data
- `leaderboard:*` - Rankings and standings
- `user:*` - User profiles and data
- `contest:*` - Contest information
- `treasury:*` - Treasury and financial data

### Invalidation Strategies
- **Time-based**: Automatic expiration with TTL
- **Event-based**: Invalidate on data updates
- **Pattern-based**: Bulk invalidation using wildcards
- **Manual**: Admin-triggered cache clearing

## Performance Optimization

### Database Indexing
- Composite indexes for common query patterns
- Covering indexes to avoid table lookups
- Partial indexes for filtered queries
- Concurrent index creation to avoid downtime

### Query Optimization
- Use of database views for complex queries
- Batch operations to reduce round trips
- Connection pooling for efficiency
- Query result caching

### API Optimization
- Response compression with gzip
- Conditional requests with ETags
- Rate limiting to prevent abuse
- Background processing for heavy operations

## Monitoring and Alerts

### Metrics Tracked
- API response times (avg, p95, p99)
- Cache hit/miss rates by prefix
- Database query performance
- Job processing times and failures
- Memory and CPU usage

### Health Checks
- Redis connectivity
- Database responsiveness
- Cache hit rates
- Error rates
- Job queue status

### Admin Dashboard
Access performance metrics at:
- `/api/admin/performance` - Performance summary
- `/api/admin/jobs` - Job queue status
- Health status included in API responses

## Troubleshooting

### Common Issues

#### Redis Connection Errors
```bash
# Check Redis status
redis-cli ping

# Restart Redis
sudo systemctl restart redis

# Check logs
tail -f /var/log/redis/redis-server.log
```

#### Low Cache Hit Rates
- Check TTL values are appropriate
- Verify cache keys are consistent
- Monitor cache eviction policies
- Consider increasing Redis memory

#### Slow Database Queries
- Check index usage with EXPLAIN
- Monitor connection pool status
- Review query patterns
- Consider query optimization

#### Job Processing Failures
- Check Redis connectivity
- Review job error logs
- Verify external API availability
- Monitor memory usage

### Performance Tuning

#### Redis Configuration
```conf
# /etc/redis/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### Database Tuning
```sql
-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'your_table';
```

## Development

### Testing Cache
```typescript
// Test cache functionality
import { cacheService } from '@/lib/cache/cache-service';

// Clear cache for testing
await cacheService.clearAllCache();

// Test cache operations
const testData = { id: '123', name: 'Test' };
await cacheService.set('test:123', testData);
const cached = await cacheService.get('test:123');
```

### Local Development
```bash
# Start Redis locally
docker run -d -p 6379:6379 redis:alpine

# Or use Redis CLI
redis-server --daemonize yes

# Monitor Redis
redis-cli monitor
```

## Production Deployment

### Redis Setup
- Use Redis Cluster for high availability
- Configure persistence (RDB + AOF)
- Set up monitoring and alerting
- Implement backup strategies

### Scaling Considerations
- Horizontal scaling with Redis Cluster
- Read replicas for read-heavy workloads
- Connection pooling and load balancing
- Memory optimization and monitoring

### Security
- Enable Redis AUTH
- Use TLS for connections
- Network isolation and firewalls
- Regular security updates