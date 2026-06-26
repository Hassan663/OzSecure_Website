import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowRight } from 'lucide-react';
import Icon from './Icon';
import AnimateIn from './AnimateIn';

/**
 * Alternating service row. Text and visual reveal from opposite sides; the
 * visual is the service photo (navy gradient fallback behind) with a navy
 * overlay, an icon badge and the service badge label. Content is unchanged.
 */
export default function ServiceDetail({ service, index }) {
  const flip = index % 2 === 1;

  const Text = (
    <AnimateIn variant={flip ? 'right' : 'left'} className={flip ? 'lg:order-2' : ''}>
      <div className="text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-accent">
        Service 0{index + 1}
      </div>
      <h3 className="mt-2 text-[clamp(1.7rem,3vw,2.3rem)]">{service.title}</h3>
      <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">{service.intro}</p>
      <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-2.5 sm:grid-cols-2">
        {service.features.map((f) => (
          <div key={f} className="flex items-start gap-2.5 text-[0.97rem] text-ink">
            <Check size={18} className="mt-0.5 shrink-0 text-accent" />
            {f}
          </div>
        ))}
      </div>
      <Link href={`/services/${service.id}`} className="btn btn-outline mt-7">
        View details <ArrowRight size={16} />
      </Link>
    </AnimateIn>
  );

  const Visual = (
    <AnimateIn variant={flip ? 'left' : 'right'} delay={0.1}>
      <div className="relative flex min-h-[340px] items-end overflow-hidden rounded-[14px] border border-hairline bg-gradient-to-br from-navy to-navy-deep p-7">
        <Image
          src={service.image}
          alt={service.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent" />
        <div className="absolute left-6 top-6 flex h-14 w-14 items-center justify-center rounded-[10px] border border-white/15 bg-navy/55 backdrop-blur-sm">
          <Icon name={service.icon} size={28} className="text-white" strokeWidth={1.8} />
        </div>
        <span className="relative z-10 text-[0.85rem] font-semibold uppercase tracking-[0.1em] text-white">
          {service.badge}
        </span>
      </div>
    </AnimateIn>
  );

  return (
    <div
      id={service.id}
      className="grid scroll-mt-24 items-center gap-9 border-b border-hairline py-[clamp(40px,6vw,70px)] last:border-b-0 lg:grid-cols-2 lg:gap-[54px]"
    >
      {Text}
      {Visual}
    </div>
  );
}
