/**
 * services/signalingService.js — WebRTC Signaling + Peer Discovery
 *
 * Implements two peer-discovery strategies:
 *   1. Radar Mode  — Groups clients by public IP into a hidden room automatically
 *   2. Room Code   — Clients manually enter a 5-digit code to join a shared room
 *
 * The server ONLY passes SDP offers/answers and ICE candidates; it never
 * touches actual file data (that flows directly peer-to-peer via WebRTC).
 */

const crypto = require('crypto');

/**
 * Derive a stable room name from a client's public IP.
 * Hashed so the raw IP is never stored or broadcast.
 */
const ipToRoom = (ip) => `ip:${crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)}`;

/**
 * Extract the real client IP, respecting proxy headers set by Render/Heroku/etc.
 */
const getClientIP = (socket) =>
  socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  socket.handshake.address;

/**
 * Register all Socket.io event handlers for a newly connected socket.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
const registerSignalingHandlers = (io, socket) => {
  const clientIP = getClientIP(socket);
  const ipRoom = ipToRoom(clientIP);

  // ── Radar Mode: Auto-join the IP-based hidden room ────────────────────────
  socket.join(ipRoom);

  // Notify all peers in the same IP room (including the new joiner)
  const peersInRoom = [...(io.sockets.adapter.rooms.get(ipRoom) || [])]
    .filter((id) => id !== socket.id)
    .map((id) => ({ socketId: id }));

  // Tell the new peer about existing radar peers
  socket.emit('radar:peers', peersInRoom);

  // Tell existing peers about the new arrival
  socket.to(ipRoom).emit('radar:peer-joined', { socketId: socket.id });

  // ── Room Code: Manual cross-network pairing ───────────────────────────────
  socket.on('room:join', ({ code }) => {
    if (!code || typeof code !== 'string') return;
    const codeRoom = `code:${code.trim().toUpperCase()}`;
    socket.join(codeRoom);

    // Notify others in this code room
    socket.to(codeRoom).emit('room:peer-joined', { socketId: socket.id });

    // Tell the joiner who else is already in the room
    const existingPeers = [...(io.sockets.adapter.rooms.get(codeRoom) || [])]
      .filter((id) => id !== socket.id)
      .map((id) => ({ socketId: id }));
    socket.emit('room:peers', existingPeers);
  });

  socket.on('room:leave', ({ code }) => {
    if (!code) return;
    const codeRoom = `code:${code.trim().toUpperCase()}`;
    socket.leave(codeRoom);
    socket.to(codeRoom).emit('room:peer-left', { socketId: socket.id });
  });

  // ── WebRTC Signaling Relay ────────────────────────────────────────────────
  // All three events follow the same pattern: forward the payload to the target peer.

  socket.on('webrtc:offer', ({ targetId, offer }) => {
    io.to(targetId).emit('webrtc:offer', { fromId: socket.id, offer });
  });

  socket.on('webrtc:answer', ({ targetId, answer }) => {
    io.to(targetId).emit('webrtc:answer', { fromId: socket.id, answer });
  });

  socket.on('webrtc:ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('webrtc:ice-candidate', { fromId: socket.id, candidate });
  });

  // ── Disconnect Cleanup ────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    // Notify IP room peers about departure
    socket.to(ipRoom).emit('radar:peer-left', { socketId: socket.id });
    // Any code rooms are automatically cleaned up by Socket.io on disconnect
  });
};

module.exports = { registerSignalingHandlers };
