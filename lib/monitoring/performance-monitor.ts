import { cacheService } from '@/lib/cache/cache-service';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface APIMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userAgent?: string;
  cacheHit?: boolean;
}

interface CacheMetrics {
  operation: 'get' | 'set' | 'del' | 'hit' | 'miss';
  key: string;
  prefix?: string;
  responseTime: number;
  timestamp: number;
}

interface DatabaseMetrics {
  query: string;
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  responseTime: number;
  rowCount?: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static apiMetrics: APIMetrics[] = [];
  private static cacheMetrics: CacheMetrics[] = [];
  private static databaseMetrics: DatabaseMetrics[] = [];
  private static maxMetricsSize = 10000;

  // Record performance metrics
  static recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);
    this.trimMetrics();
  }

  // Record API metrics
  static recordAPIMetric(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    userAgent?: string,
    cacheHit?: boolean
  ): void {
    const metric: APIMetrics = {
      endpoint,
      method,
      statusCode,
      responseTime,
      timestamp: Date.now(),
      userAgent,
      cacheHit,
    };

    this.apiMetrics.push(metric);
    this.trimAPIMetrics();
  }

  // Record cache metrics
  static recordCacheMetric(
    operation: CacheMetrics['operation'],
    key: string,
    responseTime: number,
    prefix?: string
  ): void {
    const metric: CacheMetrics = {
      operation,
      key,
      prefix,
      responseTime,
      timestamp: Date.now(),
    };

    this.cacheMetrics.push(metric);
    this.trimCacheMetrics();
  }

  // Record database metrics
  static recordDatabaseMetric(
    query: string,
    table: string,
    operation: DatabaseMetrics['operation'],
    responseTime: number,
    rowCount?: number
  ): void {
    const metric: DatabaseMetrics = {
      query: query.substring(0, 200), // Truncate long queries
      table,
      operation,
      responseTime,
      rowCount,
      timestamp: Date.now(),
    };

    this.databaseMetrics.push(metric);
    this.trimDatabaseMetrics();
  }

  // Get performance summary
  static getPerformanceSummary(timeRange: number = 3600000): any { // Default 1 hour
    const now = Date.now();
    const cutoff = now - timeRange;

    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    const recentAPIMetrics = this.apiMetrics.filter(m => m.timestamp > cutoff);
    const recentCacheMetrics = this.cacheMetrics.filter(m => m.timestamp > cutoff);
    const recentDBMetrics = this.databaseMetrics.filter(m => m.timestamp > cutoff);

    return {
      general: this.calculateGeneralMetrics(recentMetrics),
      api: this.calculateAPIMetrics(recentAPIMetrics),
      cache: this.calculateCacheMetrics(recentCacheMetrics),
      database: this.calculateDatabaseMetrics(recentDBMetrics),
      timestamp: now,
      timeRange,
    };
  }

  // Calculate general metrics
  private static calculateGeneralMetrics(metrics: PerformanceMetric[]): any {
    if (metrics.length === 0) return {};

    const grouped = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    const summary = {};
    for (const [name, values] of Object.entries(grouped)) {
      summary[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p95: this.percentile(values, 0.95),
        p99: this.percentile(values, 0.99),
      };
    }

    return summary;
  }

  // Calculate API metrics
  private static calculateAPIMetrics(metrics: APIMetrics[]): any {
    if (metrics.length === 0) return {};

    const responseTimes = metrics.map(m => m.responseTime);
    const statusCodes = metrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const cacheHitRate = metrics.filter(m => m.cacheHit === true).length / 
                        metrics.filter(m => m.cacheHit !== undefined).length;

    const endpointStats = metrics.reduce((acc, m) => {
      const key = `${m.method} ${m.endpoint}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m.responseTime);
      return acc;
    }, {} as Record<string, number[]>);

    const endpointSummary = {};
    for (const [endpoint, times] of Object.entries(endpointStats)) {
      endpointSummary[endpoint] = {
        count: times.length,
        avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length,
        p95ResponseTime: this.percentile(times, 0.95),
      };
    }

    return {
      totalRequests: metrics.length,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: this.percentile(responseTimes, 0.95),
      p99ResponseTime: this.percentile(responseTimes, 0.99),
      statusCodes,
      cacheHitRate: isNaN(cacheHitRate) ? 0 : cacheHitRate,
      endpoints: endpointSummary,
    };
  }

  // Calculate cache metrics
  private static calculateCacheMetrics(metrics: CacheMetrics[]): any {
    if (metrics.length === 0) return {};

    const operations = metrics.reduce((acc, m) => {
      acc[m.operation] = (acc[m.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const responseTimes = metrics.map(m => m.responseTime);
    const hitRate = operations.hit / (operations.hit + operations.miss || 1);

    const prefixStats = metrics.reduce((acc, m) => {
      if (!m.prefix) return acc;
      if (!acc[m.prefix]) acc[m.prefix] = { hits: 0, misses: 0, total: 0 };
      if (m.operation === 'hit') acc[m.prefix].hits++;
      if (m.operation === 'miss') acc[m.prefix].misses++;
      acc[m.prefix].total++;
      return acc;
    }, {} as Record<string, any>);

    for (const prefix of Object.keys(prefixStats)) {
      prefixStats[prefix].hitRate = prefixStats[prefix].hits / prefixStats[prefix].total;
    }

    return {
      totalOperations: metrics.length,
      operations,
      hitRate: isNaN(hitRate) ? 0 : hitRate,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: this.percentile(responseTimes, 0.95),
      prefixStats,
    };
  }

  // Calculate database metrics
  private static calculateDatabaseMetrics(metrics: DatabaseMetrics[]): any {
    if (metrics.length === 0) return {};

    const operations = metrics.reduce((acc, m) => {
      acc[m.operation] = (acc[m.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const responseTimes = metrics.map(m => m.responseTime);
    const totalRows = metrics.reduce((sum, m) => sum + (m.rowCount || 0), 0);

    const tableStats = metrics.reduce((acc, m) => {
      if (!acc[m.table]) acc[m.table] = [];
      acc[m.table].push(m.responseTime);
      return acc;
    }, {} as Record<string, number[]>);

    const tableSummary = {};
    for (const [table, times] of Object.entries(tableStats)) {
      tableSummary[table] = {
        count: times.length,
        avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length,
        p95ResponseTime: this.percentile(times, 0.95),
      };
    }

    return {
      totalQueries: metrics.length,
      operations,
      totalRowsAffected: totalRows,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: this.percentile(responseTimes, 0.95),
      p99ResponseTime: this.percentile(responseTimes, 0.99),
      tables: tableSummary,
    };
  }

  // Utility function to calculate percentiles
  private static percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  // Trim metrics arrays to prevent memory leaks
  private static trimMetrics(): void {
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }
  }

  private static trimAPIMetrics(): void {
    if (this.apiMetrics.length > this.maxMetricsSize) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetricsSize);
    }
  }

  private static trimCacheMetrics(): void {
    if (this.cacheMetrics.length > this.maxMetricsSize) {
      this.cacheMetrics = this.cacheMetrics.slice(-this.maxMetricsSize);
    }
  }

  private static trimDatabaseMetrics(): void {
    if (this.databaseMetrics.length > this.maxMetricsSize) {
      this.databaseMetrics = this.databaseMetrics.slice(-this.maxMetricsSize);
    }
  }

  // Health check
  static getHealthStatus(): any {
    const summary = this.getPerformanceSummary(300000); // Last 5 minutes
    
    const health = {
      status: 'healthy',
      issues: [],
      cache: cacheService.isHealthy(),
      timestamp: Date.now(),
    };

    // Check API response times
    if (summary.api?.p95ResponseTime > 2000) {
      health.status = 'degraded';
      health.issues.push('High API response times');
    }

    // Check cache hit rate
    if (summary.cache?.hitRate < 0.7) {
      health.status = 'degraded';
      health.issues.push('Low cache hit rate');
    }

    // Check database response times
    if (summary.database?.p95ResponseTime > 1000) {
      health.status = 'degraded';
      health.issues.push('High database response times');
    }

    // Check error rates
    if (summary.api?.statusCodes) {
      const errorRate = (summary.api.statusCodes[500] || 0) / summary.api.totalRequests;
      if (errorRate > 0.05) {
        health.status = 'unhealthy';
        health.issues.push('High error rate');
      }
    }

    return health;
  }

  // Clear all metrics (useful for testing)
  static clearAllMetrics(): void {
    this.metrics = [];
    this.apiMetrics = [];
    this.cacheMetrics = [];
    this.databaseMetrics = [];
  }
}

// Middleware for automatic API monitoring
export const performanceMiddleware = (handler: any) => {
  return async (req: any, res: any) => {
    const startTime = Date.now();
    const endpoint = req.url;
    const method = req.method;

    try {
      const result = await handler(req, res);
      const responseTime = Date.now() - startTime;
      
      PerformanceMonitor.recordAPIMetric(
        endpoint,
        method,
        res.status || 200,
        responseTime,
        req.headers['user-agent']
      );

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      PerformanceMonitor.recordAPIMetric(
        endpoint,
        method,
        500,
        responseTime,
        req.headers['user-agent']
      );

      throw error;
    }
  };
};