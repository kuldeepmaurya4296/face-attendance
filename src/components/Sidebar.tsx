'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Building, Users, Calendar, Camera, BookOpen,
  LogOut, Shield, Map, MonitorPlay, CalendarDays, Settings, User as UserIcon,
  BarChart3
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const orgType = user?.org_type;

  // Platform Owner Nav
  const platformLinks = [
    { name: 'Platform Overview', href: '/dashboard/platform', icon: LayoutDashboard },
    { name: 'Organizations', href: '/dashboard/platform/companies', icon: Building },
    { name: 'Active Plans', href: '/dashboard/platform/billing', icon: Map },
    { name: 'My Profile', href: '/dashboard/platform/profile', icon: UserIcon },
    { name: 'Kiosk Sim', href: '/kiosk', icon: MonitorPlay },
  ];

  // SuperAdmin Nav
  const companyLinks = [
    { name: 'Dashboard', href: '/dashboard/company', icon: LayoutDashboard },
    { name: orgType === 'Institute' ? 'Students & Staff' : 'Personnel', href: '/dashboard/company/personnel', icon: Users },
    { name: 'Attendance', href: '/dashboard/company/attendance', icon: Calendar },
    { name: 'Leave Requests', href: '/dashboard/company/leaves', icon: BookOpen },
    { name: 'Reports', href: '/dashboard/company/reports', icon: BarChart3 },
    { name: 'Holidays', href: '/dashboard/company/holidays', icon: CalendarDays },
    { name: 'Settings', href: '/dashboard/company/settings', icon: Settings },
    { name: 'My Profile', href: '/dashboard/company/profile', icon: UserIcon },
    { name: 'Open Kiosk', href: '/kiosk', icon: Camera },
  ];

  // Admin Nav (Permission gated logic done in render)
  const adminLinks = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: orgType === 'Institute' ? 'Students' : 'Employees', href: '/dashboard/admin/personnel', icon: Users, perm: 'manage_personnel' },
    { name: 'Attendance', href: '/dashboard/admin/attendance', icon: Calendar, perm: 'view_attendance' },
    { name: 'Leaves', href: '/dashboard/admin/leaves', icon: BookOpen, perm: 'approve_leaves' },
    { name: 'Reports', href: '/dashboard/admin/reports', icon: BarChart3, perm: 'view_attendance' },
    { name: 'Holidays', href: '/dashboard/admin/holidays', icon: CalendarDays, perm: 'manage_holidays' },
    { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings, perm: 'manage_settings' },
    { name: 'My Profile', href: '/dashboard/admin/profile', icon: UserIcon },
    { name: 'Open Kiosk', href: '/kiosk', icon: Camera },
  ];

  // User Nav
  const userLinks = [
    { name: 'My Dashboard', href: '/dashboard/user', icon: LayoutDashboard },
    { name: 'My Attendance', href: '/dashboard/user/attendance', icon: Calendar },
    { name: 'Leave Requests', href: '/dashboard/user/leaves', icon: BookOpen },
    { name: 'My Profile', href: '/dashboard/user/profile', icon: UserIcon },
    { name: 'Open Kiosk', href: '/kiosk', icon: Camera },
  ];

  let links: any[] = [];
  if (user.role === 'Owner') links = platformLinks;
  else if (user.role === 'SuperAdmin') links = companyLinks;
  else if (user.role === 'Admin') links = adminLinks.filter(l => !l.perm || user.admin_permissions?.[l.perm as keyof typeof user.admin_permissions]);
  else links = userLinks;

  const isActive = (path: string) => {
    if (path === `/dashboard/${user.role.toLowerCase()}`) return pathname === path;
    return pathname.startsWith(path) && path !== `/dashboard/${user.role.toLowerCase()}`;
  };

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen h-full sticky top-0 shrink-0">
      
      {/* Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Aura Vision
        </h1>
        <p className="text-[12px] font-medium text-sidebar-foreground/60 mt-1 uppercase tracking-wide">
          {user.role} Portal
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-hide">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] font-medium transition-all ${
                active 
                ? 'bg-sidebar-active/10 text-sidebar-active' 
                : 'text-sidebar-foreground hover:bg-sidebar-foreground/5'
              }`}
            >
              <link.icon size={18} className={active ? "text-sidebar-active" : "text-sidebar-foreground/70"} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* User Area */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar-foreground/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center font-bold text-primary">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-[14px] font-bold text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-[12px] text-sidebar-foreground/60 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-sidebar-foreground/10 hover:bg-danger/10 hover:text-danger text-[13px] font-semibold transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}
