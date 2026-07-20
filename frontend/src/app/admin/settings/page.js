'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Check, AlertCircle } from 'lucide-react';
import { adminFetch, getToken } from '@/lib/admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Field groups drive the form layout — add a field here and it just renders.
const GROUPS = [
  {
    title: 'Company',
    fields: [
      { key: 'name', label: 'Company name', required: true },
      { key: 'tagline', label: 'Tagline' },
      { key: 'serviceLine', label: 'Service line' },
      { key: 'entity', label: 'Legal entity' },
      { key: 'yearsExperience', label: 'Years experience' },
    ],
  },
  {
    title: 'Contact',
    fields: [
      { key: 'email', label: 'Email', required: true, type: 'email' },
      { key: 'phonePrimary', label: 'Phone (display)', required: true },
      { key: 'phonePrimaryTel', label: 'Phone (dial / tel:)', required: true, hint: 'e.g. 1300101765' },
      { key: 'coverage', label: 'Coverage area' },
      { key: 'hours', label: 'Operating hours' },
    ],
  },
  {
    title: 'Head office',
    fields: [
      { key: 'address.line1', label: 'Address line 1' },
      { key: 'address.line2', label: 'Address line 2' },
    ],
  },
  {
    title: 'Compliance',
    fields: [
      { key: 'mln', label: 'Master Licence No.' },
      { key: 'abn', label: 'ABN' },
    ],
  },
];

const getVal = (obj, key) =>
  key.includes('.') ? key.split('.').reduce((o, k) => (o ? o[k] : ''), obj) ?? '' : obj[key] ?? '';

function setVal(obj, key, value) {
  if (!key.includes('.')) return { ...obj, [key]: value };
  const [a, b] = key.split('.');
  return { ...obj, [a]: { ...(obj[a] || {}), [b]: value } };
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

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
      const data = await adminFetch('/site-settings');
      setForm(data.settings);
    } catch (e) {
      if (!handle401(e)) setError(e.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [handle401]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const update = (key, value) => {
    setForm((f) => setVal(f, key, value));
    setSaved(false);
  };

  const validate = () => {
    if (!form.name?.trim()) return 'Company name is required.';
    if (!EMAIL_RE.test((form.email || '').trim())) return 'A valid email is required.';
    if (!form.phonePrimary?.trim()) return 'Phone number is required.';
    if (!form.phonePrimaryTel?.trim()) return 'Dial number (tel:) is required.';
    return '';
  };

  const save = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await adminFetch('/site-settings', { method: 'PUT', body: JSON.stringify(form) });
      setForm(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e2) {
      if (!handle401(e2)) setError(e2.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="text-ink">
      <div className="mx-auto w-full max-w-[860px] px-5 py-8">
        <div className="mb-6">
          <h1 className="text-[1.6rem]">Site Settings</h1>
          <p className="mt-1 text-[0.95rem] text-muted">
            These values feed the public website (header, footer, contact page and more). Changes apply on the next page load.
          </p>
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
            {GROUPS.map((group) => (
              <fieldset key={group.title} className="rounded-[12px] border border-hairline bg-panel p-5 sm:p-6">
                <legend className="px-1 text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-muted">
                  {group.title}
                </legend>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {group.fields.map((f) => (
                    <div key={f.key} className={f.key === 'entity' || f.key === 'tagline' ? 'sm:col-span-2' : ''}>
                      <label htmlFor={f.key} className="field-label">
                        {f.label} {f.required && <span className="text-accent">*</span>}
                      </label>
                      <input
                        id={f.key}
                        type={f.type || 'text'}
                        value={getVal(form, f.key)}
                        onChange={(e) => update(f.key, e.target.value)}
                        className="field-input"
                      />
                      {f.hint && <p className="mt-1 text-[0.78rem] text-muted">{f.hint}</p>}
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-hairline bg-bg/95 py-4 backdrop-blur-md">
              {saved && (
                <span className="flex items-center gap-1.5 text-[0.9rem] font-medium text-emerald-600 dark:text-emerald-400">
                  <Check size={16} /> Saved
                </span>
              )}
              <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
                <Save size={16} /> {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
