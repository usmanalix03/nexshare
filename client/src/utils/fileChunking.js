/**
 * utils/fileChunking.js — File Chunk Utilities
 * Splits files into chunks for WebRTC data channel transfer
 * and reassembles them on the receiving end.
 */

/** WebRTC data channel max message size (16 KB is widely supported) */
export const CHUNK_SIZE = 16 * 1024; // 16 KB

/**
 * Split a File or Blob into an array of ArrayBuffer chunks.
 * @param {File} file
 * @param {number} [chunkSize] - Bytes per chunk (default: 16 KB)
 * @returns {Promise<ArrayBuffer[]>}
 */
export const chunkFile = async (file, chunkSize = CHUNK_SIZE) => {
  const buffer = await file.arrayBuffer();
  const chunks = [];

  for (let offset = 0; offset < buffer.byteLength; offset += chunkSize) {
    chunks.push(buffer.slice(offset, offset + chunkSize));
  }

  return chunks;
};

/**
 * Reassemble an ordered array of ArrayBuffer chunks into a downloadable file.
 * Automatically triggers a browser download.
 * @param {ArrayBuffer[]} chunks
 * @param {string} filename
 * @param {string} mimeType
 */
export const reassembleFile = (chunks, filename, mimeType = 'application/octet-stream') => {
  const blob = new Blob(chunks, { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
};
