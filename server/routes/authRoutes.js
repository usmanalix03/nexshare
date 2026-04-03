/**
 * routes/authRoutes.js — Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// POST /api/auth/register — Create a new account
router.post('/register', register);

// POST /api/auth/login — Authenticate and receive a JWT
router.post('/login', login);

// GET /api/auth/me — Return current user profile (requires Bearer token)
router.get('/me', requireAuth, getMe);

module.exports = router;
