'use client';
import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

/**
 * Clean stat — large Poppins numeral that counts up on scroll, muted
 * label, thin accent tick. Reduced motion → final value, no animation.
 */
export default function StatCounter({ value, suffix = '', label }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const counter = { v: 0 };
        gsap.to(counter, {
          v: value,
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
          onUpdate: () => setDisplay(Math.round(counter.v)),
        });
      });
      mm.add('(prefers-reduced-motion: reduce)', () => setDisplay(value));
    },
    { scope: ref }
  );

  return (
    <div ref={ref}>
      <span className="block h-[2px] w-8 bg-accent" />
      <div className="mt-4 font-display text-[clamp(2.8rem,5.5vw,4rem)] font-bold leading-none tracking-tight text-heading">
        {display}
        <span className="text-accent">{suffix}</span>
      </div>
      <div className="mt-3 text-[0.92rem] text-muted">{label}</div>
    </div>
  );
}
