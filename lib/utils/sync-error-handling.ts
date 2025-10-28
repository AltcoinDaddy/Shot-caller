/**
 * Enhanced sync error handling utilities
 * Provides user-friendly error messaging and troubleshooting guidance
 */

import { 
  SyncError, 
  SyncErrorType, 
  SyncErrorSeverity,
  RecoveryStrategy,
  getUserFriendlyMessage,
  getActionableSteps
} from './sync-error-classification';

export interface ErrorDisplayOptions {
  showTechnicalDetails?: boolean;
  showRetryButton?: boolean;
  showContactSupport?: boolean;
  customActions?: ErrorAction[];
}

export interface ErrorAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
}

export interface ErrorNotification {
  id: string;
  title: string;
  message: string;
  severity: SyncErrorSeverity;
  actions: ErrorAction[];
  dismissible: boolean;
  autoHide?: number;
  persistent?: boolean;
}

export interface TroubleshootingGuide {
  title: string;
  description: string;
  steps: TroubleshootingStep[];
  relatedErrors: SyncErrorType[];
}

export interface TroubleshootingStep {
  title: string;
  description: string;
  action?: () => void;
  completed?: boolean;
}

/**
 * Comprehensive troubleshooting guides for different error types
 */
export const TROUBLESHOOTING_GUIDES: Record<SyncErrorType, TroubleshootingGuide> = {
  [SyncErrorType.NETWORK_ERROR]: {
    title: 'Network Connection Issues',
    description: 'Your device is having trouble connecting to our servers.',
    steps: [
      {
        title: 'Check Internet Connection',
        description: 'Ensure you have a stable internet connection by trying to visit other websites.'
      },
      {
        title: 'Disable VPN or Proxy',
        description: 'If using a VPN or proxy, try disabling it temporarily.'
      },
      {
        title: 'Clear Browser Cache',
        description: 'Clear your browser cache and cookies, then refresh the page.'
      },
      {
        title: 'Try Different Network',
        description: 'Switch to a different network (mobile data, different WiFi) to test connectivity.'
      }
    ],
    relatedErrors: [SyncErrorType.TIMEOUT_ERROR, SyncErrorType.API_ERROR]
  },

  [SyncErrorType.AUTHENTICATION_ERROR]: {
    title: 'Wallet Authentication Problems',
    description: 'There\'s an issue with your wallet connection or authentication.',
    steps: [
      {
        title: 'Reconnect Wallet',
        description: 'Disconnect and reconnect your wallet using the wallet menu.'
      },
      {
        title: 'Check Wallet Extension',
        description: 'Ensure your wallet extension (Dapper, Flow) is installed and enabled.'
      },
      {
        title: 'Update Wallet Extension',
        description: 'Check if your wallet extension needs to be updated to the latest version.'
      },
      {
        title: 'Clear Wallet Cache',
        description: 'Clear your wallet extension\'s cache and stored data.'
      }
    ],
    relatedErrors: [SyncErrorType.WALLET_ERROR]
  },

  [SyncErrorType.API_ERROR]: {
    title: 'Service Unavailable',
    description: 'Our servers are experiencing issues or are temporarily unavailable.',
    steps: [
      {
        title: 'Wait and Retry',
        description: 'Wait a few minutes and try the operation again.'
      },
      {
        title: 'Check Service Status',
        description: 'Visit our status page to check if there are known service issues.'
      },
      {
        title: 'Use Cached Data',
        description: 'The app will use cached data when available during service issues.'
      },
      {
        title: 'Contact Support',
        description: 'If the issue persists for more than 30 minutes, contact our support team.'
      }
    ],
    relatedErrors: [SyncErrorType.RATE_LIMIT_ERROR, SyncErrorType.TIMEOUT_ERROR]
  },

  [SyncErrorType.BLOCKCHAIN_ERROR]: {
    title: 'Blockchain Connection Issues',
    description: 'Unable to connect to the Flow blockchain to fetch your NFT data.',
    steps: [
      {
        title: 'Check Flow Network Status',
        description: 'Visit Flow\'s status page to check if the network is experiencing issues.'
      },
      {
        title: 'Wait for Network Recovery',
        description: 'Blockchain networks occasionally have temporary issues. Wait and try again.'
      },
      {
        title: 'Use Cached NFT Data',
        description: 'Your previously synced NFT collection will be available from cache.'
      },
      {
        title: 'Try Different RPC Endpoint',
        description: 'The app will automatically try different blockchain endpoints.'
      }
    ],
    relatedErrors: [SyncErrorType.TIMEOUT_ERROR, SyncErrorType.API_ERROR]
  },

  [SyncErrorType.WALLET_ERROR]: {
    title: 'Wallet Connection Problems',
    description: 'There\'s an issue with your wallet software or connection.',
    steps: [
      {
        title: 'Check Wallet Extension',
        description: 'Ensure your wallet extension is installed, enabled, and unlocked.'
      },
      {
        title: 'Refresh Browser',
        description: 'Refresh the page or restart your browser.'
      },
      {
        title: 'Try Different Wallet',
        description: 'If you have multiple wallets, try connecting with a different one.'
      },
      {
        title: 'Reinstall Wallet Extension',
        description: 'As a last resort, try reinstalling your wallet extension.'
      }
    ],
    relatedErrors: [SyncErrorType.AUTHENTICATION_ERROR]
  },

  [SyncErrorType.VALIDATION_ERROR]: {
    title: 'Data Validation Issues',
    description: 'The data from your wallet or profile doesn\'t match expected formats.',
    steps: [
      {
        title: 'Check Wallet Address',
        description: 'Ensure your wallet address is valid and properly formatted.'
      },
      {
        title: 'Verify NFT Collection',
        description: 'Check that your NFTs are properly minted and visible in your wallet.'
      },
      {
        title: 'Clear Profile Cache',
        description: 'Clear your profile cache to force a fresh data sync.'
      },
      {
        title: 'Contact Support',
        description: 'If your data appears correct, contact support for assistance.'
      }
    ],
    relatedErrors: [SyncErrorType.DATA_CORRUPTION_ERROR]
  },

  [SyncErrorType.CACHE_ERROR]: {
    title: 'Cache Storage Problems',
    description: 'There\'s an issue with storing or retrieving cached data.',
    steps: [
      {
        title: 'Clear Browser Cache',
        description: 'Clear your browser\'s cache and local storage.'
      },
      {
        title: 'Check Storage Space',
        description: 'Ensure your device has sufficient storage space available.'
      },
      {
        title: 'Disable Extensions',
        description: 'Temporarily disable browser extensions that might interfere with storage.'
      },
      {
        title: 'Try Incognito Mode',
        description: 'Test the app in incognito/private browsing mode.'
      }
    ],
    relatedErrors: [SyncErrorType.DATA_CORRUPTION_ERROR]
  },

  [SyncErrorType.TIMEOUT_ERROR]: {
    title: 'Request Timeout',
    description: 'Operations are taking longer than expected to complete.',
    steps: [
      {
        title: 'Check Connection Speed',
        description: 'Test your internet connection speed and stability.'
      },
      {
        title: 'Reduce Concurrent Operations',
        description: 'Avoid performing multiple sync operations simultaneously.'
      },
      {
        title: 'Wait and Retry',
        description: 'Wait a moment and try the operation again.'
      },
      {
        title: 'Use Wired Connection',
        description: 'If on WiFi, try switching to a wired connection for better stability.'
      }
    ],
    relatedErrors: [SyncErrorType.NETWORK_ERROR, SyncErrorType.API_ERROR]
  },

  [SyncErrorType.RATE_LIMIT_ERROR]: {
    title: 'Too Many Requests',
    description: 'You\'re making requests too quickly. Please slow down.',
    steps: [
      {
        title: 'Wait Before Retrying',
        description: 'Wait at least 30 seconds before trying the operation again.'
      },
      {
        title: 'Reduce Sync Frequency',
        description: 'Consider reducing how often you sync your profile data.'
      },
      {
        title: 'Avoid Rapid Clicks',
        description: 'Don\'t click sync buttons multiple times in quick succession.'
      },
      {
        title: 'Use Auto-Sync',
        description: 'Enable automatic syncing to avoid manual rate limiting.'
      }
    ],
    relatedErrors: [SyncErrorType.API_ERROR]
  },

  [SyncErrorType.DATA_CORRUPTION_ERROR]: {
    title: 'Data Corruption Detected',
    description: 'Some of your stored data appears to be corrupted or invalid.',
    steps: [
      {
        title: 'Clear All Cache',
        description: 'Clear all cached data to force a fresh sync from the blockchain.'
      },
      {
        title: 'Reconnect Wallet',
        description: 'Disconnect and reconnect your wallet to refresh authentication.'
      },
      {
        title: 'Reset Profile Data',
        description: 'Reset your profile data and perform a complete resync.'
      },
      {
        title: 'Contact Support',
        description: 'If the issue persists, contact support with error details.'
      }
    ],
    relatedErrors: [SyncErrorType.VALIDATION_ERROR, SyncErrorType.CACHE_ERROR]
  }
};

