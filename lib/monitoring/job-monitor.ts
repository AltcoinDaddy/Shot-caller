import { Queue, Job } from 'bullmq';
import { 
  statsQueue, 
  scoringQueue, 
  rewardsQueue, 
  maintenanceQueue,
  JobMonitor 
} from '@/lib/jobs/job-queue';
import { cacheService } from '@/lib/cache/cache-service';

interface JobMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  total: number;
  throughput: number; // jobs per minute
  avgProcessingTime: number; // milliseconds
  errorRate: number; // percentage
  lastUpdated: Date;
}

interface JobHealth {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  lastCheck: Date;
}

class EnhancedJobMonitor {
  private static readonly METRICS_CACHE_TTL = 60; // 1 minute
  private static readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private static healthCheckTimer: NodeJS.Timeout | null = null;

  // Get comprehensive job metrics
  static async getJobMetrics(): Promise<JobMetrics[]> {
    const cacheKey = 'job-metrics';
    
    // Try cache first
    const cached = await cacheService.get<JobMetrics[]>(cacheKey);
    if (cached) return cached;

    const queues = [
      { name: 'stats', queue: statsQueue },
      { name: 'scoring', queue: scoringQueue },
      { name: 'rewards', queue: rewardsQueue },
      { name: 'maintenance', queue: maintenanceQueue },
    ];

    const metrics: JobMetrics[] = [];

    for (const { name, queue } of queues) {
      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(0, -1),
        queue.getFailed(0, -1),
        queue.getDelayed(),
        queue.getPaused(),
      ]);

