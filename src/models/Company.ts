import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  org_type: { type: String, enum: ['Company', 'Institute'], required: true },
  plan: { type: String, enum: ['Free', 'Paid'], default: 'Free' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  settings: {
    attendance_mode: { type: String, enum: ['SELF', 'KIOSK', 'BOTH'], default: 'KIOSK' },
    allow_self_checkin: { type: Boolean, default: false },
    shift_start: { type: String, default: '09:00' },
    shift_end: { type: String, default: '18:00' },
    late_threshold_minutes: { type: Number, default: 15 },
    early_departure_threshold_minutes: { type: Number, default: 15 },
    full_day_hours: { type: Number, default: 8 },
    half_day_hours: { type: Number, default: 4 },
    overtime_threshold_hours: { type: Number, default: 9 },
    weekend_days: { type: [Number], default: [0, 6] },
    auto_checkout_time: { type: String, default: '' },
    theme: { type: String, enum: ['Aura', 'Midnight', 'Emerald', 'Oceanic', 'Sunset'], default: 'Aura' }
  },
  admin_permissions: {
    manage_personnel: { type: Boolean, default: true },
    approve_leaves: { type: Boolean, default: true },
    view_attendance: { type: Boolean, default: true },
    manage_settings: { type: Boolean, default: false },
    manage_holidays: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Company || mongoose.model('Company', companySchema);
