'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import StatCard from '@/components/dashboard/shared/StatCard';
import { Users, CheckSquare, FileText, Settings, Loader2 } from 'lucide-react';

export default function CompanyOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, attendance: 0, leaves: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      Promise.all([
        api.get('/users'),
        api.get('/attendance/company'),
        api.get('/leaves')
      ]).then(([users, att, leaves]) => {
        setStats({ users: users.data.length, attendance: att.data.length, leaves: leaves.data.length });
        setLoading(false);
      });
    }
  }, [user]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Company Dashboard" subtitle="Overview" />
      {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div> : (
        <div className="border border-border rounded-lg bg-white p-6">
          <h2 className="text-[24px] font-bold text-foreground mb-4">Operations Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Personnel" value={stats.users} icon={Users} colorClass="text-primary" />
            <StatCard label="Attendance Logs" value={stats.attendance} icon={CheckSquare} colorClass="text-success" />
            <StatCard label="Leave Requests" value={stats.leaves} icon={FileText} colorClass="text-warning" />
          </div>
        </div>
      )}
    </div>
  );
}