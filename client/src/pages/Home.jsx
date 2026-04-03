/**
 * pages/Home.jsx — Mobile-first hero
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp  = { hidden: { opacity:0, y:20 }, visible: { opacity:1, y:0, transition:{type:'spring',stiffness:280,damping:28} } };

const Chip = ({ label }) => (
  <span style={{ fontSize:14, fontWeight:600, padding:'7px 14px', borderRadius:999, background:'var(--color-surface-2)', border:'1px solid var(--color-border)', color:'var(--color-text-2)', whiteSpace:'nowrap', display:'inline-block' }}>
    {label}
  </span>
);

const ModeCard = ({ to, emoji, title, subtitle, desc, chips, linkLabel, accent }) => (
  <Link to={to} style={{ textDecoration:'none', display:'block', height:'100%' }}>
    <motion.div
      whileHover={{ y:-4, borderColor: accent==='blue'?'rgba(59,130,246,0.4)':'rgba(168,85,247,0.4)' }}
      whileTap={{ scale:0.99 }}
      style={{
        background:'var(--color-surface)', border:'1px solid var(--color-border)',
        borderRadius:24, padding:'32px 28px', height:'100%',
        display:'flex', flexDirection:'column', cursor:'pointer', transition:'border-color 0.2s',
      }}
    >
      <div style={{ fontSize:52, marginBottom:24, lineHeight:1 }}>{emoji}</div>
      <div style={{ marginBottom:16 }}>
        <h3 style={{ fontSize:26, fontWeight:800, color:'var(--color-text-1)', letterSpacing:'-0.03em', marginBottom:6, lineHeight:1.2 }}>{title}</h3>
        <p style={{ fontSize:13, fontWeight:700, color:accent==='blue'?'var(--color-blue)':'var(--color-purple)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{subtitle}</p>
      </div>
      <p style={{ fontSize:16, color:'var(--color-text-2)', lineHeight:1.7, flex:1, marginBottom:28 }}>{desc}</p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:28 }}>
        {chips.map(c=><Chip key={c} label={c}/>)}
      </div>
      <p style={{ fontSize:16, fontWeight:700, color:accent==='blue'?'var(--color-blue)':'var(--color-purple)', display:'flex', alignItems:'center', gap:6 }}>
        {linkLabel} <span>→</span>
      </p>
    </motion.div>
  </Link>
);

const Home = () => (
  <div style={{ minHeight:'100vh', minHeight:'100dvh', padding:'90px 20px 60px', maxWidth:1100, margin:'0 auto' }}>
    <motion.div variants={stagger} initial="hidden" animate="visible" style={{ textAlign:'center', marginBottom:72 }}>
      <motion.div variants={fadeUp} style={{ marginBottom:28 }}>
        <span className="badge" style={{ background:'var(--color-blue-dim)', color:'var(--color-blue)', border:'1px solid rgba(59,130,246,0.2)', fontSize:14 }}>
          End-to-End Encrypted
        </span>
      </motion.div>
      <motion.h1 variants={fadeUp} style={{ fontSize:'clamp(38px, 9vw, 80px)', fontWeight:900, letterSpacing:'-0.045em', lineHeight:1.08, color:'var(--color-text-1)', marginBottom:28 }}>
        Share files at the{' '}
        <span style={{ background:'linear-gradient(135deg, #3b82f6, #a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          speed of light.
        </span>
      </motion.h1>
      <motion.p variants={fadeUp} style={{ fontSize:'clamp(17px, 3vw, 21px)', color:'var(--color-text-2)', maxWidth:600, margin:'0 auto', lineHeight:1.65, padding:'0 8px' }}>
        Two powerful modes: instant peer-to-peer transfers that never touch a server, 
        or encrypted cloud vault links that self-destruct after 24 hours.
      </motion.p>
    </motion.div>

    <motion.div variants={stagger} initial="hidden" animate="visible"
      style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap:20 }}>
      <motion.div variants={fadeUp} style={{ height:'100%' }}>
        <ModeCard to="/lightning" emoji="⚡" accent="blue" title="Lightning Share" subtitle="Instant P2P Transfer"
          desc="Direct device-to-device via WebRTC. Files never leave your network. Nearby devices appear on a live radar — drop a file and send instantly."
          chips={['Zero latency','No server upload','LAN radar','Room codes']}
          linkLabel="Open Lightning Share" />
      </motion.div>
      <motion.div variants={fadeUp} style={{ height:'100%' }}>
        <ModeCard to="/vault" emoji="🔐" accent="purple" title="Secure Vault" subtitle="Encrypted Cloud Storage"
          desc="AES-256 encrypted upload with a unique, shareable link. Links automatically expire and delete after 24 hours."
          chips={['AES-256-CBC','24hr auto-delete','Shareable link','Manage & delete']}
          linkLabel="Open Secure Vault" />
      </motion.div>
    </motion.div>

    <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
      style={{ textAlign:'center', marginTop:56, fontSize:14, color:'var(--color-text-3)', fontWeight:500 }}>
      No account required for P2P transfers. Sign up to manage your vault files.
    </motion.p>
  </div>
);

export default Home;
