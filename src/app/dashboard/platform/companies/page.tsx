'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import { Plus, Loader2 } from 'lucide-react';
import CompanyOnboardModal from '@/components/dashboard/owner/CompanyOnboardModal';

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = () => {
    api.get('/companies').then(res => {
      setCompanies(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (user?.role === 'Owner') fetchCompanies();
  }, [user]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Companies" subtitle="Tenant Management" />
      
      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold">All Companies</h3>
          <button onClick={() => setIsOnboarding(true)} className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 text-[14px]">
            <Plus size={16} /> Onboard New
          </button>
        </div>
        
        {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(c => (
              <div key={c._id} className="p-5 bg-surface rounded-md border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[14px]">{c.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${c.plan === 'Paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{c.plan}</span>
                </div>
              </div>
            ))}
            {companies.length === 0 && <div className="col-span-full py-12 text-center text-muted text-[14px]">No companies found.</div>}
          </div>
        )}
      </div>

      {isOnboarding && <CompanyOnboardModal onClose={() => setIsOnboarding(false)} onRefresh={fetchCompanies} />}
    </div>
  );
}