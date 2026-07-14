'use client';
import { Fragment, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';
import { useSiteSettings } from './SettingsProvider';
import { homepageDefaults } from '@/data/homepage';
import Icon from './Icon';
import HeroSlider from './HeroSlider';

// Brighter crimson used for accent text sitting over the dark hero photos, so it
// stays legible (AA) in BOTH themes — the theme `--accent` would be too dark on
// the image in light mode.
const HERO_ACCENT = '#F04A4A';

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
          .from('.hero-trust > *', { autoAlpha: 0, y: 10, duration: 0.45, stagger: 0.06 }, '-=0.2');
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
    <div ref={sectionRef}>
      <HeroSlider>
        <div className="shell flex min-h-[88vh] items-center py-[clamp(96px,15vh,160px)] sm:min-h-[85vh]">
          {/* Strictly left-aligned, constrained to the left ~55% so it never overlaps
              the subject on the right of the photos. Vertically centred; left padding
              comes from the .shell gutter. */}
          <div className="max-w-[600px] text-left [text-shadow:0_1px_16px_rgba(2,6,20,0.5)] lg:max-w-[680px]">
            <span className="hero-kicker inline-flex items-center gap-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-white/85">
              <span className="h-[2px] w-5 shrink-0 bg-accent" />
              {content.heroEyebrow}
            </span>

            <h1 className="mt-5 !text-white text-[clamp(2.2rem,6vw,4.6rem)]">
              {headWords.map((w, i) => (
                <Fragment key={i}>
                  <span className="hero-word inline-block will-change-transform">
                    {w.accent ? <em className="not-italic" style={{ color: HERO_ACCENT }}>{w.t}</em> : w.t}
                  </span>
                  {i < headWords.length - 1 ? ' ' : ''}
                </Fragment>
              ))}
            </h1>

            <p className="hero-sub mt-6 max-w-[46ch] text-[1.1rem] leading-relaxed text-white/90">
              {content.heroSubtext}
            </p>
            <p className="hero-sub mt-5 text-[1.05rem] font-semibold text-red-glow">{site.tagline}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-start">
              <Link ref={ctaRef} href="/contact" className="hero-cta btn btn-primary w-full justify-center sm:w-auto">
                {content.heroCtaPrimaryLabel} <ArrowRight size={16} />
              </Link>
              <Link
                href="/services"
                className="hero-cta btn w-full justify-center border border-white/40 bg-white/5 text-white backdrop-blur-sm transition-colors hover:bg-white/15 sm:w-auto"
              >
                {content.heroCtaSecondaryLabel}
              </Link>
            </div>

            <div className="hero-trust mt-10 flex max-w-[560px] flex-wrap justify-start gap-x-6 gap-y-3 border-t border-white/15 pt-7">
              {trust.map((t, i) => (
                <div key={`${t.label}-${i}`} className="flex items-center gap-2.5 text-[0.9rem] font-medium text-white/90">
                  <Icon name={t.icon} size={17} className="shrink-0 text-red-glow" />
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </HeroSlider>
    </div>
  );
}
