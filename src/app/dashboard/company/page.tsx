'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import DailyOverview from '@/components/dashboard/shared/DailyOverview';
import { Loader2, CheckSquare, FileText, Check, X } from 'lucide-react';

export default function CompanyOverview() {
  const { user } = useAuth();
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const orgType = user?.org_type;

  useEffect(() => {
    api.get('/leaves').then(res => {
      setPendingLeaves(res.data.filter((l: any) => l.status === 'Pending'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleLeaveAction = async (id: string, status: string) => {
    try {
      await api.put(`/leaves/${id}`, { status });
      setPendingLeaves(prev => prev.filter(l => l._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title={orgType === 'Institute' ? 'Institute Dashboard' : 'Company Dashboard'} subtitle="Overview" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyOverview orgType={orgType as any} />

        {/* Pending Leave Requests */}
        <div className="border border-border rounded-lg bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold">Pending Leave Requests</h3>
            <span className="text-[12px] text-muted">{pendingLeaves.length} pending</span>
          </div>
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" size={24} /></div>
          ) : pendingLeaves.length === 0 ? (
            <p className="text-[14px] text-muted text-center py-4">No pending requests</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pendingLeaves.map(l => (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}