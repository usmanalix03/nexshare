/**
 * hooks/useSocket.js — Socket.io Connection Hook
 * Manages connection to the signaling server, radar peer list,
 * and code-based room membership.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [radarPeers, setRadarPeers] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'], withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => {
      setIsConnected(false);
      setRadarPeers([]);
    });

    // Radar: full peer list on connection
    socket.on('radar:peers', (peers) => setRadarPeers(peers));

    // Radar: a new peer joined
    socket.on('radar:peer-joined', (peer) =>
      setRadarPeers((prev) => [...prev.filter((p) => p.socketId !== peer.socketId), peer])
    );

    // Radar: a peer left
    socket.on('radar:peer-left', ({ socketId }) =>
      setRadarPeers((prev) => prev.filter((p) => p.socketId !== socketId))
    );

    return () => socket.disconnect();
  }, []);

  /** Join a manual 5-digit code room */
  const joinRoom = useCallback((code, onPeers, onPeerJoined, onPeerLeft) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('room:join', { code });

    socket.on('room:peers', onPeers);
    socket.on('room:peer-joined', onPeerJoined);
    socket.on('room:peer-left', onPeerLeft);

    return () => {
      socket.emit('room:leave', { code });
      socket.off('room:peers', onPeers);
      socket.off('room:peer-joined', onPeerJoined);
      socket.off('room:peer-left', onPeerLeft);
    };
  }, []);

  /** Send a WebRTC signaling message to a specific peer */
  const sendSignal = useCallback((event, targetId, payload) => {
    socketRef.current?.emit(event, { targetId, ...payload });
  }, []);

  /** Register a one-time handler for incoming WebRTC signals */
  const onSignal = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    radarPeers,
    joinRoom,
    sendSignal,
    onSignal,
  };
};

export default useSocket;
