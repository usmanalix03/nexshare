/**
 * pages/SecureVault.jsx — Mobile-first, with manual delete for auth'd users
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Dropzone from '../components/Dropzone';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const LOCAL_HISTORY_KEY = 'nex_vault_history';

const fmt = (bytes) => { if(!bytes)return''; const k=1024,i=Math.floor(Math.log(bytes)/Math.log(k)); return `${parseFloat((bytes/k**i).toFixed(1))} ${'BKMG'[i]}B`.replace('BB','B'); };
const fmtDate = (d) => { if(!d)return'—'; return new Date(d).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); };
const isExpired = (e) => new Date(e)<new Date();
const addHistory = (e) => { const h=JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY)||'[]'); h.unshift({...e,date:new Date().toISOString()}); localStorage.setItem(LOCAL_HISTORY_KEY,JSON.stringify(h.slice(0,20))); };
const Spinner = ({color='#fff'}) => <span style={{width:22,height:22,border:`3px solid ${color}25`,borderTopColor:color,borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block',flexShrink:0}}/>;

const SecureVault = () => {
  const {id} = useParams();
  const {isAuthenticated} = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [userFiles, setUserFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { setHistory(JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY)||'[]')); }, []);

  // Fetch user's own files if authenticated
  useEffect(() => {
    if (!isAuthenticated || id) return;
    fetchUserFiles();
  }, [isAuthenticated, id]);

  const fetchUserFiles = async () => {
    setLoadingFiles(true);
    try { const r = await api.get('/vault/my-files'); setUserFiles(r.data.files||[]); }
    catch(e){} finally { setLoadingFiles(false); }
  };

  // Download mode
  useEffect(() => {
    if (!id) return;
    setDownloading(true);
    (async () => {
      try {
        const res = await fetch(`/api/vault/${id}`);
        if (!res.ok) { const d=await res.json(); throw new Error(d.error||'Download failed'); }
        const disp=res.headers.get('content-disposition')||'';
        const nm=disp.match(/filename="?([^"]+)"?/);
        const filename=nm?decodeURIComponent(nm[1]):'download';
        const blob=await res.blob();
        const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
        addHistory({filename,mode:'downloaded',size:blob.size}); setHistory(JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY)||'[]'));
      } catch(err){ setDownloadError(err.message); } finally { setDownloading(false); }
    })();
  }, [id]);

  const handleUpload = async () => {
    if(!file)return; setUploading(true); setUploadResult(null);
    try {
      const fd=new FormData(); fd.append('file',file);
      const res=await api.post('/vault/upload',fd,{headers:{'Content-Type':'multipart/form-data'}});
      const shareUrl=`${window.location.origin}/vault/${res.data.linkId}`;
      setUploadResult({...res.data,shareUrl});
      addHistory({filename:file.name,mode:'uploaded',size:file.size});
      setHistory(JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY)||'[]'));
      setFile(null);
      fetchUserFiles();
    } catch(err){ alert(err.response?.data?.error||'Upload failed'); } finally { setUploading(false); }
  };

  const handleCopy = async (url) => {
    await navigator.clipboard.writeText(url); setCopied(url); setTimeout(()=>setCopied(false),2500);
  };

  const confirmDelete = async () => {
    if(!deleteConfirm)return;
    try {
      await api.delete(`/vault/${deleteConfirm.id}`);
      setUserFiles(p=>p.filter(f=>f.id!==deleteConfirm.id));
      if(uploadResult?.linkId===deleteConfirm.id) setUploadResult(null);
    } catch(err){ alert(err.response?.data?.error||'Delete failed'); }
    setDeleteConfirm(null);
  };

  const cardStyle = { background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:20, padding:'28px 24px' };
  const pageStyle = { minHeight:'100vh', minHeight:'100dvh', padding:'80px 20px 60px', maxWidth:760, margin:'0 auto' };

  // Download page
  if (id) return (
    <div style={{ minHeight:'100vh', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 20px' }}>
      <div style={{ ...cardStyle, maxWidth:440, width:'100%', textAlign:'center', padding:'48px 32px' }}>
        {downloading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
            <Spinner color="var(--color-purple)" />
            <div>
              <p style={{ fontSize:22, fontWeight:800, color:'var(--color-text-1)', marginBottom:8, letterSpacing:'-0.03em' }}>Decrypting file…</p>
              <p style={{ fontSize:15, color:'var(--color-text-2)' }}>Please wait while we prepare your download.</p>
            </div>
          </div>
        ) : downloadError ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--color-red-dim)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>⚠️</div>
            <div>
              <p style={{ fontSize:22, fontWeight:800, color:'var(--color-text-1)', marginBottom:8 }}>Link Unavailable</p>
              <p style={{ fontSize:15, color:'var(--color-red)', fontWeight:600 }}>{downloadError}</p>
            </div>
            <Link to="/vault" className="btnghost" style={{ textDecoration:'none', width:'100%', justifyContent:'center', marginTop:8 }}>← Back to Vault</Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>✓</div>
            <div>
              <p style={{ fontSize:22, fontWeight:800, color:'var(--color-text-1)', marginBottom:8 }}>Download started!</p>
              <p style={{ fontSize:15, color:'var(--color-text-2)' }}>File decrypted and saved to your device.</p>
            </div>
            <Link to="/vault" className="btnblue" style={{ textDecoration:'none', width:'100%', justifyContent:'center', marginTop:8 }}>Back to Vault</Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ marginBottom:40 }}>
        <h1 style={{ fontSize:'clamp(30px, 7vw, 40px)', fontWeight:900, letterSpacing:'-0.04em', color:'var(--color-text-1)', marginBottom:12 }}>Secure Vault</h1>
        <p style={{ fontSize:16, color:'var(--color-text-2)', lineHeight:1.65, maxWidth:500 }}>
          AES-256 encrypted. Files auto-deleted after 24 hours. Sign in to upload and manage your links.
        </p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

        {/* Upload Panel */}
        <div style={cardStyle}>
          <h2 style={{ fontSize:18, fontWeight:700, color:'var(--color-text-1)', marginBottom:24, letterSpacing:'-0.02em' }}>Upload a File</h2>

          {!isAuthenticated ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'16px 0' }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--color-purple-dim)', border:'1px solid rgba(168,85,247,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, marginBottom:20 }}>🔒</div>
              <p style={{ fontSize:20, fontWeight:800, color:'var(--color-text-1)', marginBottom:12, letterSpacing:'-0.02em' }}>Sign in to upload</p>
              <p style={{ fontSize:15, color:'var(--color-text-2)', lineHeight:1.65, marginBottom:28, maxWidth:320 }}>
                You need an account to create shareable links. This lets you manage and delete your uploads anytime.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:12, width:'100%' }}>
                <Link to="/login" state={{from:'/vault'}} className="btnpurple" style={{ textDecoration:'none', justifyContent:'center' }}>Log In to Upload</Link>
                <Link to="/register" className="btnghost" style={{ textDecoration:'none', justifyContent:'center' }}>Create free account</Link>
              </div>
            </div>
          ) : (
            <>
              <Dropzone onFileSelect={setFile} accentColor="purple" disabled={uploading} />
              <button onClick={handleUpload} disabled={!file||uploading} className="btnpurple" style={{ width:'100%', marginTop:16 }}>
                {uploading ? <><Spinner/>Encrypting & Uploading…</> : file ? '🔐 Encrypt & Upload' : 'Select a file to continue'}
              </button>
            </>
          )}
        </div>

        {/* Upload Result */}
        <AnimatePresence>
          {uploadResult && (
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{ ...cardStyle, border:'1px solid rgba(168,85,247,0.25)', background:'rgba(168,85,247,0.05)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:24 }}>🎉</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--color-purple)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Upload Complete</span>
                </div>
                <button onClick={()=>setDeleteConfirm({id:uploadResult.linkId,name:uploadResult.filename})} style={{ fontSize:12, fontWeight:700, color:'var(--color-red)', background:'var(--color-red-dim)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'6px 14px', cursor:'pointer' }}>Delete</button>
              </div>
              <p style={{ fontWeight:700, fontSize:17, color:'var(--color-text-1)', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{uploadResult.filename}</p>
              <p style={{ fontSize:13, color:'var(--color-text-3)', marginBottom:20 }}>Auto-deletes in 24 hrs · {fmt(uploadResult.fileSize)}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <input readOnly value={uploadResult.shareUrl} style={{ background:'var(--color-surface-2)', border:'1px solid var(--color-border)', borderRadius:12, padding:'14px 16px', fontSize:13, fontFamily:'monospace', color:'var(--color-text-2)', width:'100%', outline:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                  onFocus={e=>e.target.select()} />
                <button onClick={()=>handleCopy(uploadResult.shareUrl)} className="btnpurple" style={{ width:'100%' }}>
                  {copied ? '✓ Copied to clipboard!' : '📋 Copy Shareable Link'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User's files (authenticated) */}
        {isAuthenticated && (
          <div style={cardStyle}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:'var(--color-text-1)' }}>My Uploads</h3>
              <button onClick={fetchUserFiles} style={{ fontSize:13, fontWeight:600, color:'var(--color-text-3)', background:'none', border:'none', cursor:'pointer' }}>↻ Refresh</button>
            </div>

            {loadingFiles ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'24px 0' }}><Spinner color="var(--color-purple)"/></div>
            ) : userFiles.length===0 ? (
              <p style={{ textAlign:'center', fontSize:15, color:'var(--color-text-3)', padding:'20px 0' }}>No uploads yet. Upload a file above.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {userFiles.map(f=>{
                  const expired = isExpired(f.expires_at);
                  const shareUrl = `${window.location.origin}/vault/${f.id}`;
                  return (
                    <div key={f.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px', background:'var(--color-surface-2)', borderRadius:14, border:'1px solid var(--color-border)', opacity:expired?0.5:1, flexWrap:'wrap', gap:'12px' }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--color-blue-dim)', border:'1px solid rgba(59,130,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>📄</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:15, fontWeight:700, color:'var(--color-text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>{f.original_filename}</p>
                        <p style={{ fontSize:12, color:'var(--color-text-3)' }}>{fmt(f.file_size)}</p>
                        <p style={{ fontSize:12, fontWeight:600, color:expired?'var(--color-red)':'var(--color-green)', marginTop:2 }}>
                          {expired ? '⚠ Expired' : `Expires ${fmtDate(f.expires_at)}`}
                        </p>
                      </div>
                      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                        {!expired&&(
                          <button onClick={()=>handleCopy(shareUrl)} className="btnghost" style={{ padding:'10px 16px', fontSize:13, color:copied===shareUrl?'var(--color-green)':'var(--color-text-2)' }}>
                            {copied===shareUrl?'✓':'Copy'}
                          </button>
                        )}
                        <button onClick={()=>setDeleteConfirm({id:f.id,name:f.original_filename})} style={{ background:'var(--color-red-dim)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'10px 16px', fontSize:13, fontWeight:700, color:'var(--color-red)', cursor:'pointer' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Local history (unauthenticated) */}
        {!isAuthenticated && history.length>0 && (
          <div style={cardStyle}>
            <p style={{ fontSize:12, fontWeight:700, color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:16 }}>Recent Activity (Local)</p>
            <div style={{ display:'flex', flexDirection:'column' }}>
              {history.map((item,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:'1px solid var(--color-border)' }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--color-surface-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{item.mode==='uploaded'?'↑':'↓'}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:'var(--color-text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.filename}</p>
                    <p style={{ fontSize:12, color:'var(--color-text-3)', marginTop:3 }}>{item.mode} · {fmt(item.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'20px', paddingBottom:'max(20px,env(safe-area-inset-bottom))', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}
            onClick={()=>setDeleteConfirm(null)}>
            <motion.div initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} exit={{y:40,opacity:0}} onClick={e=>e.stopPropagation()}
              style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:24, padding:'32px 28px', maxWidth:440, width:'100%', textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--color-red-dim)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 20px' }}>🗑️</div>
              <h3 style={{ fontSize:22, fontWeight:800, color:'var(--color-text-1)', marginBottom:12, letterSpacing:'-0.03em' }}>Delete this file?</h3>
              <p style={{ fontSize:15, color:'var(--color-text-2)', marginBottom:28, lineHeight:1.6, wordBreak:'break-all' }}>
                "<strong style={{color:'var(--color-text-1)'}}>{deleteConfirm.name}</strong>" will be permanently deleted and its link will stop working immediately.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <button onClick={confirmDelete} style={{ background:'var(--color-red)', color:'#fff', border:'none', borderRadius:14, padding:'18px', fontWeight:800, fontSize:17, cursor:'pointer', width:'100%' }}>Yes, Delete</button>
                <button onClick={()=>setDeleteConfirm(null)} className="btnghost" style={{ width:'100%' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecureVault;
