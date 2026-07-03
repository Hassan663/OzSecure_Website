'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Save, Check, AlertCircle, Plus, X } from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import Icon, { ICON_NAMES } from '@/components/Icon';
import AdminTabs from '@/components/admin/AdminTabs';
import { adminFetch, getToken, clearToken } from '@/lib/admin';

// Editor for a list of objects (trust badges, stats, why-points, process steps).
function ObjectList({ label, items, onChange, fields, blank }) {
  const set = (i, key, val) => onChange(items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));
  const add = () => onChange([...items, { ...blank }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="field-label !mb-0">{label}</span>
        <button type="button" onClick={add} className="flex items-center gap-1 text-[0.8rem] font-medium text-accent hover:underline">
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-[0.82rem] text-muted">None yet — add one.</p>}
        {items.map((it, i) => (
          <div key={i} className="rounded-[10px] border border-hairline bg-surface/50 p-3">
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                    {f.type === 'icon' ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[8px] border border-hairline">
                          <Icon name={it[f.key]} size={16} className="text-accent" />
                        </span>
                        <select value={it[f.key] || ''} onChange={(e) => set(i, f.key, e.target.value)} className="field-input !py-1.5 text-[0.88rem]">
                          {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    ) : f.type === 'textarea' ? (
                      <textarea value={it[f.key] || ''} onChange={(e) => set(i, f.key, e.target.value)} placeholder={f.placeholder} rows={2} className="field-input !py-1.5 text-[0.88rem]" />
                    ) : (
                      <input value={it[f.key] ?? ''} onChange={(e) => set(i, f.key, e.target.value)} placeholder={f.placeholder} className="field-input !py-1.5 text-[0.88rem]" />
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => remove(i)} aria-label="Remove" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-hairline text-muted hover:border-accent hover:text-accent">
                <X size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Text({ label, value, onChange, textarea, hint }) {
  const F = textarea ? 'textarea' : 'input';
  return (
    <div>
      <label className="field-label">{label}</label>
      <F value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={textarea ? 3 : undefined} className="field-input" />
      {hint && <p className="mt-1 text-[0.78rem] text-muted">{hint}</p>}
    </div>
  );
}

export default function AdminHomepagePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

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
      const data = await adminFetch('/homepage');
      setForm(data.homepage);
    } catch (e) {
      if (!handle401(e)) setError(e.message || 'Failed to load');
    } finally { setLoading(false); }
  }, [handle401]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const upd = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.heroHeadline?.trim()) { setError('Hero headline is required.'); return; }
    setError(''); setSaving(true);
    try {
      const data = await adminFetch('/homepage', { method: 'PUT', body: JSON.stringify(form) });
      setForm(data.homepage);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e2) {
      if (!handle401(e2)) setError(e2.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const logout = () => { clearToken(); router.replace('/admin/login'); };

  if (!ready) return <div className="min-h-screen bg-bg" />;

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-hairline bg-bg/90 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-auto" />
          <AdminTabs />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={logout} className="flex items-center gap-2 rounded-[10px] border border-hairline px-3.5 py-2.5 text-[0.85rem] font-medium text-muted hover:text-ink">
            <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[860px] px-5 py-8">
        <div className="mb-6">
          <h1 className="text-[1.6rem]">Homepage</h1>
          <p className="mt-1 text-[0.95rem] text-muted">Edit the hero, trust badges, stats, why-us, process steps and the bottom CTA band.</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/[0.06] px-4 py-3 text-[0.9rem] text-accent">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {loading || !form ? (
          <div className="rounded-[12px] border border-hairline bg-panel p-8 text-center text-muted">Loading…</div>
        ) : (
          <form onSubmit={save} className="space-y-6">
            <fieldset className="space-y-4 rounded-[12px] border border-hairline bg-panel p-5 sm:p-6">
              <legend className="px-1 text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-muted">Hero</legend>
              <Text label="Eyebrow" value={form.heroEyebrow} onChange={(v) => upd('heroEyebrow', v)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Headline" value={form.heroHeadline} onChange={(v) => upd('heroHeadline', v)} />
                <Text label="Accent word" value={form.heroHeadlineAccent} onChange={(v) => upd('heroHeadlineAccent', v)} hint="A word in the headline shown in crimson." />
              </div>
              <Text label="Subtext" value={form.heroSubtext} onChange={(v) => upd('heroSubtext', v)} textarea />
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Primary button label" value={form.heroCtaPrimaryLabel} onChange={(v) => upd('heroCtaPrimaryLabel', v)} />
                <Text label="Secondary button label" value={form.heroCtaSecondaryLabel} onChange={(v) => upd('heroCtaSecondaryLabel', v)} />
              </div>
              <ObjectList
                label="Trust badges"
                items={form.trust}
                onChange={(v) => upd('trust', v)}
                blank={{ icon: 'ShieldCheck', label: '' }}
                fields={[{ key: 'icon', type: 'icon' }, { key: 'label', placeholder: 'Fully Licensed' }]}
              />
            </fieldset>

            <fieldset className="space-y-4 rounded-[12px] border border-hairline bg-panel p-5 sm:p-6">
              <legend className="px-1 text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-muted">Stats</legend>
              <ObjectList
                label="Stat counters"
                items={form.stats}
                onChange={(v) => upd('stats', v)}
                blank={{ value: 0, suffix: '', label: '' }}
                fields={[
                  { key: 'value', placeholder: 'Number, e.g. 350' },
                  { key: 'suffix', placeholder: 'Suffix, e.g. +' },
                  { key: 'label', placeholder: 'Label', full: true },
                ]}
              />
            </fieldset>

            <fieldset className="space-y-4 rounded-[12px] border border-hairline bg-panel p-5 sm:p-6">
              <legend className="px-1 text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-muted">Why us</legend>
              <Text label="Heading" value={form.whyHeading} onChange={(v) => upd('whyHeading', v)} />
              <Text label="Intro" value={form.whyIntro} onChange={(v) => upd('whyIntro', v)} textarea />
              <ObjectList
                label="Points"
                items={form.whyPoints}
                onChange={(v) => upd('whyPoints', v)}
                blank={{ icon: 'ShieldCheck', title: '', body: '' }}
                fields={[
                  { key: 'icon', type: 'icon' },
                  { key: 'title', placeholder: 'Title' },
                  { key: 'body', type: 'textarea', placeholder: 'Body', full: true },
                ]}
              />
            </fieldset>

            <fieldset className="space-y-4 rounded-[12px] border border-hairline bg-panel p-5 sm:p-6">
              <legend className="px-1 text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-muted">Process steps</legend>
              <ObjectList
                label="Steps"
                items={form.processSteps}
                onChange={(v) => upd('processSteps', v)}
                blank={{ title: '', body: '' }}
                fields={[
                  { key: 'title', placeholder: 'Step title' },
                  { key: 'body', type: 'textarea', placeholder: 'Step description', full: true },
                ]}
              />
            </fieldset>

            <fieldset className="space-y-4 rounded-[12px] border border-hairline bg-panel p-5 sm:p-6">
              <legend className="px-1 text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-muted">Bottom CTA band</legend>
              <Text label="Heading" value={form.ctaHeading} onChange={(v) => upd('ctaHeading', v)} />
              <Text label="Subtext" value={form.ctaSubtext} onChange={(v) => upd('ctaSubtext', v)} textarea />
            </fieldset>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-hairline bg-bg/95 py-4 backdrop-blur-md">
              {saved && (
                <span className="flex items-center gap-1.5 text-[0.9rem] font-medium text-emerald-600 dark:text-emerald-400">
                  <Check size={16} /> Saved
                </span>
              )}
              <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
                <Save size={16} /> {saving ? 'Saving…' : 'Save homepage'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
