'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import DailyOverview from '@/components/dashboard/shared/DailyOverview';
import { Loader2, Check, X, Users, TrendingUp, Clock, FileText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function CompanyOverview() {
  const { user } = useAuth();
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, pendingLeaves: 0 });
  const [loading, setLoading] = useState(true);
  const orgType = user?.org_type;

  useEffect(() => {
    Promise.all([
      api.get('/leaves'),
      api.get('/users'),
    ]).then(([leaveRes, userRes]) => {
      const pending = leaveRes.data.filter((l: any) => l.status === 'Pending');
      setPendingLeaves(pending);
      setStats({
        users: userRes.data.length,
        pendingLeaves: pending.length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleLeaveAction = async (id: string, status: string) => {
    try {
      await api.put(`/leaves/${id}`, { status });
      setPendingLeaves(prev => prev.filter(l => l._id !== id));
      setStats(prev => ({ ...prev, pendingLeaves: prev.pendingLeaves - 1 }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title={orgType === 'Institute' ? 'Institute Dashboard' : 'Company Dashboard'} subtitle="Overview" />

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-border rounded-lg shadow-sm">
          <Users size={20} className="text-blue-500 mb-2" />
          <p className="text-[12px] text-muted">{orgType === 'Institute' ? 'Total Students' : 'Total Employees'}</p>
          <p className="text-[24px] font-bold">{stats.users}</p>
        </div>
        <div className="p-5 bg-white border border-border rounded-lg shadow-sm">
          <FileText size={20} className="text-amber-500 mb-2" />
          <p className="text-[12px] text-muted">Pending Leaves</p>
          <p className="text-[24px] font-bold">{stats.pendingLeaves}</p>
        </div>
        <Link href="/dashboard/company/reports" className="p-5 bg-white border border-border rounded-lg shadow-sm hover:border-primary transition-colors group">
          <TrendingUp size={20} className="text-emerald-500 mb-2" />
          <p className="text-[12px] text-muted">Reports</p>
          <p className="text-[14px] font-semibold text-primary group-hover:underline">View Analytics →</p>
        </Link>
        <Link href="/dashboard/company/attendance" className="p-5 bg-white border border-border rounded-lg shadow-sm hover:border-primary transition-colors group">
          <Clock size={20} className="text-violet-500 mb-2" />
          <p className="text-[12px] text-muted">Attendance Logs</p>
          <p className="text-[14px] font-semibold text-primary group-hover:underline">View Logs →</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyOverview orgType={orgType as any} />

        {/* Pending Leave Requests */}
        <div className="border border-border rounded-lg bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold">Pending Leave Requests</h3>
            <Link href="/dashboard/company/leaves" className="text-[12px] text-primary font-medium hover:underline">View All</Link>
          </div>
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" size={24} /></div>
          ) : pendingLeaves.length === 0 ? (
            <p className="text-[14px] text-muted text-center py-4">No pending requests</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pendingLeaves.slice(0, 5).map(l => (
                <div key={l._id} className="p-3 bg-surface rounded-md border border-border-light">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-[13px]">{l.user_id?.name || 'Unknown'}</p>
                      <p className="text-[12px] text-muted">
                        {new Date(l.from_date).toLocaleDateString()} — {new Date(l.to_date).toLocaleDateString()} · {l.leave_type || 'Casual'}
                      </p>
                    </div>
                  </div>
                  <p className="text-[12px] text-muted mb-2 truncate">{l.reason}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleLeaveAction(l._id, 'Approved')} className="flex-1 py-1.5 rounded-md bg-emerald-50 text-emerald-700 text-[12px] font-medium flex items-center justify-center gap-1 hover:bg-emerald-100 border border-emerald-200">
                      <Check size={14} /> Approve
                    </button>
                    <button onClick={() => handleLeaveAction(l._id, 'Rejected')} className="flex-1 py-1.5 rounded-md bg-red-50 text-red-700 text-[12px] font-medium flex items-center justify-center gap-1 hover:bg-red-100 border border-red-200">
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
              {pendingLeaves.length > 5 && (
                <Link href="/dashboard/company/leaves" className="block text-center text-[13px] text-primary font-medium py-2 hover:underline">
                  +{pendingLeaves.length - 5} more requests
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}