'use client';
import { Fragment, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import Constellation from './Constellation';

export default function PageHero({ crumb, trail, title, intro }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('.ph-crumb', { autoAlpha: 0, y: 12, duration: 0.5 })
          .from('.ph-title', { autoAlpha: 0, y: 20, duration: 0.7 }, '-=0.25')
          .from('.ph-intro', { autoAlpha: 0, y: 16, duration: 0.6 }, '-=0.4');
      });
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="relative overflow-hidden border-b border-hairline">
      <Constellation className="pointer-events-none absolute right-[4%] top-1/2 hidden h-48 w-auto -translate-y-1/2 text-muted/20 sm:block" />
      <div className="shell relative z-10 py-[clamp(52px,8vw,104px)]">
        <div className="ph-crumb text-[0.85rem] text-muted">
          {trail ? (
            trail.map((item, i) => (
              <Fragment key={item.label}>
                {i > 0 && <span className="px-1.5 text-muted/50">/</span>}
                {item.href ? (
                  <Link href={item.href} className="transition-colors hover:text-accent">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-ink">{item.label}</span>
                )}
              </Fragment>
            ))
          ) : (
            <>
              <Link href="/" className="transition-colors hover:text-accent">
                Home
              </Link>{' '}
              <span className="text-muted/50">/</span> {crumb}
            </>
          )}
        </div>
        <h1 className="ph-title mt-5 max-w-[20ch] text-[clamp(2.2rem,5vw,3.6rem)]">{title}</h1>
        <p className="ph-intro mt-5 max-w-[60ch] text-[1.1rem] leading-relaxed text-muted">{intro}</p>
      </div>
    </section>
  );
}
