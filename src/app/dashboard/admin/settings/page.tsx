'use client';

import PermissionGate from '@/components/dashboard/shared/PermissionGate';
import CompanySettingsPage from '../../company/settings/page';

export default function AdminSettingsPage() {
  return (
    <PermissionGate permission="manage_settings">
      <CompanySettingsPage />
    </PermissionGate>
  );
}
