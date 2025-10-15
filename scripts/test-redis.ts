#!/usr/bin/env tsx

import { redisCache } from '@/lib/cache/redis-client';

async function testRedisConnection() {
  console.log('Testing Redis connection...');
  
  try {
    // Connect to Redis
    await redisCache.connect();
    console.log('✓ Connected to Redis successfully');
    
    // Test basic operations
    const testKey = 'test:connection';
    const testValue = { timestamp: Date.now(), message: 'Redis test' };
    
    // Set value
    const setResult = await redisCache.set(testKey, testValue, { ttl: 60 });
    if (setResult) {
      console.log('✓ Set operation successful');
    } else {
      throw new Error('Set operation failed');
    }
    
    // Get value
    const getValue = await redisCache.get(testKey);
    if (getValue && getValue.timestamp === testValue.timestamp) {
      console.log('✓ Get operation successful');
    } else {
      throw new Error('Get operation failed or data mismatch');
    }
    
    // Check if key exists
    const exists = await redisCache.exists(testKey);
    if (exists) {
      console.log('✓ Exists check successful');
    } else {
      throw new Error('Exists check failed');
    }
    
    // Delete value
    const delResult = await redisCache.del(testKey);
    if (delResult) {
      console.log('✓ Delete operation successful');
    } else {
      throw new Error('Delete operation failed');
    }
    
    // Verify deletion
    const deletedValue = await redisCache.get(testKey);
    if (deletedValue === null) {
      console.log('✓ Deletion verified');
    } else {
      throw new Error('Value still exists after deletion');
    }
    
    console.log('');
    console.log('🎉 All Redis tests passed!');
    console.log('Redis is working correctly and ready for caching.');
    
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure Redis server is running');
    console.log('2. Check Redis connection settings in .env.local');
    console.log('3. Try: redis-cli ping (should return PONG)');
    console.log('4. For Docker: docker run -d -p 6379:6379 redis:alpine');
    process.exit(1);
  } finally {
    try {
      await redisCache.disconnect();
      console.log('✓ Disconnected from Redis');
    } catch (error) {
      console.warn('Warning: Failed to disconnect from Redis:', error.message);
    }
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testRedisConnection();
}

export { testRedisConnection };