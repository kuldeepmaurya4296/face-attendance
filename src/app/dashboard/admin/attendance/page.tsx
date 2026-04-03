'use client';

import PermissionGate from '@/components/dashboard/shared/PermissionGate';
import AttendanceLogsPage from '../../company/attendance/page';

export default function AdminAttendancePage() {
  return (
    <PermissionGate permission="view_attendance">
      <AttendanceLogsPage />
    </PermissionGate>
  );
}