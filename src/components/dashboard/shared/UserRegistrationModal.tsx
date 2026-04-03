'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CameraCapture } from '@/components/CameraCapture';
import { Loader2, Camera, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
  onRefresh: () => void;
}

export default function UserRegistrationModal({ onClose, onRefresh }: Props) {
  const { user } = useAuth();
  const orgType = user?.org_type || 'Company';

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'User', phone: '',
    // Employee fields
    employee_id: '', designation: '', department: '', joining_date: '',
    // Student fields
    roll_number: '', class_name: '', section: '', enrollment_year: '', parent_phone: ''
  });

  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faceImage) return setError("Face ID is required. Please capture a photo.");
    
    setLoading(true);
    setError('');

    try {
      // 1. Get face embeddings via ML engine
      const mlForm = new FormData();
      mlForm.append('file', faceImage);
      
      const mlRes = await fetch(`/api/ml/register`, { method: 'POST', body: mlForm });
      const mlData = await mlRes.json();
      
      if (!mlData.success) {
        setError(mlData.detail || 'Face extraction failed.');
        setLoading(false);
        return;
      }

      // 2. Check for duplicate face
      const galleryRes = await api.get(`/users/gallery/${user?.company_id}`);
      const gallery = galleryRes.data;
      
      if (gallery.length > 0) {
        const dupForm = new FormData();
        dupForm.append('file', faceImage);
        dupForm.append('gallery_data', JSON.stringify(gallery));
        
        const dupRes = await fetch(`/api/ml/check-duplicate`, { method: 'POST', body: dupForm });
        const dupData = await dupRes.json();
        
        if (dupData.duplicate) {
          setError(`Face already registered. Each person can only have one account.`);
          setLoading(false);
          return;
        }
      }

      // 3. Register user
      await api.post('/auth/register', {
        ...formData,
        company_id: user?.company_id,
        face_embeddings: mlData.embeddings
      });

      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/40 overflow-y-auto">
      <div className="border border-border rounded-lg bg-white max-w-2xl w-full p-6 md:p-8 space-y-6 my-8 relative">
        
        <div className="text-center">
          <h3 className="text-[24px] font-bold">Register {orgType === 'Institute' ? 'Student' : 'Employee'}</h3>
          <p className="text-[12px] text-muted">Add a new member to your organization</p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-danger text-[14px] text-center flex items-center justify-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-muted">Full Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-muted">Email</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-muted">Password</label>
              <input required minLength={6} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-muted">Phone Number</label>
              <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" />
            </div>

            {/* Dynamic Fields based on org_type */}
            {orgType === 'Company' ? (
              <>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-muted">Employee ID</label>
                  <input value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" placeholder="EMP-001" />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-muted">Department</label>
                  <input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" placeholder="Engineering" />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-muted">Designation</label>
                  <input value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" placeholder="Software Engineer" />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-muted">Joining Date</label>
                  <input type="date" value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-muted">Roll Number</label>
                  <input value={formData.roll_number} onChange={e => setFormData({...formData, roll_number: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-muted">Class / Course</label>
                  <input value={formData.class_name} onChange={e => setFormData({...formData, class_name: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" placeholder="B.Tech CS" />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-muted">Section</label>
                  <input value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" placeholder="A" />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-muted">Parent Phone</label>
                  <input value={formData.parent_phone} onChange={e => setFormData({...formData, parent_phone: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" />
                </div>
              </>
            )}

            <div className="space-y-1 md:col-span-2">
              <label className="text-[12px] font-medium text-muted">System Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]">
                <option value="User">User (Standard Access)</option>
                {user?.role === 'SuperAdmin' && <option value="Admin">Admin (HR / Principal)</option>}
              </select>
              {formData.role === 'Admin' && <p className="text-[11px] text-primary mt-1">Admins will have permissions configured in Organization Settings.</p>}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border-light">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-foreground flex items-center gap-1.5">
                <Camera size={14}/> Registration Face ID Fast-Capture
              </label>
              {faceImage && <span className="text-[12px] text-success font-medium flex items-center gap-1"><CheckCircle2 size={14} /> Captured</span>}
            </div>
            
            <div className={`rounded-md border-2 border-dashed ${faceImage ? 'border-success' : 'border-border'} p-2 bg-surface overflow-hidden relative min-h-[300px] flex items-center justify-center`}>
              {faceImage ? (
                <div className="relative w-full h-full flex flex-col items-center gap-4 py-8">
                  <img src={URL.createObjectURL(faceImage)} className="w-[200px] h-[200px] object-cover rounded-full border-4 border-white shadow-md mx-auto" alt="Face" />
                  <button type="button" onClick={() => setFaceImage(null)} className="px-4 py-2 bg-danger/10 text-danger rounded-md text-[13px] font-medium hover:bg-danger/20 flex items-center gap-2">
                    <Trash2 size={16}/> Retake Photo
                  </button>
                </div>
              ) : (
                <CameraCapture onCapture={setFaceImage} blinkMode={true} />
              )}
            </div>
            {!faceImage && <p className="text-[12px] text-muted text-center">Look straight into the camera and blink to auto-capture.</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 p-3 rounded-md bg-surface border border-border text-[14px] font-medium hover:bg-surface-hover transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !faceImage} className="flex-[2] p-3 rounded-md bg-primary hover:bg-primary-hover text-white text-[14px] font-medium transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}