'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import { Loader2 } from 'lucide-react';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaves').then(res => {
      setLeaves(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Leave Requests" subtitle="Company Management" />
      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <h3 className="text-[16px] font-bold">Leave Pipeline</h3>
        {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
          <div className="overflow-x-auto rounded-md border border-border">
             <table className="w-full text-left">
               <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
                 <tr><th className="p-3 px-4">Employee</th><th className="p-3">Date</th><th className="p-3">Reason</th><th className="p-3 text-center">Status</th></tr>
               </thead>
               <tbody className="text-[14px]">
                 {leaves.map(l => (
                   <tr key={l._id} className="border-t border-border-light hover:bg-surface">
                     <td className="p-3 px-4"><p className="font-medium text-[14px]">{l.user_id?.name || 'Unknown'}</p></td>
                     <td className="p-3 text-[12px]">{new Date(l.from_date).toLocaleDateString()} - {new Date(l.to_date).toLocaleDateString()}</td>
                     <td className="p-3 text-[12px]">{l.reason}</td>
                     <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-[12px] font-medium ${l.status === 'Approved' ? 'bg-green-100 text-green-700' : l.status === 'Pending' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{l.status}</span></td>
                   </tr>
                 ))}
                 {leaves.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted">No leave requests found.</td></tr>}
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}