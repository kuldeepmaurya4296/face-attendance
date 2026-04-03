'use client';

import React, { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import Pagination from '@/components/ui/Pagination';
import { Loader2, Search, CalendarDays, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const TYPE_COLORS: Record<string, string> = {
  Casual: '#2563eb',
  Sick: '#dc2626',
  Earned: '#16a34a',
  Unpaid: '#737373',
  Other: '#d97706',
};

export default function LeaveReportPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    Promise.all([
      api.get('/leaves'),
      api.get('/users'),
    ]).then(([lRes, uRes]) => {
      setLeaves(lRes.data);
      setUsers(uRes.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Per-user leave summary
  const userSummary = useMemo(() => {
    const map = new Map<string, any>();
    users.forEach((u: any) => {
      map.set(u._id, {
        user_id: u._id,
        name: u.name,
        email: u.email,
        department: u.department || 'General',
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        by_type: { Casual: 0, Sick: 0, Earned: 0, Unpaid: 0, Other: 0 },
      });
    });

    leaves.forEach((l: any) => {
      const uid = typeof l.user_id === 'object' ? l.user_id?._id : l.user_id;
      const entry = map.get(uid);
      if (!entry) return;
      
      // Calculate days
      const from = new Date(l.from_date);
      const to = new Date(l.to_date);
      const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1);
      
      entry.total += days;
      if (l.status === 'Approved') entry.approved += days;
      else if (l.status === 'Pending') entry.pending += days;
      else entry.rejected += days;
      
      const type = l.leave_type || 'Casual';
      if (entry.by_type[type] !== undefined) entry.by_type[type] += days;
    });

    return Array.from(map.values()).filter(u => u.total > 0);
  }, [leaves, users]);

  // Type distribution
  const typeDistribution = useMemo(() => {
    const totals: Record<string, number> = { Casual: 0, Sick: 0, Earned: 0, Unpaid: 0, Other: 0 };
    userSummary.forEach(u => {
      Object.keys(totals).forEach(k => { totals[k] += u.by_type[k]; });
    });
    return Object.entries(totals).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [userSummary]);

  // Status distribution
  const statusData = useMemo(() => {
    const approved = leaves.filter(l => l.status === 'Approved').length;
    const pending = leaves.filter(l => l.status === 'Pending').length;
    const rejected = leaves.filter(l => l.status === 'Rejected').length;
    return [
      { name: 'Approved', value: approved },
      { name: 'Pending', value: pending },
      { name: 'Rejected', value: rejected },
    ].filter(d => d.value > 0);
  }, [leaves]);

  // Filter & paginate
  const filtered = useMemo(() => {
    return userSummary.filter(u =>
      !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [userSummary, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginatedRows = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="Leave Report" subtitle="Analysis" />
        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" size={32} /></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Leave Report" subtitle="Leave utilization analysis" />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-border rounded-lg shadow-sm">
          <CalendarDays size={20} className="text-blue-500 mb-2" />
          <p className="text-[12px] text-muted">Total Requests</p>
          <p className="text-[24px] font-bold">{leaves.length}</p>
        </div>
        <div className="p-5 bg-white border border-border rounded-lg shadow-sm">
          <CheckCircle size={20} className="text-emerald-500 mb-2" />
          <p className="text-[12px] text-muted">Approved</p>
          <p className="text-[24px] font-bold">{leaves.filter(l => l.status === 'Approved').length}</p>
        </div>
        <div className="p-5 bg-white border border-border rounded-lg shadow-sm">
          <Clock size={20} className="text-amber-500 mb-2" />
          <p className="text-[12px] text-muted">Pending</p>
          <p className="text-[24px] font-bold">{leaves.filter(l => l.status === 'Pending').length}</p>
        </div>
        <div className="p-5 bg-white border border-border rounded-lg shadow-sm">
          <XCircle size={20} className="text-red-500 mb-2" />
          <p className="text-[12px] text-muted">Rejected</p>
          <p className="text-[24px] font-bold">{leaves.filter(l => l.status === 'Rejected').length}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {typeDistribution.length > 0 && (
          <div className="border border-border rounded-lg bg-white p-6">
            <h3 className="text-[16px] font-bold mb-4">Leave Type Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                  paddingAngle={3} dataKey="value"
                  label={(props: any) => `${props.name || ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}>
                  {typeDistribution.map((d, i) => (
                    <Cell key={i} fill={TYPE_COLORS[d.name] || '#737373'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {statusData.length > 0 && (
          <div className="border border-border rounded-lg bg-white p-6">
            <h3 className="text-[16px] font-bold mb-4">Request Status Overview</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={d.name === 'Approved' ? '#16a34a' : d.name === 'Pending' ? '#d97706' : '#dc2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Per-User Table */}
      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h3 className="text-[16px] font-bold">Employee Leave Summary</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
            <input placeholder="Search employee..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-border rounded-md bg-surface text-[13px] w-52 outline-none focus:border-primary" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
              <tr>
                <th className="p-3 px-4">Employee</th>
                <th className="p-3">Dept</th>
                <th className="p-3 text-center">Total Days</th>
                <th className="p-3 text-center">Approved</th>
                <th className="p-3 text-center">Pending</th>
                <th className="p-3 text-center">Casual</th>
                <th className="p-3 text-center">Sick</th>
                <th className="p-3 text-center">Earned</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {paginatedRows.map((row: any) => (
                <tr key={row.user_id} className="border-t border-border-light hover:bg-surface/50 transition-colors">
                  <td className="p-3 px-4">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-[12px] text-muted">{row.email}</p>
                  </td>
                  <td className="p-3 text-[13px] text-muted">{row.department}</td>
                  <td className="p-3 text-center font-semibold">{row.total}</td>
                  <td className="p-3 text-center text-emerald-600 font-semibold">{row.approved}</td>
                  <td className="p-3 text-center text-amber-600 font-semibold">{row.pending}</td>
                  <td className="p-3 text-center text-[13px]">{row.by_type.Casual}</td>
                  <td className="p-3 text-center text-[13px]">{row.by_type.Sick}</td>
                  <td className="p-3 text-center text-[13px]">{row.by_type.Earned}</td>
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted">No leave records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pages={totalPages} total={filtered.length} limit={perPage} onPageChange={setPage} />
      </div>
    </div>
  );
}
