import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
}

export default function StatCard({ label, value, icon: Icon, colorClass }: StatCardProps) {
  return (
    <div className="p-4 bg-surface rounded-md border border-border-light">
      <Icon size={16} className={`${colorClass} mb-2`} />
      <p className="text-[12px] text-muted mb-1">{label}</p>
      <p className="text-[16px] font-bold">{value}</p>
    </div>
  );
}