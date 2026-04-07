/**
 * pages/LightningShare.jsx — Dark theme
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Radar from '../components/Radar';
import Dropzone from '../components/Dropzone';
import useSocket from '../hooks/useSocket';
import useWebRTC from '../hooks/useWebRTC';

const Spinner = ({ color='#fff' }) => <span style={{width:18,height:18,border:`2.5px solid ${color}30`,borderTopColor:color,borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block',flexShrink:0}} />;

const LightningShare = () => {
  const { socket, isConnected, radarPeers, joinRoom, sendSignal, onSignal } = useSocket();
  const { sendFile, receiveOffer, transferState, progress } = useWebRTC({ sendSignal, onSignal });
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('radar');
  const [roomCode, setRoomCode] = useState('');
  const [joinedCode, setJoinedCode] = useState('');
  const [codePeers, setCodePeers] = useState([]);
  const cleanupRef = useRef(null);

  useEffect(() => { return onSignal('webrtc:offer',({fromId,offer})=>receiveOffer(fromId,offer)); },[onSignal,receiveOffer]);

  const handleJoinCode = () => {
    const code = roomCode.trim().toUpperCase();
    if (!code||code.length<3) return;
    cleanupRef.current?.();
    const cleanup = joinRoom(code, peers=>setCodePeers(peers), peer=>setCodePeers(p=>[...p.filter(x=>x.socketId!==peer.socketId),peer]), ({socketId})=>setCodePeers(p=>p.filter(x=>x.socketId!==socketId)));
    cleanupRef.current = cleanup;
    setJoinedCode(code);
  };

  const cardStyle = { background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:16, padding:28 };

  return (
    <div style={{ minHeight:'100vh', padding:'80px 24px 60px', maxWidth:1100, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:40, display:'flex', alignItems:'center', gap:16 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
            <h1 style={{ fontSize:34, fontWeight:800, letterSpacing:'-0.03em', color:'var(--color-text-1)' }}>Lightning Share</h1>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:999, background:isConnected?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.12)', color:isConnected?'var(--color-green)':'var(--color-red)', border:`1px solid ${isConnected?'rgba(34,197,94,0.25)':'rgba(239,68,68,0.2)'}` }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:isConnected?'var(--color-green)':'var(--color-red)' }} />
              {isConnected?'Connected':'Connecting…'}
            </span>
          </div>
          <p style={{ fontSize:15, color:'var(--color-text-2)', lineHeight:1.6 }}>Direct P2P file transfer via WebRTC. Files never leave your local network.</p>
          {isConnected && socket?.id && (
            <p style={{ fontSize:13, color:'var(--color-text-3)', marginTop: 8 }}>
              You appear on the radar as: <span style={{ color:'var(--color-neon-cyan)', fontWeight:600 }}>{socket.id.slice(0, 6)}</span>
            </p>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:24, alignItems:'start' }}>
        
        {/* Discovery Panel */}
        <div style={cardStyle}>
          <div style={{ display:'flex', background:'var(--color-surface-2)', borderRadius:10, padding:4, gap:4, marginBottom:28 }}>
            {['radar','code'].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:'10px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', border:'none', background:mode===m?'var(--color-surface)':'transparent', color:mode===m?'var(--color-text-1)':'var(--color-text-3)', transition:'all 0.15s' }}>
                {m==='radar'?'📡 Radar Mode':'🔑 Room Code'}
              </button>
            ))}
          </div>

          {mode==='radar' ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
              <Radar peers={radarPeers} selectedPeer={selectedPeer} onSelectPeer={setSelectedPeer} />
              <p style={{ fontSize:12, fontWeight:600, color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Scanning local network…</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={{ display:'flex', gap:8 }}>
                <input value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase().slice(0,6))} placeholder="ROOM CODE" maxLength={6}
                  onKeyDown={e=>e.key==='Enter'&&handleJoinCode()}
                  className="input" style={{ flex:1, textAlign:'center', letterSpacing:'0.2em', fontWeight:800, fontSize:18, fontFamily:'monospace', textTransform:'uppercase' }} />
                <button onClick={handleJoinCode} className="btnblue" style={{ padding:'0 20px', flexShrink:0 }}>Join</button>
              </div>
              {joinedCode && (
                <div style={{ textAlign:'center' }}>
                  <span className="badge" style={{ background:'rgba(34,197,94,0.12)', color:'var(--color-green)', border:'1px solid rgba(34,197,94,0.2)' }}>
                    Room: {joinedCode}
                  </span>
                </div>
              )}
              <Radar peers={codePeers} selectedPeer={selectedPeer} onSelectPeer={setSelectedPeer} />
            </div>
          )}
        </div>

        {/* Transfer Panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={cardStyle}>
            <p style={{ fontSize:12, fontWeight:700, color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:20 }}>Select File</p>
            <Dropzone onFileSelect={setFile} accentColor="blue" disabled={transferState==='sending'} />
          </div>

          <button onClick={()=>file&&selectedPeer&&sendFile(selectedPeer.socketId,file)} disabled={!file||!selectedPeer||transferState==='sending'}
            className="btnblue" style={{ width:'100%', padding:'15px', fontSize:16, fontWeight:700, borderRadius:12 }}>
            {!selectedPeer?'Select a peer on the radar first': !file?'Drop a file above first': transferState==='sending'?<span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}><Spinner/>Sending {progress}%</span>:`⚡ Send to ${selectedPeer.socketId.slice(0,6)}`}
          </button>

          <AnimatePresence>
            {(transferState==='sending'||transferState==='receiving') && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ ...cardStyle, padding:'20px 24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:600, marginBottom:10 }}>
                  <span style={{ color:'var(--color-text-2)' }}>{transferState==='sending'?'Uploading…':'Downloading…'}</span>
                  <span style={{ color:'var(--color-blue)' }}>{progress}%</span>
                </div>
                <div style={{ height:6, borderRadius:999, background:'var(--color-surface-3)', overflow:'hidden' }}>
                  <motion.div animate={{width:`${progress}%`}} transition={{ease:'linear', duration:0.2}} style={{ height:'100%', background:'var(--color-blue)', borderRadius:999 }} />
                </div>
              </motion.div>
            )}
            {transferState==='done' && (
              <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{ ...cardStyle, textAlign:'center', padding:'24px', background:'rgba(34,197,94,0.08)', borderColor:'rgba(34,197,94,0.2)' }}>
                <p style={{ fontWeight:700, color:'var(--color-green)', fontSize:15 }}>✓ Transfer complete!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LightningShare;
