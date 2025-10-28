// Sync Activity Manager
// Handles app focus/blur events and user activity tracking for sync operations

import { walletProfileSyncManager } from './wallet-profile-sync-manager';

export interface SyncActivityConfig {
  activityTimeout: number; // Time in ms before considering user inactive
  focusSyncDelay: number; // Delay before syncing on app focus
  enableActivityTracking: boolean;
  enableFocusSync: boolean;
}

export class SyncActivityManager {
  private config: SyncActivityConfig;
  private activityTimer: NodeJS.Timeout | null = null;
  private focusTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private lastActivity = new Date();

  constructor(config?: Partial<SyncActivityConfig>) {
    this.config = {
      activityTimeout: 300000, // 5 minutes
      focusSyncDelay: 1000, // 1 second delay
      enableActivityTracking: true,
      enableFocusSync: true,
      ...config
    };
  }

  /**
   * Initialize activity tracking and focus event listeners
   */
  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    this.isInitialized = true;

    // Set up focus/blur event listeners
    if (this.config.enableFocusSync) {
      this.setupFocusListeners();
    }

    // Set up user activity tracking
    if (this.config.enableActivityTracking) {
      this.setupActivityTracking();
    }

    console.log('Sync activity manager initialized');
  }

  /**
   * Clean up event listeners and timers
   */
  cleanup(): void {
    if (!this.isInitialized) return;

    // Clear timers
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }

    if (this.focusTimer) {
      clearTimeout(this.focusTimer);
      this.focusTimer = null;
    }

    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.handleAppFocus);
      window.removeEventListener('blur', this.handleAppBlur);
      window.removeEventListener('visibilitychange', this.handleVisibilityChange);
      
      // Remove activity listeners
      document.removeEventListener('mousedown', this.handleUserActivity);
      document.removeEventListener('mousemove', this.handleUserActivity);
      document.removeEventListener('keypress', this.handleUserActivity);
      document.removeEventListener('scroll', this.handleUserActivity);
      document.removeEventListener('touchstart', this.handleUserActivity);
      document.removeEventListener('click', this.handleUserActivity);
    }

    this.isInitialized = false;
    console.log('Sync activity manager cleaned up');
  }

  /**
   * Set up focus/blur event listeners for app focus tracking
   */
  private setupFocusListeners(): void {
    if (typeof window === 'undefined') return;

    // Window focus/blur events
    window.addEventListener('focus', this.handleAppFocus);
    window.addEventListener('blur', this.handleAppBlur);

    // Page visibility API for better mobile support
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Set up user activity tracking
   */
  private setupActivityTracking(): void {
    if (typeof document === 'undefined') return;

    // Track various user interactions
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    activityEvents.forEach(event => {
      document.addEventListener(event, this.handleUserActivity, { passive: true });
    });

    // Start activity timeout
    this.resetActivityTimer();
  }

  /**
   * Handle app gaining focus
   */
  private handleAppFocus = (): void => {
    console.log('App gained focus');

    // Clear any existing focus timer
    if (this.focusTimer) {
      clearTimeout(this.focusTimer);
    }

    // Delay sync slightly to allow app to fully initialize
    this.focusTimer = setTimeout(async () => {
      try {
        await walletProfileSyncManager.onAppFocus();
      } catch (error) {
        console.error('App focus sync failed:', error);
      }
    }, this.config.focusSyncDelay);

    // Track user activity
    this.handleUserActivity();
  };

  /**
   * Handle app losing focus
   */
  private handleAppBlur = (): void => {
    console.log('App lost focus');

    // Clear focus timer if app loses focus before sync
    if (this.focusTimer) {
      clearTimeout(this.focusTimer);
      this.focusTimer = null;
    }

    try {
      walletProfileSyncManager.onAppBlur();
    } catch (error) {
      console.error('App blur handling failed:', error);
    }
  };

  /**
   * Handle page visibility changes (better mobile support)
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.handleAppFocus();
    } else {
      this.handleAppBlur();
    }
  };

  /**
   * Handle user activity
   */
  private handleUserActivity = (): void => {
    this.lastActivity = new Date();
    
    try {
      walletProfileSyncManager.onUserActivity();
    } catch (error) {
      console.error('User activity tracking failed:', error);
    }

    // Reset activity timer
    this.resetActivityTimer();
  };

  /**
   * Reset the activity timeout timer
   */
  private resetActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }

    this.activityTimer = setTimeout(() => {
      console.log('User inactive for', this.config.activityTimeout / 1000, 'seconds');
      // User is considered inactive - sync manager will handle this in periodic sync
    }, this.config.activityTimeout);
  }

  /**
   * Get current activity status
   */
  getActivityStatus(): {
    lastActivity: Date;
    isActive: boolean;
    timeSinceActivity: number;
  } {
    const timeSinceActivity = Date.now() - this.lastActivity.getTime();
    
    return {
      lastActivity: this.lastActivity,
      isActive: timeSinceActivity < this.config.activityTimeout,
      timeSinceActivity
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SyncActivityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize if needed
    if (this.isInitialized) {
      this.cleanup();
      this.initialize();
    }
  }

  /**
   * Force trigger app focus sync (for manual testing)
   */
  async triggerFocusSync(): Promise<void> {
    await this.handleAppFocus();
  }

  /**
   * Force trigger user activity (for manual testing)
   */
  triggerUserActivity(): void {
    this.handleUserActivity();
  }
}

// ============================================================================
// Default Instance
// ============================================================================

/**
 * Default sync activity manager instance
 */
export const syncActivityManager = new SyncActivityManager({
  activityTimeout: 300000, // 5 minutes
  focusSyncDelay: 1000, // 1 second
  enableActivityTracking: true,
  enableFocusSync: true
});

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure DOM is ready
  setTimeout(() => {
    syncActivityManager.initialize();
  }, 100);
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    syncActivityManager.cleanup();
  });
}