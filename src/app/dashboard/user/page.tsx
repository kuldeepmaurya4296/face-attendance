'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import TodayStatus from '@/components/dashboard/user/TodayStatus';
import AttendanceCalendar from '@/components/dashboard/user/AttendanceCalendar';
import { FileText, Loader2, CalendarDays, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function UserOverview() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/leaves'),
      api.get(`/attendance/monthly?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
    ]).then(([leaveRes, monthRes]) => {
      setLeaves(leaveRes.data.slice(0, 5));
      setMonthlyData(monthRes.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Monthly summary
  const present = monthlyData.filter(d => d.status === 'Present' || d.status === 'Late').length;
  const late = monthlyData.filter(d => d.status === 'Late').length;
  const absent = monthlyData.filter(d => d.status === 'Absent').length;
  const onLeave = monthlyData.filter(d => d.status === 'On-Leave').length;
  const totalWorkDays = monthlyData.filter(d => d.status && d.status !== 'Weekend' && d.status !== 'Holiday').length;

  // Upcoming holidays
  const upcomingHolidays = monthlyData
    .filter(d => d.status === 'Holiday' && new Date(d.date) >= new Date())
    .slice(0, 3);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="My Dashboard" subtitle="Overview" />

      {/* Monthly Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniStat icon={CheckCircle} label="Present" value={present} color="text-emerald-600" bg="bg-emerald-50" />
        <MiniStat icon={AlertTriangle} label="Late" value={late} color="text-amber-600" bg="bg-amber-50" />
        <MiniStat icon={CalendarDays} label="Absent" value={absent} color="text-red-600" bg="bg-red-50" />
        <MiniStat icon={FileText} label="On Leave" value={onLeave} color="text-violet-600" bg="bg-violet-50" />
        <MiniStat icon={TrendingUp} label="Attendance"
          value={totalWorkDays > 0 ? `${Math.round((present / totalWorkDays) * 100)}%` : '—'}
          color="text-blue-600" bg="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today Status */}
        <div className="lg:col-span-1 space-y-6">
          <TodayStatus />

          {/* Upcoming Holidays */}
          {upcomingHolidays.length > 0 && (
            <div className="border border-border rounded-lg bg-white p-5 space-y-3">
              <h3 className="text-[14px] font-bold flex items-center gap-2">
                <CalendarDays size={16} className="text-sky-500" />
                Upcoming Holidays
              </h3>
              <div className="space-y-2">
                {upcomingHolidays.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-sky-50 rounded-md text-[13px]">
                    <span className="font-medium text-sky-800">{h.holiday_name}</span>
                    <span className="text-sky-600 text-[12px]">
                      {new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="lg:col-span-2">
          <AttendanceCalendar />
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="border border-border rounded-lg bg-white p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold">Recent Leave Requests</h3>
          <Link href="/dashboard/user/leaves" className="text-[12px] text-primary font-medium hover:underline">View All</Link>
        </div>
        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : leaves.length === 0 ? (
          <p className="text-[14px] text-muted text-center py-4">No leave requests yet.</p>
        ) : (
          <div className="space-y-2">
            {leaves.map(l => (
              <div key={l._id} className="flex items-center justify-between p-3 bg-surface rounded-md border border-border-light">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-warning" />
                  <div>
                    <p className="font-medium text-[13px]">
                      {new Date(l.from_date).toLocaleDateString()} — {new Date(l.to_date).toLocaleDateString()}
                    </p>
                    <p className="text-[12px] text-muted">{l.leave_type || 'Casual'} · {l.reason}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${
                  l.status === 'Approved' ? 'bg-green-100 text-green-700' :
                  l.status === 'Pending' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>{l.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: any; color: string; bg: string }) {
  return (
    <div className={`p-4 rounded-lg ${bg} border border-transparent`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={color} />
        <span className="text-[11px] text-muted font-medium">{label}</span>
      </div>
      <p className={`text-[20px] font-bold ${color}`}>{value}</p>
    </div>
  );
}