'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import { Loader2, Download, Search } from 'lucide-react';

export default function AttendanceLogsPage() {
  const [data, setData] = useState<any>({ total_users: 0, checked_out: [], late_arrivals: [], not_checked_in: [] });
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setLoading(true);
    api.get(`/attendance/daily-summary?date=${date}`).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [date]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Attendance Logs" subtitle="Daily Organization View" />

      <div className="border border-border rounded-lg bg-white p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
           <h3 className="text-[16px] font-bold">Daily Snapshot</h3>
           <div className="flex gap-2">
             <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-surface border border-border p-2 rounded-md outline-none text-[13px] font-medium" />
             <button className="px-4 py-2 bg-surface border border-border rounded-md text-[13px] font-medium flex items-center gap-2 hover:bg-surface-hover">
               <Download size={16} /> Export CSV
             </button>
           </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="border border-border rounded-md p-4 bg-surface">
               <h4 className="text-[14px] font-semibold mb-3 border-b border-border pb-2">Active checked in ({data.present + data.late})</h4>
               {data.checked_out.length > 0 && <p className="text-[12px] text-muted mb-2">{data.checked_out.length} users completed their shift.</p>}
               <p className="text-[13px] text-muted">A fully granular table view will be added in Phase 8.</p>
             </div>
             
             <div className="border border-border rounded-md p-4 bg-surface">
               <h4 className="text-[14px] font-semibold mb-3 border-b border-border pb-2 text-warning">Late Arrivals ({data.late_arrivals?.length || 0})</h4>
               <ul className="space-y-1">
                 {data.late_arrivals?.map((l: any, i: number) => (
                   <li key={i} className="text-[13px] flex justify-between"><span>{l.name}</span> <span className="text-amber-600">{l.late_by}m late</span></li>
                 ))}
                 {data.late_arrivals?.length === 0 && <li className="text-[12px] text-muted">No late arrivals</li>}
               </ul>
             </div>

             <div className="border border-border rounded-md p-4 bg-surface">
               <h4 className="text-[14px] font-semibold mb-3 border-b border-border pb-2 text-danger">Absent / Not Scanned ({data.not_checked_in?.length || 0})</h4>
               <ul className="space-y-1">
                 {data.not_checked_in?.map((l: any, i: number) => (
                   <li key={i} className="text-[13px] truncate">{l.name}</li>
                 ))}
                 {data.not_checked_in?.length === 0 && <li className="text-[12px] text-muted">Everyone checked in</li>}
               </ul>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}