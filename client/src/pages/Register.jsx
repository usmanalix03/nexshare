/**
 * pages/Register.jsx — Mobile-first
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Spinner = () => <span style={{ width:22, height:22, border:'3px solid rgba(255,255,255,0.25)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block', flexShrink:0 }} />;
const strengthLevel = (p) => { let s=0; if(p.length>=8)s++; if(/[A-Z]/.test(p))s++; if(/[0-9]/.test(p))s++; if(/[^A-Za-z0-9]/.test(p))s++; return s; };
const StrengthColors = ['#ef4444','#f97316','#eab308','#22c55e'];
const StrengthLabels = ['Too weak','Could be stronger','Getting there','Strong!'];

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const level = strengthLevel(password);

  return (
    <div style={{ minHeight:'100vh', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 20px 40px' }}>
      <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ type:'spring', stiffness:280, damping:28 }} style={{ width:'100%', maxWidth:440 }}>

        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:68, height:68, borderRadius:'50%', background:'var(--color-purple-dim)', border:'1px solid rgba(168,85,247,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 20px' }}>🔐</div>
          <h1 style={{ fontSize:30, fontWeight:800, color:'var(--color-text-1)', letterSpacing:'-0.04em', marginBottom:8 }}>Create your account</h1>
          <p style={{ fontSize:16, color:'var(--color-text-2)' }}>Manage, track, and delete your encrypted files</p>
        </div>

        <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:24, padding:'32px 28px' }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:22 }}>
            {error && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ background:'var(--color-red-dim)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:12, padding:'14px 18px', fontSize:15, color:'var(--color-red)', fontWeight:600 }}>
                {error}
              </motion.div>
            )}
            <div>
              <label htmlFor="reg-email" className="label">Email address</label>
              <input id="reg-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className="input" />
            </div>
            <div>
              <label htmlFor="reg-password" className="label">Password</label>
              <input id="reg-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="new-password" placeholder="Min. 8 characters" className="input" />
              {password && (
                <div style={{ marginTop:12 }}>
                  <div style={{ display:'flex', gap:6 }}>
                    {[0,1,2,3].map(i=>(
                      <div key={i} style={{ flex:1, height:5, borderRadius:999, transition:'background 0.3s', background: i<level ? StrengthColors[level-1] : 'var(--color-surface-3)' }} />
                    ))}
                  </div>
                  <p style={{ fontSize:13, fontWeight:700, marginTop:6, color: level>0 ? StrengthColors[level-1] : 'var(--color-text-3)' }}>
                    {level>0 ? StrengthLabels[level-1] : 'Too short'}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="reg-confirm" className="label">Confirm password</label>
              <input id="reg-confirm" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required autoComplete="new-password" placeholder="Repeat your password" className="input" />
            </div>
            <button type="submit" disabled={loading} className="btnpurple" style={{ width:'100%', marginTop:6 }}>
              {loading ? <><Spinner />Creating account…</> : 'Create Account'}
            </button>
          </form>
          <div style={{ marginTop:28, paddingTop:24, borderTop:'1px solid var(--color-border)', textAlign:'center', fontSize:16, color:'var(--color-text-2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--color-purple)', fontWeight:700, textDecoration:'none' }}>Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
