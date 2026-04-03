/**
 * services/encryptionService.js — AES-256-CBC File Encryption
 * Uses Node.js native `crypto` module; no third-party dependencies required.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;  // 256 bits
const IV_LENGTH = 16;   // 128 bits (AES block size)

/**
 * Encrypt a file buffer using AES-256-CBC.
 * Generates a fresh random KEY and IV for every file.
 *
 * @param {Buffer} fileBuffer - Raw file bytes
 * @returns {{ encryptedBuffer: Buffer, iv: string, key: string }}
 *   - iv and key are hex-encoded strings stored in the DB for later decryption
 */
const encryptFile = (fileBuffer) => {
  const key = crypto.randomBytes(KEY_LENGTH); // 32-byte random key
  const iv = crypto.randomBytes(IV_LENGTH);   // 16-byte random IV

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Concatenate cipher output chunks (update + final handles PKCS7 padding)
  const encryptedBuffer = Buffer.concat([
    cipher.update(fileBuffer),
    cipher.final(),
  ]);

  return {
    encryptedBuffer,
    iv: iv.toString('hex'),
    key: key.toString('hex'),
  };
};

/**
 * Decrypt an encrypted file buffer using AES-256-CBC.
 *
 * @param {Buffer} encryptedBuffer - The encrypted file bytes read from disk
 * @param {string} ivHex           - Hex-encoded IV retrieved from the DB
 * @param {string} keyHex          - Hex-encoded key retrieved from the DB
 * @returns {Buffer} The original, decrypted file bytes
 */
const decryptFile = (encryptedBuffer, ivHex, keyHex) => {
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  return Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);
};

module.exports = { encryptFile, decryptFile };
