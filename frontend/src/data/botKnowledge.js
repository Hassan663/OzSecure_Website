// ─────────────────────────────────────────────────────────────────────────────
// OzSecure Assistant — local knowledge + intent engine. NO external AI / NLP.
// 100% client-side. Answers are built from the REAL business data in
// site.js + services.js, so wording stays in sync with the rest of the site.
//
// ── HOW TO EDIT ──────────────────────────────────────────────────────────────
//  • To change what the bot SAYS  → edit the answer builders in the ANSWERS block.
//  • To change what TRIGGERS an intent → edit its `words` / `phrases` in INTENTS
//    (single words are fuzzy-matched per token; multi-word `phrases` are matched
//     as substrings and score higher).
//  • To ADD a whole new intent → add an { id, words, phrases, answer } entry to
//    INTENTS and (optionally) reference its id as a chip elsewhere.
//  • Chips: { id } = ask another intent · { action:'quote' } = start lead flow ·
//    { action:'call' } / { action:'email' } / { action:'link', href } = tappable.
// ─────────────────────────────────────────────────────────────────────────────
import { site } from './site';
import { services, steps } from './services';

export const LAUNCHER_LABEL = 'Ask us anything 👋';

export const WELCOME =
  "Hi! I'm the OzSecure Assistant 👋 Ask me anything — our services, coverage, pricing, hours or licensing — or tap a button below. I can also grab a quote for your site.";

export const QUICK_REPLIES = [
  { id: 'services', label: 'Our Services' },
  { action: 'quote', label: 'Get a Quote' },
  { id: 'coverage', label: 'Coverage Area' },
  { id: 'contact', label: 'Contact / Hours' },
];

