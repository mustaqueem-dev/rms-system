// packages/shared-kernel/src/security/pii-crypto.ts
//
// NFR-S02: AES-256-GCM field-level encryption for PII stored in MongoDB.
//
// Usage:
//   const encrypted = PiiCrypto.encrypt('user@example.com', secretKey);
//   const plain      = PiiCrypto.decrypt(encrypted, secretKey);
//
// secretKey: 32-byte (64-char hex) value from environment / Secrets Manager.
// Each call generates a unique IV so ciphertext is non-deterministic (safe).

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM  = 'aes-256-gcm';
const IV_BYTES   = 12;   // 96-bit IV for GCM
const TAG_BYTES  = 16;   // 128-bit auth tag

/** Output format: `hex(iv):hex(authTag):hex(ciphertext)` */
type EncryptedPii = string;

export class PiiCrypto {
  /**
   * Encrypt a PII plaintext value.
   * @param plaintext  - the value to encrypt (e.g., phone number, email)
   * @param secretKey  - 32-byte key expressed as a 64-char hex string
   */
  static encrypt(plaintext: string, secretKey: string): EncryptedPii {
    const key     = Buffer.from(secretKey, 'hex');
    const iv      = randomBytes(IV_BYTES);
    const cipher  = createCipheriv(ALGORITHM, key, iv);
    const ct      = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${ct.toString('hex')}`;
  }

  /**
   * Decrypt a PII ciphertext produced by `encrypt`.
   * @param ciphertext - in the `iv:authTag:ciphertext` hex format
   * @param secretKey  - 32-byte key expressed as a 64-char hex string
   */
  static decrypt(ciphertext: EncryptedPii, secretKey: string): string {
    const [ivHex, tagHex, ctHex] = ciphertext.split(':');
    if (!ivHex || !tagHex || !ctHex) throw new Error('Invalid encrypted PII format');

    const key      = Buffer.from(secretKey, 'hex');
    const iv       = Buffer.from(ivHex, 'hex');
    const authTag  = Buffer.from(tagHex, 'hex');
    const ct       = Buffer.from(ctHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ct).toString('utf8') + decipher.final('utf8');
  }

  /**
   * Hash a PII value for equality lookup (HMAC-SHA256) without storing plaintext.
   * Use this for secondary indexes on encrypted fields (e.g., find by phone).
   */
  static hash(plaintext: string, secretKey: string): string {
    const { createHmac } = require('crypto');
    return createHmac('sha256', secretKey).update(plaintext).digest('hex');
  }

  /**
   * Safely check if a value is already encrypted (starts with iv:tag:ct pattern).
   */
  static isEncrypted(value: string): boolean {
    const parts = value.split(':');
    return parts.length === 3 && parts[0].length === IV_BYTES * 2;
  }
}