/**
 * Create user-friendly error notification from sync error
 */
export function createErrorNotification(
  error: SyncError, 
  options: ErrorDisplayOptions = {}
): ErrorNotification {
  const actions: ErrorAction[] = [];

  // Add retry action if retryable
  if (error.retryable && options.showRetryButton !== false) {
    actions.push({
      label: 'Retry',
      action: () => {
        // This would trigger a retry of the failed operation
        window.dispatchEvent(new CustomEvent('sync-retry', { detail: { errorId: error.id } }));
      },
      variant: 'primary'
    });
  }

  // Add troubleshooting action
  actions.push({
    label: 'Troubleshoot',
    action: () => {
      window.dispatchEvent(new CustomEvent('show-troubleshooting', { 
        detail: { errorType: error.type } 
      }));
    },
    variant: 'secondary'
  });

  // Add contact support action for high severity errors
  if (error.severity === SyncErrorSeverity.HIGH || error.severity === SyncErrorSeverity.CRITICAL) {
    if (options.showContactSupport !== false) {
      actions.push({
        label: 'Contact Support',
        action: () => {
          window.dispatchEvent(new CustomEvent('contact-support', { 
            detail: { errorId: error.id } 
          }));
        },
        variant: 'secondary'
      });
    }
  }

  // Add custom actions
  if (options.customActions) {
    actions.push(...options.customActions);
  }

  return {
    id: error.id,
    title: getErrorTitle(error),
    message: getUserFriendlyMessage(error),
    severity: error.severity,
    actions,
    dismissible: error.severity !== SyncErrorSeverity.CRITICAL,
    autoHide: error.severity === SyncErrorSeverity.LOW ? 5000 : undefined,
    persistent: error.severity === SyncErrorSeverity.CRITICAL
  };
}

