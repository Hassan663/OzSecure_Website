'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Global smooth-scroll provider.
 *
 * Wires Lenis to GSAP's ticker and ScrollTrigger so every scroll-driven
 * animation on the site shares one rAF loop and stays in sync (no jitter,
 * no double rAF). Skips Lenis entirely under prefers-reduced-motion AND on
 * small screens (<768px), where smooth-scroll hurts more than it helps and
 * native momentum scrolling is better; tears everything down on unmount.
 */
export default function SmoothScroll({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    // Register once; registerPlugin is idempotent.
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmallScreen = window.innerWidth < 768;

    // Reduced motion or mobile: native scroll, just keep ScrollTrigger live.
    if (reduceMotion || isSmallScreen) {
      ScrollTrigger.refresh();
      return () => {};
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    // Keep ScrollTrigger informed of Lenis-driven scroll position.
    lenis.on('scroll', ScrollTrigger.update);

    const onRaf = (time) => {
      // GSAP ticker time is in seconds; Lenis expects milliseconds.
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onRaf);
    gsap.ticker.lagSmoothing(0);

    // Recalculate triggers once layout/images settle.
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(onRaf);
      lenis.destroy();
    };
  }, []);

  // On client-side route changes, jump to top and refresh triggers so the
  // new page's animations measure against a clean scroll position.
  useEffect(() => {
    window.scrollTo(0, 0);
    const id = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  return children;
}
