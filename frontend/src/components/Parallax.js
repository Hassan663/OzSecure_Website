'use client';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

/**
 * Subtle scroll parallax for a panel image. Wrap it around a next/image (fill)
 * inside an `overflow-hidden` panel — it pre-scales the child slightly (so the
 * vertical drift never reveals an edge) and eases it as the panel scrolls
 * through the viewport. Uses gsap.matchMedia so it runs ONLY on desktop with
 * motion allowed; reduced-motion / mobile → a static, fully-covered image.
 */
export default function Parallax({ children, amount = 8, className = '' }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const el = ref.current;
      if (!el) return;
      const target = el.firstElementChild;
      if (!target) return;

      const mm = gsap.matchMedia();
      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 768px)' },
        (ctx) => {
          if (!ctx.conditions.motion || !ctx.conditions.desktop) return; // static otherwise
          // Pre-scale so translating vertically can't expose the panel edge.
          gsap.set(target, { scale: 1.12, transformOrigin: 'center center' });
          gsap.fromTo(
            target,
            { yPercent: -amount / 2 },
            {
              yPercent: amount / 2,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
            }
          );
        }
      );
    },
    { scope: ref }
  );

  // absolute inset-0 so it exactly covers the panel (child is a `fill` image).
  return (
    <div ref={ref} className={`absolute inset-0 ${className}`}>
      {children}
    </div>
  );
}
