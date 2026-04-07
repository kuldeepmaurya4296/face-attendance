/**
 * ============================================================
 * Encryption Service — AES-256-GCM for Face Embeddings
 * ============================================================
 * 
 * Encrypts/decrypts face embedding arrays before DB storage.
 * Key is loaded from EMBEDDING_ENCRYPTION_KEY env var.
 * Uses AES-256-GCM for authenticated encryption.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.EMBEDDING_ENCRYPTION_KEY;
  if (!key) {
    // Fallback: derive key from JWT_SECRET (not ideal, but allows existing deployments to work)
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_123';
    return crypto.createHash('sha256').update(secret).digest();
  }
  // Expect a 64-char hex string (32 bytes)
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  // Otherwise hash it
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt an array of numbers (face embeddings) into a base64 string.
 */
export function encryptEmbeddings(embeddings: number[]): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonStr = JSON.stringify(embeddings);
  const encrypted = Buffer.concat([
    cipher.update(jsonStr, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted (all base64)
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

/**
 * Decrypt a base64 string back to an array of numbers.
 */
export function decryptEmbeddings(encryptedStr: string): number[] {
  // Check if it's actually encrypted (legacy data might be raw arrays)
  if (!encryptedStr || typeof encryptedStr !== 'string' || !encryptedStr.includes(':')) {
    // Legacy unencrypted data — return as-is if it's parseable
    try {
      const parsed = JSON.parse(encryptedStr);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not JSON, not encrypted format — return empty
    }
    return [];
  }

  const key = getKey();
  const parts = encryptedStr.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted embedding format');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = Buffer.from(parts[2], 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Check if embeddings are already encrypted (vs legacy raw array).
 */
export function isEncrypted(data: any): boolean {
  return typeof data === 'string' && data.includes(':') && data.split(':').length === 3;
}

/**
 * Safe decrypt: handles both encrypted strings and legacy raw arrays.
 */
export function safeDecryptEmbeddings(data: any): number[] {
  if (Array.isArray(data)) {
    // Legacy unencrypted array — return directly
    return data;
  }
  if (typeof data === 'string') {
    return decryptEmbeddings(data);
  }
  return [];
}
