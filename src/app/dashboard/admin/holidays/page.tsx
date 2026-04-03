'use client';

import PermissionGate from '@/components/dashboard/shared/PermissionGate';
import HolidaysPage from '../../company/holidays/page';

export default function AdminHolidaysPage() {
  return (
    <PermissionGate permission="manage_holidays">
      <HolidaysPage />
    </PermissionGate>
  );
}
