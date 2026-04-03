'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users, UserCheck, UserX, Clock, Loader2 } from 'lucide-react';

interface DailyOverviewProps {
  orgType?: 'Company' | 'Institute';
}

export default function DailyOverview({ orgType }: DailyOverviewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const memberLabel = orgType === 'Institute' ? 'Students' : 'Employees';

  useEffect(() => {
    api.get('/attendance/daily-summary')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-border rounded-lg bg-white p-6">
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
      </div>
    );
  }

  if (!data) return null;

  const total = data.total_users || 1;
  const presentPct = Math.round((data.present / total) * 100);
  const latePct = Math.round((data.late / total) * 100);
  const absentPct = Math.round((data.absent / total) * 100);
  const leavePct = Math.round((data.on_leave / total) * 100);

  return (
    <div className="border border-border rounded-lg bg-white p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold">Today&apos;s Attendance</h3>
        <span className="text-[12px] text-muted">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
          {presentPct > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${presentPct}%` }} />}
          {latePct > 0 && <div className="bg-amber-500 transition-all" style={{ width: `${latePct}%` }} />}
          {leavePct > 0 && <div className="bg-violet-500 transition-all" style={{ width: `${leavePct}%` }} />}
          {absentPct > 0 && <div className="bg-red-400 transition-all" style={{ width: `${absentPct}%` }} />}
        </div>
        <div className="flex flex-wrap gap-4 text-[12px]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present ({data.present})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late ({data.late})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> On Leave ({data.on_leave})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Absent ({data.absent})</span>
        </div>
      </div>

      {/* Stat Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 bg-surface rounded-md border border-border-light text-center">
          <Users size={14} className="text-primary mx-auto mb-1" />
          <p className="text-[11px] text-muted">Total {memberLabel}</p>
          <p className="text-[16px] font-bold">{data.total_users}</p>
        </div>
        <div className="p-3 bg-surface rounded-md border border-border-light text-center">
          <UserCheck size={14} className="text-success mx-auto mb-1" />
          <p className="text-[11px] text-muted">Present</p>
          <p className="text-[16px] font-bold">{data.present}</p>
        </div>
        <div className="p-3 bg-surface rounded-md border border-border-light text-center">
          <UserX size={14} className="text-danger mx-auto mb-1" />
          <p className="text-[11px] text-muted">Absent</p>
          <p className="text-[16px] font-bold">{data.absent}</p>
        </div>
        <div className="p-3 bg-surface rounded-md border border-border-light text-center">
          <Clock size={14} className="text-warning mx-auto mb-1" />
          <p className="text-[11px] text-muted">Late</p>
          <p className="text-[16px] font-bold">{data.late}</p>
        </div>
      </div>

      {/* Not Checked In List */}
      {data.not_checked_in?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[13px] font-semibold text-danger flex items-center gap-1.5">
            <UserX size={14} /> Not Checked In ({data.not_checked_in.length})
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {data.not_checked_in.slice(0, 10).map((u: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded text-[13px]">
                <span className="font-medium">{u.name}</span>
                <span className="text-[11px] text-muted">{u.department || u.role}</span>
              </div>
            ))}
            {data.not_checked_in.length > 10 && (
              <p className="text-[12px] text-muted text-center">+{data.not_checked_in.length - 10} more</p>
            )}
          </div>
        </div>
      )}

      {/* Late Arrivals */}
      {data.late_arrivals?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[13px] font-semibold text-warning flex items-center gap-1.5">
            <Clock size={14} /> Late Arrivals
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {data.late_arrivals.map((u: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 bg-amber-50 rounded text-[13px]">
                <span className="font-medium">{u.name}</span>
                <span className="text-[11px] text-amber-700">{u.late_by} min late</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
