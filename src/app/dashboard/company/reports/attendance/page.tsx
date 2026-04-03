'use client';

import React, { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import Pagination from '@/components/ui/Pagination';
import {
  Loader2, Download, FileSpreadsheet, Search, Filter,
  TrendingUp, Users, Clock, AlertTriangle, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const PERIOD_PRESETS = [
  { label: 'This Week', type: 'weekly' },
  { label: 'This Month', type: 'monthly' },
  { label: 'Last 3 Months', type: 'custom', months: 3 },
  { label: 'This Year', type: 'yearly' },
  { label: 'Custom', type: 'custom' },
];

const PIE_COLORS = ['#16a34a', '#dc2626', '#d97706', '#7c3aed', '#2563eb'];

export default function AttendanceReportPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const fetchReport = () => {
    setLoading(true);
    setError(null);
    let url = `/reports/attendance?type=${selectedPeriod}`;
    if (selectedPeriod === 'custom' && customFrom && customTo) {
      url = `/reports/attendance?type=custom&from=${customFrom}&to=${customTo}`;
    }
    api.get(url)
      .then(res => { setReport(res.data); setPage(1); })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 403) {
          setError('You do not have permission to view attendance reports. Please contact your SuperAdmin.');
        } else if (status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError(err?.response?.data?.error || 'Failed to load attendance report.');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedPeriod !== 'custom') fetchReport();
  }, [selectedPeriod]);

  const handleCustomFetch = () => {
    if (customFrom && customTo) fetchReport();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      let url = `/api/reports/attendance/download?type=${selectedPeriod}`;
      if (selectedPeriod === 'custom' && customFrom && customTo) {
        url = `/api/reports/attendance/download?type=custom&from=${customFrom}&to=${customTo}`;
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `attendance_report.xlsx`;
      a.click();
    } catch {} finally { setDownloading(false); }
  };

  // Filtered & paginated rows
  const filteredRows = useMemo(() => {
    if (!report?.rows) return [];
    return report.rows.filter((r: any) => {
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase());
      const matchDept = !deptFilter || r.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [report, search, deptFilter]);

  const totalPages = Math.ceil(filteredRows.length / perPage);
  const paginatedRows = filteredRows.slice((page - 1) * perPage, page * perPage);
  const departments = useMemo(() => {
    if (!report?.rows) return [];
    return [...new Set(report.rows.map((r: any) => r.department))];
  }, [report]);

  // Chart data
  const pieData = useMemo(() => {
    if (!report) return [];
    const totals = report.rows?.reduce(
      (acc: any, r: any) => ({
        present: acc.present + r.present,
        absent: acc.absent + r.absent,
        late: acc.late + r.late,
        on_leave: acc.on_leave + r.on_leave,
        half_day: acc.half_day + r.half_day,
      }),
      { present: 0, absent: 0, late: 0, on_leave: 0, half_day: 0 }
    ) || {};
    return [
      { name: 'Present', value: totals.present || 0 },
      { name: 'Absent', value: totals.absent || 0 },
      { name: 'Late', value: totals.late || 0 },
      { name: 'On Leave', value: totals.on_leave || 0 },
      { name: 'Half Day', value: totals.half_day || 0 },
    ].filter(d => d.value > 0);
  }, [report]);

  const deptChartData = useMemo(() => {
    if (!report?.department_breakdown) return [];
    return report.department_breakdown.map((d: any) => ({
      name: d.department.length > 12 ? d.department.substring(0, 12) + '…' : d.department,
      'Attendance %': d.avg_attendance_pct,
      'Avg Hours': d.avg_work_hours,
      employees: d.total,
    }));
  }, [report]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Attendance Report" subtitle="Analyze attendance across your organization" />

      {/* Controls */}
      <div className="border border-border rounded-lg bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {PERIOD_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => {
                if (p.months) {
                  const to = new Date();
                  const from = new Date();
                  from.setMonth(from.getMonth() - p.months);
                  setCustomFrom(from.toISOString().split('T')[0]);
                  setCustomTo(to.toISOString().split('T')[0]);
                  setSelectedPeriod('custom');
                  setTimeout(fetchReport, 50);
                } else {
                  setSelectedPeriod(p.type);
                }
              }}
              className={`px-4 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${
                selectedPeriod === p.type
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-muted border-border hover:bg-surface-hover'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {selectedPeriod === 'custom' && (
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-muted">From</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="bg-surface border border-border p-2 rounded-md text-[13px] outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-muted">To</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="bg-surface border border-border p-2 rounded-md text-[13px] outline-none focus:border-primary" />
            </div>
            <button onClick={handleCustomFetch}
              className="px-4 py-2 bg-primary text-white rounded-md text-[13px] font-medium hover:bg-primary-hover">
              Generate
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 rounded-lg p-8 text-center space-y-2">
          <AlertTriangle size={32} className="text-red-500 mx-auto" />
          <p className="text-[15px] font-semibold text-red-700">{error}</p>
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Employees" value={report.total_employees} color="text-blue-500" />
            <StatCard icon={TrendingUp} label="Avg Attendance" value={`${report.avg_attendance_pct}%`}
              color={report.avg_attendance_pct >= 90 ? 'text-emerald-500' : report.avg_attendance_pct >= 75 ? 'text-amber-500' : 'text-red-500'} />
            <StatCard icon={Clock} label="Total Overtime" value={`${report.total_overtime_hours}h`} color="text-violet-500" />
            <StatCard icon={AlertTriangle} label="Working Days" value={report.total_working_days} color="text-primary" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart - Status Distribution */}
            {pieData.length > 0 && (
              <div className="border border-border rounded-lg bg-white p-6">
                <h3 className="text-[16px] font-bold mb-4">Status Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                      paddingAngle={3} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Bar Chart - Department Comparison */}
            {deptChartData.length > 0 && (
              <div className="border border-border rounded-lg bg-white p-6">
                <h3 className="text-[16px] font-bold mb-4">Department Comparison</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={deptChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="Attendance %" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Avg Hours" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Most Late */}
          {report.most_late?.length > 0 && (
            <div className="border border-border rounded-lg bg-white p-6">
              <h3 className="text-[16px] font-bold mb-3">Frequent Late Arrivals</h3>
              <div className="flex flex-wrap gap-3">
                {report.most_late.map((m: any, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-[13px] font-medium text-amber-800">
                    {m.name} — {m.count}× late
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="border border-border rounded-lg bg-white p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <h3 className="text-[16px] font-bold">Employee Breakdown</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                  <input placeholder="Search employee..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9 pr-4 py-2 border border-border rounded-md bg-surface text-[13px] w-52 outline-none focus:border-primary" />
                </div>
                <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
                  className="bg-surface border border-border p-2 rounded-md text-[13px] outline-none focus:border-primary">
                  <option value="">All Depts</option>
                  {departments.map((d: any) => <option key={d} value={d}>{d}</option>)}
                </select>
                <button onClick={handleDownload} disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[13px] font-medium transition-colors disabled:opacity-50">
                  <FileSpreadsheet size={16} />
                  {downloading ? 'Generating...' : 'Excel'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
                  <tr>
                    <th className="p-3 px-4">Employee</th>
                    <th className="p-3">Dept</th>
                    <th className="p-3 text-center">Present</th>
                    <th className="p-3 text-center">Absent</th>
                    <th className="p-3 text-center">Late</th>
                    <th className="p-3 text-center">Leave</th>
                    <th className="p-3 text-center">Avg Hrs</th>
                    <th className="p-3 text-center">Overtime</th>
                    <th className="p-3 text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="text-[14px]">
                  {paginatedRows.map((row: any) => (
                    <tr key={row.user_id} className="border-t border-border-light hover:bg-surface/50 transition-colors">
                      <td className="p-3 px-4">
                        <p className="font-medium text-[14px]">{row.name}</p>
                        <p className="text-[12px] text-muted">{row.email}</p>
                      </td>
                      <td className="p-3 text-[13px] text-muted">{row.department}</td>
                      <td className="p-3 text-center text-[13px] font-semibold text-emerald-600">{row.present}</td>
                      <td className="p-3 text-center text-[13px] font-semibold text-red-600">{row.absent}</td>
                      <td className="p-3 text-center text-[13px] font-semibold text-amber-600">{row.late}</td>
                      <td className="p-3 text-center text-[13px] text-violet-600">{row.on_leave}</td>
                      <td className="p-3 text-center text-[13px]">{row.avg_work_hours}h</td>
                      <td className="p-3 text-center text-[13px]">{row.overtime_hours}h</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[12px] font-bold ${
                          row.attendance_percentage >= 90 ? 'bg-emerald-100 text-emerald-700' :
                          row.attendance_percentage >= 75 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {row.attendance_percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {paginatedRows.length === 0 && (
                    <tr><td colSpan={9} className="p-8 text-center text-muted">No data found for this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination page={page} pages={totalPages} total={filteredRows.length} limit={perPage} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <div className="text-center p-12 text-muted">Select a period to generate the report.</div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="p-5 bg-white border border-border rounded-lg shadow-sm">
      <Icon size={20} className={`${color} mb-2`} />
      <p className="text-[12px] text-muted">{label}</p>
      <p className="text-[24px] font-bold">{value}</p>
    </div>
  );
}
