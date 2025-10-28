/**
 * Integration example demonstrating sync security features
 * Shows how to use encryption, session management, audit logging, and permission validation
 */

import { SecureSyncStorage, type StorageKey } from './secure-sync-storage';
import { SyncOperationType } from './sync-session-manager';
import { AuditAction, AuditResult } from './sync-audit-logger';

/**
 * Example class showing secure sync operations
 */
export class SecureSyncExample {
  private secureStorage: SecureSyncStorage;
  private currentSessionId: string | null = null;

  constructor() {
    this.secureStorage = new SecureSyncStorage();
  }

  /**
   * Example: Secure wallet connection with session creation
   */
  async connectWallet(walletAddress: string): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      const userId = this.generateUserId(walletAddress);
      const sessionManager = this.secureStorage.getSessionManager();
      const auditLogger = this.secureStorage.getAuditLogger();

      // Create secure session
      const session = await sessionManager.createSession(userId, walletAddress);
      
      // Grant basic permissions
      await sessionManager.grantPermission(session.id, SyncOperationType.READ_PROFILE);
      await sessionManager.grantPermission(session.id, SyncOperationType.READ_NFT_COLLECTION);
      await sessionManager.grantPermission(session.id, SyncOperationType.READ_WALLET_DATA);
      await sessionManager.grantPermission(session.id, SyncOperationType.READ_CACHE);

      // Log wallet connection
      await auditLogger.logWalletConnection(
        userId,
        session.id,
        walletAddress,
        'connect',
        AuditResult.SUCCESS,
        { timestamp: new Date().toISOString() }
      );

      this.currentSessionId = session.id;

      return { success: true, sessionId: session.id };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Example: Secure profile data storage
   */
  async storeProfileData(
    walletAddress: string, 
    profileData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentSessionId) {
        throw new Error('No active session');
      }

      const sessionManager = this.secureStorage.getSessionManager();
      
      // Grant write permission if needed
      await sessionManager.grantPermission(this.currentSessionId, SyncOperationType.WRITE_PROFILE);

      const storageKey: StorageKey = {
        userId: this.generateUserId(walletAddress),
        category: 'profile',
        identifier: 'main'
      };

      const result = await this.secureStorage.store(
        storageKey, 
        profileData, 
        this.currentSessionId,
        { encrypt: true, validatePermissions: true, auditLog: true }
      );

