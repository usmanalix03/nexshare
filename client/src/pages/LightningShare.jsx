/**
 * pages/LightningShare.jsx — P2P File Transfer + Chat
 * Dark premium theme consistent with the rest of NexShare.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Radar from '../components/Radar';
import Dropzone from '../components/Dropzone';
import useSocket from '../hooks/useSocket';
import useWebRTC from '../hooks/useWebRTC';

const Spinner = ({ color = '#fff' }) => (
  <span style={{ width: 18, height: 18, border: `2.5px solid ${color}30`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
);

const LightningShare = () => {
  const { socket, isConnected, radarPeers, joinRoom, sendSignal, onSignal } = useSocket();
  const { sendFile, receiveOffer, transferState, progress } = useWebRTC({ sendSignal, onSignal });

  // Discovery state
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [discoveryMode, setDiscoveryMode] = useState('radar'); // 'radar' | 'code'
  const [roomCode, setRoomCode] = useState('');
  const [joinedCode, setJoinedCode] = useState('');
  const [codePeers, setCodePeers] = useState([]);
  const cleanupRef = useRef(null);

  // Right panel tab state
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'chat'

  // File state
  const [file, setFile] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]); // { id, from: 'me'|'them', text, time }
  const [chatInput, setChatInput] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const prevSelectedPeerRef = useRef(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasUnread(false);
    }
  }, [messages, activeTab]);

  // Clear chat when peer changes
  useEffect(() => {
    if (prevSelectedPeerRef.current?.socketId !== selectedPeer?.socketId) {
      setMessages([]);
      setHasUnread(false);
      prevSelectedPeerRef.current = selectedPeer;
    }
  }, [selectedPeer]);

  // Listen for incoming WebRTC offers
  useEffect(() => {
    return onSignal('webrtc:offer', ({ fromId, offer }) => receiveOffer(fromId, offer));
  }, [onSignal, receiveOffer]);

  // Listen for incoming chat messages
  useEffect(() => {
    const unsub = onSignal('chat:message', ({ fromId, text }) => {
      // Only accept messages from selected peer
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        from: 'them',
        peerId: fromId,
        text,
        time: new Date(),
      }]);
      setHasUnread(true);
    });
    return unsub;
  }, [onSignal]);

  const handleJoinCode = () => {
    const code = roomCode.trim().toUpperCase();
    if (!code || code.length < 3) return;
    cleanupRef.current?.();
    const cleanup = joinRoom(
      code,
      peers => setCodePeers(peers),
      peer => setCodePeers(p => [...p.filter(x => x.socketId !== peer.socketId), peer]),
      ({ socketId }) => setCodePeers(p => p.filter(x => x.socketId !== socketId))
    );
    cleanupRef.current = cleanup;
    setJoinedCode(code);
  };

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim() || !selectedPeer) return;
    const text = chatInput.trim();
    sendSignal('chat:message', selectedPeer.socketId, { text });
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      from: 'me',
      text,
      time: new Date(),
    }]);
    setChatInput('');
    chatInputRef.current?.focus();
  }, [chatInput, selectedPeer, sendSignal]);

  const handleChatKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  const formatTime = (date) =>
    date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const activePeers = discoveryMode === 'radar' ? radarPeers : codePeers;

  const cardStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 16,
    padding: 28,
  };

  const tabBtnStyle = (active) => ({
    flex: 1,
    padding: '10px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    background: active ? 'var(--color-surface)' : 'transparent',
    color: active ? 'var(--color-text-1)' : 'var(--color-text-3)',
    transition: 'all 0.15s',
    position: 'relative',
  });

  return (
    <div style={{ minHeight: '100vh', padding: '80px 24px 60px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-1)' }}>
            Lightning Share
          </h1>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
            padding: '4px 12px', borderRadius: 999,
            background: isConnected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
            color: isConnected ? 'var(--color-green)' : 'var(--color-red)',
            border: `1px solid ${isConnected ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isConnected ? 'var(--color-green)' : 'var(--color-red)' }} />
            {isConnected ? 'Connected' : 'Connecting…'}
          </span>
        </div>
        <p style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.6 }}>
          Direct P2P file transfer &amp; chat via WebRTC. Data never touches our servers.
        </p>
        {isConnected && socket?.id && (
          <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 8 }}>
            You appear on the radar as: <span style={{ color: 'var(--color-neon-cyan)', fontWeight: 600 }}>{socket.id.slice(0, 6)}</span>
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>

        {/* ── Discovery Panel ─────────────────────────────────────── */}
        <div style={cardStyle}>
          {/* Discovery mode tabs */}
          <div style={{ display: 'flex', background: 'var(--color-surface-2)', borderRadius: 10, padding: 4, gap: 4, marginBottom: 28 }}>
            {[['radar', '📡 Radar Mode'], ['code', '🔑 Room Code']].map(([m, label]) => (
              <button key={m} onClick={() => setDiscoveryMode(m)} style={tabBtnStyle(discoveryMode === m)}>
                {label}
              </button>
            ))}
          </div>

          {discoveryMode === 'radar' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <Radar peers={radarPeers} selectedPeer={selectedPeer} onSelectPeer={setSelectedPeer} />
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Scanning local network…
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="ROOM CODE" maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && handleJoinCode()}
                  className="input"
                  style={{ flex: 1, textAlign: 'center', letterSpacing: '0.2em', fontWeight: 800, fontSize: 18, fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
                <button onClick={handleJoinCode} className="btnblue" style={{ padding: '0 20px', flexShrink: 0 }}>Join</button>
              </div>
              {joinedCode && (
                <div style={{ textAlign: 'center' }}>
                  <span className="badge" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--color-green)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    Room: {joinedCode}
                  </span>
                </div>
              )}
              <Radar peers={codePeers} selectedPeer={selectedPeer} onSelectPeer={setSelectedPeer} />
            </div>
          )}
        </div>

        {/* ── Right Panel: File + Chat tabs ────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 4, gap: 4 }}>
            <button onClick={() => { setActiveTab('file'); }} style={tabBtnStyle(activeTab === 'file')}>
              📁 File Transfer
            </button>
            <button onClick={() => { setActiveTab('chat'); setHasUnread(false); }} style={{ ...tabBtnStyle(activeTab === 'chat') }}>
              💬 Live Chat
              {hasUnread && activeTab !== 'chat' && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--color-neon-cyan)',
                  boxShadow: '0 0 6px var(--color-neon-cyan)',
                }} />
              )}
            </button>
          </div>

          {/* ── File Transfer Tab ─── */}
          <AnimatePresence mode="wait">
            {activeTab === 'file' && (
              <motion.div key="file-tab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={cardStyle}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Select File</p>
                  <Dropzone onFileSelect={setFile} accentColor="blue" disabled={transferState === 'sending'} />
                </div>

                <button
                  onClick={() => file && selectedPeer && sendFile(selectedPeer.socketId, file)}
                  disabled={!file || !selectedPeer || transferState === 'sending'}
                  className="btnblue"
                  style={{ width: '100%', padding: '15px', fontSize: 16, fontWeight: 700, borderRadius: 12 }}
                >
                  {!selectedPeer ? 'Select a peer on the radar first'
                    : !file ? 'Drop a file above first'
                    : transferState === 'sending'
                      ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Spinner />Sending {progress}%</span>
                      : `⚡ Send to ${selectedPeer.socketId.slice(0, 6)}`}
                </button>

                <AnimatePresence>
                  {(transferState === 'sending' || transferState === 'receiving') && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ ...cardStyle, padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                        <span style={{ color: 'var(--color-text-2)' }}>{transferState === 'sending' ? 'Uploading…' : 'Downloading…'}</span>
                        <span style={{ color: 'var(--color-blue)' }}>{progress}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: 'var(--color-surface-3)', overflow: 'hidden' }}>
                        <motion.div animate={{ width: `${progress}%` }} transition={{ ease: 'linear', duration: 0.2 }} style={{ height: '100%', background: 'var(--color-blue)', borderRadius: 999 }} />
                      </div>
                    </motion.div>
                  )}
                  {transferState === 'done' && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ ...cardStyle, textAlign: 'center', padding: '24px', background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }}>
                      <p style={{ fontWeight: 700, color: 'var(--color-green)', fontSize: 15 }}>✓ Transfer complete!</p>
                    </motion.div>
                  )}
                  {transferState === 'error' && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ ...cardStyle, textAlign: 'center', padding: '24px', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                      <p style={{ fontWeight: 700, color: 'var(--color-red)', fontSize: 15 }}>⚠ Connection failed. Try again.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── Chat Tab ─── */}
            {activeTab === 'chat' && (
              <motion.div key="chat-tab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 440 }}>

                  {/* Chat header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    {selectedPeer ? (
                      <>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,245,255,0.12)', border: '1px solid rgba(0,245,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: 'var(--color-neon-cyan)', fontFamily: 'monospace' }}>
                          {selectedPeer.socketId.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-1)' }}>
                            Peer <span style={{ color: 'var(--color-neon-cyan)', fontFamily: 'monospace' }}>{selectedPeer.socketId.slice(0, 6)}</span>
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--color-green)', fontWeight: 600 }}>● Encrypted · Session only</p>
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: 14, color: 'var(--color-text-3)', fontWeight: 600 }}>Select a peer on the radar to start chatting</p>
                    )}
                  </div>

                  {/* Messages area */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {!selectedPeer ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.5 }}>
                        <span style={{ fontSize: 36 }}>💬</span>
                        <p style={{ fontSize: 13, color: 'var(--color-text-3)', textAlign: 'center' }}>Pick a device from the radar to open a P2P chat session</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.5 }}>
                        <span style={{ fontSize: 36 }}>👋</span>
                        <p style={{ fontSize: 13, color: 'var(--color-text-3)', textAlign: 'center' }}>Say hi! Messages are end-to-end relayed and never stored.</p>
                      </div>
                    ) : (
                      <>
                        {messages.map(msg => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.15 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'me' ? 'flex-end' : 'flex-start' }}
                          >
                            <div style={{
                              maxWidth: '78%',
                              padding: '10px 14px',
                              borderRadius: msg.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              background: msg.from === 'me'
                                ? 'linear-gradient(135deg, var(--color-blue), #0284c7)'
                                : 'var(--color-surface-2)',
                              border: msg.from === 'me' ? 'none' : '1px solid var(--color-border)',
                              color: msg.from === 'me' ? '#fff' : 'var(--color-text-1)',
                              fontSize: 14,
                              lineHeight: 1.5,
                              wordBreak: 'break-word',
                              boxShadow: msg.from === 'me' ? '0 2px 12px rgba(59,130,246,0.25)' : 'none',
                            }}>
                              {msg.text}
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 4, paddingLeft: 4, paddingRight: 4 }}>
                              {formatTime(msg.time)}
                            </span>
                          </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input bar */}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                    <input
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={handleChatKey}
                      placeholder={selectedPeer ? 'Type a message…' : 'Select a peer first…'}
                      disabled={!selectedPeer}
                      className="input"
                      style={{ flex: 1, borderRadius: 10, padding: '10px 14px', fontSize: 14 }}
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || !selectedPeer}
                      className="btnblue"
                      style={{ padding: '10px 18px', borderRadius: 10, fontSize: 15, flexShrink: 0, minWidth: 48 }}
                    >
                      ↑
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default LightningShare;
