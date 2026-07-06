import mongoose from 'mongoose';
import Query from '../models/Query.js';
import Content from '../models/Content.js';
import Service from '../models/Service.js';
import Job from '../models/Job.js';
import Testimonial from '../models/Testimonial.js';
import Media from '../models/Media.js';
import { normalizeService } from '../data/servicesDefaults.js';
import { normalizeJob } from '../data/jobsDefaults.js';
import { normalizeTestimonial } from '../data/testimonialsDefaults.js';

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
        emailSent: false,
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

    async markEmailSent(id, sent) {
      if (!mongoose.isValidObjectId(id)) return;
      await Query.findByIdAndUpdate(id, { emailSent: !!sent });
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

    // --- generic content CRUD (same interface as the JSON store) ---
    async getContent(key) {
      const doc = await Content.findOne({ key }).lean();
      return doc ? doc.value : null;
    },

    async setContent(key, value) {
      await Content.findOneAndUpdate(
        { key },
        { key, value, updatedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return value;
    },

    // --- services collection CRUD + reorder (same interface as the JSON store) ---
    async listServices({ activeOnly = false } = {}) {
      const filter = activeOnly ? { active: { $ne: false } } : {};
      const docs = await Service.find(filter).sort({ order: 1, title: 1 }).lean();
      return docs.map((d) => {
        const { _id, ...rest } = d;
        return { id: String(_id), ...rest };
      });
    },

    async getServiceBySlug(slug) {
      return toPlain(await Service.findOne({ slug }));
    },

    async getServiceById(id) {
      if (!mongoose.isValidObjectId(id)) return null;
      return toPlain(await Service.findById(id));
    },

    async createService(data) {
      const normalized = normalizeService(data);
      if (!Number.isFinite(Number(data.order))) {
        const last = await Service.findOne().sort({ order: -1 }).lean();
        normalized.order = (last?.order ?? -1) + 1;
      }
      return toPlain(await Service.create(normalized));
    },

    async updateService(id, data) {
      if (!mongoose.isValidObjectId(id)) return null;
      const existing = await Service.findById(id).lean();
      if (!existing) return null;
      const merged = normalizeService({ ...existing, ...data });
      return toPlain(await Service.findByIdAndUpdate(id, merged, { new: true }));
    },

    async deleteService(id) {
      if (!mongoose.isValidObjectId(id)) return false;
      return !!(await Service.findByIdAndDelete(id));
    },

    async reorderServices(ids) {
      const ops = ids
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id, i) => ({ updateOne: { filter: { _id: id }, update: { order: i } } }));
      if (ops.length) await Service.bulkWrite(ops);
      const docs = await Service.find().sort({ order: 1, title: 1 }).lean();
      return docs.map((d) => {
        const { _id, ...rest } = d;
        return { id: String(_id), ...rest };
      });
    },

    // --- jobs collection ---
    async listJobs({ activeOnly = false } = {}) {
      const filter = activeOnly ? { active: { $ne: false } } : {};
      const docs = await Job.find(filter).sort({ order: 1, createdAt: -1 }).lean();
      return docs.map((d) => {
        const { _id, ...rest } = d;
        return { id: String(_id), ...rest };
      });
    },
    async getJobById(id) {
      if (!mongoose.isValidObjectId(id)) return null;
      return toPlain(await Job.findById(id));
    },
    async createJob(data) {
      const normalized = normalizeJob(data);
      if (!Number.isFinite(Number(data.order))) {
        const last = await Job.findOne().sort({ order: -1 }).lean();
        normalized.order = (last?.order ?? -1) + 1;
      }
      return toPlain(await Job.create(normalized));
    },
    async updateJob(id, data) {
      if (!mongoose.isValidObjectId(id)) return null;
      const existing = await Job.findById(id).lean();
      if (!existing) return null;
      return toPlain(await Job.findByIdAndUpdate(id, normalizeJob({ ...existing, ...data }), { new: true }));
    },
    async deleteJob(id) {
      if (!mongoose.isValidObjectId(id)) return false;
      return !!(await Job.findByIdAndDelete(id));
    },

    // --- testimonials collection ---
    async listTestimonials({ activeOnly = false } = {}) {
      const filter = activeOnly ? { active: { $ne: false } } : {};
      const docs = await Testimonial.find(filter).sort({ order: 1 }).lean();
      return docs.map((d) => {
        const { _id, ...rest } = d;
        return { id: String(_id), ...rest };
      });
    },
    async getTestimonialById(id) {
      if (!mongoose.isValidObjectId(id)) return null;
      return toPlain(await Testimonial.findById(id));
    },
    async createTestimonial(data) {
      const normalized = normalizeTestimonial(data);
      if (!Number.isFinite(Number(data.order))) {
        const last = await Testimonial.findOne().sort({ order: -1 }).lean();
        normalized.order = (last?.order ?? -1) + 1;
      }
      return toPlain(await Testimonial.create(normalized));
    },
    async updateTestimonial(id, data) {
      if (!mongoose.isValidObjectId(id)) return null;
      const existing = await Testimonial.findById(id).lean();
      if (!existing) return null;
      return toPlain(await Testimonial.findByIdAndUpdate(id, normalizeTestimonial({ ...existing, ...data }), { new: true }));
    },
    async deleteTestimonial(id) {
      if (!mongoose.isValidObjectId(id)) return false;
      return !!(await Testimonial.findByIdAndDelete(id));
    },
    async reorderTestimonials(ids) {
      const ops = ids
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id, i) => ({ updateOne: { filter: { _id: id }, update: { order: i } } }));
      if (ops.length) await Testimonial.bulkWrite(ops);
      const docs = await Testimonial.find().sort({ order: 1 }).lean();
      return docs.map((d) => {
        const { _id, ...rest } = d;
        return { id: String(_id), ...rest };
      });
    },

    // --- media (uploaded images) ---
    async createMedia({ filename, contentType, size, data }) {
      const doc = await Media.create({ filename, contentType, size, data });
      const { _id, data: _d, ...rest } = doc.toObject();
      return { id: String(_id), ...rest };
    },
    async getMedia(id) {
      if (!mongoose.isValidObjectId(id)) return null;
      return toPlain(await Media.findById(id));
    },
    async listMedia() {
      const docs = await Media.find().select('-data').sort({ createdAt: -1 }).lean();
      return docs.map((d) => {
        const { _id, ...rest } = d;
        return { id: String(_id), ...rest };
      });
    },
    async deleteMedia(id) {
      if (!mongoose.isValidObjectId(id)) return false;
      return !!(await Media.findByIdAndDelete(id));
    },
  };
}
