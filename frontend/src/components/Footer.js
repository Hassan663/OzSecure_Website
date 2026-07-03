'use client';
import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useSiteSettings } from './SettingsProvider';
import Logo from './Logo';

const serviceLinks = [
  { label: 'Security', href: '/services/security' },
  { label: 'Traffic Control', href: '/services/traffic' },
  { label: 'Cleaning', href: '/services/cleaning' },
  { label: 'Labour Hire', href: '/services/labour' },
];
const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Compliance', href: '/about#compliance' },
  { label: 'Contact', href: '/contact' },
  { label: 'Get a Quote', href: '/contact' },
];

function Col({ title, links }) {
  return (
    <div>
      <h5 className="mb-4 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted">{title}</h5>
      <div className="flex flex-col gap-2.5">
        {links.map((l) => (
          <Link key={l.label} href={l.href} className="w-fit text-[0.96rem] text-muted transition-colors hover:text-ink">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  const site = useSiteSettings();
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="shell grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div>
          <Logo className="h-14 w-auto sm:h-16" />
          <p className="mt-4 text-[0.95rem] font-semibold text-accent">{site.tagline}</p>
          <p className="mt-3 max-w-[34ch] text-[0.96rem] leading-relaxed text-muted">
            One accredited provider for security, traffic control, commercial cleaning and labour hire across {site.coverage}.
          </p>
        </div>

        <Col title="Services" links={serviceLinks} />
        <Col title="Company" links={companyLinks} />

        <div>
          <h5 className="mb-4 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted">Get in touch</h5>
          <div className="flex flex-col gap-3.5 text-[0.96rem]">
            <a href={`tel:${site.phonePrimaryTel}`} className="flex items-start gap-3 text-muted transition-colors hover:text-ink">
              <Phone size={16} className="mt-0.5 shrink-0 text-accent" />
              {site.phonePrimary}
            </a>
            <a href={`mailto:${site.email}`} className="flex items-start gap-3 break-words text-muted transition-colors hover:text-ink">
              <Mail size={16} className="mt-0.5 shrink-0 text-accent" />
              {site.email}
            </a>
            <div className="flex items-start gap-3 text-muted">
              <MapPin size={16} className="mt-0.5 shrink-0 text-accent" />
              <span>
                {site.address.line1},<br />
                {site.address.line2}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="shell flex flex-wrap justify-between gap-3 border-t border-hairline py-6 text-[0.82rem] text-muted">
        <span>© {new Date().getFullYear()} {site.name} · {site.entity}</span>
        <span>NSW Master Licence No. {site.mln} · ABN {site.abn}</span>
      </div>
    </footer>
  );
}
