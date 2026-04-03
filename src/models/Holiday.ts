import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  date: { type: Date, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Public', 'Company', 'Optional'], default: 'Public' },
  createdAt: { type: Date, default: Date.now }
});

holidaySchema.index({ company_id: 1, date: 1 }, { unique: true });

export default mongoose.models.Holiday || mongoose.model('Holiday', holidaySchema);
