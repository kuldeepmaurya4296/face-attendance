'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import { Loader2, Settings2, ShieldCheck, Save, Clock, CalendarDays } from 'lucide-react';

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>({});
  const [permissions, setPermissions] = useState<any>({});
  const [orgData, setOrgData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/companies/settings').then(res => {
      setSettings(res.data.settings || {});
      setPermissions(res.data.admin_permissions || {});
      setOrgData({ name: res.data.name, plan: res.data.plan, type: res.data.org_type });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { settings };
      if (user?.role === 'SuperAdmin') {
        payload.admin_permissions = permissions;
      }
      await api.put('/companies/settings', payload);
      alert('Settings updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleWeekendToggle = (dayIndex: number) => {
    const current = settings.weekend_days || [];
    const updated = current.includes(dayIndex)
      ? current.filter((d: number) => d !== dayIndex)
      : [...current, dayIndex];
    setSettings({ ...settings, weekend_days: updated });
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Organization Settings" subtitle="Configure platform behavior" />

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        
        {/* Attendance & Shift Settings */}
        <div className="border border-border rounded-lg bg-white overflow-hidden shadow-sm">
          <div className="bg-surface border-b border-border p-4 flex items-center gap-2">
            <Settings2 className="text-primary" size={20} />
            <h3 className="text-[16px] font-bold">Attendance & Shift Configuration</h3>
          </div>
          <div className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-[13px] font-semibold text-muted flex items-center gap-1.5 border-b border-border-light pb-2"><Clock size={16}/> Shift Timings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-muted">Shift Start</label>
                    <input type="time" value={settings.shift_start} onChange={e => setSettings({...settings, shift_start: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2 outline-none focus:border-primary text-[14px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-muted">Shift End</label>
                    <input type="time" value={settings.shift_end} onChange={e => setSettings({...settings, shift_end: e.target.value})} className="w-full bg-surface border border-border rounded-md p-2 outline-none focus:border-primary text-[14px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-muted">Late Threshold (mins)</label>
                    <input type="number" value={settings.late_threshold_minutes} onChange={e => setSettings({...settings, late_threshold_minutes: Number(e.target.value)})} className="w-full bg-surface border border-border rounded-md p-2 outline-none focus:border-primary text-[14px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-muted">Early Dep. Threshold</label>
                    <input type="number" value={settings.early_departure_threshold_minutes} onChange={e => setSettings({...settings, early_departure_threshold_minutes: Number(e.target.value)})} className="w-full bg-surface border border-border rounded-md p-2 outline-none focus:border-primary text-[14px]" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[13px] font-semibold text-muted flex items-center gap-1.5 border-b border-border-light pb-2"><CalendarDays size={16}/> Working Hours Policy</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-muted">Full Day (hours)</label>
                    <input type="number" step="0.5" value={settings.full_day_hours} onChange={e => setSettings({...settings, full_day_hours: Number(e.target.value)})} className="w-full bg-surface border border-border rounded-md p-2 outline-none focus:border-primary text-[14px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-muted">Half Day (hours)</label>
                    <input type="number" step="0.5" value={settings.half_day_hours} onChange={e => setSettings({...settings, half_day_hours: Number(e.target.value)})} className="w-full bg-surface border border-border rounded-md p-2 outline-none focus:border-primary text-[14px]" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[12px] font-medium text-muted">Overtime Threshold (hours)</label>
                    <input type="number" step="0.5" value={settings.overtime_threshold_hours} onChange={e => setSettings({...settings, overtime_threshold_hours: Number(e.target.value)})} className="w-full bg-surface border border-border rounded-md p-2 outline-none focus:border-primary text-[14px]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border-light">
              <h4 className="text-[13px] font-semibold text-muted">Weekend Days</h4>
              <div className="flex flex-wrap gap-3">
                {days.map((day, idx) => (
                  <label key={day} className={`flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${settings.weekend_days?.includes(idx) ? 'bg-primary/5 border-primary text-primary' : 'bg-surface border-border text-foreground hover:bg-surface-hover'}`}>
                    <input type="checkbox" className="hidden" checked={settings.weekend_days?.includes(idx) || false} onChange={() => handleWeekendToggle(idx)} />
                    <span className="text-[13px] font-medium">{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border-light">
              <h4 className="text-[13px] font-semibold text-muted">Self Check-in</h4>
              <label className="flex items-center gap-3 p-3 border border-border rounded-md bg-surface cursor-pointer hover:bg-surface-hover">
                <input type="checkbox" checked={settings.allow_self_checkin || false} onChange={e => setSettings({...settings, allow_self_checkin: e.target.checked})} className="w-4 h-4 text-primary rounded border-border" />
                <div>
                  <p className="text-[14px] font-medium text-foreground">Allow Self Check-in from User Dashboard</p>
                  <p className="text-[12px] text-muted">If enabled, users will see a "Face Scan" button on their dashboard to mark attendance without needing the central Kiosk.</p>
                </div>
              </label>
            </div>

          </div>
        </div>

        {/* Admin Permissions (SuperAdmin Only) */}
        {user?.role === 'SuperAdmin' && (
          <div className="border border-border rounded-lg bg-white overflow-hidden shadow-sm">
            <div className="bg-surface border-b border-border p-4 flex items-center gap-2">
              <ShieldCheck className="text-secondary" size={20} />
              <h3 className="text-[16px] font-bold">Admin Role Permissions</h3>
            </div>
            <div className="p-6">
              <p className="text-[13px] text-muted mb-4">Control what your HR managers / Principals (Admins) are allowed to access and do.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'manage_personnel', label: `Manage ${orgData.type === 'Institute' ? 'Students' : 'Employees'}`, desc: 'Can register, edit, and delete user accounts' },
                  { key: 'view_attendance', label: 'View Attendance Logs', desc: 'Can view daily overview and attendance records' },
                  { key: 'approve_leaves', label: 'Approve Leaves', desc: 'Can approve or reject leave requests' },
                  { key: 'manage_settings', label: 'Manage Settings', desc: 'Can modify these organization settings (!)' },
                  { key: 'manage_holidays', label: 'Manage Holidays', desc: 'Can add or remove days from the holiday calendar' },
                ].map(perm => (
                  <label key={perm.key} className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${permissions[perm.key] ? 'border-secondary/50 bg-secondary/5' : 'border-border bg-surface hover:bg-surface-hover'}`}>
                    <input type="checkbox" checked={permissions[perm.key] || false} onChange={e => setPermissions({...permissions, [perm.key]: e.target.checked})} className="w-4 h-4 mt-0.5 text-secondary rounded border-border" />
                    <div>
                      <p className="text-[14px] font-medium text-foreground">{perm.label}</p>
                      <p className="text-[11px] text-muted leading-tight">{perm.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-md font-medium text-[14px] flex items-center gap-2 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save Configuration
          </button>
        </div>

      </form>
    </div>
  );
}
