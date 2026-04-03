import React from 'react';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function PageHeader({ title, subtitle }: { title: string, subtitle: string }) {
  const { user, logout } = useAuth();
  
  return (
    <div className="border border-border rounded-lg bg-white p-4 px-6 flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
          <LayoutDashboard size={18} className="text-white" />
        </div>
        <div>
           <h1 className="text-[16px] font-bold text-foreground">{title}</h1>
           <p className="text-[12px] text-muted capitalize">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:block text-right">
          <p className="text-[14px] font-medium">{user?.name}</p>
          <p className="text-[12px] text-primary">{user?.role}</p>
        </div>
        <button onClick={logout} className="p-2 border border-border rounded-md hover:bg-surface text-muted hover:text-danger">
           <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}