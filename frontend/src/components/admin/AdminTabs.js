'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, Settings, LayoutGrid, Briefcase, Quote, Home, Image } from 'lucide-react';

const TABS = [
  { href: '/admin', label: 'Submissions', icon: Inbox },
  { href: '/admin/homepage', label: 'Homepage', icon: Home },
  { href: '/admin/services', label: 'Services', icon: LayoutGrid },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/testimonials', label: 'Testimonials', icon: Quote },
  { href: '/admin/media', label: 'Media', icon: Image },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
];

// Shared admin section tabs (Submissions / Site Settings).
export default function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-2 rounded-[10px] px-3 py-2 text-[0.85rem] font-medium transition-colors ${
              active ? 'bg-accent/12 text-accent' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
