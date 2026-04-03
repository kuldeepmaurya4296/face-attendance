'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import UserRegistrationModal from '@/components/dashboard/shared/UserRegistrationModal';
import { Plus, Trash2, Pencil, CheckCircle, X, Loader2 } from 'lucide-react';

export default function PersonnelPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    api.get('/users').then(res => {
      setUsers(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    await api.delete(`/users/${id}`);
    fetchUsers();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Personnel" subtitle="Manage Employees" />
      
      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold">Organization Personnel</h3>
          <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 text-[14px]">
            <Plus size={16} /> Register User
          </button>
        </div>

        {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left">
              <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
                <tr>
                  <th className="p-3 px-4">Name</th><th className="p-3">Department</th><th className="p-3">Role</th><th className="p-3 text-center">Face ID</th><th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {users.map(u => (
                  <tr key={u._id} className="border-t border-border-light hover:bg-surface">
                    <td className="p-3 px-4"><p className="font-medium">{u.name}</p><p className="text-[12px] text-muted">{u.email}</p></td>
                    <td className="p-3 text-[12px] text-muted">{u.department || 'General'}</td>
                    <td className="p-3 text-[12px]">{u.role}</td>
                    <td className="p-3 text-center">{u.has_face_id ? <CheckCircle size={16} className="text-success mx-auto" /> : <X size={16} className="text-danger mx-auto" />}</td>
                    <td className="p-3 text-right">
                      {u.role !== 'SuperAdmin' && (
                        <button onClick={() => handleDelete(u._id, u.name)} className="p-1.5 text-muted hover:text-danger"><Trash2 size={16} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAdding && <UserRegistrationModal onClose={() => setIsAdding(false)} onRefresh={fetchUsers} />}
    </div>
  );
}