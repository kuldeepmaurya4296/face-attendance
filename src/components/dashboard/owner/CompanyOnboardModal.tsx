'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { Loader2, Building, GraduationCap } from 'lucide-react';

interface Props {
  onClose: () => void;
  onRefresh: () => void;
}

export default function CompanyOnboardModal({ onClose, onRefresh }: Props) {
  const [data, setData] = useState({ companyName: '', org_type: 'Company', plan: 'Free', adminName: '', adminEmail: '', adminPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/companies/onboard', data);
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
      <div className="border border-border rounded-lg bg-white max-w-xl w-full p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-1">
          <h3 className="text-[24px] font-bold">Onboard Organization</h3>
          <p className="text-[13px] text-muted">Create a new tenant organization</p>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-[13px] rounded-md text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex gap-3">
              <button
                type="button"
                onClick={() => setData({ ...data, org_type: 'Company' })}
                className={`flex-1 p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-colors ${
                  data.org_type === 'Company' ? 'bg-primary/5 border-primary text-primary' : 'bg-surface border-border text-muted hover:border-primary/50'
                }`}
              >
                <Building size={24} />
                <span className="text-[13px] font-semibold">Company</span>
              </button>
              <button
                type="button"
                onClick={() => setData({ ...data, org_type: 'Institute' })}
                className={`flex-1 p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-colors ${
                  data.org_type === 'Institute' ? 'bg-primary/5 border-primary text-primary' : 'bg-surface border-border text-muted hover:border-primary/50'
                }`}
              >
                <GraduationCap size={24} />
                <span className="text-[13px] font-semibold">Institute</span>
              </button>
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-[12px] font-medium text-muted">Organization Name</label>
              <input required placeholder="E.g. Acme Corp" value={data.companyName} onChange={e => setData({...data, companyName: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
            </div>
            
            <div className="space-y-1 col-span-2">
              <label className="text-[12px] font-medium text-muted">Plan</label>
              <select value={data.plan} onChange={e => setData({...data, plan: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]">
                <option value="Free">Free Tier</option>
                <option value="Paid">Premium Tier</option>
              </select>
            </div>

            <div className="col-span-2 pt-4 border-t border-border-light">
              <h4 className="text-[14px] font-semibold mb-3">SuperAdmin Account</h4>
            </div>

            <div className="space-y-1 col-span-2 md:col-span-1">
              <label className="text-[12px] font-medium text-muted">Full Name</label>
              <input required placeholder="Name" value={data.adminName} onChange={e => setData({...data, adminName: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
            </div>
            <div className="space-y-1 col-span-2 md:col-span-1">
              <label className="text-[12px] font-medium text-muted">Email</label>
              <input required type="email" placeholder="Email" value={data.adminEmail} onChange={e => setData({...data, adminEmail: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[12px] font-medium text-muted">Password</label>
              <input required type="password" minLength={6} placeholder="••••••••" value={data.adminPassword} onChange={e => setData({...data, adminPassword: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 p-3 rounded-md bg-surface border border-border text-[14px] font-medium hover:bg-surface-hover">Cancel</button>
            <button disabled={loading} type="submit" className="flex-[2] p-3 rounded-md bg-primary hover:bg-primary-hover text-white text-[14px] font-medium transition-colors">
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Confirm Onboarding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}