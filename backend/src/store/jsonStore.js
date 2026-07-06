import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { normalizeService } from '../data/servicesDefaults.js';
import { normalizeJob } from '../data/jobsDefaults.js';
import { normalizeTestimonial } from '../data/testimonialsDefaults.js';

/**
 * Local JSON-file store — the zero-dependency fallback used when MONGODB_URI is
 * not set. Same interface as the Mongo store. Writes are serialised through an
 * in-process queue (read-modify-write) and written atomically (temp + rename),
 * which is "concurrent-safe enough" for a single Node instance.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data'); // backend/data
const FILE = path.join(DATA_DIR, 'queries.json');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json'); // generic key/value content
const SERVICES_FILE = path.join(DATA_DIR, 'services.json'); // services collection
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json'); // jobs collection
const TESTIMONIALS_FILE = path.join(DATA_DIR, 'testimonials.json'); // testimonials collection
const MEDIA_FILE = path.join(DATA_DIR, 'media.json'); // uploaded images (base64)

const ALLOWED = ['name', 'company', 'email', 'phone', 'service', 'location', 'message'];

// Simple promise-chain mutex so read-modify-write sequences don't interleave.
let chain = Promise.resolve();
function withLock(fn) {
  const run = chain.then(fn, fn);
  // keep the chain alive but swallow errors so one failure doesn't poison it
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, '[]', 'utf8');
  }
}

async function readAll() {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    const data = JSON.parse(raw || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeAll(arr) {
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(arr, null, 2), 'utf8');
  await fs.rename(tmp, FILE);
}

// --- generic content store (key/value JSON object in content.json) ---
async function ensureContentFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CONTENT_FILE);
  } catch {
    await fs.writeFile(CONTENT_FILE, '{}', 'utf8');
  }
}

async function readContent() {
  try {
    const raw = await fs.readFile(CONTENT_FILE, 'utf8');
    const data = JSON.parse(raw || '{}');
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

async function writeContent(obj) {
  const tmp = `${CONTENT_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(obj, null, 2), 'utf8');
  await fs.rename(tmp, CONTENT_FILE);
}

// --- services collection (array in services.json) ---
async function ensureServicesFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(SERVICES_FILE);
  } catch {
    await fs.writeFile(SERVICES_FILE, '[]', 'utf8');
  }
}

async function readServices() {
  try {
    const raw = await fs.readFile(SERVICES_FILE, 'utf8');
    const data = JSON.parse(raw || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeServices(arr) {
  const tmp = `${SERVICES_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(arr, null, 2), 'utf8');
  await fs.rename(tmp, SERVICES_FILE);
}

const bySortOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.title || '').localeCompare(b.title || '');

/**
 * Generic array-collection factory (list + CRUD + reorder) backed by one JSON
 * file. Shared by jobs & testimonials — same interface as their mongo stores.
 * `sortFn` orders the list; `normalize` coerces incoming payloads.
 */
function jsonCollection(file, normalize, sortFn) {
  const ensure = async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, '[]', 'utf8');
    }
  };
  const readAll = async () => {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const data = JSON.parse(raw || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };
  const writeAll = async (arr) => {
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(arr, null, 2), 'utf8');
    await fs.rename(tmp, file);
  };

  return {
    ensure,
    async list({ activeOnly = false } = {}) {
      const all = (await readAll()).slice().sort(sortFn);
      return activeOnly ? all.filter((x) => x.active !== false) : all;
    },
    async getById(id) {
      const all = await readAll();
      return all.find((x) => x.id === id) || null;
    },
    async create(data) {
      const normalized = normalize(data);
      let record = null;
      await withLock(async () => {
        const all = await readAll();
        const order = Number.isFinite(Number(data.order))
          ? Number(data.order)
          : all.reduce((m, s) => Math.max(m, s.order ?? 0), -1) + 1;
        record = { id: crypto.randomUUID(), ...normalized, order, createdAt: new Date().toISOString() };
        all.push(record);
        await writeAll(all);
      });
      return record;
    },
    async update(id, data) {
      let updated = null;
      await withLock(async () => {
        const all = await readAll();
        const idx = all.findIndex((x) => x.id === id);
        if (idx === -1) return;
        const merged = normalize({ ...all[idx], ...data });
        updated = { ...all[idx], ...merged, id, updatedAt: new Date().toISOString() };
        all[idx] = updated;
        await writeAll(all);
      });
      return updated;
    },
    async remove(id) {
      let ok = false;
      await withLock(async () => {
        const all = await readAll();
        const next = all.filter((x) => x.id !== id);
        if (next.length !== all.length) {
          ok = true;
          await writeAll(next);
        }
      });
      return ok;
    },
    async reorder(ids) {
      await withLock(async () => {
        const all = await readAll();
        const pos = new Map(ids.map((id, i) => [id, i]));
        for (const x of all) if (pos.has(x.id)) x.order = pos.get(x.id);
        await writeAll(all);
      });
      return (await readAll()).slice().sort(sortFn);
    },
  };
}

