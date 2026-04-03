'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import { toast } from '@/stores/toastStore';
import { Loader2, Save, User, Mail, Phone, Shield, Building, Camera } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  useEffect(() => {
    api.get('/users/me').then(res => {
      setProfile(res.data);
      setForm({ name: res.data.name, email: res.data.email, phone: res.data.phone || '', password: '' });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { name: form.name, phone: form.phone };
      if (form.password) payload.password = form.password;
      await api.put('/users/profile', payload);
      updateUser({ name: form.name });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" size={32} /></div>
      </div>
    );
  }

  const roleLabel = user?.role === 'SuperAdmin' ? 'Super Administrator' :
    user?.role === 'Admin' ? 'Administrator' :
    user?.role === 'Owner' ? 'Platform Owner' : 'Employee';

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your account" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="border border-border rounded-lg bg-white p-6 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
              {user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-[18px] font-bold">{profile?.name}</h2>
              <p className="text-[13px] text-muted">{profile?.email}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-semibold">
              {roleLabel}
            </span>
          </div>

          <div className="space-y-3 pt-4 border-t border-border-light">
            <InfoRow icon={Mail} label="Email" value={profile?.email} />
            <InfoRow icon={Phone} label="Phone" value={profile?.phone || 'Not set'} />
            <InfoRow icon={Shield} label="Role" value={user?.role || ''} />
            {profile?.department && <InfoRow icon={Building} label="Department" value={profile.department} />}
            {profile?.designation && <InfoRow icon={User} label="Designation" value={profile.designation} />}
            {profile?.employee_id && <InfoRow icon={User} label="Employee ID" value={profile.employee_id} />}
          </div>

          <div className="pt-4 border-t border-border-light">
            <div className="flex items-center gap-2">
              <Camera size={16} className={profile?.has_face_id ? 'text-emerald-500' : 'text-red-500'} />
              <span className={`text-[13px] font-medium ${profile?.has_face_id ? 'text-emerald-600' : 'text-red-600'}`}>
                Face ID: {profile?.has_face_id ? 'Registered ✓' : 'Not Registered'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 border border-border rounded-lg bg-white p-6">
          <h3 className="text-[16px] font-bold mb-6">Edit Profile</h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Full Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]"
                  required />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Email (read-only)</label>
                <input value={form.email} disabled
                  className="w-full bg-surface border border-border rounded-md p-3 text-[14px] text-muted cursor-not-allowed" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Phone Number</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 XXXXXXXXXX"
                  className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">New Password (optional)</label>
                <input type="password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Leave blank to keep current"
                  className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-md font-medium text-[14px] flex items-center gap-2 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-muted shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted">{label}</p>
        <p className="text-[13px] font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
