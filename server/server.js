/**
 * server.js — Entry Point
 * Express + Socket.io server for the Dual-Mode Secure File Transfer System.
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');

const { initSocket } = require('./config/socket');
const { createUsersTable } = require('./models/userModel');
const { createVaultLinksTable } = require('./models/vaultLink');
const authRoutes = require('./routes/authRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const { cleanupExpiredFiles } = require('./controllers/vaultController');

const app = express();
const server = http.createServer(app);

// ── Middleware ─────────────────────────────────────────────────────────────
// CLIENT_URL can be a comma-separated list: https://nexshare.vercel.app,http://localhost:5173
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Render health checks, same-origin)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Bootstrap ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

(async () => {
  try {
    // Initialize database tables
    await createUsersTable();
    await createVaultLinksTable();
    console.log('✅ Database initialized');

    // Attach Socket.io (handles WebRTC signaling + peer discovery)
    initSocket(server);
    console.log('✅ Socket.io initialized');

    // Start hourly cleanup job for expired vault links
    setInterval(() => {
      cleanupExpiredFiles();
    }, 60 * 60 * 1000); // 1 hour
    cleanupExpiredFiles(); // Run once on startup

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();
