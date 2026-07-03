'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/**
 * Full-bleed background slider for the hero. The 4 hero photos fill the whole
 * section, auto-advancing with a crossfade + subtle Ken-Burns zoom. A Patriot
 * Blue gradient (stronger left/bottom, where the text sits) keeps overlaid white
 * text AA-legible over any photo. Content is passed as children and rendered on
 * top; clickable dots sit at the bottom.
 *  • priority-load slide 1, lazy the rest · pause on hover/focus + when offscreen
 *  • prefers-reduced-motion → a single static image, no rotation / Ken-Burns
 */
const SLIDES = [
  { src: '/images/hero/security.jpg', label: 'Security', alt: 'OzSecure licensed security officers on site' },
  { src: '/images/hero/traffic.jpg', label: 'Traffic Control', alt: 'OzSecure accredited traffic controllers managing road works' },
  { src: '/images/hero/cleaning.jpg', label: 'Cleaning', alt: 'OzSecure commercial cleaning crew at work' },
  { src: '/images/hero/labour.jpg', label: 'Labour Hire', alt: 'OzSecure inducted labour-hire crew on a construction site' },
];
const INTERVAL = 5000;

export default function HeroSlider({ children }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    setReduced(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Pause the timer when the hero is scrolled out of view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || paused || !visible) return undefined;
    timer.current = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(timer.current);
  }, [reduced, paused, visible]);

  return (
    <section
      ref={rootRef}
      className="relative w-full overflow-hidden border-b border-hairline bg-navy"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Background image layers */}
      <div className="absolute inset-0">
        {SLIDES.map((s, i) => {
          const show = reduced ? i === 0 : i === active;
          return (
            <div
              key={s.src}
              aria-hidden={!show}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${show ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image
                src={s.src}
                alt={s.alt}
                fill
                priority={i === 0}
                loading={i === 0 ? undefined : 'lazy'}
                sizes="100vw"
                className={`object-cover object-center ${reduced ? '' : 'kb-pan'} ${show && !reduced ? 'kb-active' : ''}`}
              />
            </div>
          );
        })}

        {/* Patriot Blue (#0D1B3D) left→right legibility gradient.
            Photos have the subject on the RIGHT with clean space on the LEFT, so
            the overlay is ~90% opaque on the left (behind the text) and fades to
            ~16% on the right (subject stays visible). Mobile covers more of the
            width (centred text over more of the image). Both keep white text AA
            over even the brightest slide (cleaning). */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(13,27,61,0.92)_0%,rgba(13,27,61,0.74)_55%,rgba(13,27,61,0.5)_100%)] sm:bg-[linear-gradient(90deg,rgba(13,27,61,0.9)_0%,rgba(13,27,61,0.8)_38%,rgba(13,27,61,0.42)_66%,rgba(13,27,61,0.16)_100%)]" />
        {/* Slight bottom darken so trust badges / dots stay readable */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/5 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10">{children}</div>

      {/* Slide indicator dots (clickable, keyboard-focusable) */}
      <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center sm:justify-start">
        <div className="shell flex items-center gap-0.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show ${s.label} slide`}
              aria-current={i === active}
              className="flex h-11 items-center rounded px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  i === active ? 'w-7 bg-accent' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
