'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import PermissionGate from '@/components/dashboard/shared/PermissionGate';
import UserRegistrationModal from '@/components/dashboard/shared/UserRegistrationModal';
import { Loader2, Plus, Pencil, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';

export default function PersonnelPage() {
  const { user } = useAuth();
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

  const handleDelete = async (id: string, name: string) => {
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
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title={orgType === 'Institute' ? 'Students & Staff' : 'Personnel Management'} subtitle="Manage Users" />
      
      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              placeholder="Search by name, email, ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-border rounded-md bg-surface text-[14px] w-full md:w-80 outline-none focus:border-primary"
            />
          </div>
          
          <PermissionGate permission="manage_personnel">
            <button onClick={() => setIsRegistering(true)} className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 text-[14px] font-medium hover:bg-primary-hover whitespace-nowrap">
              <Plus size={16} /> Register {orgType === 'Institute' ? 'Student' : 'Employee'}
            </button>
          </PermissionGate>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
                <tr>
                  <th className="p-3 px-4">Name</th>
                  {orgType === 'Company' ? (
                    <>
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Designation</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Class/Course</th>
                      <th className="p-3 text-center">Section</th>
                    </>
                  )}
                  <th className="p-3 text-center">Role</th>
                  <th className="p-3 text-center">Face ID</th>
                  <PermissionGate permission="manage_personnel" fallback={<th className="p-3"></th>}>
                    <th className="p-3 text-right">Actions</th>
                  </PermissionGate>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {filtered.map(p => (
                  <tr key={p._id} className="border-t border-border-light hover:bg-surface/50 transition-colors">
                    <td className="p-3 px-4">
                      <div className="font-medium text-[14px]">{p.name}</div>
                      <div className="text-[12px] text-muted">{p.email}</div>
                    </td>
                    
                    {orgType === 'Company' ? (
                      <>
                        <td className="p-3 text-[13px]">{p.employee_id || '—'}</td>
                        <td className="p-3 text-[13px]">{p.department || '—'}</td>
                        <td className="p-3 text-[13px] text-muted">{p.designation || '—'}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 text-[13px] font-mono">{p.roll_number || '—'}</td>
                        <td className="p-3 text-[13px]">{p.class_name || '—'}</td>
                        <td className="p-3 text-[13px] text-center">{p.section || '—'}</td>
                      </>
                    )}
                    
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${
                        p.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700' : 
                        p.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {p.has_face_id ? (
                        <CheckCircle size={16} className="text-success mx-auto" />
                      ) : (
                        <XCircle size={16} className="text-danger mx-auto" />
                      )}
                    </td>
                    
                    <PermissionGate permission="manage_personnel" fallback={<td className="p-3"></td>}>
                      <td className="p-3 text-right space-x-2">
                        {p.role !== 'SuperAdmin' && (
                          <button onClick={() => handleDelete(p._id, p.name)} className="p-1.5 text-muted hover:text-danger hover:bg-red-50 rounded transition-colors" title="Remove User">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </PermissionGate>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted">No personnel found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isRegistering && <UserRegistrationModal onClose={() => setIsRegistering(false)} onRefresh={fetchPersonnel} />}
    </div>
  );
}