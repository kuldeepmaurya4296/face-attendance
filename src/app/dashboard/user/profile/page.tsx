'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import { CameraCapture } from '@/components/CameraCapture';
import { User as UserIcon, Shield, Loader2, Save, Camera, CheckCircle2 } from 'lucide-react';

export default function UserProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<any>({});
  const [company, setCompany] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showFaceReCapture, setShowFaceReCapture] = useState(false);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [faceStatus, setFaceStatus] = useState('');

  useEffect(() => {
    api.get('/users/profile').then(res => {
      setProfile(res.data.user);
      setCompany(res.data.company || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/users/profile', profile);
      updateUser(res.data.user);
      alert('Profile updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFaceUpdate = async () => {
    if (!faceImage) return;
    setFaceStatus('Verifying face and generating embeddings...');
    try {
      const mlForm = new FormData();
      mlForm.append('file', faceImage);
      const mlRes = await fetch('/api/ml/register', { method: 'POST', body: mlForm });
      const mlData = await mlRes.json();
      
      if (!mlData.success) {
        setFaceStatus('Failed: ' + (mlData.detail || 'Extracting face'));
        return;
      }
      
      await api.put('/users/profile', { face_embeddings: mlData.embeddings });
      setFaceStatus('Face ID successfully updated!');
      setProfile({ ...profile, has_face_id: true });
      setTimeout(() => setShowFaceReCapture(false), 2000);
    } catch(err) {
      setFaceStatus('Failed to update face ID in database.');
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  const isCompany = company.org_type === 'Company';
  const isInstitute = company.org_type === 'Institute';

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your account" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col - Identity */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border border-border rounded-lg bg-white overflow-hidden text-center">
            <div className="h-24 bg-primary/10"></div>
            <div className="px-6 pb-6 relative">
              <div className="w-20 h-20 -mt-10 mx-auto bg-white rounded-full p-1 shadow-sm">
                <div className="w-full h-full bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                  {profile.name?.charAt(0)}
                </div>
              </div>
              <h3 className="mt-3 text-[18px] font-bold">{profile.name}</h3>
              <p className="text-[14px] text-muted">{profile.email}</p>
              <div className="pt-4 mt-4 border-t border-border flex items-center justify-center gap-2">
                <Shield size={16} className={user?.role === 'User' ? 'text-blue-500' : 'text-purple-500'} />
                <span className="text-[13px] font-medium">{user?.role}</span>
              </div>
            </div>
          </div>
          
          <div className="border border-border rounded-lg bg-white p-6 space-y-4">
            <h4 className="text-[14px] font-bold border-b border-border-light pb-2">Organization Status</h4>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted">Organization</span>
                <span className="font-medium text-right">{company.name || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Type</span>
                <span className="font-medium">{company.org_type || '—'}</span>
              </div>
              {isCompany && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted">Emp ID</span>
                    <span className="font-medium font-mono">{profile.employee_id || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Department</span>
                    <span className="font-medium">{profile.department || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Designation</span>
                    <span className="font-medium text-right">{profile.designation || '—'}</span>
                  </div>
                </>
              )}
              {isInstitute && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted">Roll No</span>
                    <span className="font-medium font-mono border bg-surface px-1">{profile.roll_number || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Class/Section</span>
                    <span className="font-medium">{profile.class_name} ({profile.section})</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted">Role Status</span>
                <span className={`font-medium ${profile.status === 'Active' ? 'text-emerald-600' : 'text-red-600'}`}>{profile.status}</span>
              </div>
              <p className="text-[11px] text-muted italic mt-2 text-center pt-2 border-t border-border-light">Organization fields are read-only.</p>
            </div>
          </div>
        </div>

        {/* Right Col - Editable */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="border border-border rounded-lg bg-white p-6 space-y-5">
            <h4 className="text-[16px] font-bold flex items-center gap-2"><UserIcon size={18} className="text-primary"/> Personal Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Full Name</label>
                <input required value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Email</label>
                <input required type="email" value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Phone Number</label>
                <input value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">New Password (optional)</label>
                <input type="password" placeholder="Leave blank to keep current" value={profile.password || ''} onChange={e => setProfile({...profile, password: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2.5 outline-none focus:border-primary text-[14px]" />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border-light">
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-md font-medium text-[14px] flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
              </button>
            </div>
          </form>

          {/* Face ID Section */}
          <div className="border border-border rounded-lg bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[16px] font-bold flex items-center gap-2"><Camera size={18} className="text-secondary"/> Biometric Security</h4>
              {profile.has_face_id ? (
                <span className="flex items-center gap-1 text-[12px] font-bold text-success bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><CheckCircle2 size={14}/> Registered</span>
              ) : (
                <span className="text-[12px] font-bold text-danger">Not Registered</span>
              )}
            </div>
            
            <p className="text-[13px] text-muted">Your face ID is used to securely mark attendance. If you are having trouble being recognized, you can update your biometric signature below.</p>
            
            {!showFaceReCapture ? (
              <button type="button" onClick={() => setShowFaceReCapture(true)} className="px-5 py-2.5 bg-surface border border-border text-foreground hover:bg-surface-hover rounded-md font-medium text-[14px] transition-colors">
                {profile.has_face_id ? 'Re-capture Face ID' : 'Enroll Face ID'}
              </button>
            ) : (
              <div className="space-y-4 pt-4 border-t border-border-light">
                <div className="rounded-md border-2 border-dashed border-border bg-surface overflow-hidden min-h-[300px]">
                  {faceImage ? (
                    <div className="flex flex-col items-center justify-center p-8">
                       <img src={URL.createObjectURL(faceImage)} className="w-48 h-48 rounded-full object-cover border-4 border-white shadow mb-6" alt="Preview"/>
                       <button onClick={() => setFaceImage(null)} className="text-[13px] text-danger hover:underline">Retake Photo</button>
                    </div>
                  ) : <CameraCapture onCapture={setFaceImage} blinkMode={true} />}
                </div>
                
                {faceStatus && <p className="text-[13px] font-medium text-center text-primary">{faceStatus}</p>}
                
                <div className="flex gap-3">
                  <button onClick={() => { setShowFaceReCapture(false); setFaceImage(null); setFaceStatus(''); }} className="flex-1 py-2 text-[14px] bg-surface border border-border rounded font-medium">Cancel</button>
                  <button onClick={handleFaceUpdate} disabled={!faceImage} className="flex-1 py-2 text-[14px] bg-primary text-white rounded font-medium disabled:opacity-50">Upload & Save Face ID</button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
