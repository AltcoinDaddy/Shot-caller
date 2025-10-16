# ShotCaller Caching and Performance Optimization

This directory contains the comprehensive caching and performance optimization system for the ShotCaller fantasy sports application.

## Overview

The caching system is built on Redis and provides multi-layer caching for:
- API responses
- NFT data and ownership verification
- Marketplace listings
- Player statistics
- Leaderboards
- User data
- Sports data from external APIs
- Flow blockchain data

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│  Cache Service  │───▶│  Redis Client   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Background Jobs │
                       │   - Stats Sync  │
                       │   - Cache Warm  │
                       │   - Cleanup     │
                       └─────────────────┘
```

## Components

### 1. Redis Client (`redis-client.ts`)
- Connection management with automatic reconnection
- Error handling and graceful degradation
- Support for multiple data types and TTL
- Batch operations for efficiency
- Pattern-based cache invalidation

### 2. Cache Service (`cache-service.ts`)
- High-level caching interface
- Type-safe cache operations
- Automatic serialization/deserialization
- Cache key management with prefixes
- Specialized methods for different data types

### 3. API Cache Middleware (`api-cache-middleware.ts`)
- Automatic API response caching
- Configurable TTL and cache keys
- Support for cache invalidation
- Request-specific cache variations
- Cache warming utilities

### 4. Image Optimization Service (`../services/image-optimization-service.ts`)
- CDN integration (Cloudinary, Imgix)
- Responsive image generation
- Format optimization (WebP, AVIF)
- Lazy loading support
- Performance monitoring

### 5. Job Monitoring (`../monitoring/job-monitor.ts`)
- Real-time job queue monitoring
- Performance analytics
- Health checks and alerting
- Automatic cleanup and maintenance

## Cache Prefixes and TTL

| Prefix | Data Type | TTL | Description |
|--------|-----------|-----|-------------|
| `nft` | NFT Moments | 30 min | NFT metadata and ownership |
| `marketplace` | Listings | 5 min | Marketplace listings and stats |
| `player_stats` | Statistics | 24 hours | Player performance data |
| `leaderboard` | Rankings | 10 min | Competition rankings |
| `user` | User Data | 30 min | User profiles and stats |
| `contest` | Contests | 10 min | Contest information |
| `treasury` | Treasury | 5 min | Treasury status and transactions |
| `api_response` | API Data | 5 min | Generic API response cache |
| `sports_data` | Sports APIs | 24 hours | External sports data |
| `blockchain` | Flow Data | 30 min | Blockchain query results |

## Usage Examples

### Basic Caching
```typescript
import { cacheService } from '@/lib/cache/cache-service';

// Cache user NFTs
await cacheService.setUserNFTs(walletAddress, nfts);
const cachedNFTs = await cacheService.getUserNFTs(walletAddress);

// Cache API responses
await cacheService.setAPIResponse('leaderboard', data, { week: 1 });
const cached = await cacheService.getAPIResponse('leaderboard', { week: 1 });
```

### API Middleware
```typescript
import { withCache, CACHE_CONFIGS } from '@/lib/cache/api-cache-middleware';

export const GET = withCache(CACHE_CONFIGS.leaderboard)(
  async (req: NextRequest) => {
    // Your API logic here
    return NextResponse.json(data);
  }
);
```

### Image Optimization
```typescript
import { ImageOptimizationService, IMAGE_PRESETS } from '@/lib/services/image-optimization-service';

// Generate optimized image URL
const optimizedUrl = ImageOptimizationService.generateOptimizedUrl(
  originalUrl,
  IMAGE_PRESETS.nftCard
);

// Preload critical images
await ImageOptimizationService.preloadImages([url1, url2, url3]);
```

## Performance Monitoring

### Job Queue Metrics
```typescript
import { EnhancedJobMonitor } from '@/lib/monitoring/job-monitor';

// Get job metrics
const metrics = await EnhancedJobMonitor.getJobMetrics();

// Check system health
const health = await EnhancedJobMonitor.checkJobHealth();

