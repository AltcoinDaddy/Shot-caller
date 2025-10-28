/**
 * Permission validation system for sync operations
 * Ensures all sync operations are authorized and comply with user permissions
 */

import { SyncSessionManager, SyncOperationType, type SyncSession } from './sync-session-manager';
import { SyncAuditLogger, AuditAction, AuditResult } from './sync-audit-logger';

interface ValidationContext {
  userId: string;
  sessionId: string;
  walletAddress?: string;
  operation: SyncOperationType;
  resource: string;
  requestedAction: AuditAction;
  metadata?: Record<string, any>;
}

interface ValidationResult {
  isAuthorized: boolean;
  reason?: string;
  requiredPermissions?: string[];
  suggestedActions?: string[];
}

interface PermissionRule {
  operation: SyncOperationType;
  resource: string;
  actions: AuditAction[];
  conditions?: PermissionCondition[];
  description: string;
}

interface PermissionCondition {
  type: 'wallet_ownership' | 'session_validity' | 'rate_limit' | 'time_window' | 'resource_access';
  parameters: Record<string, any>;
}

interface RateLimitConfig {
  operation: SyncOperationType;
  maxRequests: number;
  windowMs: number;
  skipSuccessful?: boolean;
}

class SyncPermissionValidator {
  private sessionManager: SyncSessionManager;
  private auditLogger: SyncAuditLogger;
  private permissionRules: Map<string, PermissionRule> = new Map();
  private rateLimits: Map<string, RateLimitConfig> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(sessionManager: SyncSessionManager, auditLogger: SyncAuditLogger) {
    this.sessionManager = sessionManager;
    this.auditLogger = auditLogger;
    this.initializeDefaultRules();
    this.initializeRateLimits();
  }

  /**
   * Validate if a sync operation is authorized
   */
  async validateSyncOperation(context: ValidationContext): Promise<ValidationResult> {
    try {
      // 1. Validate session
      const sessionValidation = await this.sessionManager.validateSession(context.sessionId);
      if (!sessionValidation.isValid) {
        await this.auditLogger.logSyncOperation(
          context.userId,
          context.sessionId,
          'permission_validation',
          context.resource,
          context.requestedAction,
          AuditResult.UNAUTHORIZED,
          { reason: sessionValidation.reason }
        );
        
        return {
          isAuthorized: false,
          reason: `Session validation failed: ${sessionValidation.reason}`,
          suggestedActions: ['Re-authenticate', 'Create new session']
        };
      }

      const session = sessionValidation.session!;

      // 2. Check basic permissions
      const hasPermission = this.sessionManager.hasPermission(session, context.operation, context.resource);
      if (!hasPermission) {
        await this.auditLogger.logSyncOperation(
          context.userId,
          context.sessionId,
          'permission_validation',
          context.resource,
          context.requestedAction,
          AuditResult.FORBIDDEN,
          { reason: 'Insufficient permissions' }
        );

        return {
          isAuthorized: false,
          reason: 'Insufficient permissions for this operation',
          requiredPermissions: [context.operation],
          suggestedActions: ['Request additional permissions', 'Contact administrator']
        };
      }

      // 3. Check permission rules
      const ruleValidation = this.validatePermissionRules(context, session);
      if (!ruleValidation.isAuthorized) {
        await this.auditLogger.logSyncOperation(
          context.userId,
          context.sessionId,
          'permission_validation',
          context.resource,
          context.requestedAction,
          AuditResult.FORBIDDEN,
          { reason: ruleValidation.reason }
        );

        return ruleValidation;
      }

      // 4. Check rate limits
      const rateLimitValidation = this.validateRateLimit(context);
      if (!rateLimitValidation.isAuthorized) {
        await this.auditLogger.logSyncOperation(
          context.userId,
          context.sessionId,
          'permission_validation',
          context.resource,
          context.requestedAction,
          AuditResult.FORBIDDEN,
          { reason: rateLimitValidation.reason }
        );

        return rateLimitValidation;
      }

      // 5. Log successful validation
      await this.auditLogger.logSyncOperation(
        context.userId,
        context.sessionId,
        'permission_validation',
        context.resource,
        context.requestedAction,
        AuditResult.SUCCESS
      );

      return { isAuthorized: true };

    } catch (error) {
      await this.auditLogger.logSyncOperation(
        context.userId,
        context.sessionId,
        'permission_validation',
        context.resource,
        context.requestedAction,
        AuditResult.FAILURE,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        isAuthorized: false,
        reason: 'Permission validation failed due to system error',
        suggestedActions: ['Retry operation', 'Contact support']
      };
    }
  }

