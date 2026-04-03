'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import PermissionGate from '@/components/dashboard/shared/PermissionGate';
import Link from 'next/link';
import { BarChart3, CalendarDays, FileSpreadsheet } from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <PermissionGate permission="view_attendance">
        <PageHeader title="Reports" subtitle="Attendance & Leave Analytics" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/admin/reports/attendance"
            className="group border border-border rounded-lg bg-white p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                <BarChart3 size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold group-hover:text-primary transition-colors">Attendance Report</h3>
                <p className="text-[13px] text-muted mt-1">View analytics, charts, and download Excel reports.</p>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/admin/reports/leaves"
            className="group border border-border rounded-lg bg-white p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-violet-500 rounded-lg flex items-center justify-center shrink-0">
                <CalendarDays size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold group-hover:text-primary transition-colors">Leave Report</h3>
                <p className="text-[13px] text-muted mt-1">Analyze leave utilization and type distribution.</p>
              </div>
            </div>
          </Link>
        </div>
      </PermissionGate>
    </div>
  );
}
