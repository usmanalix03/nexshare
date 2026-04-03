/**
 * controllers/authController.js — Authentication Handlers
 * Handles user registration and login using bcrypt + JWT.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail, getUserById } = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_replace_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/** Sign a JWT for a given user ID */
const signToken = (userId) =>
  jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * POST /api/auth/register
 * Body: { email, password }
 */
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email format' });

    // Check if email already in use
    const existing = await getUserByEmail(email.toLowerCase());
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists' });

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser(email.toLowerCase(), passwordHash);

    const token = signToken(user.id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: user.id, email: user.email, createdAt: user.created_at },
    });
  } catch (err) {
    console.error('[Auth/Register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await getUserByEmail(email.toLowerCase());
    if (!user)
      return res.status(401).json({ error: 'Invalid email or password' });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch)
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, createdAt: user.created_at },
    });
  } catch (err) {
    console.error('[Auth/Login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 * Protected by requireAuth middleware.
 */
const getMe = async (req, res) => {
  try {
    const user = await getUserById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, email: user.email, createdAt: user.created_at } });
  } catch (err) {
    console.error('[Auth/Me]', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

module.exports = { register, login, getMe };
