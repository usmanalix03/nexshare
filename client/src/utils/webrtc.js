/**
 * utils/webrtc.js — WebRTC Peer Connection Helpers
 * Factory and utility functions for creating RTCPeerConnections
 * with public STUN servers.
 */

/** ICE server configuration — Google's public STUN servers */
export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Free TURN server for symmetric NAT traversal
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
};

/**
 * Create a new RTCPeerConnection with standard STUN configuration.
 * @returns {RTCPeerConnection}
 */
export const createPeerConnection = () => new RTCPeerConnection(ICE_SERVERS);
