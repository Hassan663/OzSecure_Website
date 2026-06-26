'use client';
import AnimateIn from './AnimateIn';

/**
 * Scroll reveal. Now a thin wrapper over the GSAP-based <AnimateIn> so the site
 * ships a single animation engine (no Framer Motion). Same call sites work
 * unchanged. Honors reduced motion via AnimateIn's gsap.matchMedia.
 */
export default function Reveal({ children, delay = 0, className = '', as = 'div' }) {
  return (
    <AnimateIn as={as} variant="fade" delay={delay} className={className}>
      {children}
    </AnimateIn>
  );
}
