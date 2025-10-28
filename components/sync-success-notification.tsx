"use client";

import { useState, useEffect } from "react";
import { CheckCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SyncSuccessNotificationProps {
  show: boolean;
  message?: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
}

export function SyncSuccessNotification({
  show,
  message = "Profile synchronized successfully",
  onDismiss,
  autoHide = true,
  autoHideDelay = 3000,
  className
}: SyncSuccessNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onDismiss?.(), 300); // Wait for animation to complete
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [show, autoHide, autoHideDelay, onDismiss]);

  if (!show && !isVisible) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 transition-all duration-300 ease-out",
      isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      className
    )}>
      <Card className="p-4 bg-green-50 border-green-200 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              {message}
            </p>
          </div>
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onDismiss(), 300);
              }}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export interface SyncProgressNotificationProps {
  show: boolean;
  message?: string;
  progress?: number;
  onCancel?: () => void;
  className?: string;
}

export function SyncProgressNotification({
  show,
  message = "Synchronizing profile...",
  progress,
  onCancel,
  className
}: SyncProgressNotificationProps) {
  if (!show) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 fade-in duration-300",
      className
    )}>
      <Card className="p-4 bg-blue-50 border-blue-200 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">
              {message}
            </p>
            {progress !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-blue-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          {onCancel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}