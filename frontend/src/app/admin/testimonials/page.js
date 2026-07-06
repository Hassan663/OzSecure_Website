'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Save, Trash2, Check, AlertCircle, Eye, EyeOff, Pencil, ArrowUp, ArrowDown, Star } from 'lucide-react';
import { adminFetch, getToken } from '@/lib/admin';

const BLANK = { quote: '', authorName: '', company: '', rating: '', active: true, order: 0 };

function Editor({ initial, onClose, onSaved, onError }) {
  const isNew = !initial.id;
  const [form, setForm] = useState({ ...BLANK, ...initial, rating: initial.rating ?? '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.quote.trim()) return setErr('Quote is required.');
    setErr('');
    setSaving(true);
    const payload = {
      ...form,
      order: Number(form.order) || 0,
      rating: form.rating === '' ? null : Number(form.rating),
    };
    try {
      const data = isNew
        ? await adminFetch('/testimonials', { method: 'POST', body: JSON.stringify(payload) })
        : await adminFetch(`/testimonials/${initial.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      onSaved(data.testimonial, isNew);
    } catch (e2) {
      if (!onError(e2)) setErr(e2.message || 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col border-l border-hairline bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="text-[1.2rem]">{isNew ? 'New testimonial' : 'Edit testimonial'}</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-[8px] text-muted hover:text-ink" aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5" data-lenis-prevent>
            {err && (
              <div className="flex items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/[0.06] px-3.5 py-2.5 text-[0.88rem] text-accent">
                <AlertCircle size={15} className="shrink-0" /> {err}
              </div>
            )}
            <div>
              <label className="field-label">Quote <span className="text-accent">*</span></label>
              <textarea value={form.quote} onChange={(e) => upd('quote', e.target.value)} rows={5} className="field-input" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Author / role</label>
                <input value={form.authorName} onChange={(e) => upd('authorName', e.target.value)} placeholder="Project Manager" className="field-input" />
              </div>
              <div>
                <label className="field-label">Company / context</label>
                <input value={form.company} onChange={(e) => upd('company', e.target.value)} placeholder="Commercial Construction, NSW" className="field-input" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Rating (1–5, optional)</label>
                <select value={form.rating} onChange={(e) => upd('rating', e.target.value)} className="field-input">
                  <option value="">No rating</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Sort order</label>
                <input type="number" value={form.order} onChange={(e) => upd('order', e.target.value)} className="field-input" />
              </div>
            </div>
            <label className="flex items-center gap-2.5 pt-1">
              <input type="checkbox" checked={form.active} onChange={(e) => upd('active', e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
              <span className="text-[0.92rem] font-medium">Active (shown on the homepage)</span>
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-hairline px-5 py-4">
            <button type="button" onClick={onClose} className="btn btn-ghost !py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary !py-2.5 disabled:opacity-50">
              <Save size={16} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!getToken()) { router.replace('/admin/login'); return; }
    setReady(true);
  }, [router]);

  const handle401 = useCallback((e) => {
    if (e && e.code === 401) { router.replace('/admin/login'); return true; }
    return false;
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await adminFetch('/testimonials');
      setItems(data.testimonials || []);
    } catch (e) {
      if (!handle401(e)) setError(e.message || 'Failed to load testimonials');
    } finally { setLoading(false); }
  }, [handle401]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2800); };
  const onSaved = (_t, isNew) => { setEditing(null); flash(isNew ? 'Testimonial created.' : 'Testimonial updated.'); load(); };

  const toggleActive = async (t) => {
    try { await adminFetch(`/testimonials/${t.id}/active`, { method: 'PATCH', body: JSON.stringify({ active: !t.active }) }); load(); }
    catch (e) { if (!handle401(e)) setError(e.message); }
  };
  const remove = async (t) => {
    if (!window.confirm('Delete this testimonial permanently?')) return;
    try { await adminFetch(`/testimonials/${t.id}`, { method: 'DELETE' }); flash('Testimonial deleted.'); load(); }
    catch (e) { if (!handle401(e)) setError(e.message); }
  };
  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    try { await adminFetch('/testimonials/reorder', { method: 'PATCH', body: JSON.stringify({ ids: next.map((s) => s.id) }) }); }
    catch (e) { if (!handle401(e)) setError(e.message); load(); }
  };
  if (!ready) return null;

  return (
    <div className="text-ink">

      <div className="mx-auto w-full max-w-shell px-5 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.6rem]">Testimonials</h1>
            <p className="mt-1 text-[0.95rem] text-muted">Active testimonials rotate in the homepage client section. Reorder with the arrows.</p>
          </div>
          <button onClick={() => setEditing({})} className="btn btn-primary"><Plus size={16} /> New testimonial</button>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/[0.06] px-4 py-3 text-[0.9rem] text-accent">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-[12px] border border-hairline bg-panel p-8 text-center text-muted">Loading…</div>
        ) : (
          <div className="overflow-hidden rounded-[12px] border border-hairline bg-panel">
            {items.map((t, i) => (
              <div key={t.id} className="flex items-start gap-3 border-b border-hairline px-4 py-3 last:border-0">
                <div className="flex flex-col pt-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="text-muted hover:text-accent disabled:opacity-30"><ArrowUp size={15} /></button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down" className="text-muted hover:text-accent disabled:opacity-30"><ArrowDown size={15} /></button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">{t.authorName || 'Anonymous'}{t.company ? ` · ${t.company}` : ''}</span>
                    {t.rating > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-accent">
                        {Array.from({ length: t.rating }).map((_, s) => <Star key={s} size={11} className="fill-accent" />)}
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wide ${t.active ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-muted/15 text-muted'}`}>{t.active ? 'Active' : 'Hidden'}</span>
                  </div>
                  <p className="line-clamp-2 text-[0.9rem] leading-relaxed text-muted">&ldquo;{t.quote}&rdquo;</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => toggleActive(t)} title={t.active ? 'Hide' : 'Show'} aria-label={t.active ? 'Hide' : 'Show'} className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-hairline text-muted hover:text-ink">{t.active ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                  <button onClick={() => setEditing(t)} title="Edit" aria-label="Edit" className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-hairline text-muted hover:text-ink"><Pencil size={16} /></button>
                  <button onClick={() => remove(t)} title="Delete" aria-label="Delete" className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-hairline text-muted hover:border-accent hover:text-accent"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="px-4 py-14 text-center text-muted">No testimonials yet — add one.</div>}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-[10px] border border-hairline bg-panel px-4 py-2.5 text-[0.9rem] font-medium shadow-2xl">
          <Check size={16} className="text-emerald-500" /> {toast}
        </div>
      )}
      {editing && <Editor initial={editing} onClose={() => setEditing(null)} onSaved={onSaved} onError={handle401} />}
    </div>
  );
}
