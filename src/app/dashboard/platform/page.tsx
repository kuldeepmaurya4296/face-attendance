'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import StatCard from '@/components/dashboard/shared/StatCard';
import { Users, Building, Shield, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PlatformOverview() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login');
    if (user?.role === 'Owner') {
      api.get('/companies').then(res => {
        setCompanies(res.data);
        setLoadingMap(false);
      });
    }
  }, [user, isLoading, router]);

  if (isLoading || loadingMap) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Platform Dashboard" subtitle="System Overview" />
      
      <div className="border border-border rounded-lg bg-white p-6">
        <h2 className="text-[24px] font-bold text-foreground mb-4">System Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Companies" value={companies.length} icon={Building} colorClass="text-primary" />
          <StatCard label="Active Plans" value={companies.filter(c => c.plan === 'Paid').length} icon={Shield} colorClass="text-success" />
        </div>
      </div>
    </div>
  );
}