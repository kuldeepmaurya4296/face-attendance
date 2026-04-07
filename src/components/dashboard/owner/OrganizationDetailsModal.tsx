'use client';

import React, { useState } from 'react';
import { X, Building, GraduationCap, Mail, User, Shield, Calendar, Key, Palette, Save, Loader2, Globe } from 'lucide-react';
import api from '@/lib/api';

interface Props {
  company: any;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function OrganizationDetailsModal({ company, onClose, onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({
    brand_name: company.settings?.branding?.brand_name || company.name || '',
    primary_color: company.settings?.branding?.primary_color || '#2563eb',
    secondary_color: company.settings?.branding?.secondary_color || '#7c3aed',
    accent_color: company.settings?.branding?.accent_color || '#10b981',
    background_color: company.settings?.branding?.background_color || '#ffffff',
    text_color: company.settings?.branding?.text_color || '#1a1a1a',
    logo_url: company.settings?.branding?.logo_url || '',
  });

  React.useEffect(() => {
    setBranding({
      brand_name: company.settings?.branding?.brand_name || company.name || '',
      primary_color: company.settings?.branding?.primary_color || '#2563eb',
      secondary_color: company.settings?.branding?.secondary_color || '#7c3aed',
      accent_color: company.settings?.branding?.accent_color || '#10b981',
      background_color: company.settings?.branding?.background_color || '#ffffff',
      text_color: company.settings?.branding?.text_color || '#1a1a1a',
      logo_url: company.settings?.branding?.logo_url || '',
    });
  }, [company]);

  if (!company) return null;

  const admin = company.superAdmin || {};

  const handleSaveBranding = async () => {
    setLoading(true);
    try {
      await api.put(`/companies/${company._id}`, {
        settings: {
          ...company.settings,
          branding: branding
        }
      });
      if (onRefresh) onRefresh();
      alert('Organization settings updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="border border-border rounded-2xl bg-white max-w-2xl w-full flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Section */}
        <div className="relative h-48 bg-gray-950 flex flex-col justify-end px-8 pb-6 border-b border-white/10 overflow-hidden">
          {/* Theme Gradient Overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{ background: `linear-gradient(135deg, ${branding.primary_color}, ${branding.secondary_color})` }}
          />
          <div className="absolute top-4 right-4 group">
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md"
            >
              <X size={22} />
            </button>
          </div>
          
          <div className="flex items-end gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-2xl flex items-center justify-center text-primary transform -translate-y-2 overflow-hidden">
               {branding.logo_url ? (
                 <img src={branding.logo_url} className="w-full h-full object-contain" alt="Logo" />
               ) : (
                company.org_type === 'Institute' ? <GraduationCap size={40} /> : <Building size={40} />
               )}
            </div>
            <div className="text-white pb-2 flex-1">
              <h3 className="text-[28px] font-black tracking-tighter leading-none">{branding.brand_name || company.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest ${
                  company.plan === 'Paid' ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-white'
                }`}>{company.plan} Tier</span>
                <span className="text-white/30 truncate max-w-[200px] text-[12px] font-medium">{company.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-surface px-8 pt-4 gap-8">
          <button 
             onClick={() => setActiveTab('overview')}
             className={`pb-4 text-[13px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'overview' ? 'text-primary' : 'text-muted hover:text-foreground'}`}
          >
            Overview
            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
          </button>
          <button 
             onClick={() => setActiveTab('settings')}
             className={`pb-4 text-[13px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'settings' ? 'text-primary' : 'text-muted hover:text-foreground'}`}
          >
            Site Settings
            {activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
          </button>
        </div>

        <div className="p-8 bg-white flex-1 overflow-y-auto max-h-[50vh]">
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Organization Info */}
              <div className="space-y-6">
                <h4 className="text-[12px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                  <Globe size={14} className="text-primary" /> Core Information
                </h4>
                
                <div className="space-y-4">
                  <DetailItem icon={Shield} label="Status" value={company.status} color="text-green-600 font-bold" />
                  <DetailItem icon={Calendar} label="Registration Date" value={new Date(company.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })} />
                  <DetailItem icon={Building} label="Management ID" value={company._id} />
                  <DetailItem icon={GraduationCap} label="Entity Type" value={company.org_type} />
                </div>
              </div>

              {/* SuperAdmin Details */}
              <div className="space-y-6">
                <h4 className="text-[12px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-primary" /> Admin Root Access
                </h4>
                
                <div className="space-y-4">
                  <DetailItem icon={User} label="Admin Name" value={admin.name || 'Not Found'} />
                  <DetailItem icon={Mail} label="Contact Email" value={admin.email || 'Not Found'} />
                  <DetailItem icon={Key} label="Access Password" value={admin.password || '••••••••'} isSecret />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                   <label className="text-[12px] font-black text-muted uppercase tracking-widest">Display Brand Name</label>
                   <input 
                      value={branding.brand_name}
                      onChange={e => setBranding({...branding, brand_name: e.target.value})}
                      placeholder="e.g. Acme Corp" 
                      className="w-full p-3 bg-surface border border-border rounded-xl font-bold text-[14px] outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                   />
                 </div>
                 
                 <div className="space-y-1.5">
                   <label className="text-[12px] font-black text-muted uppercase tracking-widest">Logo URL</label>
                   <input 
                      value={branding.logo_url}
                      onChange={e => setBranding({...branding, logo_url: e.target.value})}
                      placeholder="https://example.com/logo.png" 
                      className="w-full p-3 bg-surface border border-border rounded-xl font-bold text-[14px] outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                   />
                 </div>
               </div>

               <div className="space-y-6 pt-4 border-t border-border">
                  <label className="text-[12px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                    <Palette size={14} /> Organization Visual Palette (3 Key Colors)
                  </label>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <ColorControl 
                      label="Primary Identity (Action Elements)" 
                      hex={branding.primary_color} 
                      onChange={c => setBranding({...branding, primary_color: c})} 
                    />
                    
                    <ColorControl 
                      label="Secondary Color (Sidebar & Accents)" 
                      hex={branding.secondary_color} 
                      onChange={c => setBranding({...branding, secondary_color: c})} 
                    />

                    <ColorControl 
                      label="Accent Color (Highlights & Status)" 
                      hex={branding.accent_color} 
                      onChange={c => setBranding({...branding, accent_color: c})} 
                    />

                    <ColorControl 
                      label="Background Color (Theme Base)" 
                      hex={branding.background_color} 
                      onChange={c => setBranding({...branding, background_color: c})} 
                    />

                    <ColorControl 
                      label="Text Color (Primary Typography)" 
                      hex={branding.text_color} 
                      onChange={c => setBranding({...branding, text_color: c})} 
                    />
                  </div>

                  <p className="text-[11px] text-muted font-black uppercase tracking-widest leading-relaxed pt-4">
                    Note: These colors are applied system-wide to all admins and users of this organization.
                  </p>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 px-8 border-t border-border bg-gray-50 flex items-center justify-between">
           <p className="text-[11px] text-muted font-bold uppercase tracking-widest">
             {activeTab === 'settings' ? 'Unsaved changes will be lost' : 'Manage system configuration'}
           </p>
           <div className="flex gap-3">
             <button 
              onClick={onClose} 
              className="px-6 py-2.5 rounded-xl border border-border bg-white text-[13px] font-black uppercase tracking-widest text-muted hover:bg-surface transition-all"
             >
              Cancel
             </button>
             {activeTab === 'settings' && (
               <button 
                  onClick={handleSaveBranding}
                  disabled={loading}
                  className="px-8 py-2.5 rounded-xl bg-primary text-white text-[13px] font-black uppercase tracking-widest hover:bg-primary-hover shadow-xl shadow-primary/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
               >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Branding
               </button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, color, isSecret = false }: { icon: any; label: string; value: string; color?: string; isSecret?: boolean }) {
  const [show, setShow] = React.useState(!isSecret);

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-black text-muted uppercase tracking-widest leading-tight">{label}</p>
      <div className="flex items-center gap-2 group">
        <Icon size={14} className="text-primary opacity-50" />
        <span className={`text-[14px] font-bold break-all tracking-tight ${color || 'text-foreground'}`}>
          {show ? (value || '—') : '••••••••'}
        </span>
        {isSecret && (
          <button 
            onClick={() => setShow(!show)}
            className="text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto tracking-widest"
          >
            {show ? 'HIDE' : 'SHOW'}
          </button>
        )}
      </div>
    </div>
  );
}

function ColorControl({ label, hex, onChange }: { label: string; hex: string; onChange: (val: string) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
      <div className="flex items-center gap-4">
         <div className="w-10 h-10 rounded-lg shadow-inner border border-black/10" style={{ backgroundColor: hex }} />
         <div className="space-y-1 flex-1">
           <p className="text-[13px] font-bold text-foreground">{label}</p>
           <div className="flex items-center gap-1 group/input">
             <span className="text-[11px] font-black text-muted opacity-50">HEX</span>
             <input 
                type="text" 
                value={hex} 
                onChange={e => onChange(e.target.value)} 
                className="text-[11px] font-black text-muted uppercase tracking-widest bg-transparent border-b border-dashed border-border outline-none focus:border-primary p-0 m-0 w-20 transition-colors"
                spellCheck={false}
             />
           </div>
         </div>
      </div>
      <div className="relative overflow-hidden rounded-lg w-10 h-10 border border-border shrink-0 hover:scale-105 transition-transform">
        <input 
          type="color" 
          value={hex} 
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer"
        />
      </div>
    </div>
  );
}
