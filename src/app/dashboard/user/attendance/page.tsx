'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import AttendanceCalendar from '@/components/dashboard/user/AttendanceCalendar';
import { Calendar, List } from 'lucide-react';

export default function MyAttendancePage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="My Attendance" subtitle="Attendance History" />

      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setView('calendar')}
          className={`px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 ${view === 'calendar' ? 'bg-primary text-white' : 'bg-surface border border-border text-muted'}`}
        >
          <Calendar size={14} /> Calendar
        </button>
        <button
          onClick={() => setView('list')}
          className={`px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 ${view === 'list' ? 'bg-primary text-white' : 'bg-surface border border-border text-muted'}`}
        >
          <List size={14} /> List
        </button>
      </div>

      {view === 'calendar' ? (
        <AttendanceCalendar />
      ) : (
        <AttendanceListView />
      )}
    </div>
  );
}

function AttendanceListView() {
  const [attendance, setAttendance] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const api = require('@/lib/api').default;
  const { Loader2, CheckCircle } = require('lucide-react');

  React.useEffect(() => {
    api.get('/attendance').then((res: any) => {
      setAttendance(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={24} /></div>;

  return (
    <div className="border border-border rounded-lg bg-white p-6 space-y-3">
      <h3 className="text-[16px] font-bold">Attendance Log</h3>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left">
          <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
            <tr>
              <th className="p-3 px-4">Date</th>
              <th className="p-3">Check In</th>
              <th className="p-3">Check Out</th>
              <th className="p-3">Hours</th>
              <th className="p-3">Mode</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="text-[14px]">
            {attendance.map(a => (
              <tr key={a._id} className="border-t border-border-light hover:bg-surface">
                <td className="p-3 px-4 font-medium">{new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                <td className="p-3 text-[12px]">{a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td className="p-3 text-[12px]">{a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td className="p-3 text-[12px]">{a.work_hours ? `${a.work_hours}h` : '—'}</td>
                <td className="p-3 text-[12px] text-muted">{a.mode}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${
                    a.status === 'Present' ? 'bg-green-100 text-green-700' :
                    a.status === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                    a.status === 'Half-Day' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>{a.status}</span>
                </td>
              </tr>
            ))}
            {attendance.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted">No records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}