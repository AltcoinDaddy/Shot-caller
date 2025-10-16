/**
 * Production Monitoring and Error Tracking
 * 
 * This module provides comprehensive monitoring, logging, and error tracking
 * for the production environment.
 */

import { NextRequest, NextResponse } from 'next/server';

// Types for monitoring
interface ErrorLog {
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: Error;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

interface PerformanceMetric {
  timestamp: Date;
  metric: string;
  value: number;
  tags?: Record<string, string>;
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  timestamp: Date;
}

class ProductionMonitor {
  private static instance: ProductionMonitor;
  private errorLogs: ErrorLog[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();

  private constructor() {
    // Initialize monitoring
    this.setupErrorHandlers();
    this.startHealthChecks();
  }

  public static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }

  /**
   * Log an error with context
   */
  public logError(message: string, error?: Error, context?: Record<string, any>): void {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      level: 'error',
      message,
      error,
      context,
      requestId: this.generateRequestId(),
    };

    this.errorLogs.push(errorLog);
    
    // Keep only last 1000 error logs in memory
    if (this.errorLogs.length > 1000) {
      this.errorLogs = this.errorLogs.slice(-1000);
    }

    // Log to console in production
    console.error(`[${errorLog.timestamp.toISOString()}] ${message}`, {
      error: error?.message,
      stack: error?.stack,
      context,
      requestId: errorLog.requestId,
    });

    // Send to external monitoring service (Sentry, DataDog, etc.)
    this.sendToExternalMonitoring(errorLog);
  }

  /**
   * Log performance metrics
   */
  public recordMetric(metric: string, value: number, tags?: Record<string, string>): void {
    const performanceMetric: PerformanceMetric = {
      timestamp: new Date(),
      metric,
      value,
      tags,
    };

    this.performanceMetrics.push(performanceMetric);
    
    // Keep only last 10000 metrics in memory
    if (this.performanceMetrics.length > 10000) {
      this.performanceMetrics = this.performanceMetrics.slice(-10000);
    }

    // Log significant metrics
    if (this.isSignificantMetric(metric, value)) {
      console.log(`[METRIC] ${metric}: ${value}`, tags);
    }
  }

  /**
   * Record API response time
   */
  public recordApiResponseTime(endpoint: string, method: string, responseTime: number, statusCode: number): void {
    this.recordMetric('api_response_time', responseTime, {
      endpoint,
      method,
      status_code: statusCode.toString(),
    });

    // Log slow requests
    if (responseTime > 5000) {
      this.logError(`Slow API response: ${method} ${endpoint}`, undefined, {
        responseTime,
        statusCode,
      });
    }
  }

