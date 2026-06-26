import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { requireAuth, JWT_SECRET } from '../middleware/auth.js';
import * as store from '../store/index.js';

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

export default router;
