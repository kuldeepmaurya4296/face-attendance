'use client';

import PermissionGate from '@/components/dashboard/shared/PermissionGate';
import ManageLeavesPage from '../../company/leaves/page';

export default function AdminLeavesPage() {
  return (
    <PermissionGate permission="approve_leaves">
      <ManageLeavesPage />
    </PermissionGate>
  );
}