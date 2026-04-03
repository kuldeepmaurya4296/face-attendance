'use client';

import React, { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import api from '@/lib/api';
import { Loader2, Users, Building, ShieldCheck, GraduationCap, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const PLAN_COLORS = ['#16a34a', '#2563eb'];
const ORG_COLORS = ['#2563eb', '#7c3aed'];

export default function PlatformOverview() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/companies'),
      api.get('/users'),
    ]).then(([compRes, usersRes]) => {
      setCompanies(compRes.data || []);
      setAllUsers(usersRes.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    totalCompanies: companies.filter(c => c.org_type === 'Company').length,
    totalInstitutes: companies.filter(c => c.org_type === 'Institute').length,
    activePlans: companies.filter(c => c.plan === 'Paid').length,
    freePlans: companies.filter(c => c.plan === 'Free').length,
    totalUsers: allUsers.length,
    activeOrgs: companies.filter(c => c.status === 'Active').length,
  }), [companies, allUsers]);

  // Plan distribution chart
  const planData = useMemo(() => [
    { name: 'Paid', value: stats.activePlans },
    { name: 'Free', value: stats.freePlans },
  ].filter(d => d.value > 0), [stats]);

  // Top companies by user count
  const topCompanies = useMemo(() => {
    const compMap = new Map<string, { name: string; count: number }>();
    companies.forEach(c => compMap.set(c._id, { name: c.name, count: 0 }));
    allUsers.forEach(u => {
      if (u.company_id) {
        const entry = compMap.get(u.company_id);
        if (entry) entry.count++;
      }
    });
    return Array.from(compMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map(c => ({ name: c.name.length > 15 ? c.name.substring(0, 15) + '…' : c.name, users: c.count }));
  }, [companies, allUsers]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Platform Owner" subtitle="Global Operations Overview" />

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={Building} label="Companies" value={stats.totalCompanies} color="text-blue-500" />
            <StatCard icon={GraduationCap} label="Institutes" value={stats.totalInstitutes} color="text-indigo-500" />
            <StatCard icon={ShieldCheck} label="Paid Plans" value={stats.activePlans} color="text-emerald-500" />
            <StatCard icon={Activity} label="Free Plans" value={stats.freePlans} color="text-amber-500" />
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="text-purple-500" />
            <StatCard icon={TrendingUp} label="Active Orgs" value={stats.activeOrgs} color="text-cyan-500" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Distribution */}
            {planData.length > 0 && (
              <div className="border border-border rounded-lg bg-white p-6">
                <h3 className="text-[16px] font-bold mb-4">Plan Distribution</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={planData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                      paddingAngle={4} dataKey="value"
                      label={(props: any) => `${props.name || ''} (${props.value})`}>
                      {planData.map((_, i) => (
                        <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Companies */}
            {topCompanies.length > 0 && (
              <div className="border border-border rounded-lg bg-white p-6">
                <h3 className="text-[16px] font-bold mb-4">Top Organizations by Users</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topCompanies} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="users" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Companies Table */}
          <div className="border border-border rounded-lg bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold">All Organizations</h3>
              <Link href="/dashboard/platform/companies" className="text-[13px] text-primary font-medium hover:underline">
                Manage →
              </Link>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
                  <tr>
                    <th className="p-3 px-4">Organization</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Users</th>
                  </tr>
                </thead>
                <tbody className="text-[14px]">
                  {companies.map(c => {
                    const userCount = allUsers.filter(u => u.company_id === c._id).length;
                    return (
                      <tr key={c._id} className="border-t border-border-light hover:bg-surface/50 transition-colors">
                        <td className="p-3 px-4 font-medium">{c.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            c.org_type === 'Institute' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                          }`}>{c.org_type}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            c.plan === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}>{c.plan}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>{c.status}</span>
                        </td>
                        <td className="p-3 text-center font-semibold">{userCount}</td>
                      </tr>
                    );
                  })}
                  {companies.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted">No organizations yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="p-5 bg-white border border-border rounded-lg shadow-sm">
      <Icon size={20} className={`${color} mb-2`} />
      <p className="text-[12px] text-muted">{label}</p>
      <p className="text-[24px] font-bold">{value}</p>
    </div>
  );
}