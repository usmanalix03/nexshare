/**
 * components/GlassCard.jsx — Dark surface card
 */
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = true, padding = true, style = {} }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -2, borderColor: 'rgba(255,255,255,0.15)' } : {}}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        padding: padding ? '32px' : undefined,
        transition: 'border-color 0.2s ease, transform 0.2s ease',
        ...style,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