      return { success: result.success, error: result.error };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Storage failed' 
      };
    }
  }

  /**
   * Example: Secure profile data retrieval
   */
  async getProfileData(walletAddress: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.currentSessionId) {
        throw new Error('No active session');
      }

      const storageKey: StorageKey = {
        userId: this.generateUserId(walletAddress),
        category: 'profile',
        identifier: 'main'
      };

      const result = await this.secureStorage.retrieve(
        storageKey, 
        this.currentSessionId,
        { encrypt: true, validatePermissions: true, auditLog: true }
      );

      return { 
        success: result.success, 
        data: result.data, 
        error: result.error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Retrieval failed' 
      };
    }
  }

  /**
   * Example: Secure NFT collection sync
   */
  async syncNFTCollection(
    walletAddress: string, 
    nftData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentSessionId) {
        throw new Error('No active session');
      }

      const sessionManager = this.secureStorage.getSessionManager();
      const auditLogger = this.secureStorage.getAuditLogger();
      const permissionValidator = this.secureStorage.getPermissionValidator();
      const userId = this.generateUserId(walletAddress);

      // Validate wallet ownership
      const ownershipResult = await permissionValidator.validateWalletOwnership(
        userId,
        this.currentSessionId,
        walletAddress
      );

      if (!ownershipResult.isAuthorized) {
        throw new Error(`Wallet ownership validation failed: ${ownershipResult.reason}`);
      }

      // Grant sync permission
      await sessionManager.grantPermission(this.currentSessionId, SyncOperationType.SYNC_NFT_COLLECTION);

      // Log NFT sync operation
      await auditLogger.logNFTSync(
        userId,
        this.currentSessionId,
        walletAddress,
        nftData.nfts?.length || 0,
        AuditResult.SUCCESS
      );

      const storageKey: StorageKey = {
        userId,
        category: 'nft_collection',
        identifier: 'main'
      };

      const result = await this.secureStorage.store(
        storageKey, 
        nftData, 
        this.currentSessionId,
        { encrypt: true, validatePermissions: true, auditLog: true }
      );

      return { success: result.success, error: result.error };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'NFT sync failed' 
      };
    }
  }

  /**
   * Example: Get audit trail for user
   */
  async getAuditTrail(walletAddress: string): Promise<{ success: boolean; events?: any[]; error?: string }> {
    try {
      const auditLogger = this.secureStorage.getAuditLogger();
      const userId = this.generateUserId(walletAddress);

      const events = auditLogger.queryEvents({
        userId,
        limit: 50
      });

      return { success: true, events };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Audit query failed' 
      };
    }
  }

  /**
   * Example: Get sync statistics
   */
  async getSyncStatistics(): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      const auditLogger = this.secureStorage.getAuditLogger();
      
      const timeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date()
      };

      const stats = auditLogger.getAuditStatistics(timeRange);

      return { success: true, stats };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Statistics query failed' 
      };
    }
  }

  /**
   * Example: Secure wallet disconnection
   */
  async disconnectWallet(walletAddress: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentSessionId) {
        return { success: true }; // Already disconnected
      }

      const sessionManager = this.secureStorage.getSessionManager();
      const auditLogger = this.secureStorage.getAuditLogger();
      const userId = this.generateUserId(walletAddress);

      // Log wallet disconnection
      await auditLogger.logWalletConnection(
        userId,
        this.currentSessionId,
        walletAddress,
        'disconnect',
        AuditResult.SUCCESS,
        { timestamp: new Date().toISOString() }
      );

      // Invalidate session
      await sessionManager.invalidateSession(this.currentSessionId);
      this.currentSessionId = null;

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Disconnection failed' 
      };
    }
  }

  /**
   * Example: GDPR compliance - delete user data
   */
  async deleteUserData(walletAddress: string): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      if (!this.currentSessionId) {
        throw new Error('No active session');
      }

      const userId = this.generateUserId(walletAddress);
      const result = await this.secureStorage.clearUserData(userId, this.currentSessionId);

      return { 
        success: result.success, 
        deletedCount: result.data, 
        error: result.error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Data deletion failed' 
      };
    }
  }

  /**
   * Example: Check session status
   */
  async getSessionStatus(): Promise<{ 
    isActive: boolean; 
    sessionId?: string; 
    permissions?: string[];
    error?: string;
  }> {
    try {
      if (!this.currentSessionId) {
        return { isActive: false };
      }

      const sessionManager = this.secureStorage.getSessionManager();
      const validation = await sessionManager.validateSession(this.currentSessionId);

      if (!validation.isValid) {
        this.currentSessionId = null;
        return { isActive: false, error: validation.reason };
      }

      const permissions = validation.session!.permissions
        .filter(p => p.granted)
        .map(p => p.operation);

      return {
        isActive: true,
        sessionId: this.currentSessionId,
        permissions
      };
    } catch (error) {
      return { 
        isActive: false, 
        error: error instanceof Error ? error.message : 'Session check failed' 
      };
    }
  }

  private generateUserId(walletAddress: string): string {
    // Simple hash for user ID generation
    let hash = 0;
    const normalizedAddress = walletAddress.toLowerCase();
    for (let i = 0; i < normalizedAddress.length; i++) {
      const char = normalizedAddress.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash).toString(36)}`;
  }
}

// Usage example
export async function demonstrateSecureSync() {
  const syncExample = new SecureSyncExample();
  const walletAddress = '0x1234567890abcdef';

  try {
    // 1. Connect wallet securely
    console.log('1. Connecting wallet...');
    const connectResult = await syncExample.connectWallet(walletAddress);
    if (!connectResult.success) {
      throw new Error(connectResult.error);
    }
    console.log('✓ Wallet connected securely');

    // 2. Store profile data
    console.log('2. Storing profile data...');
    const profileData = {
      username: 'testuser',
      walletAddress,
      nftCount: 5,
      lastLogin: new Date().toISOString()
    };
    
    const storeResult = await syncExample.storeProfileData(walletAddress, profileData);
    if (!storeResult.success) {
      throw new Error(storeResult.error);
    }
    console.log('✓ Profile data stored securely');

    // 3. Sync NFT collection
    console.log('3. Syncing NFT collection...');
    const nftData = {
      nfts: ['nft1', 'nft2', 'nft3'],
      lastSync: new Date().toISOString(),
      eligibleCount: 3
    };
    
    const syncResult = await syncExample.syncNFTCollection(walletAddress, nftData);
    if (!syncResult.success) {
      throw new Error(syncResult.error);
    }
    console.log('✓ NFT collection synced securely');

    // 4. Retrieve profile data
    console.log('4. Retrieving profile data...');
    const retrieveResult = await syncExample.getProfileData(walletAddress);
    if (!retrieveResult.success) {
      throw new Error(retrieveResult.error);
    }
    console.log('✓ Profile data retrieved:', retrieveResult.data);

    // 5. Check audit trail
    console.log('5. Checking audit trail...');
    const auditResult = await syncExample.getAuditTrail(walletAddress);
    if (!auditResult.success) {
      throw new Error(auditResult.error);
    }
    console.log(`✓ Audit trail contains ${auditResult.events?.length} events`);

    // 6. Get sync statistics
    console.log('6. Getting sync statistics...');
    const statsResult = await syncExample.getSyncStatistics();
    if (!statsResult.success) {
      throw new Error(statsResult.error);
    }
    console.log('✓ Sync statistics:', statsResult.stats);

    // 7. Check session status
    console.log('7. Checking session status...');
    const sessionResult = await syncExample.getSessionStatus();
    console.log('✓ Session status:', {
      isActive: sessionResult.isActive,
      permissions: sessionResult.permissions?.length
    });

    // 8. Disconnect wallet
    console.log('8. Disconnecting wallet...');
    const disconnectResult = await syncExample.disconnectWallet(walletAddress);
    if (!disconnectResult.success) {
      throw new Error(disconnectResult.error);
    }
    console.log('✓ Wallet disconnected securely');

    console.log('\n🔒 All security features demonstrated successfully!');
    
  } catch (error) {
    console.error('❌ Security demonstration failed:', error);
  }
}

export { SecureSyncExample };