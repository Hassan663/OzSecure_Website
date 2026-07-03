import { cache } from 'react';
import { services as defaultServices } from '@/data/services';

// Server-side reads of the dynamic services collection for App Router.
// Cached per-request + short ISR revalidate; always falls back to the bundled
// data/services.js so the site never renders blank (even during `next build`
// with the backend down). The bundled defaults use `id` as the slug, so we
// normalise them to the dynamic shape (slug/order/active) for a uniform API.
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

function normalizeDefault(s, i) {
  return { ...s, slug: s.slug || s.id, order: s.order ?? i, active: s.active !== false };
}
const fallbackList = () => defaultServices.map(normalizeDefault);

export const getServices = cache(async () => {
  try {
    const res = await fetch(`${API}/api/content/services`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    const list = Array.isArray(data.services) ? data.services : [];
    return list.length ? list : fallbackList();
  } catch {
    return fallbackList();
  }
});

// Single service by slug. Returns null for genuinely-missing/inactive slugs
// (→ notFound()), but on a network error falls back to bundled defaults.
export const getServiceBySlug = cache(async (slug) => {
  try {
    const res = await fetch(`${API}/api/content/services/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    return data.service || null;
  } catch {
    const d = defaultServices.find((s) => (s.slug || s.id) === slug);
    return d ? normalizeDefault(d, 0) : null;
  }
});
