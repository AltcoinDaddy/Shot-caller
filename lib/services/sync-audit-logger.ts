/**
 * Audit trail system for sync activities with privacy compliance
 * Logs all sync operations while maintaining user privacy and GDPR compliance
 */

import { SyncEncryption } from '@/lib/utils/sync-encryption';

interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string; // Hashed for privacy
  sessionId: string;
  operation: string;
  resource: string;
  action: AuditAction;
  result: AuditResult;
  metadata: AuditMetadata;
  ipAddress?: string; // Hashed for privacy
  userAgent?: string; // Sanitized
  duration?: number;
  errorCode?: string;
  errorMessage?: string; // Sanitized
}

interface AuditMetadata {
  walletAddress?: string; // Hashed
  nftCount?: number;
  dataSize?: number;
  cacheHit?: boolean;
  retryCount?: number;
  networkQuality?: string;
  [key: string]: any;
}

enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  SYNC = 'sync',
  VALIDATE = 'validate',
  ENCRYPT = 'encrypt',
  DECRYPT = 'decrypt'
}

enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
  TIMEOUT = 'timeout',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden'
}

interface AuditQuery {
  userId?: string;
  sessionId?: string;
  operation?: string;
  action?: AuditAction;
  result?: AuditResult;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

interface PrivacyConfig {
  retentionDays: number;
  anonymizeAfterDays: number;
  hashSensitiveData: boolean;
  excludePersonalData: boolean;
}

class SyncAuditLogger {
  private encryption: SyncEncryption;
  private auditEvents: Map<string, AuditEvent> = new Map();
  private privacyConfig: PrivacyConfig;
  private readonly MAX_EVENTS_IN_MEMORY = 1000;

  constructor(privacyConfig?: Partial<PrivacyConfig>) {
    this.encryption = new SyncEncryption();
    this.privacyConfig = {
      retentionDays: 90,
      anonymizeAfterDays: 30,
      hashSensitiveData: true,
      excludePersonalData: false,
      ...privacyConfig
    };
    
    this.loadPersistedEvents();
    this.scheduleCleanup();
  }

  /**
   * Log a sync operation audit event
   */
  async logSyncOperation(
    userId: string,
    sessionId: string,
    operation: string,
    resource: string,
    action: AuditAction,
    result: AuditResult,
    metadata: Partial<AuditMetadata> = {},
    duration?: number,
    error?: Error
  ): Promise<void> {
    const eventId = this.generateEventId();
    const now = new Date();

    const auditEvent: AuditEvent = {
      id: eventId,
      timestamp: now,
      userId: this.privacyConfig.hashSensitiveData ? this.hashData(userId) : userId,
      sessionId,
      operation,
      resource,
      action,
      result,
      metadata: this.sanitizeMetadata(metadata),
      duration,
      errorCode: error?.name,
      errorMessage: error ? this.sanitizeErrorMessage(error.message) : undefined
    };

    // Add context information if available
    if (typeof window !== 'undefined') {
      auditEvent.userAgent = this.sanitizeUserAgent(navigator.userAgent);
    }

    this.auditEvents.set(eventId, auditEvent);
    await this.persistEvent(auditEvent);

    // Manage memory usage
    if (this.auditEvents.size > this.MAX_EVENTS_IN_MEMORY) {
      this.trimOldEvents();
    }
  }

  /**
   * Log wallet connection events
   */
  async logWalletConnection(
    userId: string,
    sessionId: string,
    walletAddress: string,
    action: 'connect' | 'disconnect',
    result: AuditResult,
    metadata: Partial<AuditMetadata> = {}
  ): Promise<void> {
    await this.logSyncOperation(
      userId,
      sessionId,
      'wallet_connection',
      'wallet',
      action === 'connect' ? AuditAction.CREATE : AuditAction.DELETE,
      result,
      {
        ...metadata,
        walletAddress: this.privacyConfig.hashSensitiveData ? this.hashData(walletAddress) : walletAddress
      }
    );
  }

  /**
   * Log NFT collection sync events
   */
  async logNFTSync(
    userId: string,
    sessionId: string,
    walletAddress: string,
    nftCount: number,
    result: AuditResult,
    duration?: number,
    error?: Error
  ): Promise<void> {
    await this.logSyncOperation(
      userId,
      sessionId,
      'nft_collection_sync',
      'nft_collection',
      AuditAction.SYNC,
      result,
      {
        walletAddress: this.privacyConfig.hashSensitiveData ? this.hashData(walletAddress) : walletAddress,
        nftCount
      },
      duration,
      error
    );
  }

