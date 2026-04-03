/**
 * models/vaultLink.js — Vault Links Table
 * Schema and query helpers for encrypted file metadata.
 */

const { query } = require('../config/db');

/**
 * Create the `vault_links` table if it doesn't already exist.
 * `user_id` is nullable — anonymous users can upload without an account.
 */
const createVaultLinksTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS vault_links (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id            UUID REFERENCES users(id) ON DELETE SET NULL,
      original_filename  STRING(512) NOT NULL,
      encrypted_filepath STRING(1024) NOT NULL,
      iv                 STRING(64) NOT NULL,
      encryption_key     STRING(128) NOT NULL,
      file_size          INT8 NOT NULL DEFAULT 0,
      mime_type          STRING(255) NOT NULL DEFAULT 'application/octet-stream',
      created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at         TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours'
    )
  `);
};

/**
 * Insert a new vault link record.
 * @param {Object} data
 */
const createLink = async ({ userId, originalFilename, encryptedFilepath, iv, encryptionKey, fileSize, mimeType }) => {
  const result = await query(
    `INSERT INTO vault_links
       (user_id, original_filename, encrypted_filepath, iv, encryption_key, file_size, mime_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id, original_filename, file_size, mime_type, created_at, expires_at`,
    [userId || null, originalFilename, encryptedFilepath, iv, encryptionKey, fileSize, mimeType]
  );
  return result.rows[0];
};

/**
 * Fetch a vault link by ID and verify it hasn't expired.
 * @param {string} id - UUID
 * @returns {Object|null} Full row including iv/key for decryption, or null if expired/missing
 */
const getLinkById = async (id) => {
  const result = await query(
    `SELECT * FROM vault_links WHERE id = $1 AND expires_at > now()`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Fetch all active vault links belonging to a specific user.
 * @param {string} userId
 * @returns {Array} List of link rows (without encryption key for security)
 */
const getLinksByUserId = async (userId) => {
  const result = await query(
    `SELECT id, original_filename, file_size, mime_type, created_at, expires_at
     FROM vault_links
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Delete a vault link — enforces ownership so only the uploader can delete.
 * @param {string} id     - Link UUID
 * @param {string} userId - Authenticated user's UUID
 * @returns {Object|null} Deleted row (including filepath for fs cleanup), or null if not found/not owner
 */
const deleteLinkByIdAndUser = async (id, userId) => {
  const result = await query(
    `DELETE FROM vault_links WHERE id = $1 AND user_id = $2
     RETURNING id, encrypted_filepath, original_filename`,
    [id, userId]
  );
  return result.rows[0] || null;
};

/**
 * Delete all expired vault links and return them so we can delete their files from disk.
 */
const deleteExpiredLinks = async () => {
  const result = await query(
    `DELETE FROM vault_links WHERE expires_at <= now() RETURNING id, encrypted_filepath, original_filename`
  );
  return result.rows;
};

module.exports = {
  createVaultLinksTable,
  createLink,
  getLinkById,
  getLinksByUserId,
  deleteLinkByIdAndUser,
  deleteExpiredLinks,
};
