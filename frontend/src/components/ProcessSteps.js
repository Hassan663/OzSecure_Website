'use client';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { steps } from '@/data/services';

/**
 * Clean numbered process — large muted index, title, body, thin accent rule
 * that draws in. Reveals in sequence. Reduced motion → static, fully visible.
 */
export default function ProcessSteps() {
  const ref = useRef(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const el = ref.current;
      if (!el) return;

      const items = el.querySelectorAll('.step-item');
      const bars = el.querySelectorAll('.step-bar');

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(items, { autoAlpha: 0, y: 24 });
        gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' });
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%' } });
        tl.to(items, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.1, ease: 'power3.out' })
          .to(bars, { scaleX: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out' }, 0.15);
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <div key={s.title} className="step-item">
          <div className="font-display text-[2.4rem] font-bold leading-none text-hairline">
            <span className="text-muted/50">{String(i + 1).padStart(2, '0')}</span>
          </div>
          <span className="step-bar mt-5 block h-[2px] w-10 bg-accent" />
          <h4 className="mt-5 text-[1.25rem]">{s.title}</h4>
          <p className="mt-2 text-[0.96rem] leading-relaxed text-muted">{s.body}</p>
        </div>
      ))}
    </div>
  );
}
