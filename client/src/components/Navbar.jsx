/**
 * components/Navbar.jsx — Mobile-first, safe-area aware
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: '/lightning', label: '⚡ Lightning' },
    { to: '/vault',     label: '🔐 Vault' },
    ...(isAuthenticated ? [{ to: '/dashboard', label: '📁 Dashboard' }] : []),
  ];

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(13,13,13,0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        height: 64,
        display: 'flex', alignItems: 'center',
        paddingLeft: 'max(20px, env(safe-area-inset-left))',
        paddingRight: 'max(20px, env(safe-area-inset-right))',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Brand */}
          <Link to="/" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontSize: 26 }}>⚡</span>
            <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text-1)', letterSpacing: '-0.03em' }}>NexShare</span>
          </Link>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }} className="hidden-mobile">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} style={{ padding: '8px 16px', borderRadius: 10, fontSize: 15, fontWeight: 600, color: 'var(--color-text-2)', textDecoration: 'none', transition: 'color 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-1)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-2)'}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }} className="hidden-mobile">
            {isAuthenticated ? (
              <button onClick={() => { logout(); navigate('/'); }} className="btnghost" style={{ padding: '10px 18px', fontSize: 14 }}>Log out</button>
            ) : (
              <>
                <Link to="/login" style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-2)', textDecoration: 'none', padding: '8px 12px' }}>Log in</Link>
                <Link to="/register" className="btnblue" style={{ padding: '10px 20px', fontSize: 15, textDecoration: 'none' }}>Sign up</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="show-mobile"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5, WebkitTapHighlightColor: 'transparent' }}
          >
            {[0,1,2].map(i => (
              <motion.span key={i} animate={{ opacity: menuOpen && i===1 ? 0 : 1, rotate: menuOpen ? (i===0 ? 45 : i===2 ? -45 : 0) : 0, y: menuOpen ? (i===0 ? 9 : i===2 ? -9 : 0) : 0 }}
                style={{ display: 'block', width: 24, height: 2.5, background: 'var(--color-text-1)', borderRadius: 2, transformOrigin: 'center' }} />
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{
              position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
              background: 'rgba(13,13,13,0.98)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              borderBottom: '1px solid var(--color-border)', padding: '20px 24px 28px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-1)', textDecoration: 'none', padding: '14px 0', borderBottom: '1px solid var(--color-border)', display: 'block' }}>
                {l.label}
              </Link>
            ))}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isAuthenticated ? (
                <button onClick={() => { logout(); navigate('/'); setMenuOpen(false); }} className="btnghost" style={{ width: '100%' }}>Log out</button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btnghost" style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}>Log in</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btnblue" style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}>Sign up free</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hidden-mobile { display: flex !important; }
        .show-mobile   { display: none !important; }
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
