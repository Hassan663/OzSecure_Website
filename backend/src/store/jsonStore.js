import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

/**
 * Local JSON-file store — the zero-dependency fallback used when MONGODB_URI is
 * not set. Same interface as the Mongo store. Writes are serialised through an
 * in-process queue (read-modify-write) and written atomically (temp + rename),
 * which is "concurrent-safe enough" for a single Node instance.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data'); // backend/data
const FILE = path.join(DATA_DIR, 'queries.json');

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

export async function init() {
  await ensureFile();

  return {
    async createQuery(data) {
      const record = {
        id: crypto.randomUUID(),
        ...Object.fromEntries(ALLOWED.map((k) => [k, (data[k] ?? '').toString().trim()])),
        status: 'new',
        source: data.source || 'website',
        createdAt: new Date().toISOString(),
      };
      await withLock(async () => {
        const all = await readAll();
        all.push(record);
        await writeAll(all);
      });
      return record;
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
  };
}
