import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Reveal from './Reveal';
import { getSiteSettings } from '@/lib/siteSettings';

export default async function CTA({ heading, sub }) {
  const site = await getSiteSettings();
  return (
    <section className="border-t border-hairline bg-surface">
      <div className="section shell">
        <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
          <div>
            <span className="eyebrow">Get started</span>
            <h2 className="mt-4 max-w-[20ch] text-[clamp(1.9rem,4vw,3rem)]">{heading}</h2>
            <p className="mt-3 max-w-[48ch] text-[1.05rem] leading-relaxed text-muted">{sub}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-primary">
              Request a Quote <ArrowRight size={16} />
            </Link>
            <a href={`tel:${site.phonePrimaryTel}`} className="btn btn-outline">
              Call {site.phonePrimary}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
