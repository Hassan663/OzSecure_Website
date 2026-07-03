/**
 * Seed defaults for the dynamic "testimonials" collection. The first entry is
 * the existing homepage testimonial. Written on first run if empty.
 */
export const testimonialsDefaults = [
  {
    order: 0,
    active: true,
    quote:
      "OzSecure took over security, traffic and the builder's clean on our project. One supervisor, one invoice, zero gaps — it took the coordination headache off my desk entirely.",
    authorName: 'Project Manager',
    company: 'Commercial Construction, NSW',
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
