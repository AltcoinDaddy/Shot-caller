// Sync UI Components
// Comprehensive set of React components for wallet-profile synchronization features

// Core help and tooltip components
export {
  SyncHelpTooltip,
  SyncStatusIndicator,
  SyncRefreshButton,
  SyncErrorBadge,
  SyncOfflineIndicator,
  SyncInfoIcon
} from '../sync-help-tooltip';

// Comprehensive help dialog
export { SyncHelpDialog } from '../sync-help-dialog';

// Onboarding flow
export { 
  SyncOnboardingFlow,
  useSyncOnboarding 
} from '../sync-onboarding-flow';

// Type exports for TypeScript users
export type {
  SyncHelpTooltipProps
} from '../sync-help-tooltip';

export type {
  SyncHelpDialogProps
} from '../sync-help-dialog';

export type {
  SyncOnboardingFlowProps
} from '../sync-onboarding-flow';

// Re-export commonly used types from the sync system
export type {
  SyncStatus,
  SyncError,
  SyncOperation,
  SyncResult
} from '../../lib/types/sync';