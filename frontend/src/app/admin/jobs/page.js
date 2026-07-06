'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Save, Trash2, Check, AlertCircle, Eye, EyeOff, Pencil, MapPin } from 'lucide-react';
import ListEditor from '@/components/admin/ListEditor';
import { adminFetch, getToken } from '@/lib/admin';

const TYPES = ['Full-time', 'Part-time', 'Casual', 'Contract'];
const CATEGORIES = ['Security', 'Traffic Control', 'Cleaning', 'Labour', 'Other'];

const BLANK = {
  title: '', type: 'Casual', location: 'Sydney & Greater NSW', category: 'Security',
  shortDescription: '', fullDescription: '', requirements: [], active: true, order: 0,
};

function Editor({ initial, onClose, onSaved, onError }) {
  const isNew = !initial.id;
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setErr('Title is required.');
    setErr('');
    setSaving(true);
    const payload = { ...form, order: Number(form.order) || 0, requirements: form.requirements.filter((x) => x.trim()) };
    try {
      const data = isNew
        ? await adminFetch('/jobs', { method: 'POST', body: JSON.stringify(payload) })
        : await adminFetch(`/jobs/${initial.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      onSaved(data.job, isNew);
    } catch (e2) {
      if (!onError(e2)) setErr(e2.message || 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col border-l border-hairline bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="text-[1.2rem]">{isNew ? 'New job' : `Edit: ${initial.title}`}</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-[8px] text-muted hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5" data-lenis-prevent>
            {err && (
              <div className="flex items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/[0.06] px-3.5 py-2.5 text-[0.88rem] text-accent">
                <AlertCircle size={15} className="shrink-0" /> {err}
              </div>
            )}
            <div>
              <label className="field-label">Title <span className="text-accent">*</span></label>
              <input value={form.title} onChange={(e) => upd('title', e.target.value)} className="field-input" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Type</label>
                <select value={form.type} onChange={(e) => upd('type', e.target.value)} className="field-input">
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Category</label>
                <select value={form.category} onChange={(e) => upd('category', e.target.value)} className="field-input">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Location</label>
                <input value={form.location} onChange={(e) => upd('location', e.target.value)} className="field-input" />
              </div>
              <div>
                <label className="field-label">Sort order</label>
                <input type="number" value={form.order} onChange={(e) => upd('order', e.target.value)} className="field-input" />
              </div>
            </div>
            <div>
              <label className="field-label">Short description (card)</label>
              <textarea value={form.shortDescription} onChange={(e) => upd('shortDescription', e.target.value)} rows={2} className="field-input" />
            </div>
            <div>
              <label className="field-label">Full description (detail)</label>
              <textarea value={form.fullDescription} onChange={(e) => upd('fullDescription', e.target.value)} rows={5} className="field-input" />
              <p className="mt-1 text-[0.78rem] text-muted">Blank lines separate paragraphs.</p>
            </div>
            <ListEditor label="Requirements" items={form.requirements} onChange={(v) => upd('requirements', v)} placeholder="e.g. Current NSW Security Licence" />
            <label className="flex items-center gap-2.5 pt-1">
              <input type="checkbox" checked={form.active} onChange={(e) => upd('active', e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
              <span className="text-[0.92rem] font-medium">Active (listed on /careers)</span>
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-hairline px-5 py-4">
            <button type="button" onClick={onClose} className="btn btn-ghost !py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary !py-2.5 disabled:opacity-50">
              <Save size={16} /> {saving ? 'Saving…' : 'Save job'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default function AdminJobsPage() {
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
      const data = await adminFetch('/jobs');
      setItems(data.jobs || []);
    } catch (e) {
      if (!handle401(e)) setError(e.message || 'Failed to load jobs');
    } finally { setLoading(false); }
  }, [handle401]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2800); };
  const onSaved = (_j, isNew) => { setEditing(null); flash(isNew ? 'Job created.' : 'Job updated.'); load(); };

  const toggleActive = async (j) => {
    try { await adminFetch(`/jobs/${j.id}/active`, { method: 'PATCH', body: JSON.stringify({ active: !j.active }) }); load(); }
    catch (e) { if (!handle401(e)) setError(e.message); }
  };
  const remove = async (j) => {
    if (!window.confirm(`Delete “${j.title}” permanently?`)) return;
    try { await adminFetch(`/jobs/${j.id}`, { method: 'DELETE' }); flash('Job deleted.'); load(); }
    catch (e) { if (!handle401(e)) setError(e.message); }
  };
  if (!ready) return null;

  return (
    <div className="text-ink">

      <div className="mx-auto w-full max-w-shell px-5 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.6rem]">Jobs / Careers</h1>
            <p className="mt-1 text-[0.95rem] text-muted">Active jobs are listed on the /careers page with an Apply button.</p>
          </div>
          <button onClick={() => setEditing({})} className="btn btn-primary"><Plus size={16} /> New job</button>
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
            {items.map((j) => (
              <div key={j.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-ink">{j.title || '—'}</span>
                    {j.type && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wide text-accent">{j.type}</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wide ${j.active ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-muted/15 text-muted'}`}>{j.active ? 'Active' : 'Hidden'}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 truncate text-[0.82rem] text-muted"><MapPin size={12} /> {j.location} · {j.category}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => toggleActive(j)} title={j.active ? 'Hide' : 'Show'} aria-label={j.active ? 'Hide' : 'Show'} className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-hairline text-muted hover:text-ink">
                    {j.active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => setEditing(j)} title="Edit" aria-label="Edit" className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-hairline text-muted hover:text-ink"><Pencil size={16} /></button>
                  <button onClick={() => remove(j)} title="Delete" aria-label="Delete" className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-hairline text-muted hover:border-accent hover:text-accent"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="px-4 py-14 text-center text-muted">No jobs yet — add one.</div>}
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
