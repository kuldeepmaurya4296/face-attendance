import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Owner', 'SuperAdmin', 'Admin', 'User'], 
    default: 'User' 
  },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  face_embeddings: { type: mongoose.Schema.Types.Mixed }, // Changed to Mixed to support encrypted Base64 strings and legacy arrays

  // === Common Fields ===
  phone: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },

  // === Employee-specific fields (org_type = 'Company') ===
  employee_id: { type: String },
  designation: { type: String },
  department: { type: String },
  joining_date: { type: Date },

  // === Student-specific fields (org_type = 'Institute') ===
  roll_number: { type: String },
  class_name: { type: String },
  section: { type: String },
  enrollment_year: { type: Number },
  parent_phone: { type: String },

  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ company_id: 1, status: 1, role: 1 });
userSchema.index({ company_id: 1, department: 1 });

export default mongoose.models.User || mongoose.model('User', userSchema);
