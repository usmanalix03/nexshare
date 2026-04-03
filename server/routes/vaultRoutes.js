/**
 * routes/vaultRoutes.js — Vault API Routes
 */

const express = require('express');
const router = express.Router();
const { uploadFile, downloadFile, getUserFiles, deleteFile } = require('../controllers/vaultController');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

// POST /api/vault/upload — Upload & encrypt a file (authenticated only)
router.post('/upload', requireAuth, uploadFile);

// GET /api/vault/my-files — List caller's uploaded files (auth required)
// NOTE: This must be declared BEFORE /:id to avoid "my-files" being treated as an ID
router.get('/my-files', requireAuth, getUserFiles);

// GET /api/vault/:id — Download & decrypt a file (public)
router.get('/:id', downloadFile);

// DELETE /api/vault/:id — Delete a vault link and its encrypted file (auth required)
router.delete('/:id', requireAuth, deleteFile);

module.exports = router;
