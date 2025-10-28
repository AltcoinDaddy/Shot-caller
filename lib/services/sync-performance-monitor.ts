/**
 * Sync Performance Monitor
 * Tracks and analyzes performance metrics for sync operations
 */

import { PerformanceMetrics } from './sync-performance-optimizer';
import { SyncEvent, SyncEventType } from '../types/sync';

export interface PerformanceSnapshot {
  timestamp: Date;
  metrics: PerformanceMetrics;
  operationCounts: Record<string, number>;
  averageLatency: number;
  errorRate: number;
  cacheHitRate: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  metrics: Partial<PerformanceMetrics>;
  threshold: number;
  currentValue: number;
}

export interface PerformanceTrend {
  metric: keyof PerformanceMetrics;
  direction: 'improving' | 'degrading' | 'stable';
  changePercent: number;
  timeframe: string;
}

export class SyncPerformanceMonitor {
  private snapshots: PerformanceSnapshot[] = [];
  private alerts: PerformanceAlert[] = [];
  private operationCounts: Record<string, number> = {};
  private latencyMeasurements: number[] = [];
  private errorCount = 0;
  private totalOperations = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  private readonly MAX_SNAPSHOTS = 100;
  private readonly ALERT_THRESHOLDS = {
    averageResponseTime: 5000, // 5 seconds
    errorRate: 0.1, // 10%
    cacheHitRate: 0.7, // 70%
    batchProcessingTime: 3000, // 3 seconds
  };

  constructor() {
    this.startMonitoring();
  }

  /**
   * Record a sync operation for performance tracking
   */
  recordOperation(
    operationType: string,
    duration: number,
    success: boolean,
    cacheHit?: boolean
  ): void {
    // Update operation counts
    this.operationCounts[operationType] = (this.operationCounts[operationType] || 0) + 1;
    this.totalOperations++;

    // Track latency
    this.latencyMeasurements.push(duration);
    if (this.latencyMeasurements.length > 1000) {
      this.latencyMeasurements = this.latencyMeasurements.slice(-500);
    }

    // Track errors
    if (!success) {
      this.errorCount++;
    }

    // Track cache performance
    if (cacheHit !== undefined) {
      if (cacheHit) {
        this.cacheHits++;
      } else {
        this.cacheMisses++;
      }
    }
  }

  /**
   * Record sync event for analysis
   */
  recordSyncEvent(event: SyncEvent): void {
    const operationType = event.type;
    const duration = event.data?.duration || 0;
    const success = event.data?.success !== false;
    
    this.recordOperation(operationType, duration, success);

    // Check for performance alerts
    this.checkPerformanceAlerts();
  }

  /**
   * Get current performance snapshot
   */
  getCurrentSnapshot(): PerformanceSnapshot {
    const averageLatency = this.latencyMeasurements.length > 0
      ? this.latencyMeasurements.reduce((sum, lat) => sum + lat, 0) / this.latencyMeasurements.length
      : 0;

    const errorRate = this.totalOperations > 0 ? this.errorCount / this.totalOperations : 0;
    
    const totalCacheRequests = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 ? this.cacheHits / totalCacheRequests : 0;

    return {
      timestamp: new Date(),
      metrics: this.getPerformanceMetrics(),
      operationCounts: { ...this.operationCounts },
      averageLatency,
      errorRate,
      cacheHitRate
    };
  }

