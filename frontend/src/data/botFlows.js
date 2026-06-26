// ─────────────────────────────────────────────────────────────────────────────
// OzSecure Assistant — rule engine (NO external AI). Answers are built from the
// REAL business data in site.js + services.js. To edit what the bot says, change
// the answer builders below; to add keywords, edit SERVICE_KEYWORDS / matchIntent.
// ─────────────────────────────────────────────────────────────────────────────
import { site } from './site';
import { services } from './services';

export const LAUNCHER_LABEL = 'Need a quote? 👋';

export const WELCOME =
  "Hi! I'm the OzSecure Assistant 👋 I can tell you about our services, coverage and hours — or grab a quote for your site. What do you need?";

export const FALLBACK =
  "I'm not totally sure I caught that — but I can get our team onto it. Let's grab a few quick details.";

export const QUICK_REPLIES = [
  { id: 'services', label: 'Our Services' },
  { id: 'quote', label: 'Get a Quote' },
  { id: 'coverage', label: 'Coverage Area' },
  { id: 'contact', label: 'Contact / Hours' },
];

// ---- canned answers (real data) ----
function servicesAnswer() {
  return {
    text:
      "We're one accredited provider across four trades:\n\n" +
      services.map((s) => `• ${s.title} — ${s.short}`).join('\n\n') +
      '\n\nWant details on one, or a quote?',
    chips: [...services.map((s) => ({ id: `svc:${s.id}`, label: s.title })), { id: 'quote', label: 'Get a Quote' }],
  };
}

function serviceDetail(s) {
  return {
    text: `${s.title}\n\n${s.intro}`,
    chips: [
      { id: 'quote', label: `Quote for ${s.title}` },
      { id: 'services', label: 'All services' },
    ],
  };
}

function coverageAnswer() {
  return {
    text: `We operate across ${site.coverage}, with a 24/7 operations desk dispatching and supervising crews around the clock.`,
    chips: [
      { id: 'quote', label: 'Get a Quote' },
      { id: 'contact', label: 'Contact / Hours' },
    ],
  };
}

function contactAnswer() {
  return {
    text:
      `📞 ${site.phonePrimary} — 24/7 operations desk\n` +
      `✉️ ${site.email}\n` +
      `📍 ${site.address.line1}, ${site.address.line2}\n\n` +
      `We answer the phone day or night.`,
    chips: [{ id: 'quote', label: 'Get a Quote' }],
  };
}

// ---- keyword routing ----
const SERVICE_KEYWORDS = {
  security: /secur|guard|patrol|crowd|concierge|surveillance|alarm|door/,
  traffic: /traffic|road ?work|controller|signage|pedestrian|car ?park|tmp/,
  cleaning: /clean|builder|strata|end[ -]?of[ -]?lease|janitor|wash|tidy/,
  labour: /labou?r|worker|white ?card|crew hire|warehous|forklift|hands/,
};

/** Match free-typed text → an answer, a flow trigger, or null (fallback). */
export function matchIntent(raw = '') {
  const t = raw.toLowerCase().trim();
  if (!t) return null;

  if (/\b(hi|hello|hey|yo|g'?day|good (morning|afternoon|evening))\b/.test(t)) {
    return { text: WELCOME, chips: QUICK_REPLIES };
  }
  if (/\b(quote|quotation|price|pricing|cost|book|hire|engage|enquir|inquir)\b/.test(t)) {
    return { startFlow: true };
  }
  if (/\b(cover|coverage|area|where|located|location|region|sydney|nsw|suburb)\b/.test(t)) {
    return coverageAnswer();
  }
  if (/\b(contact|phone|call|email|hour|open|address|office|reach)\b/.test(t)) {
    return contactAnswer();
  }
  for (const s of services) {
    const re = SERVICE_KEYWORDS[s.id];
    if (re && re.test(t)) return serviceDetail(s);
  }
  if (/\b(service|trade|offer|do you do|what do you|help)\b/.test(t)) {
    return servicesAnswer();
  }
  if (/\b(thanks|thank you|cheers|great|ok|okay)\b/.test(t)) {
    return { text: 'Anytime! Anything else I can help with?', chips: QUICK_REPLIES };
  }
  return null;
}

/** Map a quick-reply / chip id → the same answers. */
export function resolveChip(id) {
  if (id === 'quote') return { startFlow: true };
  if (id === 'services') return servicesAnswer();
  if (id === 'coverage') return coverageAnswer();
  if (id === 'contact') return contactAnswer();
  if (id.startsWith('svc:')) {
    const s = services.find((x) => x.id === id.slice(4));
    if (s) return serviceDetail(s);
  }
  return { text: WELCOME, chips: QUICK_REPLIES };
}

// ---- quote/lead flow (one question at a time) ----
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{8,20}$/;

export const QUOTE_INTRO = "Great — I'll grab a few details and our team will follow up.";

export const QUOTE_STEPS = [
  {
    key: 'name',
    prompt: "First up, what's your name?",
    validate: (v) => (v.trim().length >= 2 ? null : 'Please enter your name.'),
    apply: (v) => ({ name: v.trim() }),
  },
  {
    key: 'contact',
    prompt: 'Thanks! What’s the best phone or email to reach you?',
    validate: (v) =>
      EMAIL_RE.test(v.trim()) || PHONE_RE.test(v.trim()) ? null : 'Please enter a valid email or phone number.',
    apply: (v) => (EMAIL_RE.test(v.trim()) ? { email: v.trim() } : { phone: v.trim() }),
  },
  {
    key: 'service',
    prompt: 'Which service do you need? (Security, Traffic Control, Cleaning, Labour Hire, or Multiple)',
    validate: (v) => (v.trim().length >= 2 ? null : 'Please tell us the service.'),
    apply: (v) => ({ service: v.trim() }),
  },
  {
    key: 'message',
    prompt: 'Last one — briefly, what does your site need? (dates, shift hours, headcount…)',
    validate: (v) => (v.trim().length >= 2 ? null : 'A short description helps us quote accurately.'),
    apply: (v) => ({ message: v.trim() }),
  },
];

/** Build the POST /api/quote payload from collected flow data. source = chatbot. */
export function buildLeadPayload(data) {
  return {
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    company: '',
    service: data.service || '',
    location: '',
    message: data.message || '',
    website: '', // honeypot — must stay empty
    source: 'chatbot',
  };
}
