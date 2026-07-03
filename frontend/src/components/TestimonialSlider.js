'use client';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

// Homepage testimonials. One → static. Multiple → tasteful auto-rotating slider
// with manual controls. Respects prefers-reduced-motion (no auto-advance, no
// crossfade animation). Never blank — the caller passes a bundled fallback.
export default function TestimonialSlider({ items }) {
  const list = Array.isArray(items) && items.length ? items : [];
  const [i, setI] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const go = useCallback((n) => setI((cur) => (n + list.length) % list.length), [list.length]);

  useEffect(() => {
    if (reduced || list.length < 2) return undefined;
    const t = setInterval(() => setI((cur) => (cur + 1) % list.length), 7000);
    return () => clearInterval(t);
  }, [reduced, list.length]);

  if (!list.length) return null;
  const t = list[Math.min(i, list.length - 1)];

  return (
    <div className="mx-auto max-w-[880px] text-center">
      <span className="eyebrow justify-center">Client</span>

      <div key={i} className={reduced ? '' : 'chat-pop'}>
        {t.rating > 0 && (
          <div className="mt-6 flex justify-center gap-1" aria-label={`${t.rating} out of 5`}>
            {Array.from({ length: 5 }).map((_, s) => (
              <Star key={s} size={18} className={s < t.rating ? 'fill-accent text-accent' : 'text-muted/30'} />
            ))}
          </div>
        )}
        <blockquote className="mt-6 font-display text-[clamp(1.5rem,3.2vw,2.3rem)] font-medium leading-[1.3] text-heading">
          &ldquo;{t.quote}&rdquo;
        </blockquote>
        <div className="mt-6 text-[0.95rem] text-muted">
          {t.authorName && <b className="font-semibold text-ink">{t.authorName}</b>}
          {t.authorName && t.company ? ' · ' : ''}
          {t.company}
        </div>
      </div>

      {list.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button onClick={() => go(i - 1)} aria-label="Previous testimonial" className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-muted transition-colors hover:border-accent hover:text-accent">
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2">
            {list.map((_, d) => (
              <button
                key={d}
                onClick={() => setI(d)}
                aria-label={`Go to testimonial ${d + 1}`}
                className={`h-2 rounded-full transition-all ${d === i ? 'w-6 bg-accent' : 'w-2 bg-muted/30 hover:bg-muted/50'}`}
              />
            ))}
          </div>
          <button onClick={() => go(i + 1)} aria-label="Next testimonial" className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-muted transition-colors hover:border-accent hover:text-accent">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
