'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { UploadCloud, Trash2, Check, Copy, AlertCircle, Loader2, ImageOff } from 'lucide-react';
import { adminFetch } from '@/lib/admin';
import { resolveImageSrc, uploadMedia, fmtBytes, MEDIA_TYPES } from '@/lib/media';

// Reusable media gallery: upload (with progress), grid, delete, optional select.
// Used both by the /admin/media page and the in-form MediaPicker modal.
export default function MediaManager({ onSelect, selectedUrl, onAuthError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState('');
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await adminFetch('/media');
      setItems(data.media || []);
    } catch (e) {
      if (e.code === 401 && onAuthError) onAuthError(e);
      else setError(e.message || 'Failed to load media');
    } finally { setLoading(false); }
  }, [onAuthError]);

  useEffect(() => { load(); }, [load]);

  const doUpload = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true); setProgress(0);
    try {
      await uploadMedia(file, setProgress);
      await load();
    } catch (e) {
      if (e.code === 401 && onAuthError) onAuthError(e);
      else setError(e.message || 'Upload failed');
    } finally { setUploading(false); setProgress(0); if (fileRef.current) fileRef.current.value = ''; }
  };

  const onDrop = (e) => { e.preventDefault(); doUpload(e.dataTransfer.files?.[0]); };
  const remove = async (id) => {
    if (!window.confirm('Delete this image permanently? Anything using it will fall back to its gradient.')) return;
    try { await adminFetch(`/media/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { if (e.code === 401 && onAuthError) onAuthError(e); else setError(e.message); }
  };
  const copy = (url) => {
    navigator.clipboard?.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div>
      {/* Uploader */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-hairline bg-surface/50 px-6 py-8 text-center"
      >
        <UploadCloud size={26} className="text-accent" />
        <p className="mt-3 text-[0.95rem] font-medium">Drag &amp; drop an image here, or</p>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-primary mt-3 !py-2.5 disabled:opacity-60">
          {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading… {progress}%</> : <><UploadCloud size={15} /> Choose file</>}
        </button>
        <input ref={fileRef} type="file" accept={MEDIA_TYPES.join(',')} className="hidden" onChange={(e) => doUpload(e.target.files?.[0])} />
        <p className="mt-3 text-[0.78rem] text-muted">JPG, PNG or WebP · max 3 MB</p>
        {uploading && (
          <div className="mt-3 h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-hairline">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/[0.06] px-4 py-3 text-[0.88rem] text-accent">
          <AlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="mt-6 py-8 text-center text-muted">Loading…</div>
      ) : items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center py-10 text-center text-muted">
          <ImageOff size={26} className="mb-2 opacity-60" /> No uploads yet.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => {
            const isSel = selectedUrl === m.url;
            return (
              <div key={m.id} className={`overflow-hidden rounded-[10px] border ${isSel ? 'border-accent ring-2 ring-accent/40' : 'border-hairline'} bg-panel`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveImageSrc(m.url)} alt={m.filename} className="aspect-[4/3] w-full bg-surface object-cover" />
                <div className="p-2.5">
                  <div className="truncate text-[0.78rem] font-medium" title={m.filename}>{m.filename}</div>
                  <div className="text-[0.72rem] text-muted">{fmtBytes(m.size)}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {onSelect && (
                      <button type="button" onClick={() => onSelect(m.url)} className="btn btn-primary flex-1 justify-center !px-2 !py-1.5 text-[0.76rem]">
                        {isSel ? <><Check size={13} /> Selected</> : 'Use'}
                      </button>
                    )}
                    <button type="button" onClick={() => copy(m.url)} title="Copy path" className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-hairline text-muted hover:text-ink">
                      {copied === m.url ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                    <button type="button" onClick={() => remove(m.id)} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-hairline text-muted hover:border-accent hover:text-accent">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
