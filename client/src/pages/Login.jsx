/**
 * pages/Login.jsx — Mobile-first
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Spinner = () => <span style={{ width:22, height:22, border:'3px solid rgba(255,255,255,0.25)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block', flexShrink:0 }} />;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 20px 40px' }}>
      <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ type:'spring', stiffness:280, damping:28 }} style={{ width:'100%', maxWidth:440 }}>

        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:68, height:68, borderRadius:'50%', background:'var(--color-blue-dim)', border:'1px solid rgba(59,130,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 20px' }}>⚡</div>
          <h1 style={{ fontSize:30, fontWeight:800, color:'var(--color-text-1)', letterSpacing:'-0.04em', marginBottom:8 }}>Welcome back</h1>
          <p style={{ fontSize:16, color:'var(--color-text-2)' }}>Sign in to manage your encrypted files</p>
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
              <label htmlFor="login-email" className="label">Email address</label>
              <input id="login-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className="input" />
            </div>
            <div>
              <label htmlFor="login-password" className="label">Password</label>
              <input id="login-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" className="input" />
            </div>
            <button type="submit" disabled={loading} className="btnblue" style={{ width:'100%', marginTop:6 }}>
              {loading ? <><Spinner />Signing in…</> : 'Sign In'}
            </button>
          </form>
          <div style={{ marginTop:28, paddingTop:24, borderTop:'1px solid var(--color-border)', textAlign:'center', fontSize:16, color:'var(--color-text-2)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--color-blue)', fontWeight:700, textDecoration:'none' }}>Create one free</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
