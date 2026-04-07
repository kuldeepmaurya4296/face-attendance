'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { Loader2, Building, GraduationCap, X, PlusCircle, ShieldCheck, Mail, Lock, User, CheckCircle2, ChevronRight } from 'lucide-react';

interface Props {
  onClose: () => void;
  onRefresh: () => void;
}

export default function CompanyOnboardModal({ onClose, onRefresh }: Props) {
  const [data, setData] = useState({ companyName: '', org_type: 'Company', plan: 'Free', adminName: '', adminEmail: '', adminPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/companies/onboard', data);
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="border border-white/20 rounded-2xl bg-white max-w-2xl w-full flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
              <PlusCircle size={24} />
            </div>
            <div>
              <h3 className="text-[20px] font-black tracking-tight text-foreground">Onboard Organization</h3>
              <p className="text-[12px] text-muted font-bold uppercase tracking-widest">Global Tenant Provisioning</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-colors text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-danger text-[13px] font-black flex items-center gap-3 animate-pulse">
                <CheckCircle2 size={18} className="rotate-180" /> {error}
              </div>
            )}

            {/* Step 1: Type Selection */}
            <div className="space-y-4">
              <SectionHeader title="Organization Type" />
              <div className="grid grid-cols-2 gap-4">
                <SelectableCard 
                  active={data.org_type === 'Company'} 
                  onClick={() => setData({ ...data, org_type: 'Company' })}
                  icon={Building}
                  label="Corporate Entity"
                  description="Standard Business / Office"
                />
                <SelectableCard 
                  active={data.org_type === 'Institute'} 
                  onClick={() => setData({ ...data, org_type: 'Institute' })}
                  icon={GraduationCap}
                  label="Academic / School"
                  description="Education / Training Center"
                />
              </div>
            </div>

            {/* Step 2: Org Details */}
            <div className="space-y-4 pt-4 border-t border-border-light">
              <SectionHeader title="Core Identity" />
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <InputField 
                    label="Legal Organization Name" 
                    icon={Building} 
                    required 
                    placeholder="E.g. Acme Global Industries" 
                    value={data.companyName} 
                    onChange={(v: string) => setData({...data, companyName: v})} 
                  />
                </div>
                <div className="col-span-2">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                      Subscription Plan <ChevronRight size={12} className="text-primary" />
                    </label>
                    <select 
                      value={data.plan} 
                      onChange={e => setData({...data, plan: e.target.value})} 
                      className="w-full bg-surface border border-border rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[14px] font-black transition-all appearance-none cursor-pointer"
                    >
                      <option value="Free">Developer (Free Tier)</option>
                      <option value="Paid">Enterprise (Premium Tier)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Admin Details */}
            <div className="space-y-4 pt-4 border-t border-border-light bg-primary/[0.01] -mx-8 px-8 pb-8">
              <SectionHeader title="Provision SuperAdmin Account" />
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <InputField 
                    label="Administrator Name" 
                    icon={User} 
                    required 
                    placeholder="Alex Rivera" 
                    value={data.adminName} 
                    onChange={(v: string) => setData({...data, adminName: v})} 
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <InputField 
                    label="Corporate Email" 
                    icon={Mail} 
                    required 
                    type="email" 
                    placeholder="admin@tenant.com" 
                    value={data.adminEmail} 
                    onChange={(v: string) => setData({...data, adminEmail: v})} 
                  />
                </div>
                <div className="col-span-2">
                  <InputField 
                    label="Secure Password" 
                    icon={Lock} 
                    required 
                    type="password" 
                    minLength={6} 
                    placeholder="••••••••" 
                    value={data.adminPassword} 
                    onChange={(v: string) => setData({...data, adminPassword: v})} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 px-8 bg-surface border-t border-border flex items-center justify-between">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2.5 rounded-xl border border-border bg-white text-[14px] font-black uppercase tracking-widest hover:bg-surface transition-all text-muted"
            >
              Cancel
            </button>
            <button 
              disabled={loading} 
              type="submit" 
              className="px-10 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[14px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/30 disabled:opacity-50 flex items-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>Deploy Environment <ShieldCheck size={18} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h4 className="text-[12px] font-black text-muted uppercase tracking-widest flex items-center gap-2 mb-2">
      <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {title}
    </h4>
  );
}

function SelectableCard({ active, onClick, icon: Icon, label, description }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden ${
        active ? 'bg-primary/5 border-primary shadow-md' : 'bg-surface border-border/60 text-muted hover:border-primary/40 hover:bg-white'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-border text-muted group-hover:text-primary'}`}>
        <Icon size={24} />
      </div>
      <div className="text-center">
        <p className={`text-[13px] font-black tracking-tight ${active ? 'text-primary' : 'text-foreground'}`}>{label}</p>
        <p className="text-[10px] opacity-70 font-medium">{description}</p>
      </div>
      {active && (
        <div className="absolute top-2 right-2 text-primary">
          <CheckCircle2 size={16} />
        </div>
      )}
    </button>
  );
}

function InputField({ label, icon: Icon, value, onChange, placeholder, required = false, type = "text", ...props }: { label: string, icon?: any, value: string, onChange: (v: string) => void, placeholder?: string, required?: boolean, type?: string, [key: string]: any }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-black text-muted uppercase tracking-widest">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <div className="relative group">
        {Icon && <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />}
        <input 
          {...props}
          type={type}
          required={required}
          value={value} 
          onChange={e => onChange(e.target.value)} 
          placeholder={placeholder}
          className={`w-full bg-surface border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[14px] font-bold transition-all ${Icon ? 'pl-12' : 'pl-4'} p-3.5 placeholder:text-muted/40`}
        />
      </div>
    </div>
  );
}