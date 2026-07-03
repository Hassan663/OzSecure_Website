'use client';
import { useState } from 'react';
import { X, ImageIcon } from 'lucide-react';
import MediaManager from './MediaManager';
import { resolveImageSrc } from '@/lib/media';

// A path/URL text input that also lets the admin pick an uploaded media item
// (or upload a new one). Accepts either a /images/... path or a /api/media/:id.
export default function ImageField({ label = 'Image', value, onChange, hint }) {
  const [picking, setPicking] = useState(false);

  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex items-start gap-3">
        <div className="flex h-[46px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-hairline bg-surface">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveImageSrc(value)} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <ImageIcon size={18} className="text-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="/images/services/security.jpg" className="field-input" />
          <button type="button" onClick={() => setPicking(true)} className="mt-2 text-[0.82rem] font-medium text-accent hover:underline">
            Choose from media library →
          </button>
        </div>
      </div>
      {hint && <p className="mt-1 text-[0.78rem] text-muted">{hint}</p>}

      {picking && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPicking(false)} />
          <div className="relative flex max-h-[88vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[16px] border border-hairline bg-panel shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
              <h3 className="text-[1.15rem]">Media library</h3>
              <button onClick={() => setPicking(false)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-[8px] text-muted hover:text-ink"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto px-5 py-5" data-lenis-prevent>
              <MediaManager
                selectedUrl={value}
                onSelect={(url) => { onChange(url); setPicking(false); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
