/**
 * config/socket.js — Socket.io Setup
 * Attaches Socket.io to the HTTP server and delegates all event
 * handling to the signaling service.
 */

const { Server } = require('socket.io');
const { registerSignalingHandlers } = require('../services/signalingService');

let io;

/**
 * Initialize Socket.io and wire up signaling handlers.
 * @param {http.Server} server - The Node.js HTTP server
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Allow up to 10MB messages (for potential future use; data channel handles main transfer)
    maxHttpBufferSize: 1e7,
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    registerSignalingHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