// Get performance analytics
const analytics = await EnhancedJobMonitor.getPerformanceAnalytics('stats', 24);
```

### Cache Performance
```typescript
// Test cache performance
const writeStart = performance.now();
await cacheService.set('test', data);
const writeTime = performance.now() - writeStart;

// Monitor cache hit rates
const hitRate = await cacheService.getHitRate();
```

## Scripts and Commands

### Development
```bash
# Start Redis (Docker)
docker run -d -p 6379:6379 --name redis redis:alpine

# Test Redis connection
pnpm test:redis

# Warm up cache
pnpm cache:warmup

# Start job workers
pnpm jobs:start

# Run performance optimization
pnpm optimize
```

### Production
```bash
# Start job monitoring
pnpm perf:monitor

# Clean up old jobs
pnpm jobs:cleanup

# Schedule recurring jobs
pnpm jobs:schedule
```

## Configuration

### Environment Variables
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# CDN Configuration (optional)
NEXT_PUBLIC_CDN_URL=https://your-cdn.com

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
```

### Redis Configuration
For production, consider these Redis settings:
```
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## Best Practices

### 1. Cache Key Design
- Use consistent naming conventions
- Include version numbers for breaking changes
- Use hierarchical keys for easy invalidation
- Avoid very long keys (>250 characters)

### 2. TTL Strategy
- Short TTL for frequently changing data (5-10 minutes)
- Medium TTL for semi-static data (30 minutes - 1 hour)
- Long TTL for rarely changing data (24 hours)
- Consider cache warming for critical data

### 3. Error Handling
- Always handle cache failures gracefully
- Implement fallback to database/API
- Log cache errors for monitoring
- Use circuit breaker pattern for external services

### 4. Performance Optimization
- Use batch operations when possible
- Implement cache warming for critical paths
- Monitor cache hit rates and adjust TTL
- Use compression for large cached objects

### 5. Memory Management
- Set appropriate maxmemory limits
- Use LRU eviction policy
- Monitor memory usage
- Clean up expired keys regularly

## Monitoring and Alerting

### Health Checks
The system includes comprehensive health monitoring:
- Cache connectivity and performance
- Job queue health and throughput
- Database query performance
- System resource usage

### Metrics Available
- Cache hit/miss rates
- Average response times
- Job processing times
- Error rates and failure patterns
- Memory and CPU usage

### Alerting
Configure alerts for:
- Cache connection failures
- High error rates (>10%)
- Slow job processing (>5 minutes)
- High memory usage (>80%)
- Queue backlogs (>100 jobs)

## Troubleshooting

### Common Issues

1. **Redis Connection Refused**
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # Start Redis
   redis-server
   ```

2. **High Memory Usage**
   ```bash
   # Check Redis memory usage
   redis-cli info memory
   
   # Clear all cache
   pnpm cache:clear
   ```

3. **Slow Cache Performance**
   ```bash
   # Check Redis latency
   redis-cli --latency
   
   # Monitor slow commands
   redis-cli monitor
   ```

4. **Job Queue Backlog**
   ```bash
   # Check job status
   curl http://localhost:3000/api/admin/performance?metric=jobs
   
   # Retry failed jobs
   curl -X POST http://localhost:3000/api/admin/performance \
     -d '{"action": "retry_failed", "queue": "stats"}'
   ```

## Performance Benchmarks

### Expected Performance
- Cache read latency: <10ms
- Cache write latency: <20ms
- Job processing: <30 seconds
- API response time: <200ms (cached)
- Image optimization: <500ms

### Load Testing
Use the performance optimization script to benchmark your setup:
```bash
pnpm optimize
```

This will test all components and provide a comprehensive performance report.

## Future Enhancements

1. **Multi-Region Caching**
   - Redis Cluster support
   - Geographic cache distribution
   - Cross-region replication

2. **Advanced Analytics**
   - Machine learning for cache prediction
   - Automatic TTL optimization
   - Usage pattern analysis

3. **Enhanced Monitoring**
   - Real-time dashboards
   - Predictive alerting
   - Performance regression detection

4. **Edge Caching**
   - CDN integration
   - Edge function caching
   - Global cache invalidation