  /**
   * Get performance trends over time
   */
  getPerformanceTrends(): PerformanceTrend[] {
    if (this.snapshots.length < 2) {
      return [];
    }

    const recent = this.snapshots.slice(-10);
    const older = this.snapshots.slice(-20, -10);

    if (older.length === 0) {
      return [];
    }

    const trends: PerformanceTrend[] = [];
    const metricsToTrack: (keyof PerformanceMetrics)[] = [
      'averageResponseTime',
      'batchProcessingTime',
      'deduplicationSavings',
      'incrementalSyncEfficiency',
      'cacheOptimizationGains'
    ];

    for (const metric of metricsToTrack) {
      const recentAvg = recent.reduce((sum, s) => sum + (s.metrics[metric] || 0), 0) / recent.length;
      const olderAvg = older.reduce((sum, s) => sum + (s.metrics[metric] || 0), 0) / older.length;
      
      if (olderAvg === 0) continue;

      const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
      let direction: 'improving' | 'degrading' | 'stable' = 'stable';
      
      if (Math.abs(changePercent) > 5) {
        // For response time and processing time, lower is better
        if (metric === 'averageResponseTime' || metric === 'batchProcessingTime') {
          direction = changePercent < 0 ? 'improving' : 'degrading';
        } else {
          // For savings and efficiency, higher is better
          direction = changePercent > 0 ? 'improving' : 'degrading';
        }
      }

      trends.push({
        metric,
        direction,
        changePercent: Math.abs(changePercent),
        timeframe: '10 snapshots'
      });
    }

    return trends;
  }

  /**
   * Get active performance alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    // Return alerts from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp > oneDayAgo);
  }

  /**
   * Get performance summary report
   */
  getPerformanceReport(): {
    summary: PerformanceSnapshot;
    trends: PerformanceTrend[];
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const summary = this.getCurrentSnapshot();
    const trends = this.getPerformanceTrends();
    const alerts = this.getActiveAlerts();
    const recommendations = this.generateRecommendations(summary, trends);

    return {
      summary,
      trends,
      alerts,
      recommendations
    };
  }

  /**
   * Clear performance data
   */
  clearData(): void {
    this.snapshots = [];
    this.alerts = [];
    this.operationCounts = {};
    this.latencyMeasurements = [];
    this.errorCount = 0;
    this.totalOperations = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Export performance data for analysis
   */
  exportData(): {
    snapshots: PerformanceSnapshot[];
    alerts: PerformanceAlert[];
    summary: any;
  } {
    return {
      snapshots: [...this.snapshots],
      alerts: [...this.alerts],
      summary: {
        totalOperations: this.totalOperations,
        errorCount: this.errorCount,
        cacheHits: this.cacheHits,
        cacheMisses: this.cacheMisses,
        operationCounts: { ...this.operationCounts }
      }
    };
  }

  private startMonitoring(): void {
    // Take performance snapshots every 5 minutes
    setInterval(() => {
      this.takeSnapshot();
    }, 5 * 60 * 1000);

    // Clean up old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }

  private takeSnapshot(): void {
    const snapshot = this.getCurrentSnapshot();
    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots = this.snapshots.slice(-this.MAX_SNAPSHOTS);
    }
  }

  private checkPerformanceAlerts(): void {
    const snapshot = this.getCurrentSnapshot();

    // Check average response time
    if (snapshot.averageLatency > this.ALERT_THRESHOLDS.averageResponseTime) {
      this.createAlert(
        'warning',
        `Average response time is high: ${snapshot.averageLatency.toFixed(2)}ms`,
        { averageResponseTime: snapshot.averageLatency },
        this.ALERT_THRESHOLDS.averageResponseTime,
        snapshot.averageLatency
      );
    }

    // Check error rate
    if (snapshot.errorRate > this.ALERT_THRESHOLDS.errorRate) {
      this.createAlert(
        'error',
        `Error rate is high: ${(snapshot.errorRate * 100).toFixed(1)}%`,
        {},
        this.ALERT_THRESHOLDS.errorRate,
        snapshot.errorRate
      );
    }

    // Check cache hit rate
    if (snapshot.cacheHitRate < this.ALERT_THRESHOLDS.cacheHitRate) {
      this.createAlert(
        'warning',
        `Cache hit rate is low: ${(snapshot.cacheHitRate * 100).toFixed(1)}%`,
        {},
        this.ALERT_THRESHOLDS.cacheHitRate,
        snapshot.cacheHitRate
      );
    }

    // Check batch processing time
    if (snapshot.metrics.batchProcessingTime > this.ALERT_THRESHOLDS.batchProcessingTime) {
      this.createAlert(
        'warning',
        `Batch processing time is high: ${snapshot.metrics.batchProcessingTime.toFixed(2)}ms`,
        { batchProcessingTime: snapshot.metrics.batchProcessingTime },
        this.ALERT_THRESHOLDS.batchProcessingTime,
        snapshot.metrics.batchProcessingTime
      );
    }
  }

  private createAlert(
    type: 'warning' | 'error' | 'info',
    message: string,
    metrics: Partial<PerformanceMetrics>,
    threshold: number,
    currentValue: number
  ): void {
    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
      metrics,
      threshold,
      currentValue
    };

    this.alerts.push(alert);

    // Log alert
    console.warn(`Performance Alert [${type.toUpperCase()}]: ${message}`);
  }

