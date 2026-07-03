// Bundled fallback for editable homepage content — used if the API is empty or
// unreachable, so the homepage never renders blank. Mirrors the backend seed.
export const homepageDefaults = {
  heroEyebrow: 'Security · Traffic · Cleaning · Labour',
  heroHeadline: 'Your site, secured end to end.',
  heroHeadlineAccent: 'secured',
  heroSubtext:
    'One accredited provider for security, traffic control, commercial cleaning and labour hire — staffed, supervised and operating around the clock across Sydney & Greater NSW.',
  heroCtaPrimaryLabel: 'Request a Quote',
  heroCtaSecondaryLabel: 'Our Services',
  trust: [
    { icon: 'ShieldCheck', label: 'Fully Licensed' },
    { icon: 'Clock', label: '24/7 Operations' },
    { icon: 'BadgeCheck', label: '15+ Years Experience' },
    { icon: 'Users', label: 'Vetted & White-Carded' },
  ],
  stats: [
    { value: 15, suffix: '+', label: 'Years in business' },
    { value: 24, suffix: '/7', label: 'Operations centre' },
    { value: 350, suffix: '+', label: 'Sites serviced' },
    { value: 15, suffix: 'min', label: 'Avg. callout response' },
  ],
  whyHeading: 'Accountable from the first call to the final report.',
  whyIntro:
    'We run our own crews — no chains of subcontractors. That means consistent standards, direct supervision and a single team that owns the outcome on your site.',
  whyPoints: [
    { icon: 'ShieldCheck', title: 'Licensed & compliant', body: 'Security master licence, traffic accreditation and full insurance on every job — documentation available on request.' },
    { icon: 'Clock', title: 'Round-the-clock cover', body: "A 24/7 operations desk dispatches, monitors and reports so there's always someone watching your site." },
    { icon: 'Activity', title: 'Live reporting', body: 'Shift logs, incident reports and patrol records delivered digitally — you always know what happened and when.' },
  ],
  processSteps: [
    { title: 'Scope', body: 'We assess your site, risks and roster needs — on a call or a walk-through, whichever suits.' },
    { title: 'Plan', body: 'You get a fixed quote, a site plan and the compliance paperwork before anyone starts.' },
    { title: 'Deploy', body: 'Inducted, vetted crews arrive on schedule with a named supervisor as your point of contact.' },
    { title: 'Report', body: 'Digital shift logs and incident records keep you informed and your records audit-ready.' },
  ],
  ctaHeading: 'Need crews on site this week?',
  ctaSubtext: "Tell us what your site needs and we'll have a quote back to you fast — usually within one business day.",
};
