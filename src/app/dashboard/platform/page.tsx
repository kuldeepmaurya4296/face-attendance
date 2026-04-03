'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import api from '@/lib/api';
import { Loader2, Users, Building, Activity, ShieldCheck, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function PlatformOverview() {
  const [stats, setStats] = useState({ totalCompanies: 0, totalInstitutes: 0, activePlans: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [compRes, usersRes] = await Promise.all([
          api.get('/companies'),
          api.get('/users') // Note: In a real large app we'd need an aggregate endpoint
        ]);
        const comps = compRes.data || [];
        const users = usersRes.data || [];

        setStats({
          totalCompanies: comps.filter((c:any) => c.org_type === 'Company').length,
          totalInstitutes: comps.filter((c:any) => c.org_type === 'Institute').length,
          activePlans: comps.filter((c:any) => c.plan === 'Paid').length,
          totalUsers: users.length
        });
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Platform Owner" subtitle="Global Operations Overview" />

      {loading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 bg-white border border-border rounded-lg shadow-sm">
            <Building size={20} className="text-blue-500 mb-3" />
            <p className="text-[13px] text-muted">Total Companies</p>
            <p className="text-[24px] font-bold">{stats.totalCompanies}</p>
          </div>
          <div className="p-6 bg-white border border-border rounded-lg shadow-sm">
            <GraduationCap size={20} className="text-indigo-500 mb-3" />
            <p className="text-[13px] text-muted">Total Institutes</p>
            <p className="text-[24px] font-bold">{stats.totalInstitutes}</p>
          </div>
          <div className="p-6 bg-white border border-border rounded-lg shadow-sm">
            <ShieldCheck size={20} className="text-emerald-500 mb-3" />
            <p className="text-[13px] text-muted">Paid Subscriptions</p>
            <p className="text-[24px] font-bold">{stats.activePlans}</p>
          </div>
          <div className="p-6 bg-white border border-border rounded-lg shadow-sm">
            <Users size={20} className="text-purple-500 mb-3" />
            <p className="text-[13px] text-muted">Total Users on Platform</p>
            <p className="text-[24px] font-bold">{stats.totalUsers}</p>
          </div>
        </div>
      )}

      <div className="border border-border rounded-lg bg-white p-6">
        <h3 className="text-[16px] font-bold mb-4">Quick Links</h3>
        <div className="flex gap-4">
          <Link href="/dashboard/platform/companies" className="px-4 py-2 bg-primary text-white text-[14px] font-medium rounded-md">
            Manage Organizations
          </Link>
        </div>
      </div>
    </div>
  );
}