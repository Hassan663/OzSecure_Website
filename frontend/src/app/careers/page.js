import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import AnimateIn from '@/components/AnimateIn';
import Icon from '@/components/Icon';
import CTA from '@/components/CTA';
import CareersJobs from '@/components/careers/CareersJobs';
import { getSiteSettings } from '@/lib/siteSettings';
import { getJobs } from '@/lib/jobs';

export const metadata = {
  title: 'Careers',
  description:
    'Join the OzSecure Services team — security, traffic control, cleaning and labour hire roles across Sydney & Greater NSW. Supervised crews, steady work and real accountability.',
};

const reasons = [
  {
    icon: 'ShieldCheck',
    title: 'Steady, supervised work',
    body: 'Regular shifts across four trades and one operations desk — so there is always work, and always someone backing you on site.',
  },
  {
    icon: 'BadgeCheck',
    title: 'Licensed & accredited crews',
    body: 'We keep your tickets, inductions and accreditations current, and we only put people on site who are ready for it.',
  },
  {
    icon: 'Clock',
    title: '24/7 operations support',
    body: 'A round-the-clock ops team means swaps, callouts and incidents are handled fast — you are never left on your own.',
  },
  {
    icon: 'Users',
    title: 'Room to grow',
    body: 'From frontline roles to supervision and coordination, we promote from within as the team and our sites grow.',
  },
];

export default async function CareersPage() {
  const [site, jobs] = await Promise.all([getSiteSettings(), getJobs()]);
  return (
    <>
      <PageHero
        crumb="Careers"
        title="Join a team that turns up and takes ownership."
        intro={`We are always looking for reliable, licensed people across security, traffic control, cleaning and labour hire — ${site.coverage}. If you take pride in doing the job properly, we would like to hear from you.`}
      />

      {/* WHY WORK WITH US */}
      <section className="section">
        <div className="shell">
          <Reveal className="mb-12 max-w-[680px]">
            <span className="eyebrow">Why work with us</span>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)]">Good people, backed properly.</h2>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-muted">
              OzSecure runs its own supervised crews, so the people on site are ours — not a chain of subcontractors. That
              means clearer expectations, better support and a team that actually has your back.
            </p>
          </Reveal>
          <AnimateIn variant="depth" stagger={0.12} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {reasons.map((r) => (
              <div key={r.title} className="h-full rounded-[12px] border border-hairline border-t-2 border-t-accent bg-panel p-7">
                <Icon name={r.icon} size={24} className="text-accent" strokeWidth={1.8} />
                <h4 className="mb-2 mt-5 text-[1.25rem]">{r.title}</h4>
                <p className="text-[0.97rem] leading-relaxed text-muted">{r.body}</p>
              </div>
            ))}
          </AnimateIn>
        </div>
      </section>

      {/* OPEN ROLES */}
      <section className="section border-y border-hairline bg-surface">
        <div className="shell">
          <Reveal className="mb-10 max-w-[620px]">
            <span className="eyebrow">Open roles</span>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,2.8rem)]">
              {jobs.length > 0 ? 'Current openings' : "We're always hiring."}
            </h2>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-muted">
              {jobs.length > 0
                ? 'Apply directly below — tell us your experience, tickets and availability, and our team will be in touch.'
                : 'Roles across all four trades open regularly. Register your interest and we’ll reach out when something suits.'}
            </p>
          </Reveal>
          <CareersJobs jobs={jobs} />
        </div>
      </section>

      <CTA
        heading="Ready to join the crew?"
        sub="Tell us about your experience, licences and availability — we will match you to the right work across our sites."
      />
    </>
  );
}