  private generateRecommendations(
    snapshot: PerformanceSnapshot,
    trends: PerformanceTrend[]
  ): string[] {
    const recommendations: string[] = [];

    // High latency recommendations
    if (snapshot.averageLatency > 2000) {
      recommendations.push('Consider enabling batch processing to reduce individual request latency');
      recommendations.push('Review cache configuration to improve hit rates');
    }

    // Low cache hit rate recommendations
    if (snapshot.cacheHitRate < 0.8) {
      recommendations.push('Optimize cache TTL settings based on user behavior patterns');
      recommendations.push('Enable cache warming for frequently accessed data');
    }

    // High error rate recommendations
    if (snapshot.errorRate > 0.05) {
      recommendations.push('Review error handling and retry policies');
      recommendations.push('Check network resilience configuration');
    }

    // Trend-based recommendations
    const degradingTrends = trends.filter(t => t.direction === 'degrading');
    if (degradingTrends.length > 0) {
      recommendations.push('Performance is degrading in: ' + 
        degradingTrends.map(t => t.metric).join(', '));
    }

    // Batch processing recommendations
    if (snapshot.metrics.batchProcessingTime > 1000) {
      recommendations.push('Consider reducing batch size or timeout for better responsiveness');
    }

    // Deduplication recommendations
    if (snapshot.metrics.deduplicationSavings < 10) {
      recommendations.push('Review request deduplication settings to improve efficiency');
    }

    return recommendations;
  }

  private cleanupOldData(): void {
    // Remove alerts older than 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > weekAgo);

    // Reset counters if they get too large
    if (this.totalOperations > 100000) {
      this.errorCount = Math.floor(this.errorCount / 2);
      this.totalOperations = Math.floor(this.totalOperations / 2);
      this.cacheHits = Math.floor(this.cacheHits / 2);
      this.cacheMisses = Math.floor(this.cacheMisses / 2);
    }
  }

  private getPerformanceMetrics(): PerformanceMetrics {
    // This would typically come from the performance optimizer
    // For now, we'll calculate based on our tracked data
    return {
      batchProcessingTime: this.calculateAverageLatency('batch'),
      deduplicationSavings: this.operationCounts['deduplication'] || 0,
      incrementalSyncEfficiency: this.calculateAverageLatency('incremental'),
      cacheOptimizationGains: this.cacheHits,
      totalRequestsOptimized: this.totalOperations,
      averageResponseTime: this.latencyMeasurements.length > 0
        ? this.latencyMeasurements.reduce((sum, lat) => sum + lat, 0) / this.latencyMeasurements.length
        : 0
    };
  }

  private calculateAverageLatency(operationType: string): number {
    // Simplified calculation - in real implementation would track by operation type
    return this.latencyMeasurements.length > 0
      ? this.latencyMeasurements.reduce((sum, lat) => sum + lat, 0) / this.latencyMeasurements.length
      : 0;
  }
}

// Export singleton instance
export const syncPerformanceMonitor = new SyncPerformanceMonitor();