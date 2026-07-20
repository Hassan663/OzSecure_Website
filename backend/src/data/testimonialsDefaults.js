/**
 * Seed defaults for the dynamic "testimonials" collection. The first entry is
 * the existing homepage testimonial. Written on first run if empty.
 */
export const testimonialsDefaults = [
  {
    order: 0,
    active: true,
    quote:
      "We've had OzSecure guards on our site for eight months and not one no-show. They turn up early, hand over properly between shifts, and the incident logs actually get to us the same night. It's the first security contract I haven't had to chase.",
    authorName: 'Site Manager',
    company: 'Commercial Construction, NSW',
    rating: 5,
  },
  {
    order: 1,
    active: true,
    quote:
      'Their officers are licensed, presentable and genuinely good with the public — which matters when you have thousands of people coming through the doors. Briefings were thorough and the supervisor was reachable all night.',
    authorName: 'Operations Lead',
    company: 'Events & Venues, Sydney',
    rating: 5,
  },
  {
    order: 2,
    active: true,
    quote:
      'Accredited controllers, traffic management plan sorted, signage on site before we started. They kept the road moving and the crew safe through a tricky two-week lane closure, and the paperwork was ready when council asked for it.',
    authorName: 'Project Supervisor',
    company: 'Civil & Roadworks, Western Sydney',
    rating: 5,
  },
];

export const TESTIMONIAL_FIELDS = ['quote', 'authorName', 'company', 'rating', 'active', 'order'];

export function normalizeTestimonial(data = {}) {
  const str = (v) => (v ?? '').toString().trim();
  let rating = Number(data.rating);
  rating = Number.isFinite(rating) && rating >= 1 && rating <= 5 ? Math.round(rating) : null;
  return {
    quote: str(data.quote),
    authorName: str(data.authorName),
    company: str(data.company),
    rating,
    active: data.active !== false,
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : 0,
  };
}
