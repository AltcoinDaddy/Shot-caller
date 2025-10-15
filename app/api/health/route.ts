import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError } from '@/lib/services/enhanced-database-service'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Check database connectivity
    const dbHealth = await enhancedDatabaseService.healthCheck()
    
    // Get comprehensive stats
    const dbStats = await enhancedDatabaseService.getStats()
    const treasuryStats = await enhancedDatabaseService.getTreasuryStats()
    
    const responseTime = Date.now() - startTime
    
    // Determine overall health
    const isHealthy = dbHealth.status === 'healthy'
    
    // Get additional system metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    }

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: '1.0.0',
      database: {
        status: dbHealth.status,
        timestamp: dbHealth.timestamp,
        connectionPool: 'active'
      },
      statistics: {
        users: dbStats.totalUsers,
        nfts: dbStats.totalNFTs,
        lineups: dbStats.totalLineups,
        contests: {
          total: dbStats.totalContests,
          active: dbStats.activeContests
        },
        marketplace: {
          totalListings: dbStats.totalMarketplaceListings,
          activeListings: dbStats.activeMarketplaceListings
        },
        treasury: {
          totalRewardPool: treasuryStats.totalRewardPool,
          totalTreasury: treasuryStats.totalTreasury,
          totalVolume: treasuryStats.totalVolume,
          transactionCount: 0 // Would need to add this to treasury stats
        }
      },
      services: {
        database: isHealthy ? 'operational' : 'degraded',
        api: 'operational',
        blockchain: 'operational', // Would check Flow network status
        cache: 'operational' // Would check Redis if implemented
      },
      system: {
        uptime: `${Math.floor(systemMetrics.uptime)}s`,
        memory: {
          used: `${Math.round(systemMetrics.memory.heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(systemMetrics.memory.heapTotal / 1024 / 1024)}MB`
        },
        nodeVersion: systemMetrics.nodeVersion,
        platform: systemMetrics.platform
      },
      features: {
        authentication: 'enabled',
        marketplace: 'enabled',
        treasury: 'enabled',
        boosters: 'enabled',
        premium: 'enabled',
        contests: 'enabled',
        rewards: 'enabled'
      }
    }, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: 'unavailable',
        api: 'degraded',
        blockchain: 'unknown',
        cache: 'unknown'
      },
      system: {
        uptime: `${Math.floor(process.uptime())}s`,
        nodeVersion: process.version,
        platform: process.platform
      }
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}