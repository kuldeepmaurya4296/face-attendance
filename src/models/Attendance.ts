import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  date: { type: Date, required: true },
  check_in: { type: Date },
  check_out: { type: Date },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half-Day'], default: 'Present' },
  mode: { type: String, enum: ['SELF', 'KIOSK', 'MANUAL'], required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