const byOrderThenNewest = (a, b) =>
  (a.order ?? 0) - (b.order ?? 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

export async function init() {
  await ensureFile();
  await ensureContentFile();
  await ensureServicesFile();

  const jobs = jsonCollection(JOBS_FILE, normalizeJob, byOrderThenNewest);
  const testimonials = jsonCollection(TESTIMONIALS_FILE, normalizeTestimonial, byOrder);
  await jobs.ensure();
  await testimonials.ensure();

  // media store (base64 images in media.json)
  const readMedia = async () => {
    try {
      const raw = await fs.readFile(MEDIA_FILE, 'utf8');
      const d = JSON.parse(raw || '[]');
      return Array.isArray(d) ? d : [];
    } catch {
      return [];
    }
  };
  const writeMedia = async (arr) => {
    const tmp = `${MEDIA_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(arr), 'utf8');
    await fs.rename(tmp, MEDIA_FILE);
  };
  try {
    await fs.access(MEDIA_FILE);
  } catch {
    await fs.writeFile(MEDIA_FILE, '[]', 'utf8');
  }
  const mediaMeta = ({ data, ...rest }) => rest; // strip heavy base64 for lists

  return {
    async createQuery(data) {
      const record = {
        id: crypto.randomUUID(),
        ...Object.fromEntries(ALLOWED.map((k) => [k, (data[k] ?? '').toString().trim()])),
        status: 'new',
        source: data.source || 'website',
        emailSent: false,
        createdAt: new Date().toISOString(),
      };
      await withLock(async () => {
        const all = await readAll();
        all.push(record);
        await writeAll(all);
      });
      return record;
    },

    async markEmailSent(id, sent) {
      await withLock(async () => {
        const all = await readAll();
        const q = all.find((x) => x.id === id);
        if (q) {
          q.emailSent = !!sent;
          await writeAll(all);
        }
      });
    },

    async listQueries({ status, page = 1, limit = 20 } = {}) {
      const all = await readAll();
      let items = all.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (status && status !== 'all') items = items.filter((q) => q.status === status);
      const total = items.length;
      const p = Math.max(1, Number(page) || 1);
      const l = Math.max(1, Math.min(100, Number(limit) || 20));
      const start = (p - 1) * l;
      return { items: items.slice(start, start + l), total, page: p, limit: l, pages: Math.max(1, Math.ceil(total / l)) };
    },

    async getQuery(id) {
      const all = await readAll();
      return all.find((q) => q.id === id) || null;
    },

    async updateStatus(id, status) {
      let updated = null;
      await withLock(async () => {
        const all = await readAll();
        const q = all.find((x) => x.id === id);
        if (q) {
          q.status = status;
          updated = q;
          await writeAll(all);
        }
      });
      return updated;
    },

    async deleteQuery(id) {
      let ok = false;
      await withLock(async () => {
        const all = await readAll();
        const next = all.filter((q) => q.id !== id);
        if (next.length !== all.length) {
          ok = true;
          await writeAll(next);
        }
      });
      return ok;
    },

    async getStats() {
      const all = await readAll();
      const stats = { new: 0, read: 0, archived: 0, total: all.length };
      for (const q of all) if (stats[q.status] !== undefined) stats[q.status] += 1;
      return stats;
    },

    // --- generic content CRUD (same interface as the mongo store) ---
    async getContent(key) {
      const all = await readContent();
      return Object.prototype.hasOwnProperty.call(all, key) ? all[key] : null;
    },

    async setContent(key, value) {
      await withLock(async () => {
        const all = await readContent();
        all[key] = value;
        await writeContent(all);
      });
      return value;
    },

    // --- services collection CRUD + reorder (same interface as the mongo store) ---
    async listServices({ activeOnly = false } = {}) {
      const all = await readServices();
      const items = all.slice().sort(bySortOrder);
      return activeOnly ? items.filter((s) => s.active !== false) : items;
    },

    async getServiceBySlug(slug) {
      const all = await readServices();
      return all.find((s) => s.slug === slug) || null;
    },

    async getServiceById(id) {
      const all = await readServices();
      return all.find((s) => s.id === id) || null;
    },

    async createService(data) {
      const normalized = normalizeService(data);
      let record = null;
      await withLock(async () => {
        const all = await readServices();
        const order = Number.isFinite(Number(data.order))
          ? Number(data.order)
          : all.reduce((m, s) => Math.max(m, s.order ?? 0), -1) + 1;
        record = { id: crypto.randomUUID(), ...normalized, order, createdAt: new Date().toISOString() };
        all.push(record);
        await writeServices(all);
      });
      return record;
    },

    async updateService(id, data) {
      let updated = null;
      await withLock(async () => {
        const all = await readServices();
        const idx = all.findIndex((s) => s.id === id);
        if (idx === -1) return;
        const merged = normalizeService({ ...all[idx], ...data });
        updated = { ...all[idx], ...merged, id, updatedAt: new Date().toISOString() };
        all[idx] = updated;
        await writeServices(all);
      });
      return updated;
    },

    async deleteService(id) {
      let ok = false;
      await withLock(async () => {
        const all = await readServices();
        const next = all.filter((s) => s.id !== id);
        if (next.length !== all.length) {
          ok = true;
          await writeServices(next);
        }
      });
      return ok;
    },

    async reorderServices(ids) {
      await withLock(async () => {
        const all = await readServices();
        const pos = new Map(ids.map((id, i) => [id, i]));
        for (const s of all) {
          if (pos.has(s.id)) s.order = pos.get(s.id);
        }
        await writeServices(all);
      });
      const all = await readServices();
      return all.slice().sort(bySortOrder);
    },

    // --- jobs collection (generic) ---
    listJobs: (opts) => jobs.list(opts),
    getJobById: (id) => jobs.getById(id),
    createJob: (data) => jobs.create(data),
    updateJob: (id, data) => jobs.update(id, data),
    deleteJob: (id) => jobs.remove(id),

    // --- testimonials collection (generic) ---
    listTestimonials: (opts) => testimonials.list(opts),
    getTestimonialById: (id) => testimonials.getById(id),
    createTestimonial: (data) => testimonials.create(data),
    updateTestimonial: (id, data) => testimonials.update(id, data),
    deleteTestimonial: (id) => testimonials.remove(id),
    reorderTestimonials: (ids) => testimonials.reorder(ids),

    // --- media (uploaded images) ---
    async createMedia({ filename, contentType, size, data }) {
      const record = { id: crypto.randomUUID(), filename, contentType, size, data, createdAt: new Date().toISOString() };
      await withLock(async () => {
        const all = await readMedia();
        all.push(record);
        await writeMedia(all);
      });
      return mediaMeta(record);
    },
    async getMedia(id) {
      const all = await readMedia();
      return all.find((m) => m.id === id) || null;
    },
    async listMedia() {
      const all = await readMedia();
      return all
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(mediaMeta);
    },
    async deleteMedia(id) {
      let ok = false;
      await withLock(async () => {
        const all = await readMedia();
        const next = all.filter((m) => m.id !== id);
        if (next.length !== all.length) {
          ok = true;
          await writeMedia(next);
        }
      });
      return ok;
    },
  };
}
