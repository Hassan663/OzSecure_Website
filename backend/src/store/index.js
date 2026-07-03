/**
 * Storage adapter. Picks MongoDB when MONGODB_URI is set, otherwise a local
 * JSON-file store — both expose the identical interface, so the rest of the app
 * never knows which is active. Add MONGODB_URI later and it switches with zero
 * code changes.
 */
import { siteSettingsDefaults } from '../data/siteDefaults.js';
import { servicesDefaults } from '../data/servicesDefaults.js';
import { jobsDefaults } from '../data/jobsDefaults.js';
import { testimonialsDefaults } from '../data/testimonialsDefaults.js';
import { homepageDefaults } from '../data/homepageDefaults.js';

let impl = null;

export async function initStore() {
  if (process.env.MONGODB_URI) {
    const mod = await import('./mongoStore.js');
    impl = await mod.init();
    console.log('Storage: MongoDB');
  } else {
    const mod = await import('./jsonStore.js');
    impl = await mod.init();
    console.log('Storage: local JSON file (set MONGODB_URI to use MongoDB)');
  }
  await seedDefaults();
  return impl;
}

// Seed dynamic content from the bundled defaults on first run (only if empty),
// so the store is never blank. Idempotent — safe to run on every cold start.
async function seedDefaults() {
  try {
    const existing = await impl.getContent('siteSettings');
    if (!existing) {
      await impl.setContent('siteSettings', siteSettingsDefaults);
      console.log('Seeded default siteSettings into content store.');
    }
    const homepage = await impl.getContent('homepage');
    if (!homepage) {
      await impl.setContent('homepage', homepageDefaults);
      console.log('Seeded default homepage into content store.');
    }
    const services = await impl.listServices();
    if (!services.length) {
      for (const svc of servicesDefaults) await impl.createService(svc);
      console.log(`Seeded ${servicesDefaults.length} default services into content store.`);
    }
    const jobs = await impl.listJobs();
    if (!jobs.length) {
      for (const job of jobsDefaults) await impl.createJob(job);
      console.log(`Seeded ${jobsDefaults.length} default jobs into content store.`);
    }
    const testimonials = await impl.listTestimonials();
    if (!testimonials.length) {
      for (const t of testimonialsDefaults) await impl.createTestimonial(t);
      console.log(`Seeded ${testimonialsDefaults.length} default testimonials into content store.`);
    }
  } catch (err) {
    // Never block startup on seeding — the API layer still falls back to defaults.
    console.warn('Content seed skipped:', err.message);
  }
}

const ensure = () => {
  if (!impl) throw new Error('Store not initialised — call initStore() first.');
  return impl;
};

export const createQuery = (data) => ensure().createQuery(data);
export const listQueries = (opts) => ensure().listQueries(opts);
export const getQuery = (id) => ensure().getQuery(id);
export const updateStatus = (id, status) => ensure().updateStatus(id, status);
export const deleteQuery = (id) => ensure().deleteQuery(id);
export const getStats = () => ensure().getStats();

// Generic content store (Mongo-or-JSON). getContent returns null when unset.
export const getContent = (key) => ensure().getContent(key);
export const setContent = (key, value) => ensure().setContent(key, value);

// Services collection (Mongo-or-JSON).
export const listServices = (opts) => ensure().listServices(opts);
export const getServiceBySlug = (slug) => ensure().getServiceBySlug(slug);
export const getServiceById = (id) => ensure().getServiceById(id);
export const createService = (data) => ensure().createService(data);
export const updateService = (id, data) => ensure().updateService(id, data);
export const deleteService = (id) => ensure().deleteService(id);
export const reorderServices = (ids) => ensure().reorderServices(ids);

// Jobs collection (Mongo-or-JSON).
export const listJobs = (opts) => ensure().listJobs(opts);
export const getJobById = (id) => ensure().getJobById(id);
export const createJob = (data) => ensure().createJob(data);
export const updateJob = (id, data) => ensure().updateJob(id, data);
export const deleteJob = (id) => ensure().deleteJob(id);

// Testimonials collection (Mongo-or-JSON).
export const listTestimonials = (opts) => ensure().listTestimonials(opts);
export const getTestimonialById = (id) => ensure().getTestimonialById(id);
export const createTestimonial = (data) => ensure().createTestimonial(data);
export const updateTestimonial = (id, data) => ensure().updateTestimonial(id, data);
export const deleteTestimonial = (id) => ensure().deleteTestimonial(id);
export const reorderTestimonials = (ids) => ensure().reorderTestimonials(ids);

// Media (uploaded images, stored base64 in the DB-backed store).
export const createMedia = (data) => ensure().createMedia(data);
export const getMedia = (id) => ensure().getMedia(id);
export const listMedia = () => ensure().listMedia();
export const deleteMedia = (id) => ensure().deleteMedia(id);
