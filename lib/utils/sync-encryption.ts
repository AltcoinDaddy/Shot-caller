/**
 * Encryption utilities for sensitive sync data
 * Provides secure storage and retrieval of sync-related information
 */

interface EncryptedData {
  data: string;
  iv: string;
  timestamp: number;
}

interface SyncSecurityConfig {
  encryptionKey?: string;
  keyDerivationSalt: string;
  algorithm: string;
  ivLength: number;
}

class SyncEncryption {
  private config: SyncSecurityConfig;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  constructor(config?: Partial<SyncSecurityConfig>) {
    this.config = {
      keyDerivationSalt: 'shotcaller-sync-salt-v1',
      algorithm: 'AES-GCM',
      ivLength: 12,
      ...config
    };
  }

  /**
   * Derive encryption key from user session or generate one
   */
  private async deriveKey(userIdentifier?: string): Promise<CryptoKey> {
    const keyMaterial = userIdentifier || 'default-sync-key';
    const keyData = this.encoder.encode(keyMaterial + this.config.keyDerivationSalt);
    
    const importedKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.encoder.encode(this.config.keyDerivationSalt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      importedKey,
      { name: this.config.algorithm, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt sensitive sync data
   */
  async encryptSyncData(data: any, userIdentifier?: string): Promise<string> {
    try {
      const key = await this.deriveKey(userIdentifier);
      const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));
      const encodedData = this.encoder.encode(JSON.stringify(data));

      const encryptedData = await crypto.subtle.encrypt(
        { name: this.config.algorithm, iv },
        key,
        encodedData
      );

      const result: EncryptedData = {
        data: Array.from(new Uint8Array(encryptedData)).map(b => b.toString(16).padStart(2, '0')).join(''),
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
        timestamp: Date.now()
      };

      return btoa(JSON.stringify(result));
    } catch (error) {
      console.error('Sync data encryption failed:', error);
      throw new Error('Failed to encrypt sync data');
    }
  }

  /**
   * Decrypt sensitive sync data
   */
  async decryptSyncData(encryptedString: string, userIdentifier?: string): Promise<any> {
    try {
      const encryptedData: EncryptedData = JSON.parse(atob(encryptedString));
      const key = await this.deriveKey(userIdentifier);
      
      const iv = new Uint8Array(
        encryptedData.iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      
      const data = new Uint8Array(
        encryptedData.data.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
      );

      const decryptedData = await crypto.subtle.decrypt(
        { name: this.config.algorithm, iv },
        key,
        data
      );

      const jsonString = this.decoder.decode(decryptedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Sync data decryption failed:', error);
      throw new Error('Failed to decrypt sync data');
    }
  }

  /**
   * Check if encrypted data is expired
   */
  isDataExpired(encryptedString: string, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    try {
      const encryptedData: EncryptedData = JSON.parse(atob(encryptedString));
      return Date.now() - encryptedData.timestamp > maxAgeMs;
    } catch {
      return true; // Consider invalid data as expired
    }
  }
}

export { SyncEncryption, type EncryptedData, type SyncSecurityConfig };