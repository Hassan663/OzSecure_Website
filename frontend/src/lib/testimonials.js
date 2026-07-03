import { cache } from 'react';
import { testimonials as fallback } from '@/data/testimonials';

// Server-side reads of the dynamic testimonials collection for App Router.
// Falls back to the bundled testimonial(s) on error or empty — never blank.
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const getTestimonials = cache(async () => {
  try {
    const res = await fetch(`${API}/api/content/testimonials`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    const list = Array.isArray(data.testimonials) ? data.testimonials : [];
    return list.length ? list : fallback;
  } catch {
    return fallback;
  }
});
