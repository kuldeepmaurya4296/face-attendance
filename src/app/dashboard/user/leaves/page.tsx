'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import LeaveApplyModal from '@/components/dashboard/user/LeaveApplyModal';
import { Loader2, Plus, FileText } from 'lucide-react';

export default function MyLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = () => {
    api.get('/leaves').then(res => {
      setLeaves(res.data);
      setLoading(false);
    });
  };

  useEffect(() => fetchLeaves(), []);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Leave Requests" subtitle="My Applications" />
      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-[16px] font-bold">My Leaves</h3>
           <button onClick={() => setIsApplying(true)} className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 text-[14px]">
             <Plus size={16} /> Apply
           </button>
        </div>
        {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
          <div className="space-y-3">
             {leaves.map(l => (
                <div key={l._id} className="p-4 bg-surface rounded-md flex items-center justify-between border border-border-light">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-warning" />
                    <div>
                      <p className="font-medium text-[14px]">{new Date(l.from_date).toLocaleDateString()} - {new Date(l.to_date).toLocaleDateString()}</p>
                      <p className="text-[12px] text-muted truncate max-w-[200px]">{l.reason}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${l.status === 'Approved' ? 'bg-green-100 text-green-700' : l.status === 'Pending' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{l.status}</span>
                </div>
             ))}
             {leaves.length === 0 && <div className="p-8 text-center text-muted">No leave requests found.</div>}
          </div>
        )}
      </div>
      {isApplying && <LeaveApplyModal onClose={() => setIsApplying(false)} onRefresh={fetchLeaves} />}
    </div>
  );
}