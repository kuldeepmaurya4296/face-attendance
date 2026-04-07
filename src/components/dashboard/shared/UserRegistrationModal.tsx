'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CameraCapture } from '@/components/CameraCapture';
import { Loader2, Camera, Trash2, AlertTriangle, CheckCircle2, X, User, Briefcase, IdCard, Phone, Mail, Lock, ShieldCheck, Building } from 'lucide-react';

interface Props {
  onClose: () => void;
  onRefresh: () => void;
  editUser?: any;
}

export default function UserRegistrationModal({ onClose, onRefresh, editUser }: Props) {
  const { user: currentUser } = useAuth();
  const orgType = currentUser?.org_type || 'Company';
  const isEditing = !!editUser;

  const [formData, setFormData] = useState({
    name: editUser?.name || '', 
    email: editUser?.email || '', 
    password: '', 
    role: editUser?.role || 'User', 
    phone: editUser?.phone || '',
    // Employee fields
    employee_id: editUser?.employee_id || '', 
    designation: editUser?.designation || '', 
    department: editUser?.department || '', 
    joining_date: editUser?.joining_date ? new Date(editUser.joining_date).toISOString().split('T')[0] : '',
    // Student fields
    roll_number: editUser?.roll_number || '', 
    class_name: editUser?.class_name || '', 
    section: editUser?.section || '', 
    enrollment_year: editUser?.enrollment_year?.toString() || '', 
    parent_phone: editUser?.parent_phone || ''
  });

  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !faceImage) return setError("Face ID is required. Please capture a photo.");
    
    setLoading(true);
    setError('');

    try {
      let embeddings = null;

      // 1. Get face embeddings via ML engine (only if new image provided)
      if (faceImage) {
        const mlForm = new FormData();
        mlForm.append('file', faceImage);
        
        const mlRes = await fetch(`/api/ml/register`, { method: 'POST', body: mlForm });
        const mlData = await mlRes.json();
        
        if (!mlData.success) {
          setError(mlData.detail || 'Face extraction failed.');
          setLoading(false);
          return;
        }
        embeddings = mlData.embeddings;

        // 2. Check for duplicate face (only if updating face)
        const galleryRes = await api.get(`/users/gallery/${currentUser?.company_id}`);
        const gallery = galleryRes.data?.success && galleryRes.data?.data ? galleryRes.data.data : galleryRes.data;
        
        if (gallery && gallery.length > 0) {
          const dupForm = new FormData();
          dupForm.append('file', faceImage);
          dupForm.append('gallery_data', JSON.stringify(gallery));
          
          const dupRes = await fetch(`/api/ml/check-duplicate`, { method: 'POST', body: dupForm });
          const dupData = await dupRes.json();
          
          if (dupData.duplicate && dupData.matched_user_id !== editUser?._id) {
            setError(`Face already registered to another account.`);
            setLoading(false);
            return;
          }
        }
      }

      // 3. Prepare payload
      const payload: any = {
        ...formData,
        company_id: currentUser?.company_id,
      };
      if (embeddings) payload.face_embeddings = embeddings;
      if (isEditing && !payload.password) delete payload.password;

      // Clean payload based on org type and schema types
      if (orgType === 'Institute') {
        if (payload.enrollment_year) {
          payload.enrollment_year = parseInt(payload.enrollment_year);
        } else {
          delete payload.enrollment_year;
        }
        // Remove company fields for institute
        delete payload.employee_id;
        delete payload.designation;
        delete payload.department;
        delete payload.joining_date;
      } else {
        // Remove institute fields for company
        delete payload.roll_number;
        delete payload.class_name;
        delete payload.section;
        delete payload.enrollment_year;
        delete payload.parent_phone;
      }

      if (isEditing) {
        await api.put(`/users/${editUser._id}`, payload);
      } else {
        await api.post('/auth/register', payload);
      }

      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || `${isEditing ? 'Update' : 'Registration'} failed.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
      <div className="border border-white/20 rounded-2xl bg-white max-w-4xl w-full flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-[20px] font-bold tracking-tight">{isEditing ? 'Update Identity' : `Onboard ${orgType === 'Institute' ? 'Student' : 'Employee'}`}</h3>
              <p className="text-[12px] text-muted font-medium">{isEditing ? `Modify details for ${formData.name}` : 'Add a new verified identity to the system'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-colors text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-8 flex flex-col lg:flex-row gap-8 overflow-y-auto max-h-[70vh]">
            
            {/* Left Side: Form */}
            <div className="flex-[1.5] space-y-8">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-danger text-[13px] font-bold flex items-center gap-3 animate-pulse">
                  <AlertTriangle size={18} /> {error}
                </div>
              )}

              <div className="space-y-6">
                <SectionHeader icon={ShieldCheck} title="Account Credentials" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Full Name" icon={User} required value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} placeholder="John Doe" />
                  <InputField label="Email Address" icon={Mail} required type="email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} placeholder="john@example.com" />
                  <InputField label={`Secure Password ${isEditing ? '(Optional)' : ''}`} icon={Lock} required={!isEditing} type="password" minLength={6} value={formData.password} onChange={(v: string) => setFormData({...formData, password: v})} placeholder={isEditing ? "••••••••" : "Create new password"} />
                  <InputField label="Phone Number" icon={Phone} value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} placeholder="+1 234 567 890" />
                </div>
              </div>

              <div className="space-y-6">
                <SectionHeader icon={Briefcase} title={orgType === 'Institute' ? 'Academic Details' : 'Professional Profile'} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orgType === 'Company' ? (
                    <>
                      <InputField label="Employee ID" icon={IdCard} value={formData.employee_id} onChange={(v: string) => setFormData({...formData, employee_id: v})} placeholder="EMP-001" />
                      <InputField label="Department" icon={Building} value={formData.department} onChange={(v: string) => setFormData({...formData, department: v})} placeholder="Engineering" />
                      <InputField label="Designation" icon={Briefcase} value={formData.designation} onChange={(v: string) => setFormData({...formData, designation: v})} placeholder="Senior Dev" />
                      <div className="space-y-1.5 flex flex-col">
                        <label className="text-[12px] font-bold text-muted uppercase tracking-wider">Joining Date</label>
                        <input type="date" value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} className="w-full bg-surface border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[14px] font-medium transition-all" />
                      </div>
                    </>
                  ) : (
                    <>
                      <InputField label="Roll Number" icon={IdCard} value={formData.roll_number} onChange={(v: string) => setFormData({...formData, roll_number: v})} placeholder="2024-CS-01" />
                      <InputField label="Class / Course" icon={Briefcase} value={formData.class_name} onChange={(v: string) => setFormData({...formData, class_name: v})} placeholder="B.Tech CS" />
                      <InputField label="Section" value={formData.section} onChange={(v: string) => setFormData({...formData, section: v})} placeholder="A" />
                      <InputField label="Enrollment Year" value={formData.enrollment_year} onChange={(v: string) => setFormData({...formData, enrollment_year: v})} placeholder="2024" />
                      <InputField label="Parent / Guardian Phone" icon={Phone} value={formData.parent_phone} onChange={(v: string) => setFormData({...formData, parent_phone: v})} placeholder="+1 234..." />
                    </>
                  )}
                  
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-bold text-muted uppercase tracking-wider">Organizational Level</label>
                    <select 
                      value={formData.role} 
                      onChange={e => setFormData({...formData, role: e.target.value})} 
                      className="w-full bg-surface border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[14px] font-bold transition-all appearance-none cursor-pointer"
                    >
                      <option value="User">Standard {orgType === 'Institute' ? 'Student' : 'Staff'}</option>
                      {currentUser?.role === 'SuperAdmin' && <option value="Admin">Administrative Access (Manager/Admin)</option>}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Face Capture */}
            <div className="flex-1 space-y-6">
              <SectionHeader icon={Camera} title={isEditing ? "Update Biometrics" : "Identity Verification"} />
              
              <div className={`relative rounded-2xl border-2 border-dashed transition-all duration-500 overflow-hidden min-h-[360px] flex items-center justify-center bg-gray-50/50 ${faceImage ? 'border-success bg-success/5' : 'border-primary/20'}`}>
                {faceImage ? (
                  <div className="relative w-full h-full p-4 flex flex-col items-center animate-in zoom-in-95 duration-500">
                    <div className="relative group">
                      <img src={URL.createObjectURL(faceImage)} className="w-[200px] h-[200px] object-cover rounded-2xl border-4 border-white shadow-2xl mx-auto" alt="Face" />
                      <div className="absolute inset-0 rounded-2xl bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <CheckCircle2 size={48} className="text-white" />
                      </div>
                    </div>
                    <div className="mt-6 text-center space-y-4">
                      <div className="space-y-1">
                        <p className="text-[15px] font-black tracking-tight text-success uppercase">Identity Captured</p>
                        <p className="text-[12px] text-muted font-medium">Clear Face ID detected successfully</p>
                      </div>
                      <button type="button" onClick={() => setFaceImage(null)} className="w-full px-6 py-3 bg-white border border-danger/20 text-danger rounded-xl text-[13px] font-black uppercase tracking-wider hover:bg-danger/5 transition-all flex items-center justify-center gap-2 shadow-sm">
                        <Trash2 size={16}/> Retake Capture
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex-1 relative">
                       <CameraCapture onCapture={setFaceImage} blinkMode={true} />
                       <div className="absolute inset-0 pointer-events-none border-[20px] border-black/5 flex items-center justify-center">
                          <div className="w-48 h-64 border border-primary/40 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 border-t-2 border-l-2 border-primary -translate-x-2 -translate-y-2 absolute top-0 left-0" />
                          </div>
                       </div>
                    </div>
                    <div className="p-4 bg-white/80 backdrop-blur-md border-t border-border-light text-center">
                      <p className="text-[12px] font-bold text-primary animate-pulse">Blink to {isEditing ? 'update' : 'auto-capture'} Face ID</p>
                    </div>
                  </div>
                )}
              </div>

              {!faceImage && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <IdCard size={16} />
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed font-medium">
                    {isEditing ? 'Biometric update is optional. Only capture if you need to re-verify the person.' : 'Ensure the subject is in a well-lit area. The scan will automatically capture when it detects a conscious blink for liveness verification.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 px-8 bg-gray-50 border-t border-border flex items-center justify-between">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-border bg-white text-[14px] font-bold hover:bg-surface transition-all text-muted">
              Discard
            </button>
            <div className="flex items-center gap-4">
               {faceImage && <CheckCircle2 size={24} className="text-success animate-in slide-in-from-right-4" />}
               <button 
                type="submit" 
                disabled={loading || (!isEditing && !faceImage)} 
                className="px-10 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[14px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/30 disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-95"
               >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (isEditing ? 'Save Changes' : 'Complete Onboarding')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
      <Icon size={16} className="text-primary" />
      <h4 className="text-[12px] font-black text-muted uppercase tracking-widest">{title}</h4>
    </div>
  );
}

function InputField({ label, icon: Icon, value, onChange, placeholder, required = false, type = "text", ...props }: { label: string, icon?: any, value: string, onChange: (v: string) => void, placeholder?: string, required?: boolean, type?: string, [key: string]: any }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-bold text-muted uppercase tracking-wider">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <div className="relative group">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />}
        <input 
          {...props}
          type={type}
          required={required}
          value={value} 
          onChange={e => onChange(e.target.value)} 
          placeholder={placeholder}
          className={`w-full bg-surface border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[14px] font-medium transition-all ${Icon ? 'pl-10' : 'pl-3'} p-3`}
        />
      </div>
    </div>
  );
}