import { Router } from 'express';
import * as store from '../store/index.js';

/**
 * Public, read-only media serving. Streams the stored image bytes with the
 * correct content-type + long cache. `Cross-Origin-Resource-Policy: cross-origin`
 * lets the frontend (a different origin) embed these in <img>/next/image.
 */
const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const media = await store.getMedia(req.params.id);
    if (!media || !media.data) return res.status(404).json({ ok: false, message: 'Not found' });
    const buf = Buffer.from(media.data, 'base64');
    res.set('Content-Type', media.contentType || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.send(buf);
  } catch (err) {
    console.error('media serve failed:', err.message);
    return res.status(404).json({ ok: false, message: 'Not found' });
  }
});

export default router;
