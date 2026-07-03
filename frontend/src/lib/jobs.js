import { cache } from 'react';

// Server-side reads of the dynamic jobs collection for App Router.
// An empty list is a valid, safe "no current openings" state — so on any
// error we return [] (the careers page shows its fallback CTA), never blank.
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const getJobs = cache(async () => {
  try {
    const res = await fetch(`${API}/api/content/jobs`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    return Array.isArray(data.jobs) ? data.jobs : [];
  } catch {
    return [];
  }
});
