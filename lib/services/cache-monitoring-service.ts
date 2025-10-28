/**
 * Cache Monitoring Service
 * Provides comprehensive monitoring, analytics, and optimization for cache performance
 */

import { intelligentCache, CacheStats } from './intelligent-cache-service';

export interface CacheMetrics {
  timestamp: Date;
  stats: CacheStats;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    averageGetTime: number;
    averageSetTime: number;
    throughput: number;
  };
  health: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

export interface CacheAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  metric: string;
  threshold: number;
  currentValue: number;
  resolved: boolean;
}

export interface MonitoringConfig {
  enableMonitoring: boolean;
  metricsInterval: number;
  alertThresholds: {
    hitRateMin: number;
    memoryUsageMax: number;
    averageAccessTimeMax: number;
    evictionRateMax: number;
  };
  retentionPeriod: number;
  enableAlerts: boolean;
}

export class CacheMonitoringService {
  private metrics: CacheMetrics[] = [];
  private alerts: CacheAlert[] = [];
  private config: MonitoringConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private lastMetricsTime = Date.now();
  private operationCounts = { gets: 0, sets: 0 };

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableMonitoring: true,
      metricsInterval: 30000, // 30 seconds
      alertThresholds: {
        hitRateMin: 0.7, // 70%
        memoryUsageMax: 0.8, // 80%
        averageAccessTimeMax: 10, // 10ms
        evictionRateMax: 0.1 // 10%
      },
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      enableAlerts: true,
      ...config
    };

    this.initializeMonitoring();
  }

  /**
   * Start monitoring cache performance
   */
  startMonitoring(): void {
    if (!this.config.enableMonitoring || this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.metricsInterval);

    this.initializePerformanceObserver();
    console.log('Cache monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    console.log('Cache monitoring stopped');
  }

  /**
   * Get current cache metrics
   */
  getCurrentMetrics(): CacheMetrics {
    return this.collectMetrics();
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(hours: number = 1): CacheMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Get cache health report
   */
  getHealthReport(): {
    overallHealth: number;
    issues: string[];
    recommendations: string[];
    trends: {
      hitRate: 'improving' | 'declining' | 'stable';
      memoryUsage: 'increasing' | 'decreasing' | 'stable';
      performance: 'improving' | 'declining' | 'stable';
    };
  } {
    const recentMetrics = this.getHistoricalMetrics(1);
    if (recentMetrics.length === 0) {
      return {
        overallHealth: 0,
        issues: ['No metrics available'],
        recommendations: ['Start monitoring to collect metrics'],
        trends: { hitRate: 'stable', memoryUsage: 'stable', performance: 'stable' }
      };
    }

    const latest = recentMetrics[recentMetrics.length - 1];
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze health
    if (latest.stats.hitRate < this.config.alertThresholds.hitRateMin) {
      issues.push(`Low cache hit rate: ${(latest.stats.hitRate * 100).toFixed(1)}%`);
      recommendations.push('Consider adjusting cache TTL or warming strategies');
    }

    if (latest.memoryUsage.percentage > this.config.alertThresholds.memoryUsageMax) {
      issues.push(`High memory usage: ${(latest.memoryUsage.percentage * 100).toFixed(1)}%`);
      recommendations.push('Consider reducing cache size or implementing more aggressive eviction');
    }

    if (latest.performance.averageGetTime > this.config.alertThresholds.averageAccessTimeMax) {
      issues.push(`Slow cache access: ${latest.performance.averageGetTime.toFixed(2)}ms`);
      recommendations.push('Consider optimizing cache structure or reducing compression overhead');
    }

    const trends = this.analyzeTrends(recentMetrics);
    const overallHealth = this.calculateHealthScore(latest, issues.length);

    return {
      overallHealth,
      issues,
      recommendations,
      trends
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): CacheAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts within time period
   */
  getAlerts(hours: number = 24): CacheAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp >= cutoff);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Get cache optimization recommendations
   */
  getOptimizationRecommendations(): {
    priority: 'high' | 'medium' | 'low';
    action: string;
    description: string;
    expectedImpact: string;
  }[] {
    const metrics = this.getCurrentMetrics();
    const recommendations: any[] = [];

    // Hit rate optimization
    if (metrics.stats.hitRate < 0.8) {
      recommendations.push({
        priority: 'high',
        action: 'Improve Cache Hit Rate',
        description: 'Current hit rate is below optimal threshold',
        expectedImpact: 'Reduce API calls and improve response times'
      });
    }

    // Memory optimization
    if (metrics.memoryUsage.percentage > 0.7) {
      recommendations.push({
        priority: 'medium',
        action: 'Optimize Memory Usage',
        description: 'Cache is using significant memory',
        expectedImpact: 'Reduce memory pressure and prevent evictions'
      });
    }

    // Performance optimization
    if (metrics.performance.averageGetTime > 5) {
      recommendations.push({
        priority: 'medium',
        action: 'Improve Access Performance',
        description: 'Cache access times are higher than optimal',
        expectedImpact: 'Faster data retrieval and better user experience'
      });
    }

    // Compression optimization
    if (metrics.stats.compressionRatio < 0.3 && metrics.stats.totalSize > 10 * 1024 * 1024) {
      recommendations.push({
        priority: 'low',
        action: 'Increase Compression Usage',
        description: 'Low compression ratio with large cache size',
        expectedImpact: 'Reduce memory usage and storage requirements'
      });
    }

    return recommendations;
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'timestamp', 'hitRate', 'missRate', 'totalEntries', 'totalSize',
        'memoryUsagePercent', 'averageGetTime', 'throughput', 'healthScore'
      ];
      
      const rows = this.metrics.map(metric => [
        metric.timestamp.toISOString(),
        metric.stats.hitRate.toFixed(3),
        metric.stats.missRate.toFixed(3),
        metric.stats.totalEntries,
        metric.stats.totalSize,
        (metric.memoryUsage.percentage * 100).toFixed(1),
        metric.performance.averageGetTime.toFixed(2),
        metric.performance.throughput.toFixed(0),
        metric.health.score.toFixed(1)
      ]);

      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    return JSON.stringify(this.metrics, null, 2);
  }

  private initializeMonitoring(): void {
    if (this.config.enableMonitoring) {
      this.startMonitoring();
    }
  }

  private initializePerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.startsWith('cache-')) {
            this.recordPerformanceEntry(entry);
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('Performance observer initialization failed:', error);
    }
  }

  private collectMetrics(): CacheMetrics {
    const stats = intelligentCache.getStats();
    const sizeInfo = intelligentCache.getSizeInfo();
    
    // Calculate memory usage
    const memoryUsage = {
      used: sizeInfo.totalSize,
      total: sizeInfo.maxSize || 50 * 1024 * 1024,
      percentage: sizeInfo.totalSize / (sizeInfo.maxSize || 50 * 1024 * 1024)
    };

    // Calculate performance metrics
    const now = Date.now();
    const timeDiff = now - this.lastMetricsTime;
    const throughput = timeDiff > 0 ? 
      ((this.operationCounts.gets + this.operationCounts.sets) / timeDiff) * 1000 : 0;

    const performance = {
      averageGetTime: stats.averageAccessTime,
      averageSetTime: stats.averageAccessTime * 1.2, // Estimate
      throughput
    };

    // Calculate health score
    const health = this.calculateHealth(stats, memoryUsage, performance);

    const metrics: CacheMetrics = {
      timestamp: new Date(),
      stats,
      memoryUsage,
      performance,
      health
    };

    // Store metrics
    this.metrics.push(metrics);
    this.cleanupOldMetrics();

    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkAlerts(metrics);
    }

    // Reset counters
    this.lastMetricsTime = now;
    this.operationCounts = { gets: 0, sets: 0 };

    return metrics;
  }

  private calculateHealth(
    stats: CacheStats, 
    memoryUsage: any, 
    performance: any
  ): { score: number; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Hit rate health
    if (stats.hitRate < this.config.alertThresholds.hitRateMin) {
      score -= 20;
      issues.push('Low cache hit rate');
      recommendations.push('Optimize cache warming and TTL settings');
    }

    // Memory usage health
    if (memoryUsage.percentage > this.config.alertThresholds.memoryUsageMax) {
      score -= 15;
      issues.push('High memory usage');
      recommendations.push('Implement more aggressive eviction policies');
    }

    // Performance health
    if (performance.averageGetTime > this.config.alertThresholds.averageAccessTimeMax) {
      score -= 10;
      issues.push('Slow cache access');
      recommendations.push('Optimize cache structure and reduce compression overhead');
    }

    // Eviction rate health
    const evictionRate = stats.evictionCount / (stats.totalEntries || 1);
    if (evictionRate > this.config.alertThresholds.evictionRateMax) {
      score -= 10;
      issues.push('High eviction rate');
      recommendations.push('Increase cache size or optimize data retention');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  private calculateHealthScore(metrics: CacheMetrics, issueCount: number): number {
    return Math.max(0, 100 - (issueCount * 20));
  }

  private analyzeTrends(metrics: CacheMetrics[]): {
    hitRate: 'improving' | 'declining' | 'stable';
    memoryUsage: 'increasing' | 'decreasing' | 'stable';
    performance: 'improving' | 'declining' | 'stable';
  } {
    if (metrics.length < 2) {
      return { hitRate: 'stable', memoryUsage: 'stable', performance: 'stable' };
    }

    const recent = metrics.slice(-5); // Last 5 measurements
    const older = metrics.slice(-10, -5); // Previous 5 measurements

    const avgRecent = {
      hitRate: recent.reduce((sum, m) => sum + m.stats.hitRate, 0) / recent.length,
      memoryUsage: recent.reduce((sum, m) => sum + m.memoryUsage.percentage, 0) / recent.length,
      performance: recent.reduce((sum, m) => sum + m.performance.averageGetTime, 0) / recent.length
    };

    const avgOlder = {
      hitRate: older.reduce((sum, m) => sum + m.stats.hitRate, 0) / (older.length || 1),
      memoryUsage: older.reduce((sum, m) => sum + m.memoryUsage.percentage, 0) / (older.length || 1),
      performance: older.reduce((sum, m) => sum + m.performance.averageGetTime, 0) / (older.length || 1)
    };

    const threshold = 0.05; // 5% change threshold

    return {
      hitRate: this.getTrend(avgRecent.hitRate, avgOlder.hitRate, threshold),
      memoryUsage: this.getTrend(avgRecent.memoryUsage, avgOlder.memoryUsage, threshold, true),
      performance: this.getTrend(avgRecent.performance, avgOlder.performance, threshold, true)
    };
  }

  private getTrend(
    recent: number, 
    older: number, 
    threshold: number, 
    inverse = false
  ): 'improving' | 'declining' | 'stable' {
    const change = (recent - older) / (older || 1);
    
    if (Math.abs(change) < threshold) return 'stable';
    
    const isImproving = inverse ? change < 0 : change > 0;
    return isImproving ? 'improving' : 'declining';
  }

  private checkAlerts(metrics: CacheMetrics): void {
    const alerts: Omit<CacheAlert, 'id' | 'timestamp'>[] = [];

    // Hit rate alert
    if (metrics.stats.hitRate < this.config.alertThresholds.hitRateMin) {
      alerts.push({
        type: 'warning',
        message: `Cache hit rate below threshold: ${(metrics.stats.hitRate * 100).toFixed(1)}%`,
        metric: 'hitRate',
        threshold: this.config.alertThresholds.hitRateMin,
        currentValue: metrics.stats.hitRate,
        resolved: false
      });
    }

    // Memory usage alert
    if (metrics.memoryUsage.percentage > this.config.alertThresholds.memoryUsageMax) {
      alerts.push({
        type: 'error',
        message: `Cache memory usage exceeds threshold: ${(metrics.memoryUsage.percentage * 100).toFixed(1)}%`,
        metric: 'memoryUsage',
        threshold: this.config.alertThresholds.memoryUsageMax,
        currentValue: metrics.memoryUsage.percentage,
        resolved: false
      });
    }

    // Performance alert
    if (metrics.performance.averageGetTime > this.config.alertThresholds.averageAccessTimeMax) {
      alerts.push({
        type: 'warning',
        message: `Cache access time exceeds threshold: ${metrics.performance.averageGetTime.toFixed(2)}ms`,
        metric: 'averageAccessTime',
        threshold: this.config.alertThresholds.averageAccessTimeMax,
        currentValue: metrics.performance.averageGetTime,
        resolved: false
      });
    }

    // Add new alerts
    alerts.forEach(alertData => {
      const alert: CacheAlert = {
        ...alertData,
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      this.alerts.push(alert);
    });
  }

  private recordPerformanceEntry(entry: PerformanceEntry): void {
    if (entry.name === 'cache-get') {
      this.operationCounts.gets++;
    } else if (entry.name === 'cache-set') {
      this.operationCounts.sets++;
    }
  }

  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod);
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoff);
  }
}