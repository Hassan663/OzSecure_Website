'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Menu, X, ArrowRight } from 'lucide-react';
import { nav, site } from '@/data/site';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-bg/85 backdrop-blur-md">
      <nav className="shell flex h-[68px] items-center justify-between gap-4 sm:h-[84px] sm:gap-6">
        <Link href="/" className="flex items-center" aria-label="OzSecure Services home">
          <Logo className="h-11 w-auto sm:h-16" priority />
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative py-1.5 text-[0.95rem] font-medium text-muted transition-colors hover:text-ink"
            >
              <span className={isActive(item.href) ? 'text-ink' : ''}>{item.label}</span>
              <span
                className={`absolute -bottom-0.5 left-0 h-[2px] bg-accent transition-all duration-200 ${
                  isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`tel:${site.phonePrimaryTel}`}
            className="mr-1 flex items-center gap-2 text-[0.92rem] font-medium text-muted transition-colors hover:text-ink"
          >
            <Phone size={15} className="text-accent" />
            {site.phonePrimary}
          </a>
          <ThemeToggle />
          <Link href="/contact" className="btn btn-primary !py-2.5 !px-5 text-[0.88rem]">
            Get a Quote <ArrowRight size={15} />
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-hairline text-ink"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="menu-in border-t border-hairline bg-bg md:hidden">
          <div className="shell flex flex-col py-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`border-b border-hairline py-3.5 text-[1rem] font-medium ${
                  isActive(item.href) ? 'text-accent' : 'text-ink'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/contact" onClick={() => setOpen(false)} className="btn btn-primary mt-4 justify-center">
              Get a Quote <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
