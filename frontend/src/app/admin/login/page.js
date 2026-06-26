'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { login, getToken } from '@/lib/admin';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');

  // Already authenticated → straight to the dashboard.
  useEffect(() => {
    if (getToken()) router.replace('/admin');
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await login(password);
      router.replace('/admin');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
        <Logo className="h-9 w-auto" />
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[400px] rounded-[14px] border border-hairline bg-panel p-8 shadow-soft">
          <div className="mb-6 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-accent/10 text-accent">
              <Lock size={18} />
            </span>
            <div>
              <h1 className="text-[1.35rem] leading-tight">Admin sign in</h1>
              <p className="text-[0.85rem] text-muted">OzSecure submissions panel</p>
            </div>
          </div>

          {status === 'error' && (
            <div className="mb-4 rounded-[10px] border border-accent/30 bg-accent/[0.06] px-4 py-3 text-[0.9rem] text-ink">
              {error}
            </div>
          )}

          <form onSubmit={submit} noValidate>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="field-input"
              required
              autoFocus
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn btn-primary mt-5 w-full justify-center disabled:opacity-70"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
