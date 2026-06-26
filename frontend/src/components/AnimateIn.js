'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

/**
 * Reusable GSAP + ScrollTrigger reveal.
 *
 * Mirrors the Framer <Reveal> API (className / delay / as) so it can be dropped
 * in for the richer signature animations. Uses useGSAP + gsap.context for
 * automatic cleanup, and gsap.matchMedia so prefers-reduced-motion gets a
 * static, fully-visible result (no transforms, no ScrollTrigger).
 *
 * Accessibility: the hidden starting state is applied by JS only (never in CSS),
 * so if JS fails or reduced motion is set, all content renders visible.
 *
 * Variants:
 *  - 'fade'      fade + rise
 *  - 'fade-down' fade + drop
 *  - 'left'      fade + slide from left
 *  - 'right'     fade + slide from right
 *  - 'clip'      clip-path wipe upward
 *  - 'scale'     fade + subtle scale-up
 *  - 'line'      horizontal line draw (scaleX 0 -> 1)
 *
 * Pass `stagger` to animate the element's direct children in sequence instead
 * of the element itself.
 */
const FROM = {
  fade: { autoAlpha: 0, y: 22 },
  'fade-down': { autoAlpha: 0, y: -22 },
  left: { autoAlpha: 0, x: -32 },
  right: { autoAlpha: 0, x: 32 },
  clip: { autoAlpha: 0, y: 30, clipPath: 'inset(0 0 100% 0)' },
  scale: { autoAlpha: 0, scale: 0.96 },
  depth: { autoAlpha: 0, y: 28, scale: 0.97 },
  line: { scaleX: 0, transformOrigin: 'left center' },
};
const TO = {
  fade: { autoAlpha: 1, y: 0 },
  'fade-down': { autoAlpha: 1, y: 0 },
  left: { autoAlpha: 1, x: 0 },
  right: { autoAlpha: 1, x: 0 },
  clip: { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)' },
  scale: { autoAlpha: 1, scale: 1 },
  depth: { autoAlpha: 1, y: 0, scale: 1 },
  line: { scaleX: 1 },
};

export default function AnimateIn({
  children,
  as: Tag = 'div',
  variant = 'fade',
  delay = 0,
  duration = 0.85,
  ease = 'power3.out',
  stagger = null,
  start = 'top 85%',
  once = true,
  className = '',
  ...rest
}) {
  const ref = useRef(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      // `desktop` gates horizontal slides — on mobile they're swapped for a
      // gentle rise so a full-width element never translates past the viewport
      // (which would otherwise cause horizontal overflow).
      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          desktop: '(min-width: 768px)',
        },
        (ctx) => {
          if (!ctx.conditions.motion) return; // reduced motion → stay visible
          const targets = stagger ? Array.from(el.children) : el;
          let from = { ...(FROM[variant] || FROM.fade) };
          let to = { ...(TO[variant] || TO.fade) };

          if (!ctx.conditions.desktop && from.x !== undefined) {
            delete from.x;
            delete to.x;
            from = { ...from, y: 22 };
            to = { ...to, y: 0 };
          }

          gsap.set(targets, from);
          gsap.to(targets, {
            ...to,
            duration,
            ease,
            delay,
            stagger: stagger || 0,
            scrollTrigger: {
              trigger: el,
              start,
              toggleActions: once ? 'play none none none' : 'play none none reverse',
            },
          });
        }
      );
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
