'use client';

import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import { BarChart3, FileSpreadsheet, CalendarDays, Users, TrendingUp, Download } from 'lucide-react';

const reportCards = [
  {
    title: 'Attendance Report',
    description: 'View detailed attendance analytics with daily, weekly, monthly, and yearly breakdowns. Includes charts, department analysis, and Excel download.',
    href: '/dashboard/company/reports/attendance',
    icon: BarChart3,
    color: 'bg-blue-500',
    features: ['Trend Charts', 'Department Breakdown', 'Excel Download'],
  },
  {
    title: 'Leave Report',
    description: 'Analyze leave utilization across the organization. View leave balances, type distribution, and department comparison.',
    href: '/dashboard/company/reports/leaves',
    icon: CalendarDays,
    color: 'bg-violet-500',
    features: ['Balance Tracking', 'Type Breakdown', 'Excel Download'],
  },
];

export default function ReportsHub() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Generate and download organization reports" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group border border-border rounded-lg bg-white p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 space-y-4"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center shrink-0`}>
                <card.icon size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-foreground group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-[13px] text-muted mt-1 leading-relaxed">{card.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {card.features.map((f) => (
                <span
                  key={f}
                  className="px-2.5 py-1 rounded-full bg-surface border border-border-light text-[11px] font-semibold text-muted"
                >
                  {f}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Download Section */}
      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Download size={18} className="text-primary" />
          <h3 className="text-[16px] font-bold">Quick Downloads</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickDownloadBtn label="This Week" type="weekly" />
          <QuickDownloadBtn label="This Month" type="monthly" />
          <QuickDownloadBtn label="This Year" type="yearly" />
        </div>
      </div>
    </div>
  );
}

function QuickDownloadBtn({ label, type }: { label: string; type: string }) {
  const [loading, setLoading] = React.useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/reports/attendance/download?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${type}_report.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center justify-center gap-2 p-3 rounded-md bg-surface border border-border text-[14px] font-medium hover:bg-surface-hover hover:border-primary transition-colors disabled:opacity-50"
    >
      <FileSpreadsheet size={16} className="text-emerald-600" />
      {loading ? 'Generating...' : `${label} Report`}
    </button>
  );
}
