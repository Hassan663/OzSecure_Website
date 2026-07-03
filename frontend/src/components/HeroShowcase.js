'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/**
 * Premium auto-rotating image showcase for the hero right column.
 *
 *  • 4 slides, ~5s each, smooth crossfade + a very subtle Ken-Burns drift.
 *  • Rounded panel, fixed 4/5 portrait aspect (no layout shift), hairline border.
 *  • Per-slide caption tag with a red accent; navy gradient keeps it readable.
 *  • Clickable dot indicators; auto-rotation pauses on hover/focus.
 *  • A navy→red gradient sits behind every image as a graceful fallback.
 *  • prefers-reduced-motion → single static slide, no rotation, no Ken-Burns.
 */
const SLIDES = [
  { src: '/images/hero/security.jpg', caption: 'Security', alt: 'Licensed security officers on site' },
  { src: '/images/hero/traffic.jpg', caption: 'Traffic Control', alt: 'Accredited traffic controllers managing road works' },
  { src: '/images/hero/cleaning.jpg', caption: 'Cleaning', alt: 'Commercial cleaning crew at work' },
  { src: '/images/hero/labour.jpg', caption: 'Labour Hire', alt: 'Inducted labour-hire crew on a construction site' },
];
const INTERVAL = 5000;

export default function HeroShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef(null);

  useEffect(() => {
    setReduced(
      typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  // Pause the timer when the showcase is scrolled out of view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const timer = useRef(null);
  useEffect(() => {
    if (reduced || paused || !visible) return undefined;
    timer.current = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(timer.current);
  }, [reduced, paused, visible]);

  return (
    <div
      ref={rootRef}
      className="hero-visual relative aspect-[4/5] w-full overflow-hidden rounded-[14px] border border-hairline bg-gradient-to-br from-navy via-navy-deep to-[#3d1010] shadow-soft"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {SLIDES.map((s, i) => {
        const isActive = i === active;
        const show = reduced ? i === 0 : isActive;
        return (
          <div
            key={s.src}
            aria-hidden={!show}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
              show ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              priority={i === 0}
              loading={i === 0 ? undefined : 'lazy'}
              sizes="(max-width: 1024px) 100vw, 45vw"
              className={`object-cover ${reduced ? '' : 'kb-pan'} ${show && !reduced ? 'kb-active' : ''}`}
            />
          </div>
        );
      })}

      {/* Bottom navy gradient for caption legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-navy/85 via-navy/30 to-transparent" />

      {/* Caption tag */}
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-[8px] border border-white/15 bg-navy/55 px-3 py-1.5 backdrop-blur-sm">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        <span className="text-[0.78rem] font-semibold tracking-wide text-white">{SLIDES[active].caption}</span>
      </div>

      {/* Dot indicators — small visual dot inside a 44px-tall tap target */}
      <div className="absolute bottom-1 left-2.5 flex items-center">
        {SLIDES.map((s, i) => (
          <button
            key={s.src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show ${s.caption}`}
            aria-current={i === active}
            className="flex h-11 items-center px-1.5"
          >
            <span
              className={`block h-2 rounded-full transition-all duration-300 ${
                i === active ? 'w-6 bg-accent' : 'w-2 bg-white/45 hover:bg-white/70'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
