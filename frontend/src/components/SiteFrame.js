'use client';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

/**
 * Renders the public chrome (Header/Footer) for marketing pages, but NOT on
 * /admin routes — the admin panel has its own minimal chrome.
 */
export default function SiteFrame({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname && pathname.startsWith('/admin');

  if (isAdmin) return <main>{children}</main>;

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
