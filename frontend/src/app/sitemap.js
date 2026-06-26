import { services } from '@/data/services';

const BASE = 'https://ozsecuresecurity.com.au';

// Public routes only — /admin is intentionally excluded (and noindexed).
export default function sitemap() {
  const routes = ['', '/services', '/about', '/contact'];
  const servicePages = services.map((s) => `/services/${s.id}`);
  return [...routes, ...servicePages].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));
}
