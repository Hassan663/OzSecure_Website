import { cache } from 'react';
import { homepageDefaults } from '@/data/homepage';

// Server-side read of the editable homepage content. Cached + revalidated;
// falls back to the bundled defaults on any error (never blank).
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

function merge(stored) {
  if (!stored || typeof stored !== 'object') return homepageDefaults;
  const m = { ...homepageDefaults, ...stored };
  for (const key of ['trust', 'stats', 'whyPoints', 'processSteps']) {
    if (!Array.isArray(stored[key]) || stored[key].length === 0) m[key] = homepageDefaults[key];
  }
  return m;
}

export const getHomepage = cache(async () => {
  try {
    const res = await fetch(`${API}/api/content/homepage`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    return merge(data.homepage);
  } catch {
    return homepageDefaults;
  }
});
