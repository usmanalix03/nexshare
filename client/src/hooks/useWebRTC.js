/**
 * hooks/useWebRTC.js — WebRTC P2P File Transfer Hook
 * Manages the full WebRTC lifecycle: offer/answer handshake,
 * ICE negotiation, chunked file sending, and reassembly on receive.
 */

import { useRef, useState, useCallback } from 'react';
import { createPeerConnection } from '../utils/webrtc';
import { chunkFile, reassembleFile, CHUNK_SIZE } from '../utils/fileChunking';

const useWebRTC = ({ sendSignal, onSignal }) => {
  const pcRef = useRef(null);
  const channelRef = useRef(null);
  const receivedChunksRef = useRef([]);
  const fileMetaRef = useRef(null);
  const unsubsRef = useRef([]);

  const [transferState, setTransferState] = useState('idle'); // idle | connecting | sending | receiving | done | error
  const [progress, setProgress] = useState(0);

  /** Clean up the current peer connection */
  const cleanUp = useCallback(() => {
    channelRef.current?.close();
    pcRef.current?.close();
    channelRef.current = null;
    pcRef.current = null;
    receivedChunksRef.current = [];
    fileMetaRef.current = null;
    unsubsRef.current.forEach(unsub => unsub?.());
    unsubsRef.current = [];
  }, []);

  /** Set up data channel event handlers (same for both sides) */
  const setupDataChannel = useCallback((channel, totalChunks, filename, mimeType) => {
    channel.binaryType = 'arraybuffer';
    let receivedCount = 0;

    channel.onopen = () => setTransferState('receiving');

    channel.onmessage = (e) => {
      if (typeof e.data === 'string') {
        // First message is metadata JSON
        const meta = JSON.parse(e.data);
        fileMetaRef.current = meta;
        receivedChunksRef.current = [];
        return;
      }
      // Binary chunk
      receivedChunksRef.current.push(e.data);
      receivedCount++;

      const total = fileMetaRef.current?.totalChunks || 1;
      setProgress(Math.round((receivedCount / total) * 100));

      if (receivedCount === total) {
        // All chunks received — reassemble and download
        reassembleFile(
          receivedChunksRef.current,
          fileMetaRef.current.filename,
          fileMetaRef.current.mimeType
        );
        setTransferState('done');
        receivedChunksRef.current = [];
      }
    };

    channel.onerror = () => setTransferState('error');
  }, []);

  /**
   * Initiate a file transfer to a remote peer (caller / offerer side).
   * @param {string} targetId - Remote socket ID
   * @param {File}   file     - File to send
   */
  const sendFile = useCallback(async (targetId, file) => {
    cleanUp();
    setTransferState('connecting');
    setProgress(0);

    const pc = createPeerConnection();
    pcRef.current = pc;

    // Create data channel (initiator side)
    const channel = pc.createDataChannel('fileTransfer', { ordered: true });
    channelRef.current = channel;

    const chunks = await chunkFile(file);

    channel.onopen = async () => {
      setTransferState('sending');
      // Send metadata first
      channel.send(JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        totalChunks: chunks.length,
      }));

      // Send each chunk with a small delay to prevent buffer overflow
      for (let i = 0; i < chunks.length; i++) {
        // Backpressure: wait if the buffer is getting full
        while (channel.bufferedAmount > CHUNK_SIZE * 8) {
          await new Promise((r) => setTimeout(r, 10));
        }
        channel.send(chunks[i]);
        setProgress(Math.round(((i + 1) / chunks.length) * 100));
      }
      setTransferState('done');
    };

    channel.onerror = () => setTransferState('error');

    // ICE candidates → relay via signaling server
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal('webrtc:ice-candidate', targetId, { candidate });
    };

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal('webrtc:offer', targetId, { offer });

    // Listen for answer
    const offAnswer = onSignal('webrtc:answer', async ({ fromId, answer }) => {
      if (fromId !== targetId) return;
      if (pc.signalingState === 'closed') return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.warn('Failed to set remote description:', err);
      }
    });
    unsubsRef.current.push(offAnswer);

    // Listen for ICE from remote
    const offIce = onSignal('webrtc:ice-candidate', async ({ fromId, candidate }) => {
      if (fromId !== targetId) return;
      if (pc.signalingState === 'closed') return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('ICE candidate ignored:', e);
      }
    });
    unsubsRef.current.push(offIce);
  }, [cleanUp, sendSignal, onSignal]);

  /**
   * Accept an incoming offer from a remote peer (answerer side).
   * Called automatically when 'webrtc:offer' is received.
   * @param {string} fromId - Remote socket ID
   * @param {RTCSessionDescriptionInit} offer
   */
  const receiveOffer = useCallback(async (fromId, offer) => {
    cleanUp();
    setTransferState('connecting');
    setProgress(0);

    const pc = createPeerConnection();
    pcRef.current = pc;

    // Receiver sets up data channel via ondatachannel event
    pc.ondatachannel = ({ channel }) => {
      channelRef.current = channel;
      setupDataChannel(channel);
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal('webrtc:ice-candidate', fromId, { candidate });
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendSignal('webrtc:answer', fromId, { answer });

    // Listen for ICE from sender
    const offIce = onSignal('webrtc:ice-candidate', async ({ fromId: fId, candidate }) => {
      if (fId !== fromId) return;
      if (pc.signalingState === 'closed') return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('ICE candidate ignored:', e);
      }
    });
    unsubsRef.current.push(offIce);
  }, [cleanUp, sendSignal, onSignal, setupDataChannel]);

  return { sendFile, receiveOffer, transferState, progress, cleanUp };
};

export default useWebRTC;
