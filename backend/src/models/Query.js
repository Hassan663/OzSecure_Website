import mongoose from 'mongoose';

// Used only when MONGODB_URI is set (loaded lazily by the mongo store).
const QuerySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    company: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    service: { type: String, trim: true },
    location: { type: String, trim: true },
    message: { type: String, trim: true },
    status: { type: String, enum: ['new', 'read', 'archived'], default: 'new', index: true },
    source: { type: String, default: 'website' },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export default mongoose.models.Query || mongoose.model('Query', QuerySchema);
