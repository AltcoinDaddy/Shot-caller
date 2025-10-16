"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, RefreshCw, Wallet, ExternalLink, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export interface PaymentError {
  type: 'insufficient_funds' | 'transaction_failed' | 'network_error' | 'user_rejected' | 'timeout' | 'unknown'
  message: string
  transactionHash?: string
  requiredAmount?: number
  currentBalance?: number
  code?: string
}

interface PaymentErrorHandlerProps {
  error: PaymentError | null
  isOpen: boolean
  onClose: () => void
  onRetry?: () => void
  onGetFlow?: () => void
  retryDisabled?: boolean
}

export function PaymentErrorHandler({
  error,
  isOpen,
  onClose,
  onRetry,
  onGetFlow,
  retryDisabled = false
}: PaymentErrorHandlerProps) {
  if (!error) return null

  const getErrorConfig = (error: PaymentError) => {
    switch (error.type) {
      case 'insufficient_funds':
        return {
          title: 'Insufficient FLOW Balance',
          description: 'You don\'t have enough FLOW tokens to complete this transaction.',
          icon: <Wallet className="w-6 h-6 text-amber-500" />,
          severity: 'warning' as const,
          showGetFlow: true,
          retryable: false
        }
      
      case 'transaction_failed':
        return {
          title: 'Transaction Failed',
          description: 'The blockchain transaction could not be completed.',
          icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
          severity: 'error' as const,
          showGetFlow: false,
          retryable: true
        }
      
      case 'network_error':
        return {
          title: 'Network Error',
          description: 'Unable to connect to the Flow blockchain. Please check your connection.',
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          severity: 'warning' as const,
          showGetFlow: false,
          retryable: true
        }
      
      case 'user_rejected':
        return {
          title: 'Transaction Cancelled',
          description: 'You cancelled the transaction in your wallet.',
          icon: <Info className="w-6 h-6 text-blue-500" />,
          severity: 'info' as const,
          showGetFlow: false,
          retryable: true
        }
      
      case 'timeout':
        return {
          title: 'Transaction Timeout',
          description: 'The transaction took too long to complete.',
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          severity: 'warning' as const,
          showGetFlow: false,
          retryable: true
        }
      
      default:
        return {
          title: 'Payment Error',
          description: 'An unexpected error occurred during payment.',
          icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
          severity: 'error' as const,
          showGetFlow: false,
          retryable: true
        }
    }
  }

  const config = getErrorConfig(error)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {config.icon}
            <DialogTitle>{config.title}</DialogTitle>
          </div>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error details */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>{error.message}</div>
                
                {error.code && (
                  <div className="text-xs text-muted-foreground">
                    Error Code: {error.code}
                  </div>
                )}
                
                {error.transactionHash && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Transaction: </span>
                    <code className="text-xs bg-muted px-1 rounded">
                      {error.transactionHash.slice(0, 8)}...{error.transactionHash.slice(-8)}
                    </code>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Balance information for insufficient funds */}
          {error.type === 'insufficient_funds' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Balance Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Required:</span>
                  <Badge variant="outline">
                    {error.requiredAmount?.toFixed(4) || '0.0000'} FLOW
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Current Balance:</span>
                  <Badge variant={error.currentBalance && error.currentBalance > 0 ? "default" : "destructive"}>
                    {error.currentBalance?.toFixed(4) || '0.0000'} FLOW
                  </Badge>
                </div>
                {error.requiredAmount && error.currentBalance && (
                  <div className="flex justify-between text-sm">
                    <span>Needed:</span>
                    <Badge variant="destructive">
                      {(error.requiredAmount - error.currentBalance).toFixed(4)} FLOW
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Troubleshooting tips */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="font-medium">Troubleshooting:</div>
            {error.type === 'insufficient_funds' && (
              <ul className="list-disc list-inside space-y-1">
                <li>Purchase FLOW tokens from a supported exchange</li>
                <li>Transfer FLOW from another wallet</li>
                <li>Check if you have pending transactions</li>
              </ul>
            )}
            {error.type === 'network_error' && (
              <ul className="list-disc list-inside space-y-1">
                <li>Check your internet connection</li>
                <li>Try refreshing the page</li>
                <li>Wait a moment and try again</li>
              </ul>
            )}
            {error.type === 'transaction_failed' && (
              <ul className="list-disc list-inside space-y-1">
                <li>Ensure your wallet is unlocked</li>
                <li>Check for sufficient gas fees</li>
                <li>Try with a smaller amount first</li>
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {config.showGetFlow && onGetFlow && (
            <Button
              variant="outline"
              onClick={onGetFlow}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Get FLOW Tokens
            </Button>
          )}
          
          {config.retryable && onRetry && (
            <Button
              onClick={onRetry}
              disabled={retryDisabled}
              className="flex items-center gap-2"
            >
              {retryDisabled ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Try Again
            </Button>
          )}
          
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook for handling payment errors
 */
export function usePaymentErrorHandler() {
  const [error, setError] = React.useState<PaymentError | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  const showError = React.useCallback((error: PaymentError) => {
    setError(error)
    setIsOpen(true)
  }, [])

  const hideError = React.useCallback(() => {
    setIsOpen(false)
    // Clear error after animation completes
    setTimeout(() => setError(null), 200)
  }, [])

  const classifyPaymentError = React.useCallback((error: any): PaymentError => {
    if (error.message?.includes('insufficient funds') || error.code === 'INSUFFICIENT_FUNDS') {
      return {
        type: 'insufficient_funds',
        message: error.message || 'Insufficient FLOW balance',
        requiredAmount: error.requiredAmount,
        currentBalance: error.currentBalance,
        code: error.code
      }
    }

    if (error.message?.includes('user rejected') || error.code === 'USER_REJECTED') {
      return {
        type: 'user_rejected',
        message: 'Transaction was cancelled by user',
        code: error.code
      }
    }

    if (error.message?.includes('network') || error.message?.includes('connection')) {
      return {
        type: 'network_error',
        message: error.message || 'Network connection error',
        code: error.code
      }
    }

    if (error.message?.includes('timeout')) {
      return {
        type: 'timeout',
        message: error.message || 'Transaction timed out',
        transactionHash: error.transactionHash,
        code: error.code
      }
    }

    if (error.transactionHash) {
      return {
        type: 'transaction_failed',
        message: error.message || 'Transaction failed on blockchain',
        transactionHash: error.transactionHash,
        code: error.code
      }
    }

    return {
      type: 'unknown',
      message: error.message || 'An unexpected payment error occurred',
      code: error.code
    }
  }, [])

  const handlePaymentError = React.useCallback((error: any) => {
    const paymentError = classifyPaymentError(error)
    showError(paymentError)
    
    // Log error for monitoring
    console.error('Payment error:', {
      type: paymentError.type,
      message: paymentError.message,
      code: paymentError.code,
      transactionHash: paymentError.transactionHash,
      timestamp: new Date().toISOString()
    })
  }, [classifyPaymentError, showError])

  return {
    error,
    isOpen,
    showError,
    hideError,
    handlePaymentError,
    PaymentErrorDialog: (props: Omit<PaymentErrorHandlerProps, 'error' | 'isOpen' | 'onClose'>) => (
      <PaymentErrorHandler
        error={error}
        isOpen={isOpen}
        onClose={hideError}
        {...props}
      />
    )
  }
}