/**
 * Unit tests for sync security measures
 * Tests encryption, session management, audit logging, and permission validation
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncEncryption } from '@/lib/utils/sync-encryption';
import { SyncSessionManager, SyncOperationType } from '@/lib/services/sync-session-manager';
import { SyncAuditLogger, AuditAction, AuditResult } from '@/lib/services/sync-audit-logger';
import { SyncPermissionValidator } from '@/lib/services/sync-permission-validator';
import { SecureSyncStorage } from '@/lib/services/secure-sync-storage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      importKey: vi.fn().mockResolvedValue({}),
      deriveKey: vi.fn().mockResolvedValue({}),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32))
    },
    getRandomValues: vi.fn().mockReturnValue(new Uint8Array(12))
  }
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = vi.fn().mockImplementation(() => ({
  encode: vi.fn().mockImplementation((str) => {
    const data = JSON.stringify({ userId: 'test123', nfts: ['nft1', 'nft2'] });
    return new Uint8Array(Array.from(data).map(c => c.charCodeAt(0)));
  })
}));

global.TextDecoder = vi.fn().mockImplementation(() => ({
  decode: vi.fn().mockImplementation(() => {
    return JSON.stringify({ userId: 'test123', nfts: ['nft1', 'nft2'] });
  })
}));

describe('SyncEncryption', () => {
  let encryption: SyncEncryption;

  beforeEach(() => {
    encryption = new SyncEncryption();
    vi.clearAllMocks();
  });

  test('should encrypt and decrypt data successfully', async () => {
    const testData = { userId: 'test123', nfts: ['nft1', 'nft2'] };
    const userIdentifier = 'user123';

    const encrypted = await encryption.encryptSyncData(testData, userIdentifier);
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(0);

    const decrypted = await encryption.decryptSyncData(encrypted, userIdentifier);
    expect(decrypted).toEqual(testData);
  });

  test('should handle encryption errors gracefully', async () => {
    vi.mocked(crypto.subtle.encrypt).mockRejectedValueOnce(new Error('Encryption failed'));

    await expect(encryption.encryptSyncData({ test: 'data' }))
      .rejects.toThrow('Failed to encrypt sync data');
  });

  test('should detect expired data', async () => {
    const testData = { test: 'data' };
    const encrypted = await encryption.encryptSyncData(testData);
    
    // Mock old timestamp
    const encryptedObj = JSON.parse(atob(encrypted));
    encryptedObj.timestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
    const expiredEncrypted = btoa(JSON.stringify(encryptedObj));

    expect(encryption.isDataExpired(expiredEncrypted)).toBe(true);
    expect(encryption.isDataExpired(encrypted)).toBe(false);
  });
});

describe('SyncSessionManager', () => {
  let sessionManager: SyncSessionManager;

  beforeEach(() => {
    sessionManager = new SyncSessionManager();
    vi.clearAllMocks();
  });

  test('should create and validate sessions', async () => {
    const userId = 'user123';
    const walletAddress = '0x1234567890abcdef';

    const session = await sessionManager.createSession(userId, walletAddress);
    
    expect(session.userId).toBe(userId);
    expect(session.walletAddress).toBe(walletAddress.toLowerCase());
    expect(session.isActive).toBe(true);
    expect(session.permissions.length).toBeGreaterThan(0);

    const validation = await sessionManager.validateSession(session.id);
    expect(validation.isValid).toBe(true);
    expect(validation.session).toBeDefined();
  });

  test('should reject invalid sessions', async () => {
    const validation = await sessionManager.validateSession('invalid-session-id');
    expect(validation.isValid).toBe(false);
    expect(validation.reason).toBe('Session not found');
  });

  test('should handle session permissions', async () => {
    const session = await sessionManager.createSession('user123', '0xtest');
    
    // Test default permissions
    expect(sessionManager.hasPermission(session, SyncOperationType.READ_PROFILE)).toBe(true);
    expect(sessionManager.hasPermission(session, SyncOperationType.WRITE_PROFILE)).toBe(false);

    // Grant additional permission
    await sessionManager.grantPermission(session.id, SyncOperationType.WRITE_PROFILE);
    const updatedValidation = await sessionManager.validateSession(session.id);
    
    expect(sessionManager.hasPermission(updatedValidation.session!, SyncOperationType.WRITE_PROFILE)).toBe(true);
  });

  test('should invalidate expired sessions', async () => {
    const session = await sessionManager.createSession('user123', '0xtest');
    
    // Mock expired session
    session.expiresAt = new Date(Date.now() - 1000);
    
    const validation = await sessionManager.validateSession(session.id);
    expect(validation.isValid).toBe(false);
    expect(validation.reason).toBe('Session expired');
  });
});

describe('SyncAuditLogger', () => {
  let auditLogger: SyncAuditLogger;

  beforeEach(() => {
    auditLogger = new SyncAuditLogger({
      retentionDays: 30,
      hashSensitiveData: true
    });
    vi.clearAllMocks();
  });

  test('should log sync operations', async () => {
    await auditLogger.logSyncOperation(
      'user123',
      'session123',
      'test_operation',
      'test_resource',
      AuditAction.READ,
      AuditResult.SUCCESS,
      { testMetadata: 'value' }
    );

    const events = auditLogger.queryEvents({ userId: 'user123' });
    expect(events.length).toBe(1);
    expect(events[0].operation).toBe('test_operation');
    expect(events[0].action).toBe(AuditAction.READ);
    expect(events[0].result).toBe(AuditResult.SUCCESS);
  });

  test('should log wallet connection events', async () => {
    await auditLogger.logWalletConnection(
      'user123',
      'session123',
      '0xtest',
      'connect',
      AuditResult.SUCCESS
    );

    const events = auditLogger.queryEvents({ operation: 'wallet_connection' });
    expect(events.length).toBe(1);
    expect(events[0].action).toBe(AuditAction.CREATE);
  });

  test('should provide audit statistics', async () => {
    const timeRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    };

    await auditLogger.logSyncOperation(
      'user123', 'session123', 'test_op', 'resource',
      AuditAction.READ, AuditResult.SUCCESS, {}, 100
    );
    
    await auditLogger.logSyncOperation(
      'user123', 'session123', 'test_op', 'resource',
      AuditAction.READ, AuditResult.FAILURE, {}, 200
    );

    const stats = auditLogger.getAuditStatistics(timeRange);
    expect(stats.totalEvents).toBe(2);
    expect(stats.eventsByResult[AuditResult.SUCCESS]).toBe(1);
    expect(stats.eventsByResult[AuditResult.FAILURE]).toBe(1);
    expect(stats.averageDuration).toBe(150);
    expect(stats.errorRate).toBe(0.5);
  });

  test('should export audit data', async () => {
    await auditLogger.logSyncOperation(
      'user123', 'session123', 'test_op', 'resource',
      AuditAction.READ, AuditResult.SUCCESS
    );

    const jsonExport = await auditLogger.exportAuditData('user123', 'json');
    expect(typeof jsonExport).toBe('string');
    
    const csvExport = await auditLogger.exportAuditData('user123', 'csv');
    expect(csvExport).toContain('id,timestamp,userId');
  });

  test('should delete user audit data', async () => {
    await auditLogger.logSyncOperation(
      'user123', 'session123', 'test_op', 'resource',
      AuditAction.READ, AuditResult.SUCCESS
    );

    const deletedCount = await auditLogger.deleteUserAuditData('user123');
    expect(deletedCount).toBe(1);

    const events = auditLogger.queryEvents({ userId: 'user123' });
    expect(events.length).toBe(0);
  });
});

describe('SyncPermissionValidator', () => {
  let sessionManager: SyncSessionManager;
  let auditLogger: SyncAuditLogger;
  let permissionValidator: SyncPermissionValidator;

  beforeEach(() => {
    sessionManager = new SyncSessionManager();
    auditLogger = new SyncAuditLogger();
    permissionValidator = new SyncPermissionValidator(sessionManager, auditLogger);
    vi.clearAllMocks();
  });

  test('should validate authorized operations', async () => {
    const session = await sessionManager.createSession('user123', '0xtest');
    
    const validationContext = {
      userId: 'user123',
      sessionId: session.id,
      operation: SyncOperationType.READ_PROFILE,
      resource: 'profile',
      requestedAction: AuditAction.READ
    };

    const result = await permissionValidator.validateSyncOperation(validationContext);
    expect(result.isAuthorized).toBe(true);
  });

  test('should reject unauthorized operations', async () => {
    const session = await sessionManager.createSession('user123', '0xtest');
    
    const validationContext = {
      userId: 'user123',
      sessionId: session.id,
      operation: SyncOperationType.WRITE_PROFILE,
      resource: 'profile',
      requestedAction: AuditAction.UPDATE
    };

    const result = await permissionValidator.validateSyncOperation(validationContext);
    expect(result.isAuthorized).toBe(false);
    expect(result.reason).toContain('Insufficient permissions');
  });

  test('should validate wallet ownership', async () => {
    const walletAddress = '0xtest123';
    const session = await sessionManager.createSession('user123', walletAddress);

    const result = await permissionValidator.validateWalletOwnership(
      'user123',
      session.id,
      walletAddress
    );
    expect(result.isAuthorized).toBe(true);

    const wrongWalletResult = await permissionValidator.validateWalletOwnership(
      'user123',
      session.id,
      '0xwrongwallet'
    );
    expect(wrongWalletResult.isAuthorized).toBe(false);
  });

  test('should enforce rate limits', async () => {
    const session = await sessionManager.createSession('user123', '0xtest');
    
    // Add a strict rate limit for testing
    permissionValidator.addRateLimit({
      operation: SyncOperationType.READ_PROFILE,
      maxRequests: 2,
      windowMs: 60000
    });

    const validationContext = {
      userId: 'user123',
      sessionId: session.id,
      operation: SyncOperationType.READ_PROFILE,
      resource: 'profile',
      requestedAction: AuditAction.READ
    };

    // First two requests should succeed
    let result = await permissionValidator.validateSyncOperation(validationContext);
    expect(result.isAuthorized).toBe(true);

    result = await permissionValidator.validateSyncOperation(validationContext);
    expect(result.isAuthorized).toBe(true);

    // Third request should be rate limited
    result = await permissionValidator.validateSyncOperation(validationContext);
    expect(result.isAuthorized).toBe(false);
    expect(result.reason).toContain('Rate limit exceeded');
  });
});

describe('SecureSyncStorage', () => {
  let secureStorage: SecureSyncStorage;

  beforeEach(() => {
    secureStorage = new SecureSyncStorage();
    vi.clearAllMocks();
  });

  test('should store and retrieve data securely', async () => {
    const sessionManager = secureStorage.getSessionManager();
    const session = await sessionManager.createSession('user123', '0xtest');
    
    // Grant write permissions
    await sessionManager.grantPermission(session.id, SyncOperationType.WRITE_PROFILE);

    const testData = { name: 'Test User', nfts: ['nft1', 'nft2'] };
    const storageKey = {
      userId: 'user123',
      category: 'profile' as const,
      identifier: 'main'
    };

    // Store data
    const storeResult = await secureStorage.store(storageKey, testData, session.id);
    expect(storeResult.success).toBe(true);
    expect(storeResult.metadata?.encrypted).toBe(true);

    // Retrieve data
    const retrieveResult = await secureStorage.retrieve(storageKey, session.id);
    expect(retrieveResult.success).toBe(true);
    expect(retrieveResult.data).toEqual(testData);
  });

  test('should reject operations without proper permissions', async () => {
    const sessionManager = secureStorage.getSessionManager();
    const session = await sessionManager.createSession('user123', '0xtest');

    const testData = { test: 'data' };
    const storageKey = {
      userId: 'user123',
      category: 'profile' as const,
      identifier: 'main'
    };

    // Try to store without write permissions
    const result = await secureStorage.store(storageKey, testData, session.id);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Permission denied');
  });

  test('should handle invalid sessions', async () => {
    const testData = { test: 'data' };
    const storageKey = {
      userId: 'user123',
      category: 'profile' as const,
      identifier: 'main'
    };

    const result = await secureStorage.store(storageKey, testData, 'invalid-session');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Session validation failed');
  });

  test('should clear user data for GDPR compliance', async () => {
    const sessionManager = secureStorage.getSessionManager();
    const session = await sessionManager.createSession('user123', '0xtest');
    
    // Mock localStorage with user data
    localStorageMock.length = 3;
    localStorageMock.key.mockImplementation((index) => {
      const keys = ['sync_profile_user_user123_main', 'sync_cache_user_user123_nfts', 'other_key'];
      return keys[index] || null;
    });

    const result = await secureStorage.clearUserData('user123', session.id);
    expect(result.success).toBe(true);
    expect(result.data).toBeGreaterThan(0);
  });
});

describe('Integration Tests', () => {
  test('should handle complete secure sync workflow', async () => {
    const secureStorage = new SecureSyncStorage();
    const sessionManager = secureStorage.getSessionManager();
    const auditLogger = secureStorage.getAuditLogger();

    // Create session
    const session = await sessionManager.createSession('user123', '0xtest');
    expect(session.isActive).toBe(true);

    // Grant necessary permissions
    await sessionManager.grantPermission(session.id, SyncOperationType.WRITE_PROFILE);
    await sessionManager.grantPermission(session.id, SyncOperationType.SYNC_NFT_COLLECTION);
    await sessionManager.grantPermission(session.id, SyncOperationType.WRITE_CACHE);

    // Store profile data
    const profileData = {
      username: 'testuser',
      walletAddress: '0xtest',
      nftCount: 5
    };

    const profileKey = {
      userId: 'user123',
      category: 'profile' as const,
      identifier: 'main'
    };

    const storeResult = await secureStorage.store(profileKey, profileData, session.id);
    expect(storeResult.success).toBe(true);

    // Store NFT collection data
    const nftData = {
      nfts: ['nft1', 'nft2', 'nft3'],
      lastSync: new Date().toISOString()
    };

    const nftKey = {
      userId: 'user123',
      category: 'nft_collection' as const,
      identifier: 'main'
    };

    const nftStoreResult = await secureStorage.store(nftKey, nftData, session.id);
    expect(nftStoreResult.success).toBe(true);

    // Retrieve data
    const profileRetrieveResult = await secureStorage.retrieve(profileKey, session.id);
    expect(profileRetrieveResult.success).toBe(true);
    expect(profileRetrieveResult.data).toEqual(profileData);

    // Check audit trail
    const auditEvents = auditLogger.queryEvents({ userId: 'user123' });
    expect(auditEvents.length).toBeGreaterThan(0);

    // Verify audit events include both storage operations
    const storageEvents = auditEvents.filter(e => e.operation.includes('secure_storage'));
    expect(storageEvents.length).toBeGreaterThan(2); // At least store and retrieve operations

    // Clean up
    await secureStorage.clearUserData('user123', session.id);
  });
});