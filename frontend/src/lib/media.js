import { getToken } from './admin';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Resolve an image reference to a renderable URL:
//  - '/api/media/:id'  → absolute backend URL (uploaded media)
//  - '/images/...'     → left as-is (bundled /public asset)
//  - full http(s) URL  → left as-is
export function resolveImageSrc(src) {
  if (!src) return src;
  if (src.startsWith('/api/media/')) return `${API}${src}`;
  return src;
}

export const MEDIA_MAX_BYTES = 3 * 1024 * 1024;
export const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Upload with progress via XHR (fetch has no upload-progress events).
export function uploadMedia(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!MEDIA_TYPES.includes(file.type)) return reject(new Error('Only JPG, PNG or WebP images are allowed'));
    if (file.size > MEDIA_MAX_BYTES) return reject(new Error('Image is too large (max 3 MB)'));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API}/api/admin/media/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${getToken() || ''}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300 && data.ok) resolve(data);
      else if (xhr.status === 401) { const err = new Error('Session expired'); err.code = 401; reject(err); }
      else reject(new Error(data.message || 'Upload failed'));
    };
    xhr.onerror = () => reject(new Error('Upload failed — is the server running?'));
    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  });
}

export function fmtBytes(n) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
