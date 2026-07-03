/**
 * Seed defaults for the dynamic "jobs" collection. Generic, on-brand example
 * roles (no invented licences/numbers). Written on first run if empty.
 */
export const jobsDefaults = [
  {
    order: 0,
    active: true,
    title: 'Security Officer',
    type: 'Casual',
    location: 'Sydney & Greater NSW',
    category: 'Security',
    shortDescription:
      'Join our licensed security team covering construction sites, events and commercial property across Sydney — steady shifts, real supervision.',
    fullDescription:
      'We’re looking for reliable, presentable security officers to join our supervised crews across Sydney and Greater NSW. You’ll work static posts, mobile patrols and event crowd control, backed by a 24/7 operations desk and a named supervisor on every job.\n\nShifts are available across days, nights and weekends, so flexibility and dependability matter. If you take pride in doing the job properly and turning up on time, we’d like to hear from you.',
    requirements: [
      'Current NSW Security Licence (or willingness to obtain one)',
      'Reliable transport and availability across a range of shifts',
      'Professional presentation and strong communication',
      'Right to work in Australia',
    ],
  },
  {
    order: 1,
    active: true,
    title: 'Traffic Controller',
    type: 'Casual',
    location: 'Sydney & Greater NSW',
    category: 'Traffic Control',
    shortDescription:
      'Accredited traffic controllers for road works, events and construction access — flexible shifts and steady, ongoing work.',
    fullDescription:
      'We need dependable traffic controllers to keep vehicles, pedestrians and workers safely separated on road works, construction access and event sites. You’ll arrive with the crew, set up to the traffic management plan, and keep the public moving while the site stays compliant.\n\nWork is regular and flexible, including after-hours and weekend shifts. We support the right people to get accredited and keep their tickets current.',
    requirements: [
      'Traffic Control accreditation (or willingness to obtain one)',
      'White Card (or willingness to obtain one)',
      'Reliable transport and flexible availability',
      'Comfortable working outdoors in all conditions',
    ],
  },
];

export const JOB_FIELDS = [
  'title', 'type', 'location', 'category', 'shortDescription', 'fullDescription', 'requirements', 'active', 'order',
];

export function normalizeJob(data = {}) {
  const str = (v) => (v ?? '').toString().trim();
  const arr = (v) => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : []);
  return {
    title: str(data.title),
    type: str(data.type) || 'Casual',
    location: str(data.location) || 'Sydney & Greater NSW',
    category: str(data.category) || 'Other',
    shortDescription: str(data.shortDescription),
    fullDescription: str(data.fullDescription),
    requirements: arr(data.requirements),
    active: data.active !== false,
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : 0,
  };
}
