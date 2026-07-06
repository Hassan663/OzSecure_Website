'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MediaManager from '@/components/admin/MediaManager';
import { getToken } from '@/lib/admin';

export default function AdminMediaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.replace('/admin/login'); return; }
    setReady(true);
  }, [router]);

  const onAuthError = useCallback(() => router.replace('/admin/login'), [router]);
  if (!ready) return null;

  return (
    <div className="text-ink">

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
