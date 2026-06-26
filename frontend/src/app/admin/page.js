'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut, RefreshCw, Search, X, Archive, Check, Trash2, Mail, Phone, MapPin, Building2, ChevronLeft, ChevronRight, Inbox,
} from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { adminFetch, getToken, clearToken } from '@/lib/admin';

const LIMIT = 20;
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'read', label: 'Read' },
  { key: 'archived', label: 'Archived' },
];

const STATUS_STYLES = {
  new: 'bg-accent/12 text-accent',
  read: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  archived: 'bg-muted/15 text-muted',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold capitalize ${STATUS_STYLES[status] || ''}`}>
      {status}
    </span>
  );
}

function SourceBadge({ source }) {
  const isBot = source === 'chatbot';
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wide ${
        isBot ? 'bg-accent/12 text-accent' : 'bg-muted/12 text-muted'
      }`}
    >
      {isBot ? 'Chatbot' : 'Website'}
    </span>
  );
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState({ new: 0, read: 0, archived: 0, total: 0 });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth guard
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
      const [q, s] = await Promise.all([
        adminFetch(`/queries?status=${statusFilter}&page=${page}&limit=${LIMIT}`),
        adminFetch('/stats'),
      ]);
      setItems(q.items || []);
      setTotal(q.total || 0);
      setPages(q.pages || 1);
      setStats(s.stats || { new: 0, read: 0, archived: 0, total: 0 });
    } catch (e) {
      if (!handle401(e)) setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, handle401]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const logout = () => {
    clearToken();
    router.replace('/admin/login');
  };

  const changeStatus = async (id, status) => {
    try {
      const data = await adminFetch(`/queries/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setSelected((s) => (s && s.id === id ? data.query : s));
      load();
    } catch (e) {
      if (!handle401(e)) setError(e.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this submission permanently?')) return;
    try {
      await adminFetch(`/queries/${id}`, { method: 'DELETE' });
      setSelected(null);
      load();
    } catch (e) {
      if (!handle401(e)) setError(e.message);
    }
  };

  // Client-side search over the loaded page (by name / email).
  const term = search.trim().toLowerCase();
  const visible = term
    ? items.filter(
        (q) => (q.name || '').toLowerCase().includes(term) || (q.email || '').toLowerCase().includes(term)
      )
    : items;

  if (!ready) return <div className="min-h-screen bg-bg" />;

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-hairline bg-bg/90 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-auto" />
          <span className="hidden text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-muted sm:inline">
            Submissions
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-hairline text-muted hover:text-ink" aria-label="Refresh">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
          <ThemeToggle />
          <button onClick={logout} className="flex items-center gap-2 rounded-[10px] border border-hairline px-3.5 py-2.5 text-[0.85rem] font-medium text-muted hover:text-ink">
            <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-shell px-5 py-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'New', value: stats.new },
            { label: 'Read', value: stats.read },
            { label: 'Archived', value: stats.archived },
            { label: 'Total', value: stats.total },
          ].map((c) => (
            <div key={c.label} className="rounded-[12px] border border-hairline bg-panel p-5">
              <div className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-muted">{c.label}</div>
              <div className="mt-1 font-display text-[2rem] font-bold leading-none text-heading">{c.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setStatusFilter(f.key);
                  setPage(1);
                }}
                className={`rounded-[8px] px-3.5 py-2 text-[0.85rem] font-medium transition-colors ${
                  statusFilter === f.key ? 'bg-accent text-white' : 'border border-hairline text-muted hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="field-input !py-2 !pl-9 text-[0.9rem] sm:w-[280px]"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-[10px] border border-accent/30 bg-accent/[0.06] px-4 py-3 text-[0.9rem]">{error}</div>
        )}

        {/* Table */}
        <div className="mt-5 overflow-hidden rounded-[12px] border border-hairline bg-panel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[0.92rem]">
              <thead>
                <tr className="border-b border-hairline text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => setSelected(q)}
                    className="cursor-pointer border-b border-hairline last:border-0 transition-colors hover:bg-surface"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(q.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      <span className="flex items-center gap-2">
                        {q.name || '—'}
                        <SourceBadge source={q.source} />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{q.company || '—'}</td>
                    <td className="px-4 py-3 text-muted">{q.service || '—'}</td>
                    <td className="px-4 py-3 text-muted">{q.email || q.phone || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                  </tr>
                ))}
                {!loading && visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center text-muted">
                      <Inbox size={26} className="mx-auto mb-2 opacity-60" />
                      No submissions{term ? ' match your search' : statusFilter !== 'all' ? ` with status “${statusFilter}”` : ' yet'}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-[0.85rem] text-muted">
          <span>
            {total} total{term ? ` · ${visible.length} shown` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-hairline disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {page} of {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-hairline disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && <Drawer query={selected} onClose={() => setSelected(null)} onStatus={changeStatus} onDelete={remove} />}
    </div>
  );
}

function Row({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-3 text-[0.95rem]">
      <Icon size={16} className="mt-0.5 shrink-0 text-accent" />
      <span className="break-words text-ink">{children}</span>
    </div>
  );
}

function Drawer({ query, onClose, onStatus, onDelete }) {
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-hairline bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[1.2rem]">{query.name || 'Submission'}</h2>
            <StatusBadge status={query.status} />
            <SourceBadge source={query.source} />
          </div>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-[8px] text-muted hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5" data-lenis-prevent>
          <div className="text-[0.78rem] uppercase tracking-[0.08em] text-muted">{fmtDate(query.createdAt)}</div>
          <div className="mt-4 grid gap-3">
            <Row icon={Building2}>{query.company}</Row>
            <Row icon={Mail}>
              <a href={`mailto:${query.email}`} className="hover:text-accent">{query.email}</a>
            </Row>
            <Row icon={Phone}>{query.phone}</Row>
            <Row icon={MapPin}>{query.location}</Row>
            {query.service && (
              <div className="text-[0.95rem]">
                <span className="text-muted">Service: </span>
                <span className="font-medium text-ink">{query.service}</span>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-[10px] border border-hairline bg-surface p-4">
            <div className="mb-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-muted">Message</div>
            <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink">{query.message || '—'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-hairline px-5 py-4">
          <button onClick={() => onStatus(query.id, 'read')} disabled={query.status === 'read'} className="btn btn-ghost flex-1 justify-center !py-2.5 text-[0.82rem] disabled:opacity-40">
            <Check size={15} /> Mark read
          </button>
          <button onClick={() => onStatus(query.id, 'archived')} disabled={query.status === 'archived'} className="btn btn-ghost flex-1 justify-center !py-2.5 text-[0.82rem] disabled:opacity-40">
            <Archive size={15} /> Archive
          </button>
          <button onClick={() => onDelete(query.id)} className="btn flex-1 justify-center border border-accent/40 !py-2.5 text-[0.82rem] text-accent hover:bg-accent/[0.06]">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </aside>
    </div>
  );
}
