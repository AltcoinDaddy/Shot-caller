"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  AlertTriangle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Wifi, 
  Shield, 
  Clock,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export enum SyncErrorType {
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  API_ERROR = 'api_error',
  VALIDATION_ERROR = 'validation_error',
  CACHE_ERROR = 'cache_error',
  TIMEOUT_ERROR = 'timeout_error'
}

export interface SyncError {
  type: SyncErrorType;
  message: string;
  code?: string;
  operation: string;
  timestamp: Date;
  retryable: boolean;
  context?: Record<string, any>;
}

export interface SyncErrorDisplayProps {
  error: SyncError;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryCount?: number;
  maxRetries?: number;
  isRetrying?: boolean;
  variant?: "inline" | "card" | "banner";
  showDetails?: boolean;
  className?: string;
}

export function SyncErrorDisplay({
  error,
  onRetry,
  onDismiss,
  retryCount = 0,
  maxRetries = 3,
  isRetrying = false,
  variant = "card",
  showDetails = false,
  className
}: SyncErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getErrorIcon = () => {
    switch (error.type) {
      case SyncErrorType.NETWORK_ERROR:
        return Wifi;
      case SyncErrorType.AUTHENTICATION_ERROR:
        return Shield;
      case SyncErrorType.TIMEOUT_ERROR:
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  const getErrorSeverity = () => {
    switch (error.type) {
      case SyncErrorType.NETWORK_ERROR:
      case SyncErrorType.TIMEOUT_ERROR:
        return "warning";
      case SyncErrorType.AUTHENTICATION_ERROR:
      case SyncErrorType.API_ERROR:
        return "destructive";
      default:
        return "default";
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case SyncErrorType.NETWORK_ERROR:
        return "Connection Error";
      case SyncErrorType.AUTHENTICATION_ERROR:
        return "Authentication Failed";
      case SyncErrorType.API_ERROR:
        return "Service Error";
      case SyncErrorType.VALIDATION_ERROR:
        return "Data Validation Error";
      case SyncErrorType.CACHE_ERROR:
        return "Cache Error";
      case SyncErrorType.TIMEOUT_ERROR:
        return "Request Timeout";
      default:
        return "Sync Error";
    }
  };

  const getActionableMessage = () => {
    switch (error.type) {
      case SyncErrorType.NETWORK_ERROR:
        return "Check your internet connection and try again.";
      case SyncErrorType.AUTHENTICATION_ERROR:
        return "Please reconnect your wallet to continue.";
      case SyncErrorType.TIMEOUT_ERROR:
        return "The request took too long. Please try again.";
      case SyncErrorType.API_ERROR:
        return "There was a problem with the service. Please try again later.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  const Icon = getErrorIcon();
  const severity = getErrorSeverity();
  const canRetry = error.retryable && retryCount < maxRetries && onRetry;

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <Icon className="w-4 h-4 text-destructive" />
        <span className="text-destructive">{error.message}</span>
        {canRetry && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetry}
            disabled={isRetrying}
            className="h-6 px-2 text-xs"
          >
            {isRetrying ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <Alert variant={severity} className={cn("border-l-4", className)}>
        <Icon className="h-4 w-4" />
        <div className="flex items-center justify-between w-full">
          <div>
            <AlertTitle className="text-sm font-medium">
              {getErrorTitle()}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {getActionableMessage()}
            </AlertDescription>
          </div>
          <div className="flex items-center gap-2">
            {retryCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {retryCount}/{maxRetries} attempts
              </Badge>
            )}
            {canRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </>
                )}
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <Alert variant={severity} className={cn("", className)}>
      <Icon className="h-4 w-4" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <AlertTitle className="text-sm font-medium">
            {getErrorTitle()}
          </AlertTitle>
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <AlertDescription className="text-sm mt-1">
          {getActionableMessage()}
        </AlertDescription>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {retryCount > 0 && (
              <Badge variant="outline" className="text-xs">
                Attempt {retryCount}/{maxRetries}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {error.operation}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {showDetails && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-xs">
                    Details
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 ml-1" />
                    ) : (
                      <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            )}
            
            {canRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {showDetails && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleContent className="mt-3 pt-3 border-t">
              <div className="text-xs space-y-2">
                <div>
                  <span className="font-medium">Error:</span> {error.message}
                </div>
                {error.code && (
                  <div>
                    <span className="font-medium">Code:</span> {error.code}
                  </div>
                )}
                <div>
                  <span className="font-medium">Time:</span> {error.timestamp.toLocaleString()}
                </div>
                {error.context && Object.keys(error.context).length > 0 && (
                  <div>
                    <span className="font-medium">Context:</span>
                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(error.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </Alert>
  );
}