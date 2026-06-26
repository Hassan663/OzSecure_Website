import Hero from '@/components/Hero';
import Reveal from '@/components/Reveal';
import AnimateIn from '@/components/AnimateIn';
import ServiceCard from '@/components/ServiceCard';
import StatCounter from '@/components/StatCounter';
import ProcessSteps from '@/components/ProcessSteps';
import Constellation from '@/components/Constellation';
import Icon from '@/components/Icon';
import CTA from '@/components/CTA';
import { services, stats, whyUs } from '@/data/services';

export default function Home() {
  return (
    <>
      <Hero />

      {/* SERVICES */}
      <section className="section">
        <div className="shell">
          <Reveal className="mb-12 max-w-[680px]">
            <span className="eyebrow">What we do</span>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)]">Four trades. One point of contact.</h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-muted">
              Manage your whole site through a single provider — fewer invoices, one supervisor to call, and crews that
              already know how to work alongside each other.
            </p>
          </Reveal>
          <AnimateIn variant="fade" stagger={0.08} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </AnimateIn>
        </div>
      </section>

      {/* STATS */}
      <section className="section border-y border-hairline bg-surface">
        <div className="shell grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="section">
        <div className="shell grid items-center gap-10 lg:grid-cols-2 lg:gap-[60px]">
          <Reveal>
            <span className="eyebrow">Why OzSecure</span>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)]">Accountable from the first call to the final report.</h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-muted">
              We run our own crews — no chains of subcontractors. That means consistent standards, direct supervision and
              a single team that owns the outcome on your site.
            </p>
            <div className="mt-8 grid gap-6">
              {whyUs.map((w) => (
                <div key={w.title} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-hairline bg-surface">
                    <Icon name={w.icon} size={20} className="text-accent" strokeWidth={1.9} />
                  </div>
                  <div>
                    <h4 className="text-[1.15rem]">{w.title}</h4>
                    <p className="mt-1 text-[0.98rem] leading-relaxed text-muted">{w.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-[14px] border border-hairline bg-surface p-7 sm:p-11">
              <Constellation className="pointer-events-none absolute -right-4 -top-4 h-44 w-auto text-muted/25" />
              <div className="relative">
                <span className="eyebrow">One team</span>
                <h3 className="mt-4 max-w-[15ch] text-[clamp(1.5rem,2.6vw,2.1rem)]">One provider. Every shift covered.</h3>
                <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">
                  From the night-shift guard to the morning clean, your whole operation runs through one accountable team.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section border-t border-hairline bg-surface">
        <div className="shell">
          <Reveal className="mb-12 max-w-[680px]">
            <span className="eyebrow">How we mobilise</span>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)]">From enquiry to crews on site</h2>
          </Reveal>
          <ProcessSteps />
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="section">
        <div className="shell">
          <AnimateIn variant="scale" className="mx-auto max-w-[880px] text-center">
            <span className="eyebrow justify-center">Client</span>
            <blockquote className="mt-6 font-display text-[clamp(1.5rem,3.2vw,2.3rem)] font-medium leading-[1.3] text-heading">
              &ldquo;OzSecure took over security, traffic and the builder&rsquo;s clean on our project. One supervisor, one
              invoice, zero gaps — it took the coordination headache off my desk entirely.&rdquo;
            </blockquote>
            <div className="mt-6 text-[0.95rem] text-muted">
              <b className="font-semibold text-ink">Project Manager</b> · Commercial Construction, NSW
            </div>
          </AnimateIn>
        </div>
      </section>

      <CTA
        heading="Need crews on site this week?"
        sub="Tell us what your site needs and we'll have a quote back to you fast — usually within one business day."
      />
    </>
  );
}
