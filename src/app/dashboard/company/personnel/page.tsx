'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import PermissionGate from '@/components/dashboard/shared/PermissionGate';
import UserRegistrationModal from '@/components/dashboard/shared/UserRegistrationModal';
import { Loader2, Plus, Pencil, Trash2, Search, CheckCircle, XCircle, SearchIcon, Filter, Users, UserPlus } from 'lucide-react';

export default function PersonnelPage() {
  const { user } = useAuth();
  const router = useRouter();
  const orgType = user?.org_type;
  
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPersonnel = () => {
    api.get('/users').then(res => {
      setPersonnel(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => fetchPersonnel(), []);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); // Don't trigger row click
    if (!confirm(`Remove ${name} from the organization?`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetchPersonnel();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const filtered = personnel.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.employee_id && p.employee_id.toLowerCase().includes(search.toLowerCase())) ||
    (p.roll_number && p.roll_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader 
          title={orgType === 'Institute' ? 'Identity Index' : 'Personnel Management'} 
          subtitle="Verified directory for the organization" 
        />
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md p-1.5 px-3 rounded-full border border-border/80 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Users size={16} />
          </div>
          <span className="text-[13px] font-black text-foreground">{personnel.length} <span className="text-muted font-bold ml-1">Total Verified</span></span>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-lg p-5 border border-border rounded-2xl shadow-xl shadow-black/[0.02]">
          <div className="relative flex-1 max-w-lg group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
            <input 
              placeholder={`Search by name, ID, or ${orgType === 'Institute' ? 'Roll No' : 'Department'}...`} 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface border border-border/60 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-[14px] font-medium transition-all"
            />
          </div>
          
          <PermissionGate permission="manage_personnel">
            <button 
              onClick={() => setIsRegistering(true)} 
              className="px-6 py-3 bg-primary text-white rounded-xl flex items-center justify-center gap-2 text-[14px] font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
            >
              <UserPlus size={18} /> Register {orgType === 'Institute' ? 'Student' : 'Employee'}
            </button>
          </PermissionGate>
        </div>

        {/* Content Area */}
        <div className="border border-border rounded-2xl bg-white shadow-2xl shadow-black/[0.02] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="text-[14px] font-black text-muted uppercase tracking-widest">Accessing Directory...</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-surface/50 text-[11px] font-black text-muted uppercase tracking-widest border-b border-border">
                  <tr>
                    <th className="p-5 px-8">Full Identity</th>
                    {orgType === 'Company' ? (
                      <>
                        <th className="p-5">Corporate ID</th>
                        <th className="p-5">Department</th>
                        <th className="p-5">Designation</th>
                      </>
                    ) : (
                      <>
                        <th className="p-5">Roll No</th>
                        <th className="p-5">Academic Course</th>
                        <th className="p-5 text-center">Batch Section</th>
                      </>
                    )}
                    <th className="p-5 text-center">System Level</th>
                    <th className="p-5 text-center px-8">Biometric Status</th>
                    <PermissionGate permission="manage_personnel" fallback={<th className="p-5"></th>}>
                      <th className="p-5 text-right px-8">Actions</th>
                    </PermissionGate>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {filtered.map(p => (
                    <tr 
                      key={p._id} 
                      onClick={() => router.push(`/dashboard/company/personnel/${p._id}`)} 
                      className="group transition-all hover:bg-primary/[0.02] cursor-pointer"
                    >
                      <td className="p-5 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center font-black text-primary transition-all group-hover:scale-110 group-hover:shadow-md">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-[15px] text-foreground tracking-tight group-hover:text-primary transition-colors">{p.name}</div>
                            <div className="text-[12px] text-muted font-medium">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      {orgType === 'Company' ? (
                        <>
                          <td className="p-5 text-[13px] font-black text-foreground/80">{p.employee_id || '—'}</td>
                          <td className="p-5 text-[13px] font-bold text-muted">{p.department || '—'}</td>
                          <td className="p-5 text-[13px] font-medium text-muted/60">{p.designation || '—'}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-5 text-[13px] font-mono font-black text-foreground/85">{p.roll_number || '—'}</td>
                          <td className="p-5 text-[13px] font-bold text-muted">{p.class_name || '—'}</td>
                          <td className="p-5 text-[13px] text-center font-bold text-primary">{p.section || '—'}</td>
                        </>
                      )}
                      
                      <td className="p-5 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                          p.role === 'SuperAdmin' ? 'bg-purple-50 border-purple-200 text-purple-700' : 
                          p.role === 'Admin' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="p-5 text-center px-8">
                        {p.has_face_id ? (
                          <div className="flex items-center justify-center gap-1.5 text-success font-black text-[11px] uppercase tracking-tighter">
                            <CheckCircle size={14} className="animate-pulse" /> Verified
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 text-danger font-black text-[11px] uppercase tracking-tighter opacity-50">
                            <XCircle size={14} /> Pending
                          </div>
                        )}
                      </td>
                      
                      <PermissionGate permission="manage_personnel" fallback={<td className="p-5 px-8"></td>}>
                        <td className="p-5 text-right space-x-2 px-8">
                          {p.role !== 'SuperAdmin' && (
                            <button 
                              onClick={(e) => handleDelete(e, p._id, p.name)} 
                              className="p-2.5 text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-all scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100" 
                              title="Revoke Identity"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </PermissionGate>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-20 text-center">
                         <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                            <SearchIcon size={48} className="text-muted/30" />
                            <p className="text-[14px] font-black text-muted uppercase tracking-widest">No matching personnel records</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isRegistering && <UserRegistrationModal onClose={() => setIsRegistering(false)} onRefresh={fetchPersonnel} />}
    </div>
  );
}