  /**
   * Validate wallet ownership for operations
   */
  async validateWalletOwnership(
    userId: string, 
    sessionId: string, 
    walletAddress: string
  ): Promise<ValidationResult> {
    const sessionValidation = await this.sessionManager.validateSession(sessionId);
    if (!sessionValidation.isValid) {
      return {
        isAuthorized: false,
        reason: 'Invalid session for wallet ownership validation'
      };
    }

    const session = sessionValidation.session!;
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const sessionWalletAddress = session.walletAddress.toLowerCase();

    if (normalizedWalletAddress !== sessionWalletAddress) {
      await this.auditLogger.logSyncOperation(
        userId,
        sessionId,
        'wallet_ownership_validation',
        walletAddress,
        AuditAction.VALIDATE,
        AuditResult.FORBIDDEN,
        { 
          requestedWallet: normalizedWalletAddress,
          sessionWallet: sessionWalletAddress
        }
      );

      return {
        isAuthorized: false,
        reason: 'Wallet address does not match session wallet',
        suggestedActions: ['Connect correct wallet', 'Create new session with correct wallet']
      };
    }

    return { isAuthorized: true };
  }

  /**
   * Check if user can perform bulk operations
   */
  async validateBulkOperation(
    context: ValidationContext,
    itemCount: number,
    maxBulkSize: number = 100
  ): Promise<ValidationResult> {
    if (itemCount > maxBulkSize) {
      return {
        isAuthorized: false,
        reason: `Bulk operation exceeds maximum size (${itemCount} > ${maxBulkSize})`,
        suggestedActions: ['Reduce batch size', 'Split into multiple operations']
      };
    }

    // Check if user has permission for bulk operations
    const bulkContext: ValidationContext = {
      ...context,
      operation: SyncOperationType.SYNC_NFT_COLLECTION, // Bulk operations typically involve collection sync
      metadata: { ...context.metadata, bulkSize: itemCount }
    };

    return this.validateSyncOperation(bulkContext);
  }

  /**
   * Validate resource access permissions
   */
  validateResourceAccess(
    session: SyncSession,
    resourceType: string,
    resourceId: string,
    action: AuditAction
  ): ValidationResult {
    // Check if user owns the resource (for user-specific resources)
    if (resourceType === 'profile' || resourceType === 'nft_collection') {
      const resourceUserId = this.extractUserIdFromResource(resourceId);
      if (resourceUserId && resourceUserId !== session.userId) {
        return {
          isAuthorized: false,
          reason: 'Cannot access another user\'s resources',
          suggestedActions: ['Access your own resources', 'Request proper authorization']
        };
      }
    }

    // Check action-specific permissions
    if (action === AuditAction.DELETE || action === AuditAction.UPDATE) {
      const hasWritePermission = this.sessionManager.hasPermission(
        session, 
        SyncOperationType.WRITE_PROFILE, 
        resourceType
      );
      
      if (!hasWritePermission) {
        return {
          isAuthorized: false,
          reason: 'Write permissions required for this action',
          requiredPermissions: [SyncOperationType.WRITE_PROFILE],
          suggestedActions: ['Request write permissions']
        };
      }
    }

    return { isAuthorized: true };
  }

