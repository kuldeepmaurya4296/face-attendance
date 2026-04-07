'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import CompanyOnboardModal from '@/components/dashboard/owner/CompanyOnboardModal';
import OrganizationDetailsModal from '@/components/dashboard/owner/OrganizationDetailsModal';
import { Loader2, Plus, Building, GraduationCap, ArrowRight, Table, LayoutGrid, Search, Filter } from 'lucide-react';

export default function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCompanies = () => {
    api.get('/companies').then(res => {
      setCompanies(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => fetchCompanies(), []);

  const filtered = companies
    .filter(c => filter === 'All' || c.org_type === filter)
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Organizations" subtitle="Manage Tenant Environments" />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/70 backdrop-blur-md p-4 border border-border rounded-xl shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['All', 'Company', 'Institute'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/20' : 'bg-surface text-muted border border-border hover:bg-surface-hover hover:text-foreground'}`}
            >
              {f === 'All' ? 'View All' : f}
            </button>
          ))}
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
            <input 
              placeholder="Quick search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg outline-none focus:border-primary text-[14px] transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)} 
            className="px-6 py-2.5 bg-primary text-white rounded-lg flex items-center justify-center gap-2 text-[14px] font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all group"
          >
             <Plus size={18} className="transition-transform group-hover:rotate-90" /> Onboard
          </button>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-[14px] font-medium text-muted">Building tenant list...</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface/50 border-b border-border">
                  <th className="p-4 px-6 text-[12px] font-black text-muted uppercase tracking-widest">Organization</th>
                  <th className="p-4 text-[12px] font-black text-muted uppercase tracking-widest">Type</th>
                  <th className="p-4 text-[12px] font-black text-muted uppercase tracking-widest">Plan</th>
                  <th className="p-4 text-[12px] font-black text-muted uppercase tracking-widest">Registered</th>
                  <th className="p-4 text-[12px] font-black text-muted uppercase tracking-widest text-center">Status</th>
                  <th className="p-4 text-[12px] font-black text-muted uppercase tracking-widest text-right px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map(c => (
                  <tr 
                    key={c._id} 
                    onClick={() => setSelectedCompany(c)}
                    className="hover:bg-primary/[0.02] active:bg-primary/[0.04] cursor-pointer transition-colors group"
                  >
                    <td className="p-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-md transition-all">
                          {c.org_type === 'Institute' ? <GraduationCap size={20} /> : <Building size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-[15px] text-foreground tracking-tight">{c.name}</p>
                          <p className="text-[11px] text-muted font-mono">{c._id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black tracking-widest uppercase border ${
                        c.org_type === 'Institute' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>{c.org_type}</span>
                    </td>
                    <td className="p-4 text-[14px] font-medium">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black tracking-widest uppercase border ${
                        c.plan === 'Paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-500'
                      }`}>{c.plan}</span>
                    </td>
                    <td className="p-4 text-[13px] text-muted font-medium">
                      {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                          c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Active' ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
                          {c.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right px-6">
                      <button className="p-2 rounded-full hover:bg-primary/10 text-muted hover:text-primary transition-all">
                        <ArrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center text-muted space-y-2">
                        <Search size={40} className="text-border" />
                        <p className="text-[15px] font-medium">No results match your current search criteria.</p>
                        <button onClick={() => {setFilter('All'); setSearchQuery('');}} className="text-primary text-[13px] underline font-bold">Clear Filters</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-2 text-[12px] text-muted font-medium">
        <p>Total Registered Environment Counts: <span className="text-foreground font-black">{companies.length}</span></p>
        <p>Sorted by newest onboarded first</p>
      </div>

      {isAdding && <CompanyOnboardModal onClose={() => setIsAdding(false)} onRefresh={fetchCompanies} />}
      
      {selectedCompany && (
        <OrganizationDetailsModal 
          company={selectedCompany} 
          onClose={() => setSelectedCompany(null)} 
        />
      )}
    </div>
  );
}