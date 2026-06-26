import Image from 'next/image';
import { Check } from 'lucide-react';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import AnimateIn from '@/components/AnimateIn';
import Icon from '@/components/Icon';
import CTA from '@/components/CTA';
import { site } from '@/data/site';

export const metadata = {
  title: 'About',
  description:
    'OzSecure Services runs its own supervised crews for security, traffic control, cleaning and labour hire across NSW. Licensed, insured and audit-ready.',
};

const values = [
  { icon: 'ShieldCheck', title: 'Accountability', body: 'We own the outcome on your site. No finger-pointing between subcontractors, because the crew is ours.' },
  { icon: 'BadgeCheck', title: 'Compliance', body: 'Licences, accreditations and insurance kept current — and documentation ready whenever you ask for it.' },
  { icon: 'Clock', title: 'Responsiveness', body: 'A 24/7 operations desk means callouts, swaps and incidents are handled fast — not left until business hours.' },
];

const compliance = [
  { title: 'Security master licence', body: `Officers individually licensed and screened before they set foot on your site (MLN ${site.mln}).` },
  { title: 'Traffic control accreditation', body: 'Controllers accredited to the relevant state standard, with traffic management plans on file.' },
  { title: "Public liability & workers' comp", body: 'Comprehensive cover across every service line — certificates of currency on request.' },
  { title: 'White card & site inductions', body: 'Labour and cleaning crews inducted and construction-ready before deployment.' },
];

function InfoPanel({ title, body, image, alt }) {
  return (
    <div className="relative flex min-h-[420px] items-end overflow-hidden rounded-[14px] border border-hairline bg-gradient-to-br from-navy to-navy-deep p-9 sm:p-11">
      <Image src={image} alt={alt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/45 to-navy/10" />
      <div className="relative">
        <h3 className="max-w-[16ch] text-[clamp(1.5rem,2.6vw,2rem)] text-white">{title}</h3>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-[#C7D2E6]">{body}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumb="About"
        title="Built to take the coordination off your plate."
        intro="OzSecure Services brings security, traffic control, cleaning and labour hire together under one accountable operator — so you brief one team instead of chasing four."
      />

      {/* STORY */}
      <section className="section">
        <div className="shell grid items-center gap-[60px] lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow">Who we are</span>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)]">A single operator for the work that keeps sites running.</h2>
            <p className="mb-4 mt-5 text-[1.05rem] leading-relaxed text-muted">
              Most sites juggle a different supplier for every job — a security firm, a traffic crew, a cleaning
              contractor and a labour agency, each with its own invoice, supervisor and standard. The gaps between them
              become someone&rsquo;s problem, usually yours.
            </p>
            <p className="text-[1.05rem] leading-relaxed text-muted">
              OzSecure was built to close those gaps. We run our own supervised crews across all four trades, coordinated
              from one operations desk. You get consistent standards, a single point of contact and full accountability
              from the first call to the final report.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <InfoPanel
              title="Australian-owned. On the ground where you are."
              body="Local crews, local supervisors, and an operations team that answers the phone — day or night."
              image="/images/about/operations.jpg"
              alt="OzSecure operations crew on site"
            />
          </Reveal>
        </div>
      </section>

      {/* VALUES */}
      <section className="section border-y border-hairline bg-surface">
        <div className="shell">
          <Reveal className="mb-12 max-w-[680px]">
            <span className="eyebrow">What we stand on</span>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)]">The standards behind every shift.</h2>
          </Reveal>
          <AnimateIn variant="depth" stagger={0.12} className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="h-full rounded-[12px] border border-hairline border-t-2 border-t-accent bg-panel p-7">
                <Icon name={v.icon} size={24} className="text-accent" strokeWidth={1.8} />
                <h4 className="mb-2 mt-5 text-[1.25rem]">{v.title}</h4>
                <p className="text-[0.97rem] leading-relaxed text-muted">{v.body}</p>
              </div>
            ))}
          </AnimateIn>
        </div>
      </section>

      {/* COMPLIANCE */}
      <section id="compliance" className="section scroll-mt-24">
        <div className="shell grid items-center gap-[60px] lg:grid-cols-2">
          <div>
            <AnimateIn variant="left">
              <span className="eyebrow">Compliance &amp; cover</span>
              <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)]">Licensed, insured and audit-ready.</h2>
              <p className="mt-5 text-[1.05rem] leading-relaxed text-muted">
                Every crew we deploy meets the requirements for its trade, and we keep the paperwork ready so your records
                stay clean.
              </p>
            </AnimateIn>
            <AnimateIn as="div" stagger={0.1} className="mt-8 grid gap-5">
              {compliance.map((c) => (
                <div key={c.title} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-hairline bg-surface">
                    <Check size={20} className="text-accent" strokeWidth={2.4} />
                  </div>
                  <div>
                    <h4 className="text-[1.15rem]">{c.title}</h4>
                    <p className="mt-1 text-[0.98rem] leading-relaxed text-muted">{c.body}</p>
                  </div>
                </div>
              ))}
            </AnimateIn>
          </div>
          <AnimateIn variant="right" delay={0.1}>
            <InfoPanel
              title="One file. Every certificate."
              body="We hold and maintain the compliance documentation for all four trades, so an audit never sends you scrambling."
              image="/images/about/compliance.jpg"
              alt="Compliance documentation ready for audit"
            />
          </AnimateIn>
        </div>
      </section>

      <CTA heading="Let's cover your site." sub="Talk to our operations team about the trades you need and how quickly you need them." />
    </>
  );
}
