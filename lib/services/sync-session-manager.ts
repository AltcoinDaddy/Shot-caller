/**
 * Secure session management for sync operations
 * Handles authentication, authorization, and session validation
 */

import { SyncEncryption } from '@/lib/utils/sync-encryption';

interface SyncSession {
  id: string;
  userId: string;
  walletAddress: string;
  permissions: SyncPermission[];
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

interface SyncPermission {
  operation: SyncOperationType;
  resource: string;
  granted: boolean;
  grantedAt: Date;
  expiresAt?: Date;
}

enum SyncOperationType {
  READ_PROFILE = 'read_profile',
  WRITE_PROFILE = 'write_profile',
  READ_NFT_COLLECTION = 'read_nft_collection',
  SYNC_NFT_COLLECTION = 'sync_nft_collection',
  READ_WALLET_DATA = 'read_wallet_data',
  WRITE_CACHE = 'write_cache',
  READ_CACHE = 'read_cache',
  AUDIT_LOG = 'audit_log'
}

interface SessionValidationResult {
  isValid: boolean;
  session?: SyncSession;
  reason?: string;
}

class SyncSessionManager {
  private encryption: SyncEncryption;
  private sessions: Map<string, SyncSession> = new Map();
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly ACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

  constructor() {
    this.encryption = new SyncEncryption();
    this.loadPersistedSessions();
  }

  /**
   * Create a new sync session for a user
   */
  async createSession(userId: string, walletAddress: string): Promise<SyncSession> {
    const sessionId = this.generateSessionId();
    const now = new Date();
    
    const session: SyncSession = {
      id: sessionId,
      userId,
      walletAddress: walletAddress.toLowerCase(),
      permissions: this.getDefaultPermissions(),
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.SESSION_DURATION),
      lastActivity: now,
      isActive: true
    };

    this.sessions.set(sessionId, session);
    await this.persistSession(session);
    
    return session;
  }

  /**
   * Validate and retrieve a sync session
   */
  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { isValid: false, reason: 'Session not found' };
    }

    if (!session.isActive) {
      return { isValid: false, reason: 'Session is inactive' };
    }

    if (session.expiresAt < new Date()) {
      await this.invalidateSession(sessionId);
      return { isValid: false, reason: 'Session expired' };
    }

    const timeSinceActivity = Date.now() - session.lastActivity.getTime();
    if (timeSinceActivity > this.ACTIVITY_TIMEOUT) {
      await this.invalidateSession(sessionId);
      return { isValid: false, reason: 'Session timed out due to inactivity' };
    }

    // Update last activity
    session.lastActivity = new Date();
    await this.persistSession(session);

    return { isValid: true, session };
  }

  /**
   * Check if user has permission for a specific sync operation
   */
  hasPermission(session: SyncSession, operation: SyncOperationType, resource?: string): boolean {
    const permission = session.permissions.find(p => 
      p.operation === operation && 
      (!resource || p.resource === resource || p.resource === '*')
    );

    if (!permission || !permission.granted) {
      return false;
    }

    // Check if permission has expired
    if (permission.expiresAt && permission.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Grant additional permissions to a session
   */
  async grantPermission(
    sessionId: string, 
    operation: SyncOperationType, 
    resource: string = '*',
    expiresAt?: Date
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const existingPermission = session.permissions.find(p => 
      p.operation === operation && p.resource === resource
    );

    if (existingPermission) {
      existingPermission.granted = true;
      existingPermission.grantedAt = new Date();
      existingPermission.expiresAt = expiresAt;
    } else {
      session.permissions.push({
        operation,
        resource,
        granted: true,
        grantedAt: new Date(),
        expiresAt
      });
    }

    await this.persistSession(session);
    return true;
  }

  /**
   * Revoke permissions from a session
   */
  async revokePermission(sessionId: string, operation: SyncOperationType, resource?: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.permissions = session.permissions.filter(p => 
      !(p.operation === operation && (!resource || p.resource === resource))
    );

    await this.persistSession(session);
    return true;
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      await this.persistSession(session);
    }
    this.sessions.delete(sessionId);
    this.removePersistedSession(sessionId);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (session.expiresAt < now || !session.isActive) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      await this.invalidateSession(sessionId);
    }
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): SyncSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.userId === userId && session.isActive
    );
  }

  private generateSessionId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultPermissions(): SyncPermission[] {
    const now = new Date();
    return [
      {
        operation: SyncOperationType.READ_PROFILE,
        resource: '*',
        granted: true,
        grantedAt: now
      },
      {
        operation: SyncOperationType.READ_NFT_COLLECTION,
        resource: '*',
        granted: true,
        grantedAt: now
      },
      {
        operation: SyncOperationType.READ_CACHE,
        resource: '*',
        granted: true,
        grantedAt: now
      }
    ];
  }

  private async persistSession(session: SyncSession): Promise<void> {
    try {
      const encryptedSession = await this.encryption.encryptSyncData(session, session.userId);
      localStorage.setItem(`sync_session_${session.id}`, encryptedSession);
    } catch (error) {
      console.error('Failed to persist sync session:', error);
    }
  }

  private removePersistedSession(sessionId: string): void {
    localStorage.removeItem(`sync_session_${sessionId}`);
  }

  private async loadPersistedSessions(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('sync_session_')) {
          const encryptedData = localStorage.getItem(key);
          if (encryptedData) {
            try {
              // Extract session ID from key
              const sessionId = key.replace('sync_session_', '');
              const session = await this.encryption.decryptSyncData(encryptedData);
              
              // Validate session structure and expiry
              if (this.isValidSessionStructure(session) && session.expiresAt > new Date()) {
                this.sessions.set(sessionId, {
                  ...session,
                  createdAt: new Date(session.createdAt),
                  expiresAt: new Date(session.expiresAt),
                  lastActivity: new Date(session.lastActivity)
                });
              } else {
                localStorage.removeItem(key);
              }
            } catch (error) {
              console.warn('Failed to load persisted session:', error);
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load persisted sessions:', error);
    }
  }

  private isValidSessionStructure(obj: any): obj is SyncSession {
    return obj && 
           typeof obj.id === 'string' &&
           typeof obj.userId === 'string' &&
           typeof obj.walletAddress === 'string' &&
           Array.isArray(obj.permissions) &&
           obj.createdAt &&
           obj.expiresAt &&
           obj.lastActivity &&
           typeof obj.isActive === 'boolean';
  }
}

export { 
  SyncSessionManager, 
  SyncOperationType,
  type SyncSession, 
  type SyncPermission, 
  type SessionValidationResult 
};