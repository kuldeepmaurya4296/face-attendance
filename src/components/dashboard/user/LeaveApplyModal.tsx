import React, { useState } from 'react';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function LeaveApplyModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const [data, setData] = useState({ from_date: new Date().toISOString().split('T')[0], to_date: new Date().toISOString().split('T')[0], reason: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leaves', data);
      alert("Leave successfully requested.");
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
      <div className="border border-border rounded-lg bg-white max-w-md w-full p-8 space-y-6">
        <h3 className="text-[24px] font-bold text-center">Apply for Leave</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-muted">From Date</label>
              <input required type="date" value={data.from_date} onChange={e => setData({...data, from_date: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-muted">To Date</label>
              <input required type="date" value={data.to_date} onChange={e => setData({...data, to_date: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
            </div>
          </div>
          <textarea required placeholder="Brief reason for leave..." value={data.reason} onChange={e => setData({...data, reason: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 h-28 outline-none focus:border-primary text-[14px]" />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 p-3 rounded-md bg-surface border border-border text-[14px] font-medium">Cancel</button>
            <button disabled={loading} type="submit" className="flex-[2] p-3 rounded-md bg-primary text-white text-[14px] font-medium">
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}