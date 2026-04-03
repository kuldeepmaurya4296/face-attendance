import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  year: { type: Number, required: true },
  balances: {
    casual: {
      total: { type: Number, default: 12 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 12 },
    },
    sick: {
      total: { type: Number, default: 6 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 6 },
    },
    earned: {
      total: { type: Number, default: 15 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 15 },
    },
    unpaid: {
      total: { type: Number, default: -1 }, // -1 = unlimited
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: -1 },
    },
  },
}, { timestamps: true });

leaveBalanceSchema.index({ user_id: 1, year: 1 }, { unique: true });
leaveBalanceSchema.index({ company_id: 1, year: 1 });

const LeaveBalance = mongoose.models.LeaveBalance || mongoose.model('LeaveBalance', leaveBalanceSchema);
export default LeaveBalance;
