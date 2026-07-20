/**
 * Seed defaults for the dynamic "homepage" content object. Mirrors the current
 * hardcoded homepage (hero, trust badges, stats, why-us, process, CTA band) so
 * nothing is lost. Also the merge base + fallback so no field is ever blank.
 */
export const homepageDefaults = {
  heroEyebrow: 'Security · Traffic · Cleaning · Labour',
  heroHeadline: 'Your site, secured end to end.',
  heroHeadlineAccent: 'secured', // word rendered in the accent colour
  heroSubtext:
    'One accredited provider for security, traffic control, commercial cleaning and labour hire — staffed, supervised and operating around the clock across Sydney & Greater NSW.',
  heroCtaPrimaryLabel: 'Request a Quote',
  heroCtaSecondaryLabel: 'Our Services',
  trust: [
    { icon: 'ShieldCheck', label: 'Fully Licensed' },
    { icon: 'Umbrella', label: 'Fully Insured' },
    { icon: 'Clock', label: '24/7 Operations' },
    { icon: 'BadgeCheck', label: '10+ Years Experience' },
    { icon: 'Users', label: 'Vetted & White-Carded' },
  ],
  stats: [
    { value: 10, suffix: '+', label: 'Years in business' },
    { value: 24, suffix: '/7', label: 'Operations centre' },
    { value: 100, suffix: '+', label: 'Sites serviced' },
    { value: 30, suffix: 'min', label: 'Avg. callout response' },
  ],
  whyHeading: 'Accountable from the first call to the final report.',
  whyIntro:
    'We run our own crews — no chains of subcontractors. That means consistent standards, direct supervision and a single team that owns the outcome on your site.',
  whyPoints: [
    {
      icon: 'ShieldCheck',
      title: 'Licensed & compliant',
      body: 'Security master licence, traffic accreditation and full insurance on every job — documentation available on request.',
    },
    {
      icon: 'Clock',
      title: 'Round-the-clock cover',
      body: "A 24/7 operations desk dispatches, monitors and reports so there's always someone watching your site.",
    },
    {
      icon: 'Activity',
      title: 'Live reporting',
      body: 'Shift logs, incident reports and patrol records delivered digitally — you always know what happened and when.',
    },
  ],
  processSteps: [
    { title: 'Scope', body: 'We assess your site, risks and roster needs — on a call or a walk-through, whichever suits.' },
    { title: 'Plan', body: 'You get a fixed quote, a site plan and the compliance paperwork before anyone starts.' },
    { title: 'Deploy', body: 'Inducted, vetted crews arrive on schedule with a named supervisor as your point of contact.' },
    { title: 'Report', body: 'Digital shift logs and incident records keep you informed and your records audit-ready.' },
  ],
  ctaHeading: 'Need crews on site this week?',
  ctaSubtext:
    "Tell us what your site needs and we'll have a quote back to you fast — usually within one business day.",
};

const str = (v) => (v ?? '').toString();
const iconList = (v, keys) =>
  Array.isArray(v)
    ? v.map((it) => Object.fromEntries(keys.map((k) => [k, str(it?.[k]).trim()]))).filter((it) => Object.values(it).some(Boolean))
    : [];

/** Coerce an incoming homepage payload into a clean, typed object. */
export function normalizeHomepage(data = {}) {
  const s = (v, d = '') => (v == null || v === '' ? d : str(v).trim());
  return {
    heroEyebrow: s(data.heroEyebrow),
    heroHeadline: s(data.heroHeadline),
    heroHeadlineAccent: s(data.heroHeadlineAccent),
    heroSubtext: s(data.heroSubtext),
    heroCtaPrimaryLabel: s(data.heroCtaPrimaryLabel, 'Request a Quote'),
    heroCtaSecondaryLabel: s(data.heroCtaSecondaryLabel, 'Our Services'),
    trust: iconList(data.trust, ['icon', 'label']),
    stats: Array.isArray(data.stats)
      ? data.stats
          .map((it) => ({ value: Number(it?.value) || 0, suffix: str(it?.suffix).trim(), label: str(it?.label).trim() }))
          .filter((it) => it.label)
      : [],
    whyHeading: s(data.whyHeading),
    whyIntro: s(data.whyIntro),
    whyPoints: iconList(data.whyPoints, ['icon', 'title', 'body']),
    processSteps: Array.isArray(data.processSteps)
      ? data.processSteps.map((it) => ({ title: str(it?.title).trim(), body: str(it?.body).trim() })).filter((it) => it.title)
      : [],
    ctaHeading: s(data.ctaHeading),
    ctaSubtext: s(data.ctaSubtext),
  };
}

/** Merge stored homepage over defaults so no field is ever blank. */
export function mergeHomepage(stored) {
  if (!stored || typeof stored !== 'object') return { ...homepageDefaults };
  const merged = { ...homepageDefaults, ...stored };
  // Keep non-empty stored arrays; otherwise fall back to defaults.
  for (const key of ['trust', 'stats', 'whyPoints', 'processSteps']) {
    if (!Array.isArray(stored[key]) || stored[key].length === 0) merged[key] = homepageDefaults[key];
  }
  return merged;
}