  /**
   * Add custom permission rule
   */
  addPermissionRule(rule: PermissionRule): void {
    const ruleKey = `${rule.operation}_${rule.resource}`;
    this.permissionRules.set(ruleKey, rule);
  }

  /**
   * Add rate limit configuration
   */
  addRateLimit(config: RateLimitConfig): void {
    const limitKey = config.operation;
    this.rateLimits.set(limitKey, config);
  }

  /**
   * Get current rate limit status for a user
   */
  getRateLimitStatus(userId: string, operation: SyncOperationType): {
    remaining: number;
    resetTime: number;
    isLimited: boolean;
  } {
    const limitKey = `${userId}_${operation}`;
    const rateLimitConfig = this.rateLimits.get(operation);
    
    if (!rateLimitConfig) {
      return { remaining: Infinity, resetTime: 0, isLimited: false };
    }

    const requestData = this.requestCounts.get(limitKey);
    if (!requestData) {
      return { 
        remaining: rateLimitConfig.maxRequests, 
        resetTime: Date.now() + rateLimitConfig.windowMs,
        isLimited: false 
      };
    }

    const now = Date.now();
    if (now > requestData.resetTime) {
      // Reset window
      this.requestCounts.delete(limitKey);
      return { 
        remaining: rateLimitConfig.maxRequests, 
        resetTime: now + rateLimitConfig.windowMs,
        isLimited: false 
      };
    }

    const remaining = Math.max(0, rateLimitConfig.maxRequests - requestData.count);
    return {
      remaining,
      resetTime: requestData.resetTime,
      isLimited: remaining === 0
    };
  }

  private validatePermissionRules(context: ValidationContext, session: SyncSession): ValidationResult {
    const ruleKey = `${context.operation}_${context.resource}`;
    const rule = this.permissionRules.get(ruleKey) || this.permissionRules.get(`${context.operation}_*`);
    
    if (!rule) {
      // No specific rule, allow if basic permissions are met
      return { isAuthorized: true };
    }

    // Check if action is allowed by rule
    if (!rule.actions.includes(context.requestedAction)) {
      return {
        isAuthorized: false,
        reason: `Action '${context.requestedAction}' not allowed for operation '${context.operation}'`,
        suggestedActions: [`Use allowed actions: ${rule.actions.join(', ')}`]
      };
    }

    // Check rule conditions
    if (rule.conditions) {
      for (const condition of rule.conditions) {
        const conditionResult = this.evaluateCondition(condition, context, session);
        if (!conditionResult.isAuthorized) {
          return conditionResult;
        }
      }
    }

    return { isAuthorized: true };
  }

  private evaluateCondition(
    condition: PermissionCondition, 
    context: ValidationContext, 
    session: SyncSession
  ): ValidationResult {
    switch (condition.type) {
      case 'wallet_ownership':
        if (context.walletAddress && context.walletAddress.toLowerCase() !== session.walletAddress.toLowerCase()) {
          return {
            isAuthorized: false,
            reason: 'Wallet ownership verification failed'
          };
        }
        break;

      case 'session_validity':
        const maxAge = condition.parameters.maxAgeMinutes || 60;
        const sessionAge = (Date.now() - session.lastActivity.getTime()) / (1000 * 60);
        if (sessionAge > maxAge) {
          return {
            isAuthorized: false,
            reason: 'Session too old for this operation',
            suggestedActions: ['Refresh session', 'Re-authenticate']
          };
        }
        break;

      case 'time_window':
        const allowedHours = condition.parameters.allowedHours || [0, 23];
        const currentHour = new Date().getHours();
        if (currentHour < allowedHours[0] || currentHour > allowedHours[1]) {
          return {
            isAuthorized: false,
            reason: 'Operation not allowed during current time window'
          };
        }
        break;

      case 'resource_access':
        const resourceValidation = this.validateResourceAccess(
          session,
          context.resource,
          condition.parameters.resourceId || context.resource,
          context.requestedAction
        );
        if (!resourceValidation.isAuthorized) {
          return resourceValidation;
        }
        break;
    }

    return { isAuthorized: true };
  }

