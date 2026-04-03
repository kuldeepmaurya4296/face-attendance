'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import StatCard from '@/components/dashboard/shared/StatCard';
import { CheckSquare, FileText, Send, Loader2 } from 'lucide-react';

export default function UserOverview() {
  const [stats, setStats] = useState({ attendance: 0, leaves: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/attendance'),
      api.get('/leaves')
    ]).then(([att, leaves]) => {
      setStats({ attendance: att.data.length, leaves: leaves.data.length });
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="User Dashboard" subtitle="My Overview" />
      {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border rounded-lg bg-white p-6">
             <h3 className="text-[16px] font-bold mb-4">My Stats</h3>
             <div className="grid grid-cols-2 gap-3">
               <StatCard label="Attendance Days" value={stats.attendance} icon={CheckSquare} colorClass="text-success" />
               <StatCard label="Leave Requests" value={stats.leaves} icon={FileText} colorClass="text-warning" />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}