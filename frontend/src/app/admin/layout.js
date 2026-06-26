// Server component so it can export metadata. Keeps the admin area out of search
// indexes (noindex, nofollow). The actual pages are client components.
export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return children;
}
