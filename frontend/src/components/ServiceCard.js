import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Icon from './Icon';

/**
 * Clean service card with a real photo visual (navy gradient fallback behind),
 * an icon badge + navy overlay over the image, then title/copy below. Reveal is
 * driven by the parent grid.
 */
export default function ServiceCard({ service }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[12px] border border-hairline bg-panel transition-[transform,box-shadow,border-color] duration-200 will-change-transform hover:-translate-y-1 hover:border-accent/30 hover:shadow-soft">
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-gradient-to-br from-navy to-navy-deep">
        <Image
          src={service.image}
          alt={service.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
        <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-[8px] border border-white/15 bg-navy/55 backdrop-blur-sm">
          <Icon name={service.icon} size={20} className="text-white" strokeWidth={1.8} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-[1.3rem]">{service.title}</h3>
        <p className="mt-2.5 flex-1 text-[0.96rem] leading-relaxed text-muted">{service.short}</p>
        <Link
          href={`/services/${service.id}`}
          className="mt-5 inline-flex items-center gap-2 text-[0.9rem] font-semibold text-accent"
        >
          Explore
          <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
