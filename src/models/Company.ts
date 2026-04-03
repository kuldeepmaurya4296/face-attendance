import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  plan: { type: String, enum: ['Free', 'Paid'], default: 'Free' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  settings: {
    attendance_mode: { type: String, enum: ['SELF', 'KIOSK', 'BOTH'], default: 'BOTH' },
    office_timing: { type: String, default: '09:00' }, // "HH:mm"
    late_threshold_minutes: { type: Number, default: 15 },
    theme: { type: String, enum: ['Aura', 'Midnight', 'Emerald', 'Oceanic', 'Sunset'], default: 'Aura' }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Company || mongoose.model('Company', companySchema);
