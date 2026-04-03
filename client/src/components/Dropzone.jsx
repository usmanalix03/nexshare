/**
 * components/Dropzone.jsx — Dark theme, big padded dropzone
 */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${'BKMG'[i]}B`.replace('BB','B');
};

const getFileIcon = (mimeType) => {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📑';
  if (mimeType.includes('zip') || mimeType.includes('compress')) return '📦';
  if (mimeType.includes('text')) return '📝';
  return '📄';
};

const Dropzone = ({ onFileSelect, accept, disabled = false, accentColor = 'blue' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);
  const accent = accentColor === 'purple' ? 'var(--color-purple)' : 'var(--color-blue)';
  const accentDim = accentColor === 'purple' ? 'var(--color-purple-dim)' : 'var(--color-blue-dim)';

  const handleFile = useCallback((f) => {
    if (!f || disabled) return;
    setFile(f);
    onFileSelect?.(f);
  }, [onFileSelect, disabled]);

  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); };
  const onDragOver = (e) => { e.preventDefault(); if (!disabled) setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onChange = (e) => handleFile(e.target.files?.[0]);
  const clearFile = (e) => { e.stopPropagation(); setFile(null); onFileSelect?.(null); if (inputRef.current) inputRef.current.value = ''; };

  return (
    <motion.div
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      animate={{ borderColor: isDragging ? accent : 'var(--color-border)', background: isDragging ? accentDim : 'var(--color-surface-2)' }}
      transition={{ duration: 0.15 }}
      style={{
        border: '2px dashed var(--color-border)', borderRadius: 14,
        padding: file ? '32px' : '56px 32px',
        textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none', transition: 'all 0.15s ease',
      }}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={onChange} style={{ display: 'none' }} disabled={disabled} />

      <AnimatePresence mode="wait">
        {file ? (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: accentDim, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
              {getFileIcon(file.type)}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-1)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 4 }}>{formatBytes(file.size)}</p>
            </div>
            <button onClick={clearFile} style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-red)', background: 'var(--color-red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', marginTop: 4 }}>
              Remove
            </button>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <motion.div animate={{ y: isDragging ? -8 : 0 }} style={{ fontSize: 48, lineHeight: 1 }}>
              {isDragging ? '⚡' : '📂'}
            </motion.div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-1)', marginBottom: 6 }}>
                {isDragging ? 'Release to drop' : 'Drop a file here'}
              </p>
              <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>or click to browse</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: accent, background: accentDim, border: `1px solid ${accent}30`, borderRadius: 999, padding: '4px 14px' }}>
              Max 100 MB
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dropzone;
