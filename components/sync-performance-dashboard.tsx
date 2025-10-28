"use client";

/**
 * Sync Performance Dashboard Component
 * Displays performance metrics, trends, and optimization controls
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Zap, 
  Database, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';
import { useSyncPerformance, useSyncPerformanceAlerts } from '@/hooks/use-sync-performance';

export function SyncPerformanceDashboard() {
  const {
    metrics,
    snapshot,
    trends,
    alerts: performanceAlerts,
    isOptimizing,
    optimizationConfig,
    refreshMetrics,
    optimizeForUser,
    configureOptimization,
    clearPerformanceData,
    exportPerformanceData,
    getPerformanceReport
  } = useSyncPerformance();

  const {
    alerts,
    unreadCount,
    dismissAlert,
    markAllAsRead
  } = useSyncPerformanceAlerts();

  const handleOptimizeForUser = async () => {
    // In a real app, this would get the current user's address
    const mockAddress = '0x1234567890abcdef';
    await optimizeForUser(mockAddress);
  };

  const handleExportData = () => {
    const data = exportPerformanceData();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sync-performance-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'degrading': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sync Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and optimize wallet-profile synchronization performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={isOptimizing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Performance Alerts</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} new</Badge>
            )}
          </div>
          {alerts.slice(0, 3).map((alert) => (
            <Alert key={alert.id} className={
              alert.type === 'error' ? 'border-red-200' : 
              alert.type === 'warning' ? 'border-yellow-200' : 'border-blue-200'
            }>
              {getAlertIcon(alert.type)}
              <AlertTitle className="flex items-center justify-between">
                {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                >
                  ×
                </Button>
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
          {alerts.length > 3 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              View all {alerts.length} alerts
            </Button>
          )}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics ? formatDuration(metrics.averageResponseTime) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {snapshot && snapshot.averageLatency < 2000 ? 'Good' : 'Needs attention'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {snapshot ? formatPercentage(snapshot.cacheHitRate) : 'N/A'}
                </div>
                <Progress 
                  value={snapshot ? snapshot.cacheHitRate * 100 : 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requests Optimized</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics ? metrics.totalRequestsOptimized.toLocaleString() : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total optimizations applied
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {snapshot ? formatPercentage(snapshot.errorRate) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {snapshot && snapshot.errorRate < 0.05 ? 'Excellent' : 'Monitor closely'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Status */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Status</CardTitle>
              <CardDescription>
                Current performance optimization features and their status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span>Batch Processing</span>
                  <Badge variant={optimizationConfig.batchingEnabled ? 'default' : 'secondary'}>
                    {optimizationConfig.batchingEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Request Deduplication</span>
                  <Badge variant={optimizationConfig.deduplicationEnabled ? 'default' : 'secondary'}>
                    {optimizationConfig.deduplicationEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Incremental Sync</span>
                  <Badge variant={optimizationConfig.incrementalSyncEnabled ? 'default' : 'secondary'}>
                    {optimizationConfig.incrementalSyncEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cache Optimization</span>
                  <Badge variant={optimizationConfig.cacheOptimizationEnabled ? 'default' : 'secondary'}>
                    {optimizationConfig.cacheOptimizationEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              
              <Button 
                onClick={handleOptimizeForUser}
                disabled={isOptimizing}
                className="w-full"
              >
                {isOptimizing ? 'Optimizing...' : 'Optimize Cache for Current User'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Batch Processing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Average Processing Time:</span>
                  <span>{metrics ? formatDuration(metrics.batchProcessingTime) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deduplication Savings:</span>
                  <span>{metrics ? metrics.deduplicationSavings : 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incremental Sync</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Efficiency Score:</span>
                  <span>{metrics ? formatDuration(metrics.incrementalSyncEfficiency) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Optimization Gains:</span>
                  <span>{metrics ? metrics.cacheOptimizationGains : 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {snapshot && (
            <Card>
              <CardHeader>
                <CardTitle>Operation Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(snapshot.operationCounts).map(([operation, count]) => (
                    <div key={operation} className="flex justify-between">
                      <span className="capitalize">{operation.replace(/_/g, ' ')}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Recent performance trends across key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trends.length > 0 ? (
                <div className="space-y-3">
                  {trends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(trend.direction)}
                        <span className="capitalize">{trend.metric.replace(/([A-Z])/g, ' $1')}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {trend.changePercent.toFixed(1)}% {trend.direction}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {trend.timeframe}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No trend data available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Optimization Settings
              </CardTitle>
              <CardDescription>
                Configure performance optimization features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Batch Processing</label>
                    <p className="text-sm text-muted-foreground">
                      Group multiple operations for better efficiency
                    </p>
                  </div>
                  <Switch
                    checked={optimizationConfig.batchingEnabled}
                    onCheckedChange={(checked) => 
                      configureOptimization({ enableBatching: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Request Deduplication</label>
                    <p className="text-sm text-muted-foreground">
                      Prevent redundant API calls
                    </p>
                  </div>
                  <Switch
                    checked={optimizationConfig.deduplicationEnabled}
                    onCheckedChange={(checked) => 
                      configureOptimization({ enableDeduplication: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Incremental Sync</label>
                    <p className="text-sm text-muted-foreground">
                      Use delta updates for large collections
                    </p>
                  </div>
                  <Switch
                    checked={optimizationConfig.incrementalSyncEnabled}
                    onCheckedChange={(checked) => 
                      configureOptimization({ enableIncrementalSync: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Cache Optimization</label>
                    <p className="text-sm text-muted-foreground">
                      Optimize cache based on user behavior
                    </p>
                  </div>
                  <Switch
                    checked={optimizationConfig.cacheOptimizationEnabled}
                    onCheckedChange={(checked) => 
                      configureOptimization({ enableCacheOptimization: checked })
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={clearPerformanceData}
                  className="w-full"
                >
                  Clear Performance Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}