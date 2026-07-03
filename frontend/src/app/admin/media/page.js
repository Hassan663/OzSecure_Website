'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import AdminTabs from '@/components/admin/AdminTabs';
import MediaManager from '@/components/admin/MediaManager';
import { getToken, clearToken } from '@/lib/admin';

export default function AdminMediaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.replace('/admin/login'); return; }
    setReady(true);
  }, [router]);

  const onAuthError = useCallback(() => router.replace('/admin/login'), [router]);
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

      <div className="mx-auto w-full max-w-shell px-5 py-8">
        <div className="mb-6">
          <h1 className="text-[1.6rem]">Media</h1>
          <p className="mt-1 text-[0.95rem] text-muted">
            Upload images here, then select them from any image field (e.g. a Service image). Copy a path to reuse it.
          </p>
        </div>
        <MediaManager onAuthError={onAuthError} />
      </div>
    </div>
  );
}
