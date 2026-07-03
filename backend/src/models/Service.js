import mongoose from 'mongoose';

// Used only when MONGODB_URI is set (loaded lazily by the mongo store).
const ServiceSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    order: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true },
    icon: { type: String, trim: true, default: 'Shield' },
    title: { type: String, trim: true },
    image: { type: String, trim: true },
    alt: { type: String, trim: true },
    short: { type: String, trim: true },
    intro: { type: String, trim: true },
    badge: { type: String, trim: true },
    features: { type: [String], default: [] },
    overview: { type: [String], default: [] },
    industries: { type: [String], default: [] },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);
