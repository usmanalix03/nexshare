/**
 * controllers/vaultController.js — Secure Vault Handlers
 * Handles encrypted file upload, download, user file listing, and deletion.
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { encryptFile, decryptFile } = require('../services/encryptionService');
const { createLink, getLinkById, getLinksByUserId, deleteLinkByIdAndUser, deleteExpiredLinks } = require('../models/vaultLink');

// ── Multer Configuration ────────────────────────────────────────────────────
// Store uploaded files in memory so we can encrypt before writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
}).single('file');

// Ensure the encrypted storage directory exists
const STORAGE_DIR = path.join(__dirname, '..', 'storage');
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

/**
 * POST /api/vault/upload
 * Receives a file, encrypts it with AES-256-CBC, stores it on disk,
 * and records metadata in the database.
 * Supports authenticated users only.
 */
const uploadFile = (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) return res.status(500).json({ error: 'File upload failed' });
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    try {
      const { encryptedBuffer, iv, key } = encryptFile(req.file.buffer);

      // Write encrypted file to /storage with a random name
      const encryptedFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.enc`;
      const encryptedFilepath = path.join(STORAGE_DIR, encryptedFilename);
      fs.writeFileSync(encryptedFilepath, encryptedBuffer);

      // Persist metadata to CockroachDB
      const link = await createLink({
        userId: req.user.sub, // Enforced by requireAuth middleware
        originalFilename: req.file.originalname,
        encryptedFilepath,
        iv,
        encryptionKey: key,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      res.status(201).json({
        message: 'File uploaded and encrypted successfully',
        linkId: link.id,
        url: `/vault/${link.id}`,
        filename: link.original_filename,
        fileSize: link.file_size,
        expiresAt: link.expires_at,
      });
    } catch (error) {
      console.error('[Vault/Upload]', error);
      res.status(500).json({ error: 'Encryption or storage failed' });
    }
  });
};

/**
 * GET /api/vault/:id
 * Public route — validates TTL, decrypts the file on-the-fly, and streams it to the client.
 */
const downloadFile = async (req, res) => {
  try {
    const link = await getLinkById(req.params.id);

    if (!link) {
      return res.status(410).json({ error: 'This link has expired or does not exist' });
    }

    if (!fs.existsSync(link.encrypted_filepath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Read and decrypt
    const encryptedBuffer = fs.readFileSync(link.encrypted_filepath);
    const decryptedBuffer = decryptFile(encryptedBuffer, link.iv, link.encryption_key);

    // Set headers so the browser prompts a download with the original filename
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(link.original_filename)}"`);
    res.setHeader('Content-Type', link.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', decryptedBuffer.length);
    res.send(decryptedBuffer);
  } catch (err) {
    console.error('[Vault/Download]', err);
    res.status(500).json({ error: 'Decryption or download failed' });
  }
};

/**
 * GET /api/vault/my-files
 * Protected — returns all active vault links belonging to the authenticated user.
 */
const getUserFiles = async (req, res) => {
  try {
    const files = await getLinksByUserId(req.user.sub);
    res.json({ files });
  } catch (err) {
    console.error('[Vault/MyFiles]', err);
    res.status(500).json({ error: 'Failed to fetch your files' });
  }
};

/**
 * DELETE /api/vault/:id
 * Protected — deletes a vault link and its encrypted file.
 * Enforces ownership: only the original uploader can delete.
 */
const deleteFile = async (req, res) => {
  try {
    const deleted = await deleteLinkByIdAndUser(req.params.id, req.user.sub);

    if (!deleted) {
      return res.status(404).json({ error: 'File not found or you do not have permission to delete it' });
    }

    // Remove encrypted file from disk if it still exists
    if (fs.existsSync(deleted.encrypted_filepath)) {
      fs.unlinkSync(deleted.encrypted_filepath);
    }

    res.json({ message: `"${deleted.original_filename}" deleted successfully` });
  } catch (err) {
    console.error('[Vault/Delete]', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

/**
 * CRON: Cleanup job to delete expired files from disk and DB
 */
const cleanupExpiredFiles = async () => {
  try {
    const expiredLinks = await deleteExpiredLinks();
    let deletedCount = 0;
    for (const link of expiredLinks) {
      if (fs.existsSync(link.encrypted_filepath)) {
        fs.unlinkSync(link.encrypted_filepath);
        deletedCount++;
      }
    }
    if (expiredLinks.length > 0) {
      console.log(`[Vault/Cleanup] Deleted ${expiredLinks.length} expired DB records and ${deletedCount} files from disk.`);
    }
  } catch (err) {
    console.error('[Vault/Cleanup] Error cleaning up expired files:', err);
  }
};

module.exports = { uploadFile, downloadFile, getUserFiles, deleteFile, cleanupExpiredFiles };
