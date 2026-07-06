'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, X, Save, Trash2, Check, AlertCircle, ArrowUp, ArrowDown, Eye, EyeOff, Pencil,
} from 'lucide-react';
import Icon, { ICON_NAMES } from '@/components/Icon';
import ImageField from '@/components/admin/ImageField';
import { adminFetch, getToken } from '@/lib/admin';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const BLANK = {
  title: '', slug: '', icon: 'Shield', badge: '', short: '', intro: '',
  image: '/images/services/', alt: '', active: true, order: 0,
  features: [], overview: [], industries: [],
};

// --- add/remove list editor (features / overview paragraphs / industries) ---
function ListEditor({ label, items, onChange, textarea, placeholder }) {
  const set = (i, v) => onChange(items.map((x, idx) => (idx === i ? v : x)));
  const add = () => onChange([...items, '']);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const Field = textarea ? 'textarea' : 'input';
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="field-label !mb-0">{label}</span>
        <button type="button" onClick={add} className="flex items-center gap-1 text-[0.8rem] font-medium text-accent hover:underline">
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-[0.82rem] text-muted">None yet — add one.</p>}
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <Field
              value={item}
              onChange={(e) => set(i, e.target.value)}
              placeholder={placeholder}
              rows={textarea ? 2 : undefined}
              className="field-input !py-2 text-[0.9rem]"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-hairline text-muted hover:border-accent hover:text-accent"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Editor({ initial, onClose, onSaved, onError }) {
  const isNew = !initial.id;
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setErr('Title is required.');
    if (!SLUG_RE.test(form.slug.trim())) return setErr('Slug must be lowercase letters, numbers and hyphens (e.g. traffic-control).');
    setErr('');
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug.trim().toLowerCase(),
      order: Number(form.order) || 0,
      features: form.features.filter((x) => x.trim()),
      overview: form.overview.filter((x) => x.trim()),
      industries: form.industries.filter((x) => x.trim()),
    };
    try {
      const data = isNew
        ? await adminFetch('/services', { method: 'POST', body: JSON.stringify(payload) })
        : await adminFetch(`/services/${initial.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      onSaved(data.service, isNew);
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
          <h2 className="text-[1.2rem]">{isNew ? 'New service' : `Edit: ${initial.title}`}</h2>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Title <span className="text-accent">*</span></label>
                <input value={form.title} onChange={(e) => upd('title', e.target.value)} className="field-input" />
              </div>
              <div>
                <label className="field-label">Slug <span className="text-accent">*</span></label>
                <input value={form.slug} onChange={(e) => upd('slug', e.target.value)} placeholder="traffic-control" className="field-input" />
                <p className="mt-1 text-[0.78rem] text-muted">URL: /services/{form.slug || '…'}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Icon</label>
                <div className="flex items-center gap-2">
                  <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[10px] border border-hairline">
                    <Icon name={form.icon} size={20} className="text-accent" />
                  </span>
                  <select value={form.icon} onChange={(e) => upd('icon', e.target.value)} className="field-input">
                    {ICON_NAMES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="field-label">Sort order</label>
                <input type="number" value={form.order} onChange={(e) => upd('order', e.target.value)} className="field-input" />
              </div>
            </div>

            <div>
              <label className="field-label">Badge</label>
              <input value={form.badge} onChange={(e) => upd('badge', e.target.value)} placeholder="Licensed · Vetted · Supervised" className="field-input" />
            </div>
            <div>
              <label className="field-label">Short blurb (card)</label>
              <textarea value={form.short} onChange={(e) => upd('short', e.target.value)} rows={2} className="field-input" />
            </div>
            <div>
              <label className="field-label">Intro (service page)</label>
              <textarea value={form.intro} onChange={(e) => upd('intro', e.target.value)} rows={3} className="field-input" />
            </div>

            <ImageField
              label="Image"
              value={form.image}
              onChange={(v) => upd('image', v)}
              hint="Upload/select an image, or point at a bundled /images/services/… path."
            />
            <div>
              <label className="field-label">Image alt text</label>
              <input value={form.alt} onChange={(e) => upd('alt', e.target.value)} className="field-input" />
            </div>

            <ListEditor label="Features (what's included)" items={form.features} onChange={(v) => upd('features', v)} placeholder="e.g. 24/7 manned guarding" />
            <ListEditor label="Overview paragraphs" items={form.overview} onChange={(v) => upd('overview', v)} textarea placeholder="A paragraph of overview copy…" />
            <ListEditor label="Industries we serve" items={form.industries} onChange={(v) => upd('industries', v)} placeholder="e.g. Construction & building sites" />

            <label className="flex items-center gap-2.5 pt-1">
              <input type="checkbox" checked={form.active} onChange={(e) => upd('active', e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
              <span className="text-[0.92rem] font-medium">Active (visible on the public site)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-hairline px-5 py-4">
            <button type="button" onClick={onClose} className="btn btn-ghost !py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary !py-2.5 disabled:opacity-50">
              <Save size={16} /> {saving ? 'Saving…' : 'Save service'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default function AdminServicesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState(null); // service object or {} for new

  useEffect(() => {
    if (!getToken()) {
      router.replace('/admin/login');
      return;
    }
    setReady(true);
  }, [router]);

  const handle401 = useCallback(
    (e) => {
      if (e && e.code === 401) {
        router.replace('/admin/login');
        return true;
      }
      return false;
    },
    [router]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/services');
      setItems(data.services || []);
    } catch (e) {
      if (!handle401(e)) setError(e.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [handle401]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  const onSaved = (_svc, isNew) => {
    setEditing(null);
    flash(isNew ? 'Service created.' : 'Service updated.');
    load();
  };

  const toggleActive = async (svc) => {
    try {
      await adminFetch(`/services/${svc.id}`, { method: 'PUT', body: JSON.stringify({ ...svc, active: !svc.active }) });
      load();
    } catch (e) {
      if (!handle401(e)) setError(e.message);
    }
  };

  const remove = async (svc) => {
    if (!window.confirm(`Delete “${svc.title}” permanently? This removes /services/${svc.slug}.`)) return;
    try {
      await adminFetch(`/services/${svc.id}`, { method: 'DELETE' });
      flash('Service deleted.');
      load();
    } catch (e) {
      if (!handle401(e)) setError(e.message);
    }
  };

  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next); // optimistic
    try {
      await adminFetch('/services/reorder', { method: 'PATCH', body: JSON.stringify({ ids: next.map((s) => s.id) }) });
    } catch (e) {
      if (!handle401(e)) setError(e.message);
      load(); // revert to server truth
    }
  };

  if (!ready) return null;

  return (
    <div className="text-ink">

      <div className="mx-auto w-full max-w-shell px-5 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.6rem]">Services</h1>
            <p className="mt-1 text-[0.95rem] text-muted">
              These drive the homepage cards, the /services page and each /services/[slug] page. Reorder with the arrows.
            </p>
          </div>
          <button onClick={() => setEditing({})} className="btn btn-primary">
            <Plus size={16} /> New service
          </button>
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
            {items.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0">
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="text-muted hover:text-accent disabled:opacity-30">
                    <ArrowUp size={15} />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down" className="text-muted hover:text-accent disabled:opacity-30">
                    <ArrowDown size={15} />
                  </button>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-hairline">
                  <Icon name={s.icon} size={18} className="text-accent" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-ink">{s.title || '—'}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wide ${s.active ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-muted/15 text-muted'}`}>
                      {s.active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <div className="truncate text-[0.82rem] text-muted">/services/{s.slug}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => toggleActive(s)} aria-label={s.active ? 'Hide' : 'Show'} title={s.active ? 'Hide from site' : 'Show on site'} className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-hairline text-muted hover:text-ink">
                    {s.active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => setEditing(s)} aria-label="Edit" title="Edit" className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-hairline text-muted hover:text-ink">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => remove(s)} aria-label="Delete" title="Delete" className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-hairline text-muted hover:border-accent hover:text-accent">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="px-4 py-14 text-center text-muted">No services yet — add one.</div>}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-[10px] border border-hairline bg-panel px-4 py-2.5 text-[0.9rem] font-medium shadow-2xl">
          <Check size={16} className="text-emerald-500" /> {toast}
        </div>
      )}

      {editing && (
        <Editor initial={editing} onClose={() => setEditing(null)} onSaved={onSaved} onError={handle401} />
      )}
    </div>
  );
}
