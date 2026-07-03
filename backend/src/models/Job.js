import mongoose from 'mongoose';

// Used only when MONGODB_URI is set (loaded lazily by the mongo store).
const JobSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    type: { type: String, trim: true, default: 'Casual' },
    location: { type: String, trim: true, default: 'Sydney & Greater NSW' },
    category: { type: String, trim: true, default: 'Other' },
    shortDescription: { type: String, trim: true },
    fullDescription: { type: String, trim: true },
    requirements: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export default mongoose.models.Job || mongoose.model('Job', JobSchema);
