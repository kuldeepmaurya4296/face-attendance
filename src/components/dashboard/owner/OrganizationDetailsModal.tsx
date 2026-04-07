'use client';

import React from 'react';
import { X, Building, GraduationCap, Mail, User, Shield, Calendar, Key } from 'lucide-react';

interface Props {
  company: any;
  onClose: () => void;
}

export default function OrganizationDetailsModal({ company, onClose }: Props) {
  if (!company) return null;

  const admin = company.superAdmin || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="border border-border rounded-xl bg-white max-w-2xl w-full flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="relative h-32 bg-gray-950 flex items-center px-8 border-b border-white/10">
          <div className="absolute top-4 right-4 group">
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-white border border-white/20 flex items-center justify-center text-primary shadow-xl">
              {company.org_type === 'Institute' ? <GraduationCap size={32} /> : <Building size={32} />}
            </div>
            <div className="text-white">
              <h3 className="text-[24px] font-bold tracking-tight">{company.name}</h3>
              <div className="flex items-center gap-2 text-[13px] text-white/60">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest ${
                  company.plan === 'Paid' ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-white'
                }`}>{company.plan}</span>
                <span>·</span>
                <span>{company.org_type}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-surface/30">
          {/* Organization Info */}
          <div className="space-y-6">
            <h4 className="text-[12px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
              <Building size={14} className="text-primary" /> Organization Info
            </h4>
            
            <div className="space-y-4">
              <DetailItem icon={Shield} label="Account Status" value={company.status} color="text-green-600 font-bold" />
              <DetailItem icon={Calendar} label="Registered On" value={new Date(company.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })} />
              <DetailItem icon={Building} label="Organization ID" value={company._id} />
            </div>
          </div>

          {/* SuperAdmin Details */}
          <div className="space-y-6">
            <h4 className="text-[12px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-primary" /> SuperAdmin Details
            </h4>
            
            <div className="space-y-4">
              <DetailItem icon={User} label="Full Name" value={admin.name || 'Not Found'} />
              <DetailItem icon={Mail} label="Email Address" value={admin.email || 'Not Found'} />
              <DetailItem icon={Key} label="Access Password" value={admin.password || '••••••••'} isSecret />
            </div>
          </div>
        </div>

        <div className="p-4 px-8 border-t border-border bg-white flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 rounded-md bg-gray-900 text-white text-[14px] font-medium hover:bg-black transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, color, isSecret = false }: { icon: any; label: string; value: string; color?: string; isSecret?: boolean }) {
  const [show, setShow] = React.useState(!isSecret);

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold text-muted uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2 group">
        <Icon size={14} className="text-muted/60" />
        <span className={`text-[14px] font-medium break-all ${color || 'text-foreground'}`}>
          {show ? value : '••••••••'}
        </span>
        {isSecret && (
          <button 
            onClick={() => setShow(!show)}
            className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
          >
            {show ? 'HIDE' : 'SHOW'}
          </button>
        )}
      </div>
    </div>
  );
}
