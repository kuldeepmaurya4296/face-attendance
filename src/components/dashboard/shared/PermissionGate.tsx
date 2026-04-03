'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import type { AdminPermissions } from '@/context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface PermissionGateProps {
  permission: keyof AdminPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PermissionGate({ permission, children, fallback }: PermissionGateProps) {
  const { user } = useAuth();

  if (!user) return null;

  // Owner and SuperAdmin always have access
  if (user.role === 'Owner' || user.role === 'SuperAdmin') {
    return <>{children}</>;
  }

  // Admin checks permissions
  if (user.role === 'Admin' && user.admin_permissions?.[permission]) {
    return <>{children}</>;
  }

  // Default fallback
  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <ShieldAlert size={48} className="text-muted mb-4" />
      <h3 className="text-[16px] font-bold text-foreground mb-2">Access Restricted</h3>
      <p className="text-[14px] text-muted max-w-md">
        You don&apos;t have permission to access this section. Contact your SuperAdmin to update your access.
      </p>
    </div>
  );
}
