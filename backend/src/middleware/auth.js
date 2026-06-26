import jwt from 'jsonwebtoken';

// Dev default ONLY when the env var is missing, so the panel works today.
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-jwt-secret-change-me';

/** Verifies a Bearer JWT on protected admin routes. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Invalid or expired token' });
  }
}
