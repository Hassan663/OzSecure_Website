import mongoose from 'mongoose';

// Generic key/value content store — used only when MONGODB_URI is set (loaded
// lazily by the mongo store). One document per content key (e.g. 'siteSettings',
// and later 'services', 'homepage', …). `value` is arbitrary JSON.
const ContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.models.Content || mongoose.model('Content', ContentSchema);
