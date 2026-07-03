'use client';
import { Fragment, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';
import { useSiteSettings } from './SettingsProvider';
import { homepageDefaults } from '@/data/homepage';
import Icon from './Icon';
import HeroShowcase from './HeroShowcase';

export default function Hero({ content = homepageDefaults }) {
  const site = useSiteSettings();
  const accentWord = (content.heroHeadlineAccent || '').trim().toLowerCase();
  const headWords = (content.heroHeadline || '').split(' ').map((t) => ({
    t,
    accent: accentWord && t.replace(/[^a-z0-9]/gi, '').toLowerCase() === accentWord,
  }));
  const trust = content.trust || [];
  const sectionRef = useRef(null);
  const ctaRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from('.hero-kicker', { autoAlpha: 0, y: 14, duration: 0.5 })
          .from('.hero-word', { autoAlpha: 0, yPercent: 60, duration: 0.7, stagger: 0.07 }, '-=0.15')
          .from('.hero-sub', { autoAlpha: 0, y: 16, duration: 0.6 }, '-=0.3')
          .from('.hero-cta', { autoAlpha: 0, y: 14, duration: 0.5, stagger: 0.08 }, '-=0.25')
          .from('.hero-trust > *', { autoAlpha: 0, y: 10, duration: 0.45, stagger: 0.06 }, '-=0.2')
          .from('.hero-visual', { autoAlpha: 0, scale: 0.96, duration: 0.8, ease: 'power2.out' }, 0.15);
      });

      mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const btn = ctaRef.current;
        if (!btn) return;
        const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
        const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
        const onMove = (e) => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.5);
        };
        const onLeave = () => {
          xTo(0);
          yTo(0);
        };
        btn.addEventListener('pointermove', onMove);
        btn.addEventListener('pointerleave', onLeave);
        return () => {
          btn.removeEventListener('pointermove', onMove);
          btn.removeEventListener('pointerleave', onLeave);
        };
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-b border-hairline">
      <div className="shell grid items-center gap-10 py-[clamp(52px,7vw,96px)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div>
          <span className="hero-kicker eyebrow">{content.heroEyebrow}</span>
          <h1 className="mt-5 text-[clamp(2.3rem,6vw,4.6rem)]">
            {headWords.map((w, i) => (
              <Fragment key={i}>
                <span className="hero-word inline-block will-change-transform">
                  {w.accent ? <em className="not-italic text-accent">{w.t}</em> : w.t}
                </span>
                {i < headWords.length - 1 ? ' ' : ''}
              </Fragment>
            ))}
          </h1>
          <p className="hero-sub mt-6 max-w-[48ch] text-[1.12rem] leading-relaxed text-muted">{content.heroSubtext}</p>
          <p className="hero-sub mt-5 text-[1.02rem] font-semibold text-accent">{site.tagline}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link ref={ctaRef} href="/contact" className="hero-cta btn btn-primary w-full justify-center sm:w-auto">
              {content.heroCtaPrimaryLabel} <ArrowRight size={16} />
            </Link>
            <Link href="/services" className="hero-cta btn btn-ghost w-full justify-center sm:w-auto">
              {content.heroCtaSecondaryLabel}
            </Link>
          </div>
          <div className="hero-trust mt-12 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-hairline pt-7 sm:max-w-[520px]">
            {trust.map((t, i) => (
              <div key={`${t.label}-${i}`} className="flex items-center gap-2.5 text-[0.9rem] font-medium text-muted">
                <Icon name={t.icon} size={17} className="shrink-0 text-accent" />
                {t.label}
              </div>
            ))}
          </div>
        </div>

        <HeroShowcase />
      </div>
    </section>
  );
}
