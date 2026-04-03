'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import { Loader2, CheckCircle } from 'lucide-react';

export default function MyAttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance').then(res => {
      setAttendance(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="My Attendance" subtitle="Attendance History" />
      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <h3 className="text-[16px] font-bold">Attendance Log</h3>
        {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
          <div className="space-y-3">
             {attendance.map(a => (
                <div key={a._id} className="p-4 bg-surface rounded-md flex items-center justify-between border border-border-light">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-primary" />
                    <div>
                      <p className="font-medium text-[14px]">{new Date(a.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                      <p className="text-[12px] text-muted">Check-in: {a.check_in ? new Date(a.check_in).toLocaleTimeString() : '—'} — {a.mode}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${a.status === 'Present' ? 'bg-green-100 text-green-700' : typeof a.status === 'string' && a.status === 'Late' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
                </div>
             ))}
             {attendance.length === 0 && <div className="p-8 text-center text-muted">No attendance records found.</div>}
          </div>
        )}
      </div>
    </div>
  );
}