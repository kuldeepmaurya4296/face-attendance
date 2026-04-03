'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import CompanyOnboardModal from '@/components/dashboard/owner/CompanyOnboardModal';
import { Loader2, Plus, Building, GraduationCap } from 'lucide-react';

export default function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState('All');

  const fetchCompanies = () => {
    api.get('/companies').then(res => {
      setCompanies(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => fetchCompanies(), []);

  const filtered = filter === 'All' ? companies : companies.filter(c => c.org_type === filter);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Organizations" subtitle="Manage Tenant Environments" />

      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {['All', 'Company', 'Institute'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium border ${filter === f ? 'bg-primary text-white border-primary' : 'bg-surface text-muted border-border hover:bg-surface-hover'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 text-[14px]">
             <Plus size={16} /> Onboard Organization
          </button>
        </div>

        {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(c => (
              <div key={c._id} className="p-5 border border-border rounded-lg hover:shadow-md transition-shadow bg-surface relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${c.status === 'Active' ? 'bg-success' : 'bg-danger'}`} />
                <div className="flex items-start justify-between mb-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded bg-white border border-border-light flex items-center justify-center text-primary shadow-sm">
                       {c.org_type === 'Institute' ? <GraduationCap size={20} /> : <Building size={20} />}
                     </div>
                     <div>
                       <h3 className="font-bold text-[15px]">{c.name}</h3>
                       <p className="text-[12px] text-muted">{c.org_type}</p>
                     </div>
                   </div>
                   <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${c.plan === 'Paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>{c.plan}</span>
                </div>
                <div className="text-[12px] text-muted">Created: {new Date(c.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-full py-12 text-center text-muted">No organizations found.</div>}
          </div>
        )}
      </div>

      {isAdding && <CompanyOnboardModal onClose={() => setIsAdding(false)} onRefresh={fetchCompanies} />}
    </div>
  );
}