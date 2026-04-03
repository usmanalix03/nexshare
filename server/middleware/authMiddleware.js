/**
 * middleware/authMiddleware.js — JWT Verification
 * Provides two middleware variants:
 *   - requireAuth: Rejects requests without a valid token (401)
 *   - optionalAuth: Attaches user info if token present, passes through if not
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_replace_in_production';

/**
 * Verify and decode a Bearer token from the Authorization header.
 * @param {string} authHeader
 * @returns {Object|null} Decoded payload or null
 */
const decodeToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

/**
 * Require a valid JWT — returns 401 if missing or invalid.
 * Attaches decoded payload as `req.user` on success.
 */
const requireAuth = (req, res, next) => {
  const decoded = decodeToken(req.headers.authorization);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized — valid token required' });
  }
  req.user = decoded;
  next();
};

/**
 * Optionally parse a JWT — does NOT reject unauthenticated requests.
 * Attaches decoded payload as `req.user` if a valid token is present.
 */
const optionalAuth = (req, _res, next) => {
  const decoded = decodeToken(req.headers.authorization);
  req.user = decoded || null;
  next();
};

module.exports = { requireAuth, optionalAuth };
