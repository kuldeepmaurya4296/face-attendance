'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import { Loader2, Check, X, Search } from 'lucide-react';

export default function ManageLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');

  const fetchLeaves = () => {
    api.get('/leaves').then(res => {
      setLeaves(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => fetchLeaves(), []);

  const handleAction = async (id: string, status: string) => {
    try {
      await api.put(`/leaves/${id}`, { status });
      fetchLeaves();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const filtered = leaves.filter(l => filter === 'All' || l.status === filter);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Leave Management" subtitle="Approve or Reject Requests" />

      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
         <div className="flex gap-2 mb-4">
           {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
             <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-md text-[13px] font-medium border ${filter === f ? 'bg-primary text-white border-primary' : 'bg-surface text-muted border-border'}`}>{f}</button>
           ))}
         </div>

         {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={24} /></div> : (
           <div className="overflow-x-auto rounded-md border border-border">
             <table className="w-full text-left whitespace-nowrap">
               <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
                 <tr>
                   <th className="p-3">User</th>
                   <th className="p-3">Type</th>
                   <th className="p-3">Date Range</th>
                   <th className="p-3">Reason</th>
                   <th className="p-3 text-center">Status</th>
                   <th className="p-3 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="text-[14px]">
                 {filtered.map(l => (
                   <tr key={l._id} className="border-t border-border-light hover:bg-surface">
                     <td className="p-3 font-medium">{l.user_id?.name || 'Unknown'}</td>
                     <td className="p-3">{l.leave_type || 'Casual'}</td>
                     <td className="p-3">{new Date(l.from_date).toLocaleDateString()} - {new Date(l.to_date).toLocaleDateString()}</td>
                     <td className="p-3 max-w-[200px] truncate" title={l.reason}>{l.reason}</td>
                     <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${l.status === 'Approved' ? 'bg-green-100 text-green-700' : l.status === 'Pending' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{l.status}</span>
                     </td>
                     <td className="p-3 text-right">
                       {l.status === 'Pending' && (
                         <div className="flex justify-end gap-2">
                           <button onClick={() => handleAction(l._id, 'Approved')} className="p-1.5 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100"><Check size={16} /></button>
                           <button onClick={() => handleAction(l._id, 'Rejected')} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"><X size={16} /></button>
                         </div>
                       )}
                       {l.status !== 'Pending' && <span className="text-[12px] text-muted">Processed by {l.approved_by?.name || 'System'}</span>}
                     </td>
                   </tr>
                 ))}
                 {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted">No {filter.toLowerCase()} leave requests.</td></tr>}
               </tbody>
             </table>
           </div>
         )}
      </div>
    </div>
  );
}