  private validateRateLimit(context: ValidationContext): ValidationResult {
    const rateLimitConfig = this.rateLimits.get(context.operation);
    if (!rateLimitConfig) {
      return { isAuthorized: true };
    }

    const limitKey = `${context.userId}_${context.operation}`;
    const now = Date.now();
    
    let requestData = this.requestCounts.get(limitKey);
    
    // Initialize or reset if window expired
    if (!requestData || now > requestData.resetTime) {
      requestData = {
        count: 0,
        resetTime: now + rateLimitConfig.windowMs
      };
      this.requestCounts.set(limitKey, requestData);
    }

    // Check if limit exceeded
    if (requestData.count >= rateLimitConfig.maxRequests) {
      const resetIn = Math.ceil((requestData.resetTime - now) / 1000);
      return {
        isAuthorized: false,
        reason: `Rate limit exceeded for operation '${context.operation}'`,
        suggestedActions: [`Wait ${resetIn} seconds before retrying`]
      };
    }

    // Increment counter
    requestData.count++;

    return { isAuthorized: true };
  }

  private extractUserIdFromResource(resourceId: string): string | null {
    // Extract user ID from resource identifier
    // This is a simplified implementation - adjust based on your resource ID format
    const match = resourceId.match(/^user_([^_]+)/);
    return match ? match[1] : null;
  }

  private initializeDefaultRules(): void {
    // Profile access rules
    this.addPermissionRule({
      operation: SyncOperationType.READ_PROFILE,
      resource: 'profile',
      actions: [AuditAction.READ],
      conditions: [
        { type: 'session_validity', parameters: { maxAgeMinutes: 120 } }
      ],
      description: 'Allow reading profile data with valid session'
    });

    this.addPermissionRule({
      operation: SyncOperationType.WRITE_PROFILE,
      resource: 'profile',
      actions: [AuditAction.UPDATE, AuditAction.CREATE],
      conditions: [
        { type: 'wallet_ownership', parameters: {} },
        { type: 'session_validity', parameters: { maxAgeMinutes: 30 } }
      ],
      description: 'Allow writing profile data with wallet ownership and fresh session'
    });

    // NFT collection rules
    this.addPermissionRule({
      operation: SyncOperationType.SYNC_NFT_COLLECTION,
      resource: 'nft_collection',
      actions: [AuditAction.SYNC, AuditAction.READ],
      conditions: [
        { type: 'wallet_ownership', parameters: {} }
      ],
      description: 'Allow NFT collection sync with wallet ownership verification'
    });

    // Cache operation rules
    this.addPermissionRule({
      operation: SyncOperationType.READ_CACHE,
      resource: '*',
      actions: [AuditAction.READ],
      description: 'Allow cache read operations'
    });

    this.addPermissionRule({
      operation: SyncOperationType.WRITE_CACHE,
      resource: '*',
      actions: [AuditAction.CREATE, AuditAction.UPDATE, AuditAction.DELETE],
      conditions: [
        { type: 'session_validity', parameters: { maxAgeMinutes: 60 } }
      ],
      description: 'Allow cache write operations with valid session'
    });
  }

  private initializeRateLimits(): void {
    // NFT collection sync - limit to prevent API abuse
    this.addRateLimit({
      operation: SyncOperationType.SYNC_NFT_COLLECTION,
      maxRequests: 10,
      windowMs: 5 * 60 * 1000, // 5 minutes
      skipSuccessful: false
    });

    // Profile updates
    this.addRateLimit({
      operation: SyncOperationType.WRITE_PROFILE,
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
      skipSuccessful: true
    });

    // Wallet data reads
    this.addRateLimit({
      operation: SyncOperationType.READ_WALLET_DATA,
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
      skipSuccessful: true
    });
  }
}

export { 
  SyncPermissionValidator,
  type ValidationContext,
  type ValidationResult,
  type PermissionRule,
  type PermissionCondition,
  type RateLimitConfig
};