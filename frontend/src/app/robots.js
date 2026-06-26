const BASE = 'https://ozsecuresecurity.com.au';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/admin', // keep the admin panel out of crawlers
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
