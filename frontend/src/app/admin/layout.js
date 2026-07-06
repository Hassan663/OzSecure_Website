// Server component so it can export metadata. Keeps the admin area out of search
// indexes (noindex, nofollow). AdminShell (client) provides the sidebar dashboard
// chrome + auth guard for every /admin route except /admin/login.
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
