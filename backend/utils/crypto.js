import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// AES-256-GCM helper utilities
// Key management: expects BIOMETRIC_MASTER_KEY as base64 (32 bytes). If missing,
// a key will be generated and a warning will be printed. For production, use KMS.

const ALGO = 'aes-256-gcm';
const KEY_ENV = 'BIOMETRIC_MASTER_KEY';

function ensureKey() {
  let keyBase64 = process.env[KEY_ENV];
  if (!keyBase64) {
    // Generate a random 32-byte key and print a one-time instruction for developer
    const key = crypto.randomBytes(32);
    keyBase64 = key.toString('base64');
    // Do not persist automatically in repo; log instruction for developer to set env var
    console.warn(`WARNING: ${KEY_ENV} was not set. A temporary key was generated for this process. For persistent secure operation set ${KEY_ENV} in your environment to this base64 value:`);
    console.warn(keyBase64);
    // Set it in process.env for runtime use only
    process.env[KEY_ENV] = keyBase64;
  }
  const keyBuf = Buffer.from(keyBase64, 'base64');
  if (keyBuf.length !== 32) {
    throw new Error(`${KEY_ENV} must be 32 bytes (base64-encoded). Current value decodes to ${keyBuf.length} bytes.`);
  }
  return keyBuf;
}

const MASTER_KEY = ensureKey();

export function encryptTemplate(plainObj) {
  try {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(ALGO, MASTER_KEY, iv);
    const plaintext = Buffer.from(JSON.stringify(plainObj), 'utf8');
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      version: 1,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      data: ciphertext.toString('base64')
    };
  } catch (err) {
    throw new Error(`Encryption failed: ${err.message}`);
  }
}

export function decryptTemplate(pkg) {
  try {
    if (!pkg || !pkg.data || !pkg.iv || !pkg.tag) throw new Error('Invalid encrypted package');
    const iv = Buffer.from(pkg.iv, 'base64');
    const tag = Buffer.from(pkg.tag, 'base64');
    const data = Buffer.from(pkg.data, 'base64');
    const decipher = crypto.createDecipheriv(ALGO, MASTER_KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch (err) {
    throw new Error(`Decryption failed: ${err.message}`);
  }
}

export default { encryptTemplate, decryptTemplate };
