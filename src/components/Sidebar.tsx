'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Building, Users, CheckSquare, 
  FileText, Settings, User, LogOut, ChevronRight 
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  const role = user.role;
  let navLinks: { name: string; href: string; icon: any }[] = [];

  if (role === 'Owner') {
    navLinks = [
      { name: 'Overview', href: '/dashboard/platform', icon: LayoutDashboard },
      { name: 'Companies', href: '/dashboard/platform/companies', icon: Building },
      { name: 'Billing', href: '/dashboard/platform/billing', icon: FileText },
      { name: 'Settings', href: '/dashboard/platform/settings', icon: Settings },
    ];
  } else if (role === 'SuperAdmin') {
    navLinks = [
      { name: 'Dashboard', href: '/dashboard/company', icon: LayoutDashboard },
      { name: 'Personnel', href: '/dashboard/company/personnel', icon: Users },
      { name: 'Attendance', href: '/dashboard/company/attendance', icon: CheckSquare },
      { name: 'Leaves', href: '/dashboard/company/leaves', icon: FileText },
      { name: 'Settings', href: '/dashboard/company/settings', icon: Settings },
    ];
  } else if (role === 'Admin') {
    navLinks = [
      { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
      { name: 'Personnel', href: '/dashboard/admin/personnel', icon: Users },
      { name: 'Attendance', href: '/dashboard/admin/attendance', icon: CheckSquare },
      { name: 'Leaves', href: '/dashboard/admin/leaves', icon: FileText },
      { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
    ];
  } else {
    // User
    navLinks = [
      { name: 'Overview', href: '/dashboard/user', icon: LayoutDashboard },
      { name: 'My Attendance', href: '/dashboard/user/attendance', icon: CheckSquare },
      { name: 'Leave Requests', href: '/dashboard/user/leaves', icon: FileText },
      { name: 'Profile', href: '/dashboard/user/profile', icon: User },
    ];
  }

  return (
    <aside className="w-64 bg-white border-r border-border h-full flex flex-col hidden md:flex">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
          <LayoutDashboard size={16} className="text-white" />
        </div>
        <span className="text-[18px] font-bold text-foreground tracking-tight">Aura</span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="mb-4 px-2">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Main Navigation</p>
        </div>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors ${
                isActive 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted hover:bg-surface hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-primary' : 'text-muted'} />
                <span className="text-[14px]">{link.name}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-primary" />}
            </Link>
          );
        })}
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-border bg-surface">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[14px]">
              {user.name?.[0] || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-[13px] font-bold text-foreground truncate">{user.name}</p>
              <p className="text-[11px] text-muted truncate">{user.role}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-2 justify-center py-2 text-[13px] font-medium text-danger hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
