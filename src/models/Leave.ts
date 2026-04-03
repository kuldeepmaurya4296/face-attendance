import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  from_date: { type: Date, required: true },
  to_date: { type: Date, required: true },
  reason: { type: String, required: true },
  leave_type: { type: String, enum: ['Casual', 'Sick', 'Earned', 'Unpaid', 'Other'], default: 'Casual' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

leaveSchema.index({ company_id: 1, status: 1 });
leaveSchema.index({ user_id: 1, from_date: -1 });
leaveSchema.index({ company_id: 1, from_date: -1, to_date: 1 });

export default mongoose.models.Leave || mongoose.model('Leave', leaveSchema);
