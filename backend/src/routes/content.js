import { Router } from 'express';
import * as store from '../store/index.js';
import { mergeSiteSettings, siteSettingsDefaults } from '../data/siteDefaults.js';
import { servicesDefaults } from '../data/servicesDefaults.js';
import { testimonialsDefaults } from '../data/testimonialsDefaults.js';
import { mergeHomepage, homepageDefaults } from '../data/homepageDefaults.js';

/**
 * Public, read-only content API for the marketing site. No auth. Always returns
 * a fully-populated object (stored values merged over the bundled defaults), so
 * the website never renders blank — even if the store is empty or errors.
 */
const router = Router();

router.get('/site-settings', async (_req, res) => {
  try {
    const stored = await store.getContent('siteSettings');
    return res.json({ ok: true, settings: mergeSiteSettings(stored) });
  } catch (err) {
    console.error('site-settings read failed, serving defaults:', err.message);
    return res.json({ ok: true, settings: siteSettingsDefaults });
  }
});

// Active services, sorted by order. Falls back to bundled defaults on error.
router.get('/services', async (_req, res) => {
  try {
    const services = await store.listServices({ activeOnly: true });
    return res.json({ ok: true, services });
  } catch (err) {
    console.error('services read failed, serving defaults:', err.message);
    return res.json({ ok: true, services: servicesDefaults });
  }
});

// Single active service by slug. 404 when missing/inactive.
router.get('/services/:slug', async (req, res) => {
  try {
    const service = await store.getServiceBySlug(req.params.slug);
    if (!service || service.active === false) {
      return res.status(404).json({ ok: false, message: 'Service not found' });
    }
    return res.json({ ok: true, service });
  } catch (err) {
    console.error('service read failed:', err.message);
    const fallback = servicesDefaults.find((s) => s.slug === req.params.slug);
    if (fallback) return res.json({ ok: true, service: fallback });
    return res.status(404).json({ ok: false, message: 'Service not found' });
  }
});

// Active jobs (order, then newest). Empty list is a valid "no openings" state.
router.get('/jobs', async (_req, res) => {
  try {
    const jobs = await store.listJobs({ activeOnly: true });
    return res.json({ ok: true, jobs });
  } catch (err) {
    console.error('jobs read failed:', err.message);
    return res.json({ ok: true, jobs: [] });
  }
});

// Single active job by id. 404 when missing/inactive.
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await store.getJobById(req.params.id);
    if (!job || job.active === false) {
      return res.status(404).json({ ok: false, message: 'Job not found' });
    }
    return res.json({ ok: true, job });
  } catch (err) {
    console.error('job read failed:', err.message);
    return res.status(404).json({ ok: false, message: 'Job not found' });
  }
});

// Active testimonials, ordered. Falls back to the bundled default on error.
router.get('/testimonials', async (_req, res) => {
  try {
    const testimonials = await store.listTestimonials({ activeOnly: true });
    return res.json({ ok: true, testimonials });
  } catch (err) {
    console.error('testimonials read failed, serving defaults:', err.message);
    return res.json({ ok: true, testimonials: testimonialsDefaults });
  }
});

// Editable homepage content (merged over defaults so nothing is ever blank).
router.get('/homepage', async (_req, res) => {
  try {
    const stored = await store.getContent('homepage');
    return res.json({ ok: true, homepage: mergeHomepage(stored) });
  } catch (err) {
    console.error('homepage read failed, serving defaults:', err.message);
    return res.json({ ok: true, homepage: homepageDefaults });
  }
});

export default router;
