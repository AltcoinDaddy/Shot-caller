"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Server,
  Database,
  Wifi,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  responseTime?: number
  lastCheck: Date
  endpoint?: string
  description?: string
}

interface ServiceMonitorProps {
  className?: string
  services?: ServiceStatus[]
  onRefresh?: () => void
  showDetails?: boolean
}

const DEFAULT_SERVICES: ServiceStatus[] = [
  {
    name: 'API Gateway',
    status: 'healthy',
    responseTime: 45,
    lastCheck: new Date(),
    endpoint: '/api/health',
    description: 'Main API endpoints'
  },
  {
    name: 'Database',
    status: 'healthy',
    responseTime: 12,
    lastCheck: new Date(),
    description: 'User data and transactions'
  },
  {
    name: 'Flow Network',
    status: 'healthy',
    responseTime: 89,
    lastCheck: new Date(),
    description: 'Blockchain connectivity'
  },
  {
    name: 'NFT Service',
    status: 'degraded',
    responseTime: 234,
    lastCheck: new Date(),
    description: 'NFT data and metadata'
  }
]

export function DashboardServiceMonitor({ 
  className, 
  services = DEFAULT_SERVICES,
  onRefresh,
  showDetails = false
}: ServiceMonitorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh?.()
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      setIsRefreshing(false)
    }
  }

  const toggleServiceDetails = (serviceName: string) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serviceName)) {
        newSet.delete(serviceName)
      } else {
        newSet.add(serviceName)
      }
      return newSet
    })
  }

  const getOverallStatus = () => {
    const statuses = services.map(s => s.status)
    if (statuses.includes('down')) return 'down'
    if (statuses.includes('degraded')) return 'degraded'
    if (statuses.every(s => s === 'healthy')) return 'healthy'
    return 'unknown'
  }

  const overallStatus = getOverallStatus()
  const healthyCount = services.filter(s => s.status === 'healthy').length
  const totalCount = services.length

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <ServiceStatusBadge status={overallStatus} />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Status Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Services Online</span>
          <span className="font-medium">
            {healthyCount}/{totalCount}
          </span>
        </div>

        {/* Service List */}
        <div className="space-y-2">
          {services.map((service) => (
            <ServiceItem
              key={service.name}
              service={service}
              isExpanded={expandedServices.has(service.name)}
              onToggle={() => toggleServiceDetails(service.name)}
              showDetails={showDetails}
            />
          ))}
        </div>

        {/* System-wide alerts */}
        {overallStatus === 'degraded' && (
          <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Some services are experiencing issues. Functionality may be limited.
            </AlertDescription>
          </Alert>
        )}

        {overallStatus === 'down' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Critical services are down. Please try again later.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

interface ServiceItemProps {
  service: ServiceStatus
  isExpanded: boolean
  onToggle: () => void
  showDetails: boolean
}

function ServiceItem({ service, isExpanded, onToggle, showDetails }: ServiceItemProps) {
  const getServiceIcon = () => {
    switch (service.name.toLowerCase()) {
      case 'api gateway':
        return Server
      case 'database':
        return Database
      case 'flow network':
        return Zap
      default:
        return Wifi
    }
  }

  const ServiceIcon = getServiceIcon()

  return (
    <div className="space-y-2">
      <div 
        className={cn(
          "flex items-center justify-between p-2 rounded-lg transition-colors",
          showDetails && "cursor-pointer hover:bg-muted/50"
        )}
        onClick={showDetails ? onToggle : undefined}
      >
        <div className="flex items-center space-x-3">
          <ServiceIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">{service.name}</div>
            {service.description && (
              <div className="text-xs text-muted-foreground">
                {service.description}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {service.responseTime && (
            <span className="text-xs text-muted-foreground">
              {service.responseTime}ms
            </span>
          )}
          <ServiceStatusBadge status={service.status} size="sm" />
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && showDetails && (
        <div className="ml-7 p-2 bg-muted/30 rounded text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Check:</span>
            <span>{service.lastCheck.toLocaleTimeString()}</span>
          </div>
          {service.endpoint && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Endpoint:</span>
              <span className="font-mono">{service.endpoint}</span>
            </div>
          )}
          {service.responseTime && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Response Time:</span>
              <span>{service.responseTime}ms</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ServiceStatusBadgeProps {
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  size?: 'sm' | 'default'
}

function ServiceStatusBadge({ status, size = 'default' }: ServiceStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          label: 'Healthy',
          className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800'
        }
      case 'degraded':
        return {
          icon: AlertTriangle,
          label: 'Degraded',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800'
        }
      case 'down':
        return {
          icon: XCircle,
          label: 'Down',
          className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800'
        }
      default:
        return {
          icon: AlertTriangle,
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800'
        }
    }
  }

  const { icon: Icon, label, className } = getStatusConfig()
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <Badge variant="outline" className={cn(className, textSize)}>
      <Icon className={cn(iconSize, "mr-1")} />
      {label}
    </Badge>
  )
}

// Compact version for dashboard header
export function CompactServiceMonitor({ className }: { className?: string }) {
  const [services] = useState(DEFAULT_SERVICES)
  const overallStatus = services.every(s => s.status === 'healthy') ? 'healthy' : 
                       services.some(s => s.status === 'down') ? 'down' : 'degraded'

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Activity className="h-4 w-4 text-muted-foreground" />
      <ServiceStatusBadge status={overallStatus} size="sm" />
    </div>
  )
}