/**
 * components/Radar.jsx — Peer Discovery Radar
 * Animated circular radar that displays discovered nearby peers as blips.
 * Used in Lightning Share mode.
 */

import { motion, AnimatePresence } from 'framer-motion';

/** Individual peer blip on the radar */
const PeerBlip = ({ peer, index, onSelect, isSelected }) => {
  // Distribute blips evenly in a circle
  const total = 6; // max blips in ring
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 38; // percentage of radar radius
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);

  return (
    <motion.button
      key={peer.socketId}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      whileHover={{ scale: 1.3 }}
      onClick={() => onSelect(peer)}
      title={`Peer: ${peer.socketId.slice(0, 6)}…`}
      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
      className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${
        isSelected
          ? 'bg-[var(--color-neon-cyan)] border-white'
          : 'bg-[var(--color-neon-cyan)]/60 border-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan)]'
      }`}
    />
  );
};

const Radar = ({ peers = [], selectedPeer, onSelectPeer }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Radar Display */}
      <div className="relative w-56 h-56">
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: '0 0 40px rgba(0,245,255,0.15)' }}
        />

        {/* Radar rings */}
        {[1, 0.66, 0.33].map((scale, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-[var(--color-neon-cyan)]/20"
            style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
            animate={{ opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity }}
          />
        ))}

        {/* Sweeping scan line */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ transformOrigin: 'center' }}
        >
          <motion.div
            className="absolute"
            style={{
              width: '50%',
              height: '2px',
              top: '50%',
              left: '50%',
              transformOrigin: '0% 50%',
              background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.7))',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-neon-cyan)]" />

        {/* Peer blips */}
        <AnimatePresence>
          {peers.slice(0, 6).map((peer, i) => (
            <PeerBlip
              key={peer.socketId}
              peer={peer}
              index={i}
              onSelect={onSelectPeer}
              isSelected={selectedPeer?.socketId === peer.socketId}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Status text */}
      <div className="text-center">
        {peers.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] animate-pulse">
            Scanning for nearby devices…
          </p>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-neon-cyan)] font-semibold">{peers.length}</span>
            {' '}device{peers.length !== 1 ? 's' : ''} detected
            {selectedPeer && (
              <span className="block text-xs text-[var(--color-neon-cyan)]/70 mt-1">
                Selected: {selectedPeer.socketId.slice(0, 8)}…
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default Radar;
