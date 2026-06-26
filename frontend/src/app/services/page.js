import PageHero from '@/components/PageHero';
import ServiceDetail from '@/components/ServiceDetail';
import CTA from '@/components/CTA';
import { services } from '@/data/services';

export const metadata = {
  title: 'Services',
  description:
    'Security, traffic control, commercial cleaning and labour hire from OzSecure — accredited crews and 24/7 supervision across Sydney & Greater NSW.',
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        crumb="Services"
        title="Everything your site needs, under one roof."
        intro="Four operational trades, run by our own supervised crews. Engage one service or run your whole site through us — the standards and the accountability stay the same."
      />
      <section className="section">
        <div className="shell">
          {services.map((s, i) => (
            <ServiceDetail key={s.id} service={s} index={i} />
          ))}
        </div>
      </section>
      <CTA
        heading="Not sure which services you need?"
        sub="Tell us about your site and we'll recommend the right mix — and quote it as one package."
      />
    </>
  );
}
