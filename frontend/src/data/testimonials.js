// Bundled fallback testimonials — used if the API is empty/unreachable, so the
// homepage testimonial section never renders blank. Mirrors the backend seed.
// Attributions are deliberately generic (role + sector), not real names/companies.
export const testimonials = [
  {
    quote:
      "We've had OzSecure guards on our site for eight months and not one no-show. They turn up early, hand over properly between shifts, and the incident logs actually get to us the same night. It's the first security contract I haven't had to chase.",
    authorName: 'Site Manager',
    company: 'Commercial Construction, NSW',
    rating: 5,
  },
  {
    quote:
      'Their officers are licensed, presentable and genuinely good with the public — which matters when you have thousands of people coming through the doors. Briefings were thorough and the supervisor was reachable all night.',
    authorName: 'Operations Lead',
    company: 'Events & Venues, Sydney',
    rating: 5,
  },
  {
    quote:
      'Accredited controllers, traffic management plan sorted, signage on site before we started. They kept the road moving and the crew safe through a tricky two-week lane closure, and the paperwork was ready when council asked for it.',
    authorName: 'Project Supervisor',
    company: 'Civil & Roadworks, Western Sydney',
    rating: 5,
  },
];