// ── tiny fuzzy helpers (typo tolerance, no libraries) ────────────────────────
function normalize(s = '') {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let cur = new Array(n + 1);
  for (let i = 1; i <= m; i += 1) {
    cur[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

// Grammatical filler — ignored during keyword scoring so "to"/"a" can't
// false-match long keywords like "tomorrow"/"availability". (Phrases still use
// the full text, so "talk to a human" etc. keep matching.)
const STOPWORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'for', 'and', 'or', 'i', 'im', 'is', 'are', 'was',
  'do', 'does', 'you', 'we', 'my', 'me', 'it', 'its', 'in', 'on', 'at', 'be', 'been',
  'can', 'could', 'would', 'should', 'have', 'has', 'had', 'with', 'your', 'our',
  'this', 'that', 'there', 'their', 'they', 'please', 'just',
]);

// Score how well one input token matches a keyword (0 = no match).
function tokenScore(token, word) {
  if (token === word) return 2;
  // stem / plural: "guards" ~ "guard", "cleaners" ~ "clean" (both must be real words)
  if (word.length >= 5 && token.length >= 4 && (token.startsWith(word) || word.startsWith(token))) return 1.6;
  // small edit distance for typos ("parramata" ~ "parramatta", "licenced" ~ "licensed")
  if (word.length >= 4 && token.length >= 4) {
    const tol = word.length >= 8 ? 2 : 1;
    if (levenshtein(token, word) <= tol) return 1.4;
  }
  return 0;
}

// ── service keyword sets (used for both service intents and context detection) ─
const SERVICE_TERMS = {
  security: {
    words: ['security', 'secure', 'guard', 'guards', 'patrol', 'patrols', 'crowd', 'concierge', 'surveillance', 'alarm', 'bouncer', 'cctv', 'watchman', 'officer', 'officers', 'static', 'doorman', 'protection'],
    phrases: ['crowd control', 'mobile patrol', 'security guard', 'loss prevention', 'static guard', 'event security', 'guard dog'],
  },
  traffic: {
    words: ['traffic', 'roadwork', 'roadworks', 'controller', 'controllers', 'signage', 'pedestrian', 'carpark', 'tmp', 'lane', 'detour', 'flagger'],
    phrases: ['traffic control', 'traffic controller', 'road work', 'road works', 'car park', 'traffic management', 'stop slow', 'lane closure'],
  },
  cleaning: {
    words: ['clean', 'cleaner', 'cleaners', 'cleaning', 'strata', 'janitor', 'wash', 'tidy', 'mop', 'vacuum', 'scrub', 'hygiene', 'housekeeping'],
    phrases: ['end of lease', 'builders clean', 'builder clean', 'post construction', 'make good', 'common areas', 'office cleaning'],
  },
  labour: {
    words: ['labour', 'labor', 'labourer', 'labourers', 'worker', 'workers', 'warehouse', 'forklift', 'hands', 'staff', 'temp', 'trades', 'tradies'],
    phrases: ['white card', 'labour hire', 'general labour', 'pick pack', 'short notice', 'crew hire', 'skilled labour'],
  },
};

function detectService(norm) {
  for (const s of services) {
    const { words, phrases } = SERVICE_TERMS[s.id];
    if (phrases.some((p) => norm.includes(p))) return s;
    const toks = norm.split(' ');
    if (words.some((w) => toks.some((t) => tokenScore(t, w) >= 1.6))) return s;
  }
  return null;
}

// Common areas we cover — lets "do you work in parramatta?" answer specifically.
const AREAS = [
  'sydney', 'parramatta', 'penrith', 'blacktown', 'liverpool', 'bankstown', 'castle hill',
  'campbelltown', 'western sydney', 'cbd', 'north shore', 'newcastle', 'wollongong',
  'central coast', 'hills district', 'eastern suburbs', 'inner west', 'north west',
  'south west', 'ryde', 'chatswood', 'hornsby', 'sutherland', 'macarthur', 'greater sydney',
  'nsw', 'new south wales', 'auburn', 'fairfield', 'wetherill park', 'homebush',
];
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
function detectArea(norm) {
  // longest match first so "western sydney" wins over "sydney"
  const found = AREAS.filter((a) => norm.includes(a)).sort((a, b) => b.length - a.length);
  return found[0] || null;
}

// ── ANSWERS (edit wording here) ──────────────────────────────────────────────
const entityName = site.entity.replace(/^A project of\s*/i, '');

function greetingAnswer() {
  return { text: WELCOME, chips: QUICK_REPLIES };
}

function servicesAnswer() {
  return {
    text: 'OzSecure is one accredited provider across four trades:',
    bullets: services.map((s) => `${s.title} — ${s.short}`),
    note: 'Tap a service for what’s included, or get a quote.',
    chips: [
      ...services.map((s) => ({ id: `svc:${s.id}`, label: s.title })),
      { action: 'quote', label: 'Get a Quote' },
    ],
  };
}

function serviceAnswer(s) {
  return {
    text: `${s.title} — ${s.short}\n\nWhat’s typically included:`,
    bullets: s.features.slice(0, 6),
    note: s.badge,
    chips: [
      { action: 'quote', label: `Quote for ${s.title}` },
      { id: 'coverage', label: 'Coverage area' },
      { id: 'human', label: 'Talk to a human' },
    ],
  };
}

function pricingAnswer(ctx = {}) {
  const svc = ctx.norm ? detectService(ctx.norm) : null;
  const lead = svc
    ? `Pricing for ${svc.title.toLowerCase()} depends on your site — headcount, hours, location and how long you need us.`
    : 'We quote every job individually — the price depends on the service, headcount, hours, site and duration.';
  return {
    text:
      `${lead} There’s no one-size hourly rate that ignores your risk profile, but our quotes are fast, fixed, and include the compliance paperwork.\n\n` +
      'Tell me a bit about the job and I’ll get you a tailored quote.',
    chips: [
      { action: 'quote', label: svc ? `Quote for ${svc.title}` : 'Get a quote' },
      { action: 'call', label: `Call ${site.phonePrimary}` },
      { id: 'services', label: 'Our services' },
    ],
  };
}

function coverageAnswer(ctx = {}) {
  const area = ctx.norm ? detectArea(ctx.norm) : null;
  const prefix = area && !['nsw', 'new south wales', 'greater sydney', 'sydney'].includes(area)
    ? `Yes — ${titleCase(area)} is well within our patch. `
    : '';
  return {
    text:
      `${prefix}We operate right across ${site.coverage}, with a 24/7 operations desk dispatching and ` +
      'supervising crews around the clock. If you’re anywhere in the greater Sydney metro or regional NSW, we can get to you.',
    chips: [
      { action: 'quote', label: 'Get a quote' },
      { id: 'hours', label: 'Hours & availability' },
      { id: 'contact', label: 'Contact details' },
    ],
  };
}

function hoursAnswer() {
  return {
    text:
      'Our operations desk runs 24/7 — genuinely round the clock, including weekends and public holidays. ' +
      'We handle callouts, shift swaps and incidents day or night, and crews can deploy at short notice.',
    chips: [
      { action: 'call', label: `Call ${site.phonePrimary}` },
      { action: 'quote', label: 'Get a quote' },
      { id: 'emergency', label: 'It’s urgent' },
    ],
  };
}

function contactAnswer() {
  return {
    text:
      'Here’s how to reach us:\n\n' +
      `📞 ${site.phonePrimary} — 24/7 operations desk\n` +
      `✉️ ${site.email}\n` +
      `📍 ${site.address.line1}, ${site.address.line2}\n\n` +
      'We answer the phone day or night.',
    chips: [
      { action: 'call', label: 'Call now' },
      { action: 'email', label: 'Email us' },
      { action: 'quote', label: 'Get a quote' },
    ],
  };
}

function licensingAnswer() {
  return {
    text: 'We’re fully licensed, accredited and insured:',
    bullets: [
      `NSW Security Master Licence No. ${site.mln}`,
      `ABN ${site.abn}`,
      'Public liability & workers’ compensation cover on every job',
      'Traffic controllers accredited to the relevant state standard',
      'Officers individually licensed, screened and site-inducted',
    ],
    note: 'Certificates of currency and compliance documents are available on request.',
    chips: [
      { id: 'about', label: 'About OzSecure' },
      { action: 'quote', label: 'Get a quote' },
      { id: 'human', label: 'Talk to a human' },
    ],
  };
}

function aboutAnswer() {
  return {
    text:
      `${site.name} — “${site.tagline}”\n\n` +
      `${site.entity}, with ${site.yearsExperience} years’ experience. We run our own supervised crews across ` +
      'security, traffic control, cleaning and labour hire, coordinated from one 24/7 operations desk — so you ' +
      'brief one accountable team instead of chasing four.',
    chips: [
      { id: 'services', label: 'Our services' },
      { id: 'licensing', label: 'Licensing & compliance' },
      { action: 'link', href: '/about', label: 'About page' },
    ],
  };
}

function careersAnswer() {
  return {
    text:
      'We’re regularly hiring across all four trades — security, traffic control, cleaning and labour hire. ' +
      'If you’re reliable, licensed (or ready to be) and take pride in the work, we’d like to hear from you.',
    chips: [
      { action: 'link', href: '/careers', label: 'View careers' },
      { action: 'quote', label: 'Register interest' },
      { action: 'call', label: `Call ${site.phonePrimary}` },
    ],
  };
}

function getStartedAnswer() {
  return {
    text: 'Getting started is simple — four steps:',
    bullets: steps.map((st) => `${st.title}: ${st.body}`),
    note: 'Ready when you are — I can grab a few details and have the team call you.',
    chips: [
      { action: 'quote', label: 'Get started' },
      { action: 'call', label: 'Call now' },
      { id: 'contact', label: 'Contact' },
    ],
  };
}

function emergencyAnswer() {
  return {
    text:
      'If this is urgent, the fastest route is a phone call — our operations desk is staffed 24/7 and can dispatch immediately.',
    note: 'For a life-threatening emergency, always call 000 first.',
    chips: [
      { action: 'call', label: `Call ${site.phonePrimary} now` },
      { action: 'quote', label: 'Request a callback' },
    ],
  };
}

function humanAnswer() {
  return {
    text:
      'Happy to connect you with a real person — our team is on the ops desk 24/7:\n\n' +
      `📞 ${site.phonePrimary}\n` +
      `✉️ ${site.email}\n\n` +
      'Or leave your details and we’ll call you back.',
    chips: [
      { action: 'call', label: 'Call now' },
      { action: 'email', label: 'Email us' },
      { action: 'quote', label: 'Leave my details' },
    ],
  };
}

function thanksAnswer() {
  return { text: 'Anytime! Anything else I can help with?', chips: QUICK_REPLIES };
}

function byeAnswer() {
  return {
    text: `Thanks for stopping by — stay safe. 👋 Call ${site.phonePrimary} anytime.`,
    chips: [
      { action: 'call', label: 'Call us' },
      { action: 'quote', label: 'Get a quote' },
    ],
  };
}

// Low-confidence fallback — never guesses wrong; offers the best next steps.
export const FALLBACK = {
  text:
    'I want to get this right rather than guess. I can help with our services, coverage, pricing, hours, ' +
    'licensing and contact details — or I can grab your details and have the team answer directly.',
  chips: [
    { id: 'services', label: 'Our services' },
    { action: 'quote', label: 'Get a quote' },
    { id: 'coverage', label: 'Coverage' },
    { id: 'human', label: 'Talk to a human' },
  ],
};

// ── INTENT REGISTRY ──────────────────────────────────────────────────────────
const serviceIntents = services.map((s) => ({
  id: s.id,
  words: SERVICE_TERMS[s.id].words,
  phrases: SERVICE_TERMS[s.id].phrases,
  weight: 1.1,
  answer: () => serviceAnswer(s),
}));

const INTENTS = [
  { id: 'emergency', weight: 1.5, words: ['emergency', 'urgent', 'asap', 'immediately', 'now', 'help'], phrases: ['right now', 'straight away', 'break in', 'broken in', 'as soon as possible', 'need someone now'], answer: emergencyAnswer },
  { id: 'greeting', words: ['hi', 'hello', 'hey', 'yo', 'gday', 'howdy', 'hiya', 'sup'], phrases: ['good morning', 'good afternoon', 'good evening', 'g day'], answer: greetingAnswer },
  ...serviceIntents,
  { id: 'pricing', weight: 1.35, words: ['price', 'pricing', 'cost', 'costs', 'rate', 'rates', 'fee', 'fees', 'charge', 'charges', 'budget', 'expensive', 'afford'], phrases: ['how much', 'per hour', 'hourly rate', 'ball park', 'ballpark', 'per day'], answer: pricingAnswer },
  { id: 'quote', weight: 1.2, words: ['quote', 'quotation', 'book', 'booking', 'hire', 'engage', 'enquire', 'inquire', 'enquiry', 'inquiry', 'request'], phrases: ['get a quote', 'get started', 'sign up', 'i need', 'we need', 'looking for'], answer: () => ({ startFlow: true }) },
  { id: 'coverage', words: ['cover', 'coverage', 'area', 'areas', 'where', 'located', 'location', 'region', 'suburb', 'suburbs', 'servicing', ...AREAS.map((a) => a.split(' ')[0])], phrases: ['do you cover', 'do you service', 'near me', 'work in', ...AREAS], answer: coverageAnswer },
  { id: 'hours', words: ['hours', 'open', 'availability', 'available', 'weekend', 'weekends', 'overnight', 'tonight', 'tomorrow', 'today', 'anytime'], phrases: ['after hours', 'out of hours', 'public holiday', 'what time', '24 7', '24/7'], answer: hoursAnswer },
  { id: 'licensing', weight: 1.15, words: ['licensed', 'license', 'licence', 'licensing', 'insured', 'insurance', 'accredited', 'accreditation', 'certified', 'qualified', 'vetted', 'compliance', 'compliant', 'abn', 'credentials'], phrases: ['master licence', 'master license', 'police check', 'certificate of currency', 'are you licensed', 'public liability'], answer: licensingAnswer },
  { id: 'contact', words: ['contact', 'phone', 'call', 'email', 'address', 'office', 'reach', 'number', 'mobile'], phrases: ['get in touch', 'phone number', 'head office', 'where are you based'], answer: contactAnswer },
  { id: 'getstarted', words: ['process', 'steps', 'start', 'begin', 'onboard'], phrases: ['how do i book', 'how does it work', 'how do i get started', 'next steps', 'how to start', 'get started'], answer: getStartedAnswer },
  { id: 'about', words: ['about', 'company', 'who', 'history', 'experience', 'story', 'background'], phrases: ['who are you', 'about you', 'tell me about', 'how long', 'years in business'], answer: aboutAnswer },
  { id: 'careers', weight: 1.15, words: ['job', 'jobs', 'career', 'careers', 'hiring', 'employment', 'apply', 'vacancy', 'vacancies', 'recruit', 'recruiting'], phrases: ['work for you', 'work with you', 'are you hiring', 'join the team', 'looking for work'], answer: careersAnswer },
  { id: 'services', words: ['service', 'services', 'trade', 'trades', 'offer', 'do', 'provide', 'help'], phrases: ['what do you do', 'do you do', 'what do you offer', 'what services', 'list of services'], answer: servicesAnswer },
  { id: 'human', weight: 1.1, words: ['human', 'person', 'someone', 'agent', 'operator', 'representative', 'staff'], phrases: ['talk to a human', 'real person', 'speak to someone', 'talk to someone', 'speak to a human'], answer: humanAnswer },
  { id: 'thanks', words: ['thanks', 'thank', 'cheers', 'ta', 'appreciate', 'awesome', 'great', 'perfect'], phrases: ['thank you', 'thanks heaps', 'much appreciated'], answer: thanksAnswer },
  { id: 'bye', words: ['bye', 'goodbye', 'cya', 'later', 'done'], phrases: ['see ya', 'see you', 'that is all', 'thats all', 'no thanks'], answer: byeAnswer },
];

const MATCH_THRESHOLD = 2; // need at least one solid keyword or phrase hit

/**
 * Match free-typed text → an answer object, or the smart FALLBACK when unsure.
 * Returned shape: { text, bullets?, note?, chips?, startFlow? }.
 */
export function matchIntent(raw = '') {
  const norm = normalize(raw);
  if (!norm) return FALLBACK;
  const tokens = norm.split(' ');
  const contentTokens = tokens.filter((t) => t.length >= 2 && !STOPWORDS.has(t));

  let best = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const p of intent.phrases || []) {
      if (norm.includes(p)) score += 3;
    }
    for (const w of intent.words || []) {
      let wbest = 0;
      for (const t of contentTokens) {
        const s = tokenScore(t, w);
        if (s > wbest) wbest = s;
      }
      score += wbest;
    }
    score *= intent.weight || 1;
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  if (!best || bestScore < MATCH_THRESHOLD) return FALLBACK;
  return best.answer({ raw, norm, tokens });
}

/** Map a quick-reply / chip id → the same answers (no fuzzy matching needed). */
export function resolveChip(id) {
  if (id === 'quote') return { startFlow: true };
  if (id && id.startsWith('svc:')) {
    const s = services.find((x) => x.id === id.slice(4));
    if (s) return serviceAnswer(s);
  }
  const intent = INTENTS.find((i) => i.id === id);
  if (intent) return intent.answer({ raw: '', norm: '', tokens: [] });
  return FALLBACK;
}

// ── quote / lead flow (one question at a time) ───────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{8,20}$/;

export const QUOTE_INTRO = 'Great — I’ll grab a few details and our team will follow up.';

export const QUOTE_STEPS = [
  {
    key: 'name',
    prompt: 'First up, what’s your name?',
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
