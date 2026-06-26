import mongoose from 'mongoose';
import Query from '../models/Query.js';

/**
 * MongoDB store (Mongoose). Active only when MONGODB_URI is set. Returns the
 * exact same interface/shape as the JSON store — records normalised to `id`.
 */
function toPlain(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = o;
  return { id: String(_id), ...rest };
}

export async function init() {
  await mongoose.connect(process.env.MONGODB_URI);

  return {
    async createQuery(data) {
      const doc = await Query.create({
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        service: data.service,
        location: data.location,
        message: data.message,
        source: data.source || 'website',
      });
      return toPlain(doc);
    },

    async listQueries({ status, page = 1, limit = 20 } = {}) {
      const filter = status && status !== 'all' ? { status } : {};
      const p = Math.max(1, Number(page) || 1);
      const l = Math.max(1, Math.min(100, Number(limit) || 20));
      const [docs, total] = await Promise.all([
        Query.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
        Query.countDocuments(filter),
      ]);
      const items = docs.map((d) => {
        const { _id, ...rest } = d;
        return { id: String(_id), ...rest };
      });
      return { items, total, page: p, limit: l, pages: Math.max(1, Math.ceil(total / l)) };
    },

    async getQuery(id) {
      if (!mongoose.isValidObjectId(id)) return null;
      return toPlain(await Query.findById(id));
    },

    async updateStatus(id, status) {
      if (!mongoose.isValidObjectId(id)) return null;
      return toPlain(await Query.findByIdAndUpdate(id, { status }, { new: true }));
    },

    async deleteQuery(id) {
      if (!mongoose.isValidObjectId(id)) return false;
      const res = await Query.findByIdAndDelete(id);
      return !!res;
    },

    async getStats() {
      const rows = await Query.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
      const stats = { new: 0, read: 0, archived: 0, total: 0 };
      for (const r of rows) {
        if (stats[r._id] !== undefined) stats[r._id] = r.count;
        stats.total += r.count;
      }
      return stats;
    },
  };
}