      // Calculate throughput (jobs completed in last hour)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentCompleted = completed.filter(job => 
        job.finishedOn && job.finishedOn > oneHourAgo
      );
      const throughput = recentCompleted.length;

      // Calculate average processing time
      const processingTimes = recentCompleted
        .filter(job => job.processedOn && job.finishedOn)
        .map(job => job.finishedOn! - job.processedOn!);
      
      const avgProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

      // Calculate error rate
      const totalJobs = completed.length + failed.length;
      const errorRate = totalJobs > 0 ? (failed.length / totalJobs) * 100 : 0;

      metrics.push({
        queueName: name,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: paused.length,
        total: waiting.length + active.length + completed.length + failed.length,
        throughput,
        avgProcessingTime,
        errorRate,
        lastUpdated: new Date(),
      });
    }

    // Cache metrics
    await cacheService.set(cacheKey, metrics, this.METRICS_CACHE_TTL);
    
    return metrics;
  }

  // Health check for job system
  static async checkJobHealth(): Promise<JobHealth> {
    const metrics = await this.getJobMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];

    for (const metric of metrics) {
      // Check for high failure rate
      if (metric.errorRate > 10) {
        issues.push(`High error rate in ${metric.queueName} queue: ${metric.errorRate.toFixed(1)}%`);
        recommendations.push(`Investigate failed jobs in ${metric.queueName} queue`);
      }

      // Check for stuck jobs
      if (metric.active > 0 && metric.avgProcessingTime > 300000) { // 5 minutes
        issues.push(`Long-running jobs in ${metric.queueName} queue`);
        recommendations.push(`Check for stuck jobs in ${metric.queueName} queue`);
      }

      // Check for queue backlog
      if (metric.waiting > 100) {
        issues.push(`Large backlog in ${metric.queueName} queue: ${metric.waiting} jobs`);
        recommendations.push(`Consider scaling workers for ${metric.queueName} queue`);
      }

      // Check for low throughput
      if (metric.throughput < 1 && metric.waiting > 0) {
        issues.push(`Low throughput in ${metric.queueName} queue`);
        recommendations.push(`Check worker performance for ${metric.queueName} queue`);
      }
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations,
      lastCheck: new Date(),
    };
  }

  // Get detailed job information
  static async getJobDetails(queueName: string, jobId: string): Promise<any> {
    const queue = this.getQueueByName(queueName);
    if (!queue) return null;

    const job = await queue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      opts: job.opts,
      progress: job.progress,
      delay: job.delay,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      attemptsMade: job.attemptsMade,
    };
  }

  // Get job logs
  static async getJobLogs(queueName: string, limit: number = 50): Promise<any[]> {
    const queue = this.getQueueByName(queueName);
    if (!queue) return [];

    const [completed, failed] = await Promise.all([
      queue.getCompleted(0, Math.floor(limit / 2) - 1),
      queue.getFailed(0, Math.floor(limit / 2) - 1),
    ]);

    const logs = [...completed, ...failed]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limit)
      .map(job => ({
        id: job.id,
        name: job.name,
        status: job.finishedOn ? (job.failedReason ? 'failed' : 'completed') : 'processing',
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        duration: job.processedOn && job.finishedOn 
          ? job.finishedOn - job.processedOn 
          : null,
        failedReason: job.failedReason,
        progress: job.progress,
      }));

    return logs;
  }

  // Performance analytics
  static async getPerformanceAnalytics(queueName: string, hours: number = 24): Promise<any> {
    const queue = this.getQueueByName(queueName);
    if (!queue) return null;

    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const [completed, failed] = await Promise.all([
      queue.getCompleted(0, -1),
      queue.getFailed(0, -1),
    ]);

    const recentCompleted = completed.filter(job => 
      job.finishedOn && job.finishedOn > cutoff
    );
    const recentFailed = failed.filter(job => 
      job.finishedOn && job.finishedOn > cutoff
    );

    // Processing time distribution
    const processingTimes = recentCompleted
      .filter(job => job.processedOn && job.finishedOn)
      .map(job => job.finishedOn! - job.processedOn!);

    const sortedTimes = processingTimes.sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

    // Hourly breakdown
    const hourlyStats = {};
    for (let i = 0; i < hours; i++) {
      const hourStart = Date.now() - (i + 1) * 60 * 60 * 1000;
      const hourEnd = Date.now() - i * 60 * 60 * 1000;
      
      const hourCompleted = recentCompleted.filter(job => 
        job.finishedOn! >= hourStart && job.finishedOn! < hourEnd
      ).length;
      
      const hourFailed = recentFailed.filter(job => 
        job.finishedOn! >= hourStart && job.finishedOn! < hourEnd
      ).length;

      hourlyStats[i] = {
        hour: new Date(hourStart).getHours(),
        completed: hourCompleted,
        failed: hourFailed,
        total: hourCompleted + hourFailed,
      };
    }

    return {
      totalCompleted: recentCompleted.length,
      totalFailed: recentFailed.length,
      successRate: recentCompleted.length + recentFailed.length > 0
        ? (recentCompleted.length / (recentCompleted.length + recentFailed.length)) * 100
        : 100,
      avgProcessingTime: processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0,
      percentiles: {
        p50,
        p95,
        p99,
      },
      hourlyStats,
    };
  }

  // Start continuous health monitoring
  static startHealthMonitoring(): void {
    if (this.healthCheckTimer) return;

    this.healthCheckTimer = setInterval(async () => {
      try {
        const health = await this.checkJobHealth();
        
        if (!health.isHealthy) {
          console.warn('Job system health issues detected:', health.issues);
          
          // Cache health status for dashboard
          await cacheService.set('job-health', health, 300); // 5 minutes
          
          // Could send alerts here (email, Slack, etc.)
          this.sendHealthAlert(health);
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, this.HEALTH_CHECK_INTERVAL);

    console.log('Job health monitoring started');
  }

  // Stop health monitoring
  static stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('Job health monitoring stopped');
    }
  }

  // Send health alerts (placeholder for actual implementation)
  private static async sendHealthAlert(health: JobHealth): Promise<void> {
    // This would integrate with your alerting system
    // For now, just log the alert
    console.log('🚨 Job Health Alert:', {
      timestamp: health.lastCheck,
      issues: health.issues,
      recommendations: health.recommendations,
    });

    // Could integrate with:
    // - Email notifications
    // - Slack webhooks
    // - PagerDuty
    // - Discord webhooks
    // - SMS alerts
  }

  // Utility methods
  private static getQueueByName(name: string): Queue | null {
    switch (name) {
      case 'stats': return statsQueue;
      case 'scoring': return scoringQueue;
      case 'rewards': return rewardsQueue;
      case 'maintenance': return maintenanceQueue;
      default: return null;
    }
  }

  // Clean up old job data
  static async cleanupOldJobs(olderThanDays: number = 7): Promise<void> {
    const queues = [statsQueue, scoringQueue, rewardsQueue, maintenanceQueue];
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    for (const queue of queues) {
      try {
        await queue.clean(cutoff, 100, 'completed');
        await queue.clean(cutoff, 50, 'failed');
        console.log(`Cleaned old jobs from ${queue.name}`);
      } catch (error) {
        console.error(`Failed to clean jobs from ${queue.name}:`, error);
      }
    }
  }

  // Export metrics for external monitoring
  static async exportMetrics(): Promise<string> {
    const metrics = await this.getJobMetrics();
    const health = await this.checkJobHealth();

    // Prometheus format
    let output = '# HELP shotcaller_jobs_total Total number of jobs by queue and status\n';
    output += '# TYPE shotcaller_jobs_total counter\n';

    for (const metric of metrics) {
      output += `shotcaller_jobs_total{queue="${metric.queueName}",status="waiting"} ${metric.waiting}\n`;
      output += `shotcaller_jobs_total{queue="${metric.queueName}",status="active"} ${metric.active}\n`;
      output += `shotcaller_jobs_total{queue="${metric.queueName}",status="completed"} ${metric.completed}\n`;
      output += `shotcaller_jobs_total{queue="${metric.queueName}",status="failed"} ${metric.failed}\n`;
    }

    output += '\n# HELP shotcaller_job_processing_time_ms Average job processing time in milliseconds\n';
    output += '# TYPE shotcaller_job_processing_time_ms gauge\n';

    for (const metric of metrics) {
      output += `shotcaller_job_processing_time_ms{queue="${metric.queueName}"} ${metric.avgProcessingTime}\n`;
    }

    output += '\n# HELP shotcaller_job_error_rate Job error rate percentage\n';
    output += '# TYPE shotcaller_job_error_rate gauge\n';

    for (const metric of metrics) {
      output += `shotcaller_job_error_rate{queue="${metric.queueName}"} ${metric.errorRate}\n`;
    }

    output += '\n# HELP shotcaller_job_system_healthy Job system health status\n';
    output += '# TYPE shotcaller_job_system_healthy gauge\n';
    output += `shotcaller_job_system_healthy ${health.isHealthy ? 1 : 0}\n`;

    return output;
  }
}

// Initialize monitoring when module is loaded
if (process.env.NODE_ENV === 'production') {
  EnhancedJobMonitor.startHealthMonitoring();
}

export { EnhancedJobMonitor };