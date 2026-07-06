import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import quoteRouter from './src/routes/quote.js';
import adminRouter from './src/routes/admin.js';
import contentRouter from './src/routes/content.js';
import mediaRouter from './src/routes/media.js';
import { initStore } from './src/store/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Render (and most PaaS) sit behind a reverse proxy. Trust the first proxy so
// req.ip is the real client IP — needed for correct per-IP rate limiting.
app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json({ limit: '100kb' }));

const allowed = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin / curl (no origin) and any whitelisted origin
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
  })
);

// Limit quote submissions: 5 per 10 minutes per IP
const quoteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many requests. Please try again shortly or call 0450 717 765.' },
});

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'ozsecure-api' }));
app.use('/api/quote', quoteLimiter, quoteRouter);
app.use('/api/content', contentRouter);
app.use('/api/media', mediaRouter);
app.use('/api/admin', adminRouter);

app.use((_req, res) => res.status(404).json({ ok: false, message: 'Not found' }));

// Initialise storage (Mongo or JSON) before accepting traffic.
initStore()
  .then(() => {
    // Bind to 0.0.0.0 on the platform-assigned port (required by Render/most PaaS).
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`OzSecure API listening on 0.0.0.0:${PORT}`);
      if (!process.env.ADMIN_PASSWORD) {
        console.warn('⚠  ADMIN_PASSWORD not set — using dev default "admin123". Set ADMIN_PASSWORD in production!');
      }
      if (!process.env.JWT_SECRET) {
        console.warn('⚠  JWT_SECRET not set — using an insecure dev default. Set JWT_SECRET in production!');
      }
    });
  })
  .catch((err) => {
    console.error('Failed to initialise storage:', err);
    process.exit(1);
  });
