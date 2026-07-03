import mongoose from 'mongoose';

// Used only when MONGODB_URI is set (loaded lazily by the mongo store).
const TestimonialSchema = new mongoose.Schema(
  {
    quote: { type: String, trim: true },
    authorName: { type: String, trim: true },
    company: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5, default: null },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema);