/**
 * Get appropriate error title based on error type
 */
export function getErrorTitle(error: SyncError): string {
  switch (error.type) {
    case SyncErrorType.NETWORK_ERROR:
      return 'Connection Issue';
    case SyncErrorType.AUTHENTICATION_ERROR:
      return 'Authentication Required';
    case SyncErrorType.API_ERROR:
      return 'Service Unavailable';
    case SyncErrorType.BLOCKCHAIN_ERROR:
      return 'Blockchain Connection Issue';
    case SyncErrorType.WALLET_ERROR:
      return 'Wallet Connection Problem';
    case SyncErrorType.VALIDATION_ERROR:
      return 'Data Validation Error';
    case SyncErrorType.CACHE_ERROR:
      return 'Cache Storage Issue';
    case SyncErrorType.TIMEOUT_ERROR:
      return 'Request Timeout';
    case SyncErrorType.RATE_LIMIT_ERROR:
      return 'Too Many Requests';
    case SyncErrorType.DATA_CORRUPTION_ERROR:
      return 'Data Corruption Detected';
    default:
      return 'Sync Error';
  }
}

/**
 * Get troubleshooting guide for error type
 */
export function getTroubleshootingGuide(errorType: SyncErrorType): TroubleshootingGuide {
  return TROUBLESHOOTING_GUIDES[errorType];
}

/**
 * Format error for support ticket
 */
export function formatErrorForSupport(error: SyncError): string {
  return `
Error ID: ${error.id}
Type: ${error.type}
Severity: ${error.severity}
Operation: ${error.operation}
Timestamp: ${error.timestamp.toISOString()}
Message: ${error.message}
Recovery Strategy: ${error.recoveryStrategy}
User Agent: ${error.context.userAgent}
Online Status: ${error.context.online}
URL: ${error.context.url}

Technical Details:
${error.technicalDetails || 'Not available'}
  `.trim();
}

/**
 * Check if error should show detailed troubleshooting
 */
export function shouldShowDetailedTroubleshooting(error: SyncError): boolean {
  return error.severity === SyncErrorSeverity.HIGH || 
         error.severity === SyncErrorSeverity.CRITICAL ||
         error.recoveryStrategy === RecoveryStrategy.REQUIRE_USER_ACTION;
}

/**
 * Get error severity color for UI
 */
export function getErrorSeverityColor(severity: SyncErrorSeverity): string {
  switch (severity) {
    case SyncErrorSeverity.LOW:
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case SyncErrorSeverity.MEDIUM:
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case SyncErrorSeverity.HIGH:
      return 'text-red-600 bg-red-50 border-red-200';
    case SyncErrorSeverity.CRITICAL:
      return 'text-red-800 bg-red-100 border-red-300';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get recovery strategy description for users
 */
export function getRecoveryStrategyDescription(strategy: RecoveryStrategy): string {
  switch (strategy) {
    case RecoveryStrategy.RETRY_AUTOMATIC:
      return 'The system will automatically retry this operation.';
    case RecoveryStrategy.RETRY_MANUAL:
      return 'Please try the operation again manually.';
    case RecoveryStrategy.FALLBACK_CACHE:
      return 'Using cached data while resolving the issue.';
    case RecoveryStrategy.FALLBACK_PARTIAL:
      return 'Some features may be limited while resolving this issue.';
    case RecoveryStrategy.REQUIRE_RECONNECTION:
      return 'Please reconnect your wallet to continue.';
    case RecoveryStrategy.REQUIRE_USER_ACTION:
      return 'User action is required to resolve this issue.';
    case RecoveryStrategy.NO_RECOVERY:
      return 'This issue cannot be automatically resolved.';
    default:
      return 'Recovery strategy not specified.';
  }
}