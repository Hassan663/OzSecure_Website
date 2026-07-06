'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Inbox, Home, LayoutGrid, Briefcase, Quote, Image as ImageIcon, Settings, LogOut, Menu, X, User } from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { getToken, clearToken } from '@/lib/admin';

// Single source of truth for the admin sidebar sections.
const NAV = [
  { href: '/admin', label: 'Queries', icon: Inbox },
  { href: '/admin/homepage', label: 'Homepage', icon: Home },
  { href: '/admin/services', label: 'Services', icon: LayoutGrid },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/testimonials', label: 'Testimonials', icon: Quote },
  { href: '/admin/media', label: 'Media', icon: ImageIcon },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
];

const isActive = (href, pathname) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

function SidebarContent({ pathname, onNav, onLogout }) {
  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Link href="/admin" onClick={onNav} aria-label="OzSecure admin home">
          <Logo reverse className="h-8 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNav}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[44px] items-center gap-3 rounded-[10px] px-3 py-2.5 text-[0.9rem] font-medium transition-colors ${
                active ? 'bg-accent text-white shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2.5 px-2 py-1.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
            <User size={16} className="text-white" />
          </span>
          <div className="min-w-0">
            <div className="text-[0.85rem] font-semibold text-white">Administrator</div>
            <div className="truncate text-[0.72rem] text-white/50">OzSecure admin</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex min-h-[44px] w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[0.9rem] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={17} className="shrink-0" /> Log out
        </button>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const isLogin = pathname === '/admin/login';

  // Central auth guard for every admin route except the login page.
  useEffect(() => {
    if (isLogin) return;
    if (!getToken()) {
      router.replace('/admin/login');
      return;
    }
    setReady(true);
  }, [isLogin, pathname, router]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Login is a standalone, full-screen, pre-auth page — no sidebar.
  if (isLogin) return children;

  if (!ready) return <div className="min-h-screen bg-surface" />;

  const logout = () => {
    clearToken();
    router.replace('/admin/login');
  };
  const title = NAV.find((n) => isActive(n.href, pathname))?.label || 'Admin';

  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] lg:block">
        <SidebarContent pathname={pathname} onNav={() => {}} onLogout={logout} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="admin-drawer absolute inset-y-0 left-0 w-[260px] max-w-[82%] shadow-2xl">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute right-2 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-[8px] text-white/80 hover:bg-white/10"
            >
              <X size={20} />
            </button>
            <SidebarContent pathname={pathname} onNav={() => setDrawerOpen(false)} onLogout={logout} />
          </div>
        </div>
      )}

      {/* Content column */}
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-hairline bg-bg/85 px-4 backdrop-blur-md lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-hairline text-ink lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-[1.05rem] font-semibold text-heading">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={logout}
              aria-label="Log out"
              className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-hairline text-muted hover:text-ink lg:hidden"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
