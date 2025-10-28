/**
 * Sync Integration Validation Script
 * 
 * Validates that all sync components are properly integrated
 * and working together as expected.
 */

import { existsSync, readFileSync } from 'fs';
import path from 'path';

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
}

class SyncIntegrationValidator {
  private results: ValidationResult[] = [];

  async validateIntegration(): Promise<void> {
    console.log('🔍 Validating Sync System Integration\n');

    // Core component validations
    this.validateSyncManager();
    this.validateAuthContext();
    this.validateEventBus();
    this.validateNetworkResilience();
    this.validateUIComponents();
    this.validateHooks();
    this.validateTypes();
    this.validateTests();
    this.validateConfiguration();

    this.printResults();
  }

  private validateSyncManager(): void {
    const syncManagerPath = 'lib/services/wallet-profile-sync-manager.ts';
    
    if (!existsSync(syncManagerPath)) {
      this.addResult('Sync Manager', 'fail', 'Sync manager file not found');
      return;
    }

    const content = readFileSync(syncManagerPath, 'utf8');
    const requiredMethods = [
      'syncWalletToProfile',
      'syncNFTCollection',
      'syncProfileStats',
      'onWalletConnect',
      'onWalletDisconnect',
      'getSyncStatus',
      'forceSyncProfile',
      'refreshNFTCollection'
    ];

    const missingMethods = requiredMethods.filter(method => !content.includes(method));
    
    if (missingMethods.length > 0) {
      this.addResult('Sync Manager', 'fail', 'Missing required methods', missingMethods);
    } else {
      this.addResult('Sync Manager', 'pass', 'All required methods implemented');
    }

    // Check for security integration
    if (!content.includes('SecureSyncStorage') || !content.includes('SyncAuditLogger')) {
      this.addResult('Sync Manager Security', 'warning', 'Security components may not be fully integrated');
    } else {
      this.addResult('Sync Manager Security', 'pass', 'Security components integrated');
    }
  }

  private validateAuthContext(): void {
    const authContextPath = 'contexts/auth-context.tsx';
    
    if (!existsSync(authContextPath)) {
      this.addResult('Auth Context', 'fail', 'Auth context file not found');
      return;
    }

    const content = readFileSync(authContextPath, 'utf8');
    const requiredProperties = [
      'syncStatus',
      'profileData',
      'nftCollection',
      'forceSyncProfile',
      'refreshNFTCollection',
      'onSyncStatusChange',
      'onProfileDataChange'
    ];

    const missingProperties = requiredProperties.filter(prop => !content.includes(prop));
    
    if (missingProperties.length > 0) {
      this.addResult('Auth Context', 'fail', 'Missing sync-related properties', missingProperties);
    } else {
      this.addResult('Auth Context', 'pass', 'All sync properties implemented');
    }

    // Check for sync manager integration
    if (!content.includes('ConcreteWalletProfileSyncManager') && !content.includes('walletProfileSyncManager')) {
      this.addResult('Auth Context Integration', 'fail', 'Sync manager not integrated with auth context');
    } else {
      this.addResult('Auth Context Integration', 'pass', 'Sync manager properly integrated');
    }
  }

  private validateEventBus(): void {
    const eventBusPath = 'lib/services/sync-event-bus.ts';
    
    if (!existsSync(eventBusPath)) {
      this.addResult('Event Bus', 'fail', 'Event bus file not found');
      return;
    }

    const content = readFileSync(eventBusPath, 'utf8');
    const requiredMethods = [
      'subscribe',
      'emit',
      'emitEvent',
      'getEventHistory',
      'clearHistory'
    ];

    const missingMethods = requiredMethods.filter(method => !content.includes(method));
    
    if (missingMethods.length > 0) {
      this.addResult('Event Bus', 'fail', 'Missing required methods', missingMethods);
    } else {
      this.addResult('Event Bus', 'pass', 'All required methods implemented');
    }
  }

  private validateNetworkResilience(): void {
    const networkManagerPath = 'lib/services/network-resilience-manager.ts';
    
    if (!existsSync(networkManagerPath)) {
      this.addResult('Network Resilience', 'warning', 'Network resilience manager not found - using basic implementation');
      return;
    }

    const content = readFileSync(networkManagerPath, 'utf8');
    const requiredMethods = [
      'executeWithRetry',
      'isOnline',
      'getConnectionQuality',
      'queueOfflineOperation'
    ];

    const missingMethods = requiredMethods.filter(method => !content.includes(method));
    
    if (missingMethods.length > 0) {
      this.addResult('Network Resilience', 'fail', 'Missing required methods', missingMethods);
    } else {
      this.addResult('Network Resilience', 'pass', 'All required methods implemented');
    }
  }

  private validateUIComponents(): void {
    const uiComponents = [
      'components/sync-status-indicator.tsx',
      'components/profile-sync-status.tsx',
      'components/sync-loading-state.tsx',
      'components/navigation-sync-indicator.tsx'
    ];

    let foundComponents = 0;
    const missingComponents: string[] = [];

    for (const component of uiComponents) {
      if (existsSync(component)) {
        foundComponents++;
      } else {
        missingComponents.push(component);
      }
    }

    if (foundComponents === 0) {
      this.addResult('UI Components', 'fail', 'No sync UI components found');
    } else if (missingComponents.length > 0) {
      this.addResult('UI Components', 'warning', `Some UI components missing (${