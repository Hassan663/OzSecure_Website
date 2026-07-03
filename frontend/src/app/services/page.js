import PageHero from '@/components/PageHero';
import ServiceDetail from '@/components/ServiceDetail';
import CTA from '@/components/CTA';
import { getServices } from '@/lib/services';

export const metadata = {
  title: 'Services',
  description:
    'Security, traffic control, commercial cleaning and labour hire from OzSecure — accredited crews and 24/7 supervision across Sydney & Greater NSW.',
};

export default async function ServicesPage() {
  const services = await getServices();
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
            <ServiceDetail key={s.slug} service={s} index={i} />
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