  /**
   * Log profile data access events
   */
  async logProfileAccess(
    userId: string,
    sessionId: string,
    action: AuditAction,
    result: AuditResult,
    metadata: Partial<AuditMetadata> = {}
  ): Promise<void> {
    await this.logSyncOperation(
      userId,
      sessionId,
      'profile_access',
      'profile',
      action,
      result,
      metadata
    );
  }

  /**
   * Log cache operations
   */
  async logCacheOperation(
    userId: string,
    sessionId: string,
    action: AuditAction,
    cacheKey: string,
    result: AuditResult,
    metadata: Partial<AuditMetadata> = {}
  ): Promise<void> {
    await this.logSyncOperation(
      userId,
      sessionId,
      'cache_operation',
      this.sanitizeCacheKey(cacheKey),
      action,
      result,
      metadata
    );
  }

  /**
   * Query audit events with privacy-compliant filtering
   */
  queryEvents(query: AuditQuery): AuditEvent[] {
    let events = Array.from(this.auditEvents.values());

    // Apply filters
    if (query.userId) {
      const hashedUserId = this.privacyConfig.hashSensitiveData ? this.hashData(query.userId) : query.userId;
      events = events.filter(e => e.userId === hashedUserId);
    }

    if (query.sessionId) {
      events = events.filter(e => e.sessionId === query.sessionId);
    }

    if (query.operation) {
      events = events.filter(e => e.operation === query.operation);
    }

    if (query.action) {
      events = events.filter(e => e.action === query.action);
    }

    if (query.result) {
      events = events.filter(e => e.result === query.result);
    }

    if (query.startDate) {
      events = events.filter(e => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      events = events.filter(e => e.timestamp <= query.endDate!);
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (query.limit) {
      events = events.slice(0, query.limit);
    }

    return events;
  }

  /**
   * Get audit statistics for monitoring
   */
  getAuditStatistics(timeRange: { start: Date; end: Date }): {
    totalEvents: number;
    eventsByResult: Record<AuditResult, number>;
    eventsByOperation: Record<string, number>;
    averageDuration: number;
    errorRate: number;
  } {
    const events = this.queryEvents({
      startDate: timeRange.start,
      endDate: timeRange.end
    });

    const eventsByResult = events.reduce((acc, event) => {
      acc[event.result] = (acc[event.result] || 0) + 1;
      return acc;
    }, {} as Record<AuditResult, number>);

    const eventsByOperation = events.reduce((acc, event) => {
      acc[event.operation] = (acc[event.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const durationsWithValues = events.filter(e => e.duration !== undefined);
    const averageDuration = durationsWithValues.length > 0
      ? durationsWithValues.reduce((sum, e) => sum + (e.duration || 0), 0) / durationsWithValues.length
      : 0;

    const errorEvents = events.filter(e => e.result === AuditResult.FAILURE || e.result === AuditResult.TIMEOUT);
    const errorRate = events.length > 0 ? errorEvents.length / events.length : 0;

    return {
      totalEvents: events.length,
      eventsByResult,
      eventsByOperation,
      averageDuration,
      errorRate
    };
  }

  /**
   * Export audit data for compliance purposes
   */
  async exportAuditData(userId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const userEvents = this.queryEvents({ userId });
    
    if (format === 'csv') {
      return this.convertToCSV(userEvents);
    }
    
    return JSON.stringify(userEvents, null, 2);
  }

  /**
   * Delete user audit data for GDPR compliance
   */
  async deleteUserAuditData(userId: string): Promise<number> {
    const hashedUserId = this.privacyConfig.hashSensitiveData ? this.hashData(userId) : userId;
    const userEvents = Array.from(this.auditEvents.entries()).filter(
      ([_, event]) => event.userId === hashedUserId
    );

    for (const [eventId] of userEvents) {
      this.auditEvents.delete(eventId);
      this.removePersistedEvent(eventId);
    }

    return userEvents.length;
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashData(data: string): string {
    // Simple hash for privacy (in production, use a proper cryptographic hash)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  private sanitizeMetadata(metadata: Partial<AuditMetadata>): AuditMetadata {
    const sanitized: AuditMetadata = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      if (key === 'walletAddress' && this.privacyConfig.hashSensitiveData) {
        sanitized[key] = typeof value === 'string' ? this.hashData(value) : value;
      } else if (this.privacyConfig.excludePersonalData && this.isPersonalDataField(key)) {
        // Skip personal data fields
        continue;
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove potentially sensitive information from error messages
    return message
      .replace(/0x[a-fA-F0-9]{40}/g, '[WALLET_ADDRESS]') // Ethereum addresses
      .replace(/[a-zA-Z0-9]{34}/g, '[FLOW_ADDRESS]') // Flow addresses
      .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '[CARD_NUMBER]') // Credit card numbers
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]'); // Email addresses
  }

  private sanitizeUserAgent(userAgent: string): string {
    // Keep only browser and OS information, remove detailed version numbers
    const sanitized = userAgent
      .replace(/\d+\.\d+\.\d+/g, 'X.X.X') // Version numbers
      .replace(/\([^)]*\)/g, '(...)'); // Detailed system info
    
    return sanitized.substring(0, 200); // Limit length
  }

  private sanitizeCacheKey(key: string): string {
    // Remove sensitive parts from cache keys
    return key
      .replace(/0x[a-fA-F0-9]{40}/g, '[WALLET]')
      .replace(/[a-zA-Z0-9]{34}/g, '[ADDRESS]');
  }

  private isPersonalDataField(fieldName: string): boolean {
    const personalDataFields = ['email', 'phone', 'name', 'address', 'ip'];
    return personalDataFields.some(field => fieldName.toLowerCase().includes(field));
  }

  private async persistEvent(event: AuditEvent): Promise<void> {
    try {
      const encryptedEvent = await this.encryption.encryptSyncData(event);
      localStorage.setItem(`audit_event_${event.id}`, encryptedEvent);
    } catch (error) {
      console.error('Failed to persist audit event:', error);
    }
  }

  private removePersistedEvent(eventId: string): void {
    localStorage.removeItem(`audit_event_${eventId}`);
  }

  private async loadPersistedEvents(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('audit_event_')) {
          const encryptedData = localStorage.getItem(key);
          if (encryptedData) {
            try {
              const event = await this.encryption.decryptSyncData(encryptedData);
              if (this.isValidEventStructure(event)) {
                this.auditEvents.set(event.id, {
                  ...event,
                  timestamp: new Date(event.timestamp)
                });
              } else {
                localStorage.removeItem(key);
              }
            } catch (error) {
              console.warn('Failed to load persisted audit event:', error);
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load persisted audit events:', error);
    }
  }

  private isValidEventStructure(obj: any): obj is AuditEvent {
    return obj &&
           typeof obj.id === 'string' &&
           typeof obj.userId === 'string' &&
           typeof obj.sessionId === 'string' &&
           typeof obj.operation === 'string' &&
           typeof obj.resource === 'string' &&
           Object.values(AuditAction).includes(obj.action) &&
           Object.values(AuditResult).includes(obj.result) &&
           obj.timestamp &&
           typeof obj.metadata === 'object';
  }

  private trimOldEvents(): void {
    const events = Array.from(this.auditEvents.entries())
      .sort(([, a], [, b]) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Keep only the most recent events
    const eventsToKeep = events.slice(0, this.MAX_EVENTS_IN_MEMORY);
    const eventsToRemove = events.slice(this.MAX_EVENTS_IN_MEMORY);
    
    this.auditEvents.clear();
    for (const [id, event] of eventsToKeep) {
      this.auditEvents.set(id, event);
    }
    
    // Remove old events from storage
    for (const [id] of eventsToRemove) {
      this.removePersistedEvent(id);
    }
  }

  private scheduleCleanup(): void {
    // Clean up old events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000);
  }

  private cleanupOldEvents(): void {
    const now = new Date();
    const retentionCutoff = new Date(now.getTime() - (this.privacyConfig.retentionDays * 24 * 60 * 60 * 1000));
    
    const eventsToRemove: string[] = [];
    
    for (const [eventId, event] of this.auditEvents) {
      if (event.timestamp < retentionCutoff) {
        eventsToRemove.push(eventId);
      }
    }
    
    for (const eventId of eventsToRemove) {
      this.auditEvents.delete(eventId);
      this.removePersistedEvent(eventId);
    }
  }

  private convertToCSV(events: AuditEvent[]): string {
    if (events.length === 0) return '';
    
    const headers = ['id', 'timestamp', 'userId', 'sessionId', 'operation', 'resource', 'action', 'result', 'duration', 'errorCode'];
    const rows = events.map(event => [
      event.id,
      event.timestamp.toISOString(),
      event.userId,
      event.sessionId,
      event.operation,
      event.resource,
      event.action,
      event.result,
      event.duration || '',
      event.errorCode || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

export { 
  SyncAuditLogger, 
  AuditAction, 
  AuditResult,
  type AuditEvent, 
  type AuditMetadata, 
  type AuditQuery,
  type PrivacyConfig 
};