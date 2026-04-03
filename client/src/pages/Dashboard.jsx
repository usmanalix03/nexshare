/**
 * pages/Dashboard.jsx
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const formatBytes = (bytes) => { if(!bytes||bytes===0) return '0 B'; const k=1024,i=Math.floor(Math.log(bytes)/Math.log(k)); return `${parseFloat((bytes/Math.pow(k,i)).toFixed(1))} ${'BKMG'[i]}B`.replace('BB','B'); };
const formatDate = (d) => { if(!d) return '—'; return new Date(d).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); };
const isExpired = (e) => new Date(e)<new Date();
const Spinner = () => <span style={{width:20,height:20,border:'3px solid rgba(255,255,255,0.1)',borderTopColor:'var(--color-blue)',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block'}} />;

const FileRow = ({ file, onDelete, copying, onCopy }) => {
  const expired = isExpired(file.expires_at);
  const shareUrl = `${window.location.origin}/vault/${file.id}`;
  return (
    <motion.div layout initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,height:0}} style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, padding:'20px 24px', display:'flex', alignItems:'center', gap:16, opacity:expired?0.5:1, flexWrap:'wrap' }}>
      <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--color-blue-dim)', border:'1px solid rgba(59,130,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📄</div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontWeight:700, fontSize:15, color:'var(--color-text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>{file.original_filename}</p>
        <p style={{ fontSize:12, color:'var(--color-text-3)' }}>{formatBytes(file.file_size)} · Uploaded {formatDate(file.created_at)}</p>
        <p style={{ fontSize:12, fontWeight:600, marginTop:4, color:expired?'var(--color-red)':'var(--color-green)' }}>
          {expired ? '⚠ Expired' : `Expires ${formatDate(file.expires_at)}`}
        </p>
      </div>
      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
        {!expired && (
          <button onClick={()=>onCopy(file.id,shareUrl)} className="btnghost" style={{ padding:'8px 16px', fontSize:13, color:copying===file.id?'var(--color-green)':'var(--color-text-2)' }}>
            {copying===file.id?'✓ Copied':'Copy Link'}
          </button>
        )}
        <button onClick={()=>onDelete(file.id,file.original_filename)} style={{ background:'var(--color-red-dim)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, color:'var(--color-red)', cursor:'pointer' }}>
          Delete
        </button>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { isAuthenticated, loading:authLoading } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { if(!authLoading&&!isAuthenticated) navigate('/login',{state:{from:'/dashboard'}}); },[isAuthenticated,authLoading,navigate]);

  const fetchFiles = useCallback(async()=>{ try{ setLoading(true); const r=await api.get('/vault/my-files'); setFiles(r.data.files||[]); }catch(err){ setError(err.response?.data?.error||'Failed to load'); }finally{setLoading(false);} },[]);

  useEffect(()=>{ if(isAuthenticated)fetchFiles(); },[isAuthenticated,fetchFiles]);

  const handleCopy = useCallback(async(id,url)=>{ await navigator.clipboard.writeText(url); setCopying(id); setTimeout(()=>setCopying(null),2000); },[]);
  const handleDelete = useCallback((id,name)=>setDeleteConfirm({id,name}),[]);
  const confirmDelete = useCallback(async()=>{ if(!deleteConfirm)return; try{ await api.delete(`/vault/${deleteConfirm.id}`); setFiles(p=>p.filter(f=>f.id!==deleteConfirm.id)); setDeleteConfirm(null); }catch(err){ setError(err.response?.data?.error||'Delete failed'); setDeleteConfirm(null); } },[deleteConfirm]);

  if(authLoading||(!isAuthenticated&&!authLoading)) return null;

  return (
    <div style={{ minHeight:'100vh', padding:'80px 24px 60px', maxWidth:960, margin:'0 auto' }}>
      <div style={{ marginBottom:40 }}>
        <h1 style={{ fontSize:34, fontWeight:800, letterSpacing:'-0.03em', color:'var(--color-text-1)', marginBottom:8 }}>My Vault Files</h1>
        <p style={{ fontSize:15, color:'var(--color-text-2)', lineHeight:1.6 }}>Manage your encrypted uploads. Links automatically expire after 24 hours.</p>
      </div>

      {error && <div style={{ background:'var(--color-red-dim)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'12px 16px', fontSize:14, color:'var(--color-red)', marginBottom:24 }}>{error}</div>}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><Spinner /></div>
      ) : files.length===0 ? (
        <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:16, padding:64, textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:20 }}>📭</div>
          <h2 style={{ fontSize:22, fontWeight:700, color:'var(--color-text-1)', marginBottom:10 }}>No files yet</h2>
          <p style={{ fontSize:15, color:'var(--color-text-2)', marginBottom:32 }}>Upload a file to the Secure Vault to get started.</p>
          <Link to="/vault" className="btnpurple" style={{ textDecoration:'none', padding:'12px 28px' }}>Go to Secure Vault →</Link>
        </div>
      ) : (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <p style={{ fontSize:12, fontWeight:700, color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{files.length} file{files.length!==1?'s':''}</p>
            <Link to="/vault" style={{ fontSize:13, fontWeight:600, color:'var(--color-purple)', textDecoration:'none' }}>+ Upload New</Link>
          </div>
          <AnimatePresence mode="popLayout">
            {files.map(f=><FileRow key={f.id} file={f} onDelete={handleDelete} copying={copying} onCopy={handleCopy} />)}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)' }}
            onClick={()=>setDeleteConfirm(null)}>
            <motion.div initial={{scale:0.95,y:16}} animate={{scale:1,y:0}} exit={{scale:0.95}} onClick={e=>e.stopPropagation()}
              style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:20, padding:40, maxWidth:400, width:'100%', textAlign:'center' }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--color-red-dim)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 20px' }}>🗑️</div>
              <h3 style={{ fontSize:20, fontWeight:700, color:'var(--color-text-1)', marginBottom:12, letterSpacing:'-0.02em' }}>Delete file?</h3>
              <p style={{ fontSize:14, color:'var(--color-text-2)', marginBottom:28, lineHeight:1.6, wordBreak:'break-all' }}>
                "<strong style={{color:'var(--color-text-1)'}}>{deleteConfirm.name}</strong>" will be permanently deleted.
              </p>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={()=>setDeleteConfirm(null)} className="btnghost" style={{ flex:1, padding:'12px' }}>Cancel</button>
                <button onClick={confirmDelete} style={{ flex:1, background:'var(--color-red)', color:'#fff', border:'none', borderRadius:10, padding:'12px', fontWeight:700, fontSize:15, cursor:'pointer' }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
