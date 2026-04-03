'use client';

import React, { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import Pagination from '@/components/ui/Pagination';
import { Loader2, Download, Search, Filter, Calendar, FileSpreadsheet } from 'lucide-react';

export default function AttendanceLogsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'daily' | 'records'>('daily');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Fetch daily summary
  useEffect(() => {
    if (view === 'daily') {
      setLoading(true);
      api.get(`/attendance/daily-summary?date=${date}`)
        .then(res => setDailyData(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [date, view]);

  // Fetch all records
  useEffect(() => {
    if (view === 'records') {
      setLoading(true);
      api.get('/attendance/company')
        .then(res => { setRecords(res.data); setPage(1); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [view]);

  // Excel download
  const handleDownload = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/reports/attendance/download?type=monthly`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `attendance_report.xlsx`;
      a.click();
    } catch {
      alert('Download failed');
    }
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((a: any) => {
      const name = a.user_id?.name || '';
      const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, search, statusFilter]);

  const totalPages = Math.ceil(filteredRecords.length / perPage);
  const paginated = filteredRecords.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Attendance Logs" subtitle="Organization Attendance View" />

      {/* View Toggle + Controls */}
      <div className="border border-border rounded-lg bg-white p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setView('daily')}
              className={`px-4 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${
                view === 'daily' ? 'bg-primary text-white border-primary' : 'bg-surface text-muted border-border'
              }`}>
              <Calendar size={14} className="inline mr-1.5" />Daily Snapshot
            </button>
            <button onClick={() => setView('records')}
              className={`px-4 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${
                view === 'records' ? 'bg-primary text-white border-primary' : 'bg-surface text-muted border-border'
              }`}>
              All Records
            </button>
          </div>
          <div className="flex items-center gap-2">
            {view === 'daily' && (
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="bg-surface border border-border p-2 rounded-md outline-none text-[13px] font-medium focus:border-primary" />
            )}
            <button onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[13px] font-medium transition-colors">
              <FileSpreadsheet size={16} />
              Excel
            </button>
          </div>
        </div>

        {view === 'records' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
              <input placeholder="Search by name..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-md bg-surface text-[13px] outline-none focus:border-primary" />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-surface border border-border p-2 rounded-md text-[13px] outline-none focus:border-primary">
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half-Day">Half-Day</option>
              <option value="Early-Departure">Early Departure</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : view === 'daily' && dailyData ? (
        <>
          {/* Daily Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <StatBox label="Total" value={dailyData.total_users} color="text-primary" />
            <StatBox label="Present" value={dailyData.present} color="text-emerald-600" />
            <StatBox label="Late" value={dailyData.late} color="text-amber-600" />
            <StatBox label="Absent" value={dailyData.absent} color="text-red-600" />
            <StatBox label="On Leave" value={dailyData.on_leave} color="text-violet-600" />
            <StatBox label="Half Day" value={dailyData.half_day || 0} color="text-orange-600" />
          </div>

          {/* Lists */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ListCard title="Late Arrivals" items={dailyData.late_arrivals} color="text-amber-700" bgColor="bg-amber-50"
              renderItem={(l: any) => (
                <div className="flex justify-between text-[13px]">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-amber-600 font-semibold">{l.late_by}m late</span>
                </div>
              )} />
            <ListCard title="Not Checked In" items={dailyData.not_checked_in} color="text-red-700" bgColor="bg-red-50"
              renderItem={(l: any) => (
                <div className="flex justify-between text-[13px]">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-muted text-[11px]">{l.department || l.role}</span>
                </div>
              )} />
            <ListCard title="Completed Shift" items={dailyData.checked_out} color="text-blue-700" bgColor="bg-blue-50"
              renderItem={(l: any) => (
                <div className="flex justify-between text-[13px]">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-blue-600 font-semibold">{l.work_hours?.toFixed(1)}h</span>
                </div>
              )} />
          </div>
        </>
      ) : view === 'records' ? (
        <div className="border border-border rounded-lg bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold">All Attendance Records</h3>
            <span className="text-[12px] text-muted">{filteredRecords.length} records</span>
          </div>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
                <tr>
                  <th className="p-3 px-4">Employee</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Check In</th>
                  <th className="p-3">Check Out</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {paginated.map((a: any) => (
                  <tr key={a._id} className="border-t border-border-light hover:bg-surface/50 transition-colors">
                    <td className="p-3 px-4">
                      <p className="font-medium text-[14px]">{a.user_id?.name || 'Unknown'}</p>
                      <p className="text-[12px] text-muted">{a.user_id?.email || ''}</p>
                    </td>
                    <td className="p-3 text-[13px]">
                      {new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-3 text-[13px]">
                      {a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-3 text-[13px]">
                      {a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-3 text-[13px]">{a.work_hours ? `${a.work_hours}h` : '—'}</td>
                    <td className="p-3 text-[12px] text-muted">{a.mode}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${
                        a.status === 'Present' ? 'bg-green-100 text-green-700' :
                        a.status === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                        a.status === 'Half-Day' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={totalPages} total={filteredRecords.length} limit={perPage} onPageChange={setPage} />
        </div>
      ) : null}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 bg-white border border-border rounded-lg text-center">
      <p className="text-[11px] text-muted mb-1">{label}</p>
      <p className={`text-[22px] font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ListCard({ title, items, color, bgColor, renderItem }: any) {
  return (
    <div className="border border-border rounded-lg bg-white p-5 space-y-3">
      <h4 className={`text-[14px] font-semibold ${color}`}>{title} ({items?.length || 0})</h4>
      {items?.length > 0 ? (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {items.map((item: any, i: number) => (
            <div key={i} className={`p-2 ${bgColor} rounded`}>{renderItem(item)}</div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-muted text-center py-2">None</p>
      )}
    </div>
  );
}