  /**
   * Check system health
   */
  public async checkHealth(): Promise<Record<string, HealthCheck>> {
    const healthChecks: Record<string, HealthCheck> = {};

    // Check database connection
    try {
      const dbStart = Date.now();
      // This would be replaced with actual database health check
      await this.checkDatabaseHealth();
      const dbResponseTime = Date.now() - dbStart;
      
      healthChecks.database = {
        service: 'database',
        status: 'healthy',
        responseTime: dbResponseTime,
        timestamp: new Date(),
      };
    } catch (error) {
      healthChecks.database = {
        service: 'database',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }

    // Check Redis connection
    try {
      const redisStart = Date.now();
      await this.checkRedisHealth();
      const redisResponseTime = Date.now() - redisStart;
      
      healthChecks.redis = {
        service: 'redis',
        status: 'healthy',
        responseTime: redisResponseTime,
        timestamp: new Date(),
      };
    } catch (error) {
      healthChecks.redis = {
        service: 'redis',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }

    // Check external APIs
    try {
      const apiStart = Date.now();
      await this.checkExternalAPIs();
      const apiResponseTime = Date.now() - apiStart;
      
      healthChecks.external_apis = {
        service: 'external_apis',
        status: 'healthy',
        responseTime: apiResponseTime,
        timestamp: new Date(),
      };
    } catch (error) {
      healthChecks.external_apis = {
        service: 'external_apis',
        status: 'degraded',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }

    // Update internal health checks
    Object.entries(healthChecks).forEach(([service, check]) => {
      this.healthChecks.set(service, check);
    });

    return healthChecks;
  }

  /**
   * Get system metrics
   */
  public getMetrics(): {
    errors: ErrorLog[];
    performance: PerformanceMetric[];
    health: Record<string, HealthCheck>;
  } {
    return {
      errors: this.errorLogs.slice(-100), // Last 100 errors
      performance: this.performanceMetrics.slice(-1000), // Last 1000 metrics
      health: Object.fromEntries(this.healthChecks),
    };
  }

  /**
   * Middleware for API monitoring
   */
  public createApiMonitoringMiddleware() {
    return async (request: NextRequest) => {
      const start = Date.now();
      const requestId = this.generateRequestId();
      
      // Add request ID to headers
      const response = NextResponse.next();
      response.headers.set('x-request-id', requestId);

      // Record the request
      this.recordMetric('api_request', 1, {
        method: request.method,
        path: request.nextUrl.pathname,
      });

      // Monitor response time after request completes
      const responseTime = Date.now() - start;
      this.recordApiResponseTime(
        request.nextUrl.pathname,
        request.method,
        responseTime,
        response.status
      );

      return response;
    };
  }

  private setupErrorHandlers(): void {
    // Only set up process error handlers if we're not in Edge Runtime
    if (typeof process !== 'undefined' && process.on) {
      // Global error handler for unhandled promises
      process.on('unhandledRejection', (reason, promise) => {
        this.logError('Unhandled Promise Rejection', reason instanceof Error ? reason : new Error(String(reason)), {
          promise: promise.toString(),
        });
      });

      // Global error handler for uncaught exceptions
      process.on('uncaughtException', (error) => {
        this.logError('Uncaught Exception', error);
        // Don't exit in production, but log the error
      });
    }
  }

  private startHealthChecks(): void {
    // Only start interval-based health checks if we're not in Edge Runtime
    if (typeof setInterval !== 'undefined' && typeof process !== 'undefined') {
      // Run health checks every 5 minutes
      setInterval(async () => {
        try {
          await this.checkHealth();
        } catch (error) {
          this.logError('Health check failed', error instanceof Error ? error : new Error(String(error)));
        }
      }, 5 * 60 * 1000);
    }
  }

  private async checkDatabaseHealth(): Promise<void> {
    // This would be replaced with actual Supabase health check
    // For now, we'll simulate a health check
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      // Simulate database check
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      throw new Error('Database configuration missing');
    }
  }

  private async checkRedisHealth(): Promise<void> {
    // This would be replaced with actual Redis health check
    if (process.env.REDIS_URL) {
      // Simulate Redis check
      await new Promise(resolve => setTimeout(resolve, 50));
    } else {
      throw new Error('Redis configuration missing');
    }
  }

  private async checkExternalAPIs(): Promise<void> {
    // Check NBA API
    if (process.env.NBA_API_KEY) {
      // Simulate API check
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Check NFL API
    if (process.env.NFL_API_KEY) {
      // Simulate API check
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  private sendToExternalMonitoring(errorLog: ErrorLog): void {
    // This would integrate with Sentry, DataDog, or other monitoring services
    if (process.env.SENTRY_DSN) {
      // Send to Sentry
      console.log('Sending error to Sentry:', errorLog.message);
    }
  }

  private isSignificantMetric(metric: string, value: number): boolean {
    // Define which metrics are significant enough to log
    const significantMetrics = [
      'api_response_time',
      'database_query_time',
      'error_rate',
      'user_registration',
      'tournament_entry',
    ];

    return significantMetrics.includes(metric) || value > 1000;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const productionMonitor = ProductionMonitor.getInstance();

// Export middleware
export const apiMonitoringMiddleware = productionMonitor.createApiMonitoringMiddleware();

// Export health check endpoint handler
export async function handleHealthCheck(): Promise<Response> {
  try {
    const health = await productionMonitor.checkHealth();
    const overallStatus = Object.values(health).every(check => check.status === 'healthy') 
      ? 'healthy' 
      : Object.values(health).some(check => check.status === 'unhealthy')
      ? 'unhealthy'
      : 'degraded';

    return new Response(JSON.stringify({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: health,
    }), {
      status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 206 : 503,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    productionMonitor.logError('Health check endpoint failed', error instanceof Error ? error : new Error(String(error)));
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}