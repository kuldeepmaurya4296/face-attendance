'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import {
  Loader2, ArrowLeft, Mail, Phone, Building, Briefcase, Calendar,
  CheckCircle, XCircle, Clock, TrendingUp, User as UserIcon, Camera
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

import UserRegistrationModal from '@/components/dashboard/shared/UserRegistrationModal';
import { useAuth } from '@/context/AuthContext';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const id = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, attRes, leaveRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/attendance/company`),
        api.get('/leaves'),
      ]);
      setUser(userRes.data);
      setAttendance(attRes.data.filter((a: any) => {
        const uid = typeof a.user_id === 'object' ? a.user_id?._id : a.user_id;
        return uid === id;
      }));
      setLeaves(leaveRes.data.filter((l: any) => {
        const uid = typeof l.user_id === 'object' ? l.user_id?._id : l.user_id;
        return uid === id;
      }));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Monthly summary stats
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthAttendance = attendance.filter(a => new Date(a.date) >= monthStart);
    
    return {
      present: monthAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length,
      late: monthAttendance.filter(a => a.is_late).length,
      absent: 0, // calculated differently in production
      totalHours: monthAttendance.reduce((s, a) => s + (a.work_hours || 0), 0),
      overtime: monthAttendance.reduce((s, a) => s + (a.overtime_hours || 0), 0),
    };
  }, [attendance]);

  // Work hours chart (last 14 days)
  const workHoursChart = useMemo(() => {
    const days: any[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().split('T')[0];
      const record = attendance.find(a => {
        const aDate = new Date(a.date);
        aDate.setHours(0, 0, 0, 0);
        return aDate.toISOString().split('T')[0] === dateStr;
      });
      days.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        hours: record?.work_hours || 0,
        status: record?.status || 'Absent',
      });
    }
    return days;
  }, [attendance]);

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted">User not found.</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-[14px]">Go Back</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Back button + Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-md border border-border bg-surface hover:bg-surface-hover transition-colors">
            <ArrowLeft size={18} />
          </button>
          <PageHeader title={user.name} subtitle={user.role === 'Admin' ? 'Administrative Official' : 'Personnel Profile'} />
        </div>
        
        {(currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Owner') && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-[13px] font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <UserIcon size={16} /> Edit Identity
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="border border-border rounded-lg bg-white p-6 space-y-5">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
              {user.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-[18px] font-bold">{user.name}</h2>
              <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${
                user.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>{user.role}</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border-light text-[13px]">
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Phone} label="Phone" value={user.phone || 'Not set'} />
            <InfoRow icon={Building} label="Department" value={user.department || 'General'} />
            <InfoRow icon={Briefcase} label="Designation" value={user.designation || '—'} />
            {user.employee_id && <InfoRow icon={UserIcon} label="Employee ID" value={user.employee_id} />}
            {user.joining_date && <InfoRow icon={Calendar} label="Joined" value={new Date(user.joining_date).toLocaleDateString()} />}
          </div>

          <div className="pt-3 border-t border-border-light flex items-center gap-2">
            <Camera size={16} className={user.has_face_id ? 'text-emerald-500' : 'text-red-500'} />
            <span className={`text-[13px] font-medium ${user.has_face_id ? 'text-emerald-600' : 'text-red-600'}`}>
              Face ID: {user.has_face_id ? 'Registered ✓' : 'Not Registered'}
            </span>
          </div>
        </div>

        {/* Stats + Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MiniStat label="Present" value={monthlyStats.present} color="text-emerald-600" bg="bg-emerald-50" />
            <MiniStat label="Late" value={monthlyStats.late} color="text-amber-600" bg="bg-amber-50" />
            <MiniStat label="Total Hours" value={`${monthlyStats.totalHours.toFixed(1)}h`} color="text-blue-600" bg="bg-blue-50" />
            <MiniStat label="Overtime" value={`${monthlyStats.overtime.toFixed(1)}h`} color="text-violet-600" bg="bg-violet-50" />
            <MiniStat label="Leaves Used" value={leaves.filter(l => l.status === 'Approved').length} color="text-pink-600" bg="bg-pink-50" />
          </div>

          {/* Work Hours Chart */}
          <div className="border border-border rounded-lg bg-white p-6">
            <h3 className="text-[16px] font-bold mb-4">Work Hours — Last 14 Days</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={workHoursChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 12]} />
                <Tooltip />
                <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} name="Hours Worked" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Attendance Table */}
      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <h3 className="text-[16px] font-bold">Attendance History</h3>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
              <tr>
                <th className="p-3 px-4">Date</th>
                <th className="p-3">Check In</th>
                <th className="p-3">Check Out</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Mode</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {attendance.slice(0, 30).map((a: any) => (
                <tr key={a._id} className="border-t border-border-light hover:bg-surface/50 transition-colors">
                  <td className="p-3 px-4 font-medium">
                    {new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-3 text-[13px]">
                    {a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="p-3 text-[13px]">
                    {a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="p-3 text-[13px]">{a.work_hours ? `${a.work_hours}h` : '—'}</td>
                  <td className="p-3 text-[13px] text-muted">{a.mode}</td>
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
              {attendance.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted">No attendance records.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave History */}
      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <h3 className="text-[16px] font-bold">Leave History</h3>
        <div className="space-y-2">
          {leaves.length === 0 ? (
            <p className="text-[14px] text-muted text-center py-4">No leave records.</p>
          ) : (
            leaves.slice(0, 10).map((l: any) => (
              <div key={l._id} className="flex items-center justify-between p-3 bg-surface rounded-md border border-border-light">
                <div>
                  <p className="font-medium text-[13px]">
                    {new Date(l.from_date).toLocaleDateString()} — {new Date(l.to_date).toLocaleDateString()}
                  </p>
                  <p className="text-[12px] text-muted">{l.leave_type || 'Casual'} · {l.reason}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${
                  l.status === 'Approved' ? 'bg-green-100 text-green-700' :
                  l.status === 'Pending' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>{l.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
      {isEditing && (
        <UserRegistrationModal 
          onClose={() => setIsEditing(false)} 
          onRefresh={fetchData} 
          editUser={user} 
        />
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-muted shrink-0" />
      <div>
        <p className="text-[11px] text-muted">{label}</p>
        <p className="text-[13px] font-medium">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, bg }: { label: string; value: any; color: string; bg: string }) {
  return (
    <div className={`p-4 rounded-lg ${bg} text-center`}>
      <p className="text-[11px] text-muted mb-1">{label}</p>
      <p className={`text-[20px] font-bold ${color}`}>{value}</p>
    </div>
  );
}
