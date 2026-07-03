import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { requireAuth, JWT_SECRET } from '../middleware/auth.js';
import * as store from '../store/index.js';
import { mergeSiteSettings } from '../data/siteDefaults.js';
import { normalizeHomepage, mergeHomepage } from '../data/homepageDefaults.js';

const router = Router();

// Dev default ONLY when env is missing (see startup warning in server.js).
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const STATUSES = ['new', 'read', 'archived'];

// Throttle login attempts to slow brute force.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many login attempts. Try again later.' },
});

// --- public: login ---
router.post('/login', loginLimiter, (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: 'Incorrect password.' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ ok: true, token });
});

// --- everything below requires a valid Bearer token ---
router.use(requireAuth);

router.get('/stats', async (_req, res) => {
  res.json({ ok: true, stats: await store.getStats() });
});

router.get('/queries', async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await store.listQueries({
    status: status || undefined,
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  });
  res.json({ ok: true, ...result });
});

router.get('/queries/:id', async (req, res) => {
  const query = await store.getQuery(req.params.id);
  if (!query) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true, query });
});

router.patch('/queries/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ ok: false, message: 'Invalid status' });
  }
  const query = await store.updateStatus(req.params.id, status);
  if (!query) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true, query });
});

router.delete('/queries/:id', async (req, res) => {
  const ok = await store.deleteQuery(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true });
});

// --- site settings (dynamic content) ---
router.get('/site-settings', async (_req, res) => {
  const stored = await store.getContent('siteSettings');
  res.json({ ok: true, settings: mergeSiteSettings(stored) });
});

const SETTINGS_FIELDS = [
  'name', 'tagline', 'serviceLine', 'entity', 'mln', 'abn', 'yearsExperience',
  'phonePrimary', 'phonePrimaryTel', 'email', 'coverage', 'hours',
];

const settingsValidators = [
  body('name').trim().notEmpty().withMessage('Company name is required').isLength({ max: 120 }),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('phonePrimary').trim().notEmpty().withMessage('Phone number is required').isLength({ max: 40 }),
  body('phonePrimaryTel').trim().notEmpty().withMessage('Dial number (tel:) is required').isLength({ max: 40 }),
  body('tagline').optional({ nullable: true }).trim().isLength({ max: 160 }),
  body('serviceLine').optional({ nullable: true }).trim().isLength({ max: 160 }),
  body('entity').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('mln').optional({ nullable: true }).trim().isLength({ max: 60 }),
  body('abn').optional({ nullable: true }).trim().isLength({ max: 60 }),
  body('yearsExperience').optional({ nullable: true }).trim().isLength({ max: 20 }),
  body('coverage').optional({ nullable: true }).trim().isLength({ max: 120 }),
  body('hours').optional({ nullable: true }).trim().isLength({ max: 120 }),
  body('address.line1').optional({ nullable: true }).trim().isLength({ max: 160 }),
  body('address.line2').optional({ nullable: true }).trim().isLength({ max: 160 }),
];

router.put('/site-settings', settingsValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, message: errors.array()[0].msg, errors: errors.array().map((e) => e.msg) });
  }
  const b = req.body || {};
  const value = {
    ...Object.fromEntries(SETTINGS_FIELDS.map((k) => [k, (b[k] ?? '').toString().trim()])),
    address: {
      line1: (b.address?.line1 ?? '').toString().trim(),
      line2: (b.address?.line2 ?? '').toString().trim(),
    },
  };
  // Merge over defaults so a partial payload can never blank a required field.
  const merged = mergeSiteSettings(value);
  await store.setContent('siteSettings', merged);
  res.json({ ok: true, settings: merged });
});

// --- homepage content ---
router.get('/homepage', async (_req, res) => {
  const stored = await store.getContent('homepage');
  res.json({ ok: true, homepage: mergeHomepage(stored) });
});

router.put('/homepage', async (req, res) => {
  const b = req.body || {};
  if (!b.heroHeadline || !b.heroHeadline.toString().trim()) {
    return res.status(400).json({ ok: false, message: 'Hero headline is required' });
  }
  const merged = mergeHomepage(normalizeHomepage(b));
  await store.setContent('homepage', merged);
  res.json({ ok: true, homepage: merged });
});

// --- services management ---
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const serviceValidators = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
  body('slug')
    .trim()
    .notEmpty().withMessage('Slug is required')
    .isLength({ max: 80 })
    .matches(SLUG_RE).withMessage('Slug must be lowercase letters, numbers and hyphens (e.g. traffic-control)'),
  body('icon').optional({ nullable: true }).trim().isLength({ max: 40 }),
  body('short').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('intro').optional({ nullable: true }).trim().isLength({ max: 1200 }),
  body('badge').optional({ nullable: true }).trim().isLength({ max: 120 }),
  body('image').optional({ nullable: true }).trim().isLength({ max: 300 }),
  body('alt').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('order').optional({ nullable: true }).isInt().withMessage('Order must be a number'),
  body('active').optional({ nullable: true }).isBoolean().withMessage('Active must be true/false'),
  body('features').optional({ nullable: true }).isArray().withMessage('Features must be a list'),
  body('overview').optional({ nullable: true }).isArray().withMessage('Overview must be a list'),
  body('industries').optional({ nullable: true }).isArray().withMessage('Industries must be a list'),
];

const firstError = (req) => {
  const errors = validationResult(req);
  return errors.isEmpty() ? null : errors.array()[0].msg;
};

