'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import { Loader2 } from 'lucide-react';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance/company').then(res => {
      setAttendance(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Attendance Logs" subtitle="Company Wide Attendance" />
      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <h3 className="text-[16px] font-bold">Attendance Records</h3>
        {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left">
              <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
                <tr><th className="p-3 px-4">Employee</th><th className="p-3">Date</th><th className="p-3">Check In</th><th className="p-3">Check Out</th><th className="p-3">Mode</th><th className="p-3 text-center">Status</th></tr>
              </thead>
              <tbody className="text-[14px]">
                {attendance.map(a => (
                  <tr key={a._id} className="border-t border-border-light hover:bg-surface">
                    <td className="p-3 px-4"><p className="font-medium">{a.user_id?.name}</p><p className="text-[12px] text-muted">{a.user_id?.email}</p></td>
                    <td className="p-3 text-[12px]">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-3 text-[12px]">{a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="p-3 text-[12px]">{a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="p-3 text-[12px] text-muted">{a.mode}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-[12px] font-medium ${a.status === 'Present' ? 'bg-green-100 text-green-700' : typeof a.status === 'string' && a.status === 'Late' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span></td>
                  </tr>
                ))}
                {attendance.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted">No attendance records found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}