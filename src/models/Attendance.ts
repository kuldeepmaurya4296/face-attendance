import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  date: { type: Date, required: true },
  check_in: { type: Date },
  check_out: { type: Date },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half-Day', 'On-Leave', 'Holiday', 'Weekend', 'Early-Departure'],
    default: 'Present'
  },
  mode: { type: String, enum: ['SELF', 'KIOSK', 'MANUAL'], required: true },
  work_hours: { type: Number, default: 0 },
  is_overtime: { type: Boolean, default: false },
  overtime_hours: { type: Number, default: 0 },
  is_late: { type: Boolean, default: false },
  late_minutes: { type: Number, default: 0 },
  is_early_departure: { type: Boolean, default: false },
  early_departure_minutes: { type: Number, default: 0 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

attendanceSchema.index({ user_id: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
