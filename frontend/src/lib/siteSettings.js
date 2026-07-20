import { cache } from 'react';
import { SETTINGS_DEFAULTS, mergeSettings } from '@/data/siteSettings';

// Server-side fetch of dynamic site settings for App Router (server components).
// - Cached per-request via React `cache` (dedupes across components in a render).
// - `no-store` + a timeout: never cached, so admin edits show on the next load;
// - Any failure (backend down, e.g. during `next build`) falls back to the
//   bundled defaults, so prerender + the live site are always safe.
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const getSiteSettings = cache(async () => {
  try {
    const res = await fetch(`${API}/api/content/site-settings`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return SETTINGS_DEFAULTS;
    const data = await res.json();
    return mergeSettings(data.settings);
  } catch {
    return SETTINGS_DEFAULTS;
  }
});
