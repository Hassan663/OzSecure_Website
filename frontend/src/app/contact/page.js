import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import PageHero from '@/components/PageHero';
import AnimateIn from '@/components/AnimateIn';
import QuoteForm from '@/components/QuoteForm';
import Constellation from '@/components/Constellation';
import { getSiteSettings } from '@/lib/siteSettings';

export const metadata = {
  title: 'Contact',
  description:
    'Get a quote for security, traffic control, cleaning or labour hire. Call our 24/7 operations desk or send your site details and we\'ll respond fast.',
};

export default async function ContactPage() {
  const site = await getSiteSettings();
  return (
    <>
      <PageHero
        crumb="Contact"
        title="Tell us about your site."
        intro="Send through the details and we'll come back with a quote — usually within one business day. Need crews urgently? Call the operations desk any time, day or night."
      />
      <section className="section">
        <div className="shell grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-[50px]">
          {/* INFO */}
          <AnimateIn variant="left">
            <div className="relative overflow-hidden rounded-[14px] border border-hairline bg-surface p-6 sm:p-[38px]">
              <Constellation className="pointer-events-none absolute -right-4 -top-4 h-40 w-auto text-muted/20" />
              <h3 className="relative text-[1.5rem]">Operations Desk</h3>

              <InfoRow icon={Phone} label="Call 24/7">
                <a className="transition-colors hover:text-accent" href={`tel:${site.phonePrimaryTel}`}>{site.phonePrimary}</a>
              </InfoRow>
              <InfoRow icon={Mail} label="Email">
                <a className="transition-colors hover:text-accent" href={`mailto:${site.email}`}>{site.email}</a>
              </InfoRow>
              <InfoRow icon={MapPin} label="Head office">
                {site.address.line1},<br />
                {site.address.line2}
              </InfoRow>
              <InfoRow icon={Clock} label="Coverage">
                {site.coverage}
                <br />
                <span className="text-[0.9rem] text-muted">Operations desk 24/7</span>
              </InfoRow>
            </div>
          </AnimateIn>

          {/* FORM */}
          <AnimateIn variant="right" delay={0.1}>
            <QuoteForm />
          </AnimateIn>
        </div>
      </section>
    </>
  );
}

function InfoRow({ icon: Ico, label, children }) {
  return (
    <div className="relative z-10 mt-6 flex items-start gap-3.5">
      <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[10px] border border-hairline bg-panel">
        <Ico size={20} className="text-accent" />
      </div>
      <div className="min-w-0">
        <div className="text-[0.76rem] font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
        <div className="break-words text-[1.05rem] font-medium text-ink">{children}</div>
      </div>
    </div>
  );
}
