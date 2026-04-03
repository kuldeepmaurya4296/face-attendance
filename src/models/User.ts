import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Owner', 'SuperAdmin', 'Admin', 'User', 'Employee', 'Student'], 
    default: 'User' 
  },
  department: { type: String },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  face_embeddings: { type: [Number] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
