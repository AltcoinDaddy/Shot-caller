"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SyncStatusIndicator, SyncStatus } from "./sync-status-indicator";
import { SyncErrorDisplay, SyncError } from "./sync-error-display";
import { SyncProgressIndicator, SyncOperation } from "./sync-progress-indicator";
import { SyncLoadingState } from "./sync-loading-state";
import { RefreshCw, Settings, History, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SyncStatusDashboardProps {
  syncStatus: SyncStatus;
  operations: SyncOperation[];
  errors: SyncError[];
  onRetrySync?: () => void;
  onRetryOperation?: (operationId: string) => void;
  onDismissError?: (errorIndex: number) => void;
  onCancelSync?: () => void;
  onConfigureSync?: () => void;
  className?: string;
}

export function SyncStatusDashboard({
  syncStatus,
  operations,
  errors,
  onRetrySync,
  onRetryOperation,
  onDismissError,
  onCancelSync,
  onConfigureSync,
  className
}: SyncStatusDashboardProps) {
  const [activeTab, setActiveTab] = useState("status");

  const activeOperations = operations.filter(op => 
    op.status === "in_progress" || op.status === "retrying"
  );
  const recentErrors = errors.slice(0, 5); // Show only recent errors

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Sync Status
            <SyncStatusIndicator status={syncStatus} variant="compact" />
          </CardTitle>
          <div className="flex items-center gap-2">
            {onRetrySync && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetrySync}
                disabled={syncStatus.isActive}
              >
                <RefreshCw className={cn(
                  "w-4 h-4 mr-2",
                  syncStatus.isActive && "animate-spin"
                )} />
                Sync Now
              </Button>
            )}
            {onConfigureSync && (
              <Button size="sm" variant="ghost" onClick={onConfigureSync}>
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status" className="flex items-center gap-2">
              Status
              {activeOperations.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeOperations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-2">
              Errors
              {recentErrors.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {recentErrors.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Last Sync</h4>
                <div className="text-sm text-muted-foreground">
                  {syncStatus.lastSync 
                    ? syncStatus.lastSync.toLocaleString()
                    : "Never"
                  }
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Next Sync</h4>
                <div className="text-sm text-muted-foreground">
                  {syncStatus.nextSync 
                    ? syncStatus.nextSync.toLocaleString()
                    : "Not scheduled"
                  }
                </div>
              </div>
            </div>

            {activeOperations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Active Operations</h4>
                <SyncProgressIndicator
                  operations={activeOperations}
                  onCancel={onCancelSync}
                  onRetry={onRetryOperation}
                  variant="detailed"
                />
              </div>
            )}

            {activeOperations.length === 0 && !syncStatus.isActive && (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active sync operations</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="errors" className="mt-4 space-y-4">
            {recentErrors.length > 0 ? (
              <div className="space-y-3">
                {recentErrors.map((error, index) => (
                  <SyncErrorDisplay
                    key={`${error.timestamp.getTime()}-${index}`}
                    error={error}
                    onRetry={onRetrySync}
                    onDismiss={() => onDismissError?.(index)}
                    variant="card"
                    showDetails
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent errors</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent Operations</h4>
              {operations.length > 0 ? (
                <div className="space-y-2">
                  {operations.slice(0, 10).map((operation) => (
                    <div
                      key={operation.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {operation.type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {operation.startTime.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            operation.status === "completed" ? "default" :
                            operation.status === "failed" ? "destructive" :
                            "secondary"
                          }
                          className="text-xs"
                        >
                          {operation.status}
                        </Badge>
                        {operation.duration && (
                          <span className="text-xs text-muted-foreground">
                            {Math.round(operation.duration / 1000)}s
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No operation history</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}