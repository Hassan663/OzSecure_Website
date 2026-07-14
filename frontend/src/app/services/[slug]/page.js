import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowRight } from 'lucide-react';
import PageHero from '@/components/PageHero';
import AnimateIn from '@/components/AnimateIn';
import Parallax from '@/components/Parallax';
import Icon from '@/components/Icon';
import CTA from '@/components/CTA';
import { getServices, getServiceBySlug } from '@/lib/services';
import { resolveImageSrc } from '@/lib/media';

// Prerender the known slugs at build; allow slugs added later to resolve at
// runtime (ISR) instead of 404-ing.
export const dynamicParams = true;

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const service = await getServiceBySlug(params.slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.short,
  };
}

export default async function ServicePage({ params }) {
  const service = await getServiceBySlug(params.slug);
  if (!service) notFound();

  const all = await getServices();
  const others = all.filter((s) => s.slug !== service.slug);
  const lower = service.title.toLowerCase();

  return (
    <>
      <PageHero
        trail={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: service.title },
        ]}
        title={service.title}
        intro={service.intro}
      />

      {/* OVERVIEW */}
      <section className="section">
        <div className="shell grid items-center gap-10 lg:grid-cols-2 lg:gap-[60px]">
          <AnimateIn variant="left">
            <span className="eyebrow">Overview</span>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)]">What we deliver</h2>
            {service.overview.map((p, i) => (
              <p key={i} className={`text-[1.05rem] leading-relaxed text-muted ${i === 0 ? 'mb-4 mt-5' : ''}`}>
                {p}
              </p>
            ))}
          </AnimateIn>
          <AnimateIn variant="right" delay={0.1}>
            <div className="relative flex min-h-[400px] items-end overflow-hidden rounded-[14px] border border-hairline bg-gradient-to-br from-navy to-navy-deep p-8">
              {service.image && (
                <Parallax>
                  <Image
                    src={resolveImageSrc(service.image)}
                    alt={service.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </Parallax>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent" />
              <div className="absolute left-7 top-7 flex h-14 w-14 items-center justify-center rounded-[10px] border border-white/15 bg-navy/55 backdrop-blur-sm">
                <Icon name={service.icon} size={28} className="text-white" strokeWidth={1.8} />
              </div>
              <span className="relative z-10 text-[0.85rem] font-semibold uppercase tracking-[0.1em] text-white">
                {service.badge}
              </span>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="section border-y border-hairline bg-surface">
        <div className="shell">
          <AnimateIn className="mb-10 max-w-[680px]">
            <span className="eyebrow">What&rsquo;s included</span>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)]">Everything in our {lower} service.</h2>
          </AnimateIn>
          <AnimateIn as="div" stagger={0.06} className="grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {service.features.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-[1.02rem] text-ink">
                <Check size={18} className="mt-1 shrink-0 text-accent" />
                {f}
              </div>
            ))}
          </AnimateIn>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="section">
        <div className="shell">
          <AnimateIn className="mb-10 max-w-[680px]">
            <span className="eyebrow">Industries we serve</span>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)]">Where our {lower} crews work.</h2>
          </AnimateIn>
          <AnimateIn as="div" variant="fade" stagger={0.07} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {service.industries.map((ind) => (
              <div key={ind} className="flex items-center gap-3.5 rounded-[12px] border border-hairline bg-panel p-5 transition-[transform,box-shadow,border-color] duration-200 will-change-transform hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-soft">
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span className="text-[1.02rem] font-medium text-ink">{ind}</span>
              </div>
            ))}
          </AnimateIn>
        </div>
      </section>

      {/* OTHER SERVICES */}
      <section className="section border-t border-hairline bg-surface">
        <div className="shell">
          <AnimateIn className="mb-9 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="eyebrow">More from OzSecure</span>
              <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)]">Our other services</h2>
            </div>
            <Link href="/services" className="btn btn-outline hidden sm:inline-flex">
              All services <ArrowRight size={16} />
            </Link>
          </AnimateIn>
          <AnimateIn as="div" variant="fade" stagger={0.08} className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/services/${o.slug}`}
                className="group flex flex-col rounded-[12px] border border-hairline bg-panel p-6 transition-[transform,box-shadow,border-color] duration-200 will-change-transform hover:-translate-y-1 hover:border-accent/30 hover:shadow-soft"
              >
                <Icon name={o.icon} size={24} className="text-accent" strokeWidth={1.8} />
                <h3 className="mt-4 text-[1.3rem]">{o.title}</h3>
                <p className="mt-2 flex-1 text-[0.96rem] leading-relaxed text-muted">{o.short}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-[0.88rem] font-semibold text-accent">
                  View details <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </AnimateIn>
        </div>
      </section>

      <CTA
        heading={`Need ${lower} on your site?`}
        sub="Tell us about your site and we'll get a tailored quote back to you fast — usually within one business day."
      />
    </>
  );
}