router.get('/services', async (_req, res) => {
  res.json({ ok: true, services: await store.listServices() });
});

router.post('/services', serviceValidators, async (req, res) => {
  const err = firstError(req);
  if (err) return res.status(400).json({ ok: false, message: err });
  const slug = req.body.slug.trim().toLowerCase();
  const all = await store.listServices();
  if (all.some((s) => s.slug === slug)) {
    return res.status(400).json({ ok: false, message: 'That slug is already in use.' });
  }
  const service = await store.createService(req.body);
  res.status(201).json({ ok: true, service });
});

// NOTE: defined before '/services/:id' routes, but methods differ so no clash.
router.patch('/services/reorder', async (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ ok: false, message: 'ids must be an array' });
  const services = await store.reorderServices(ids.map((x) => String(x)));
  res.json({ ok: true, services });
});

router.put('/services/:id', serviceValidators, async (req, res) => {
  const err = firstError(req);
  if (err) return res.status(400).json({ ok: false, message: err });
  const slug = req.body.slug.trim().toLowerCase();
  const all = await store.listServices();
  if (all.some((s) => s.slug === slug && s.id !== req.params.id)) {
    return res.status(400).json({ ok: false, message: 'That slug is already in use.' });
  }
  const service = await store.updateService(req.params.id, req.body);
  if (!service) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true, service });
});

router.delete('/services/:id', async (req, res) => {
  const ok = await store.deleteService(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true });
});

// --- jobs management ---
const jobValidators = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 140 }),
  body('type').optional({ nullable: true }).trim().isLength({ max: 40 }),
  body('location').optional({ nullable: true }).trim().isLength({ max: 120 }),
  body('category').optional({ nullable: true }).trim().isLength({ max: 60 }),
  body('shortDescription').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('fullDescription').optional({ nullable: true }).trim().isLength({ max: 6000 }),
  body('requirements').optional({ nullable: true }).isArray().withMessage('Requirements must be a list'),
  body('active').optional({ nullable: true }).isBoolean().withMessage('Active must be true/false'),
  body('order').optional({ nullable: true }).isInt().withMessage('Order must be a number'),
];

router.get('/jobs', async (_req, res) => {
  res.json({ ok: true, jobs: await store.listJobs() });
});

router.post('/jobs', jobValidators, async (req, res) => {
  const err = firstError(req);
  if (err) return res.status(400).json({ ok: false, message: err });
  res.status(201).json({ ok: true, job: await store.createJob(req.body) });
});

router.put('/jobs/:id', jobValidators, async (req, res) => {
  const err = firstError(req);
  if (err) return res.status(400).json({ ok: false, message: err });
  const job = await store.updateJob(req.params.id, req.body);
  if (!job) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true, job });
});

// Toggle active without sending the whole payload.
router.patch('/jobs/:id/active', async (req, res) => {
  const { active } = req.body || {};
  const job = await store.updateJob(req.params.id, { active: active !== false });
  if (!job) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true, job });
});

router.delete('/jobs/:id', async (req, res) => {
  const ok = await store.deleteJob(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true });
});

// --- testimonials management ---
const testimonialValidators = [
  body('quote').trim().notEmpty().withMessage('Quote is required').isLength({ max: 1200 }),
  body('authorName').optional({ nullable: true }).trim().isLength({ max: 120 }),
  body('company').optional({ nullable: true }).trim().isLength({ max: 160 }),
  body('rating').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
  body('active').optional({ nullable: true }).isBoolean().withMessage('Active must be true/false'),
  body('order').optional({ nullable: true }).isInt().withMessage('Order must be a number'),
];

router.get('/testimonials', async (_req, res) => {
  res.json({ ok: true, testimonials: await store.listTestimonials() });
});

router.post('/testimonials', testimonialValidators, async (req, res) => {
  const err = firstError(req);
  if (err) return res.status(400).json({ ok: false, message: err });
  res.status(201).json({ ok: true, testimonial: await store.createTestimonial(req.body) });
});

router.patch('/testimonials/reorder', async (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ ok: false, message: 'ids must be an array' });
  res.json({ ok: true, testimonials: await store.reorderTestimonials(ids.map((x) => String(x))) });
});

router.put('/testimonials/:id', testimonialValidators, async (req, res) => {
  const err = firstError(req);
  if (err) return res.status(400).json({ ok: false, message: err });
  const testimonial = await store.updateTestimonial(req.params.id, req.body);
  if (!testimonial) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true, testimonial });
});

router.patch('/testimonials/:id/active', async (req, res) => {
  const { active } = req.body || {};
  const testimonial = await store.updateTestimonial(req.params.id, { active: active !== false });
  if (!testimonial) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true, testimonial });
});

router.delete('/testimonials/:id', async (req, res) => {
  const ok = await store.deleteTestimonial(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true });
});

// --- media (image uploads) ---
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    return cb(new Error('Only JPG, PNG or WebP images are allowed'));
  },
});

router.post('/media/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 3 MB)' : err.message;
      return res.status(400).json({ ok: false, message: msg });
    }
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file uploaded' });
    const media = await store.createMedia({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer.toString('base64'),
    });
    res.status(201).json({ ok: true, media, url: `/api/media/${media.id}` });
  });
});

router.get('/media', async (_req, res) => {
  const media = (await store.listMedia()).map((m) => ({ ...m, url: `/api/media/${m.id}` }));
  res.json({ ok: true, media });
});

router.delete('/media/:id', async (req, res) => {
  const ok = await store.deleteMedia(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true });
});

export default router;
