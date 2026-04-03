import React, { useState } from 'react';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function CompanyOnboardModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const [data, setData] = useState({ companyName: '', plan: 'Free', adminName: '', adminEmail: '', adminPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/companies/onboard', data);
      alert("Company successfully onboarded.");
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || "Onboarding failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
      <div className="border border-border rounded-lg bg-white max-w-xl w-full p-8 space-y-6">
        <h3 className="text-[24px] font-bold text-center">Onboard Company</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Organization Name" value={data.companyName} onChange={e => setData({...data, companyName: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
          <input required placeholder="SuperAdmin Name" value={data.adminName} onChange={e => setData({...data, adminName: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
          <input required type="email" placeholder="SuperAdmin Email" value={data.adminEmail} onChange={e => setData({...data, adminEmail: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
          <input required type="password" placeholder="Password" value={data.adminPassword} onChange={e => setData({...data, adminPassword: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 p-3 rounded-md bg-surface border border-border text-[14px] font-medium">Cancel</button>
            <button disabled={loading} type="submit" className="flex-[2] p-3 rounded-md bg-primary text-white text-[14px] font-medium">
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Onboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}