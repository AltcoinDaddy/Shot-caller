/**
 * Secure storage service for sync data
 * Integrates encryption, session management, audit logging, and permission validation
 */

import { SyncEncryption } from '@/lib/utils/sync-encryption';
import { SyncSessionManager, SyncOperationType } from './sync-session-manager';
import { SyncAuditLogger, AuditAction, AuditResult } from './sync-audit-logger';
import { SyncPermissionValidator, type ValidationContext } from './sync-permission-validator';

interface SecureStorageOptions {
  encrypt?: boolean;
  validatePermissions?: boolean;
  auditLog?: boolean;
  sessionRequired?: boolean;
}

interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    encrypted: boolean;
    cached: boolean;
    timestamp: Date;
    source: string;
  };
}

interface StorageKey {
  userId: string;
  category: 'profile' | 'nft_collection' | 'wallet_data' | 'cache' | 'session';
  identifier: string;
}

class SecureSyncStorage {
  private encryption: SyncEncryption;
  private sessionManager: SyncSessionManager;
  private auditLogger: SyncAuditLogger;
  private permissionValidator: SyncPermissionValidator;
  private cache: Map<string, { data: any; timestamp: Date; encrypted: boolean }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.encryption = new SyncEncryption();
    this.sessionManager = new SyncSessionManager();
    this.auditLogger = new SyncAuditLogger();
    this.permissionValidator = new SyncPermissionValidator(this.sessionManager, this.auditLogger);
  }

  /**
   * Securely store sync data
   */
  async store<T>(
    key: StorageKey,
    data: T,
    sessionId: string,
    options: SecureStorageOptions = {}
  ): Promise<StorageResult<T>> {
    const startTime = Date.now();
    const storageKey = this.generateStorageKey(key);
    
    try {
      // Default options
      const opts = {
        encrypt: true,
        validatePermissions: true,
        auditLog: true,
        sessionRequired: true,
        ...options
      };

      // Validate session if required
      if (opts.sessionRequired) {
        const sessionValidation = await this.sessionManager.validateSession(sessionId);
        if (!sessionValidation.isValid) {
          return {
            success: false,
            error: `Session validation failed: ${sessionValidation.reason}`
          };
        }
      }

      // Validate permissions if required
      if (opts.validatePermissions) {
        const validationContext: ValidationContext = {
          userId: key.userId,
          sessionId,
          operation: this.getOperationTypeForCategory(key.category, 'write'),
          resource: key.category,
          requestedAction: AuditAction.CREATE
        };

        const permissionResult = await this.permissionValidator.validateSyncOperation(validationContext);
        if (!permissionResult.isAuthorized) {
          if (opts.auditLog) {
            await this.auditLogger.logSyncOperation(
              key.userId,
              sessionId,
              'secure_storage_write',
              storageKey,
              AuditAction.CREATE,
              AuditResult.FORBIDDEN,
              { reason: permissionResult.reason }
            );
          }

          return {
            success: false,
            error: `Permission denied: ${permissionResult.reason}`
          };
        }
      }

      // Prepare data for storage
      let storageData: string;
      let isEncrypted = false;

      if (opts.encrypt) {
        storageData = await this.encryption.encryptSyncData(data, key.userId);
        isEncrypted = true;
      } else {
        storageData = JSON.stringify(data);
      }

      // Store in localStorage
      localStorage.setItem(storageKey, storageData);

      // Update cache
      this.cache.set(storageKey, {
        data,
        timestamp: new Date(),
        encrypted: isEncrypted
      });

      // Audit log if required
      if (opts.auditLog) {
        const duration = Date.now() - startTime;
        await this.auditLogger.logSyncOperation(
          key.userId,
          sessionId,
          'secure_storage_write',
          storageKey,
          AuditAction.CREATE,
          AuditResult.SUCCESS,
          {
            dataSize: JSON.stringify(data).length,
            encrypted: isEncrypted,
            category: key.category
          },
          duration
        );
      }

      return {
        success: true,
        data,
        metadata: {
          encrypted: isEncrypted,
          cached: true,
          timestamp: new Date(),
          source: 'storage'
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (options.auditLog !== false) {
        await this.auditLogger.logSyncOperation(
          key.userId,
          sessionId,
          'secure_storage_write',
          storageKey,
          AuditAction.CREATE,
          AuditResult.FAILURE,
          { error: error instanceof Error ? error.message : 'Unknown error' },
          duration,
          error instanceof Error ? error : new Error('Storage operation failed')
        );
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage operation failed'
      };
    }
  }

  /**
   * Securely retrieve sync data
   */
  async retrieve<T>(
    key: StorageKey,
    sessionId: string,
    options: SecureStorageOptions = {}
  ): Promise<StorageResult<T>> {
    const startTime = Date.now();
    const storageKey = this.generateStorageKey(key);
    
    try {
      // Default options
      const opts = {
        encrypt: true,
        validatePermissions: true,
        auditLog: true,
        sessionRequired: true,
        ...options
      };

      // Validate session if required
      if (opts.sessionRequired) {
        const sessionValidation = await this.sessionManager.validateSession(sessionId);
        if (!sessionValidation.isValid) {
          return {
            success: false,
            error: `Session validation failed: ${sessionValidation.reason}`
          };
        }
      }

      // Validate permissions if required
      if (opts.validatePermissions) {
        const validationContext: ValidationContext = {
          userId: key.userId,
          sessionId,
          operation: this.getOperationTypeForCategory(key.category, 'read'),
          resource: key.category,
          requestedAction: AuditAction.READ
        };

        const permissionResult = await this.permissionValidator.validateSyncOperation(validationContext);
        if (!permissionResult.isAuthorized) {
          if (opts.auditLog) {
            await this.auditLogger.logSyncOperation(
              key.userId,
              sessionId,
              'secure_storage_read',
              storageKey,
              AuditAction.READ,
              AuditResult.FORBIDDEN,
              { reason: permissionResult.reason }
            );
          }

          return {
            success: false,
            error: `Permission denied: ${permissionResult.reason}`
          };
        }
      }

      // Check cache first
      const cachedData = this.cache.get(storageKey);
      if (cachedData && this.isCacheValid(cachedData.timestamp)) {
        if (opts.auditLog) {
          const duration = Date.now() - startTime;
          await this.auditLogger.logCacheOperation(
            key.userId,
            sessionId,
            AuditAction.READ,
            storageKey,
            AuditResult.SUCCESS,
            { cacheHit: true }
          );
        }

        return {
          success: true,
          data: cachedData.data,
          metadata: {
            encrypted: cachedData.encrypted,
            cached: true,
            timestamp: cachedData.timestamp,
            source: 'cache'
          }
        };
      }

      // Retrieve from localStorage
      const storageData = localStorage.getItem(storageKey);
      if (!storageData) {
        if (opts.auditLog) {
          await this.auditLogger.logSyncOperation(
            key.userId,
            sessionId,
            'secure_storage_read',
            storageKey,
            AuditAction.READ,
            AuditResult.FAILURE,
            { reason: 'Data not found' }
          );
        }

        return {
          success: false,
          error: 'Data not found'
        };
      }

      // Decrypt or parse data
      let data: T;
      let isEncrypted = false;

      try {
        if (opts.encrypt) {
          data = await this.encryption.decryptSyncData(storageData, key.userId);
          isEncrypted = true;
        } else {
          data = JSON.parse(storageData);
        }
      } catch (decryptError) {
        // Try parsing as plain JSON if decryption fails
        try {
          data = JSON.parse(storageData);
        } catch (parseError) {
          throw new Error('Failed to decrypt or parse stored data');
        }
      }

      // Update cache
      this.cache.set(storageKey, {
        data,
        timestamp: new Date(),
        encrypted: isEncrypted
      });

      // Audit log if required
      if (opts.auditLog) {
        const duration = Date.now() - startTime;
        await this.auditLogger.logSyncOperation(
          key.userId,
          sessionId,
          'secure_storage_read',
          storageKey,
          AuditAction.READ,
          AuditResult.SUCCESS,
          {
            dataSize: JSON.stringify(data).length,
            encrypted: isEncrypted,
            category: key.category,
            cacheHit: false
          },
          duration
        );
      }

      return {
        success: true,
        data,
        metadata: {
          encrypted: isEncrypted,
          cached: false,
          timestamp: new Date(),
          source: 'storage'
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (options.auditLog !== false) {
        await this.auditLogger.logSyncOperation(
          key.userId,
          sessionId,
          'secure_storage_read',
          storageKey,
          AuditAction.READ,
          AuditResult.FAILURE,
          { error: error instanceof Error ? error.message : 'Unknown error' },
          duration,
          error instanceof Error ? error : new Error('Retrieval operation failed')
        );
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retrieval operation failed'
      };
    }
  }

  /**
   * Securely delete sync data
   */
  async delete(
    key: StorageKey,
    sessionId: string,
    options: SecureStorageOptions = {}
  ): Promise<StorageResult<boolean>> {
    const startTime = Date.now();
    const storageKey = this.generateStorageKey(key);
    
    try {
      // Default options
      const opts = {
        validatePermissions: true,
        auditLog: true,
        sessionRequired: true,
        ...options
      };

      // Validate session if required
      if (opts.sessionRequired) {
        const sessionValidation = await this.sessionManager.validateSession(sessionId);
        if (!sessionValidation.isValid) {
          return {
            success: false,
            error: `Session validation failed: ${sessionValidation.reason}`
          };
        }
      }

      // Validate permissions if required
      if (opts.validatePermissions) {
        const validationContext: ValidationContext = {
          userId: key.userId,
          sessionId,
          operation: this.getOperationTypeForCategory(key.category, 'write'),
          resource: key.category,
          requestedAction: AuditAction.DELETE
        };

        const permissionResult = await this.permissionValidator.validateSyncOperation(validationContext);
        if (!permissionResult.isAuthorized) {
          if (opts.auditLog) {
            await this.auditLogger.logSyncOperation(
              key.userId,
              sessionId,
              'secure_storage_delete',
              storageKey,
              AuditAction.DELETE,
              AuditResult.FORBIDDEN,
              { reason: permissionResult.reason }
            );
          }

          return {
            success: false,
            error: `Permission denied: ${permissionResult.reason}`
          };
        }
      }

      // Remove from localStorage and cache
      localStorage.removeItem(storageKey);
      this.cache.delete(storageKey);

      // Audit log if required
      if (opts.auditLog) {
        const duration = Date.now() - startTime;
        await this.auditLogger.logSyncOperation(
          key.userId,
          sessionId,
          'secure_storage_delete',
          storageKey,
          AuditAction.DELETE,
          AuditResult.SUCCESS,
          { category: key.category },
          duration
        );
      }

      return {
        success: true,
        data: true,
        metadata: {
          encrypted: false,
          cached: false,
          timestamp: new Date(),
          source: 'storage'
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (options.auditLog !== false) {
        await this.auditLogger.logSyncOperation(
          key.userId,
          sessionId,
          'secure_storage_delete',
          storageKey,
          AuditAction.DELETE,
          AuditResult.FAILURE,
          { error: error instanceof Error ? error.message : 'Unknown error' },
          duration,
          error instanceof Error ? error : new Error('Delete operation failed')
        );
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete operation failed'
      };
    }
  }

  /**
   * Clear all data for a user (GDPR compliance)
   */
  async clearUserData(userId: string, sessionId: string): Promise<StorageResult<number>> {
    try {
      let deletedCount = 0;
      const keysToDelete: string[] = [];

      // Find all keys for this user
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(`user_${userId}_`)) {
          keysToDelete.push(key);
        }
      }

      // Delete each key
      for (const key of keysToDelete) {
        localStorage.removeItem(key);
        this.cache.delete(key);
        deletedCount++;
      }

      // Clear audit data for user
      await this.auditLogger.deleteUserAuditData(userId);

      // Log the cleanup operation
      await this.auditLogger.logSyncOperation(
        userId,
        sessionId,
        'user_data_cleanup',
        'all_user_data',
        AuditAction.DELETE,
        AuditResult.SUCCESS,
        { deletedItems: deletedCount }
      );

      return {
        success: true,
        data: deletedCount,
        metadata: {
          encrypted: false,
          cached: false,
          timestamp: new Date(),
          source: 'cleanup'
        }
      };

    } catch (error) {
      await this.auditLogger.logSyncOperation(
        userId,
        sessionId,
        'user_data_cleanup',
        'all_user_data',
        AuditAction.DELETE,
        AuditResult.FAILURE,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        undefined,
        error instanceof Error ? error : new Error('Cleanup operation failed')
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cleanup operation failed'
      };
    }
  }

  /**
   * Get session manager instance
   */
  getSessionManager(): SyncSessionManager {
    return this.sessionManager;
  }

  /**
   * Get audit logger instance
   */
  getAuditLogger(): SyncAuditLogger {
    return this.auditLogger;
  }

  /**
   * Get permission validator instance
   */
  getPermissionValidator(): SyncPermissionValidator {
    return this.permissionValidator;
  }

  private generateStorageKey(key: StorageKey): string {
    return `sync_${key.category}_user_${key.userId}_${key.identifier}`;
  }

  private getOperationTypeForCategory(category: string, operation: 'read' | 'write'): SyncOperationType {
    const mapping: Record<string, { read: SyncOperationType; write: SyncOperationType }> = {
      profile: {
        read: SyncOperationType.READ_PROFILE,
        write: SyncOperationType.WRITE_PROFILE
      },
      nft_collection: {
        read: SyncOperationType.READ_NFT_COLLECTION,
        write: SyncOperationType.SYNC_NFT_COLLECTION
      },
      wallet_data: {
        read: SyncOperationType.READ_WALLET_DATA,
        write: SyncOperationType.READ_WALLET_DATA
      },
      cache: {
        read: SyncOperationType.READ_CACHE,
        write: SyncOperationType.WRITE_CACHE
      },
      session: {
        read: SyncOperationType.READ_CACHE,
        write: SyncOperationType.WRITE_CACHE
      }
    };

    return mapping[category]?.[operation] || SyncOperationType.READ_CACHE;
  }

  private isCacheValid(timestamp: Date): boolean {
    return Date.now() - timestamp.getTime() < this.CACHE_TTL;
  }
}

export { 
  SecureSyncStorage,
  type SecureStorageOptions,
  type StorageResult,
  type StorageKey
};