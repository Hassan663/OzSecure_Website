import mongoose from 'mongoose';

// Used only when MONGODB_URI is set (loaded lazily by the mongo store).
// Image bytes are stored base64 in the DB so they survive Render's ephemeral
// filesystem (no external object store). `data` is excluded from list queries.
const MediaSchema = new mongoose.Schema(
  {
    filename: { type: String, trim: true },
    contentType: { type: String, trim: true },
    size: { type: Number, default: 0 },
    data: { type: String }, // base64
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export default mongoose.models.Media || mongoose.model('Media', MediaSchema);
