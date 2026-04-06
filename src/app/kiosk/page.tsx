'use client';

import React, { useState, useEffect } from 'react';
import { CameraCapture } from '@/components/CameraCapture';
import { Loader2, Camera, UserCheck, UserX, Clock, Building, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function KioskMode() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');
  const [actionTaken, setActionTaken] = useState<'CHECK_IN'|'CHECK_OUT'|null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/login?redirect=/kiosk');
      return;
    }
    
    if (user.role === 'User') {
      router.push('/dashboard/user');
      return;
    }

    if (user.company_id) {
      // SuperAdmin or Admin
      setSelectedCompanyId(user.company_id);
    } else if (user.role === 'Owner') {
      // Owner might manage multiple
      api.get('/companies').then(res => {
        setCompanies(res.data);
        if (res.data.length === 1) setSelectedCompanyId(res.data[0]._id);
      }).catch(err => console.error(err));
    }
  }, [user, authLoading, router]);

  const getDashboardUrl = () => {
    if (!user) return '/auth/login';
    if (user.role === 'Owner') return '/dashboard/platform';
    if (user.role === 'SuperAdmin') return '/dashboard/company';
    if (user.role === 'Admin') return '/dashboard/admin';
    return '/dashboard/user';
  };


  const handleCapture = async (file: File) => {
    if (!selectedCompanyId) {
      setFeedback('Select a company first.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('scanning');
    setFeedback('Analyzing face and verifying liveness...');
    setActionTaken(null);

    try {
      // 1. Get gallery
      const galleryRes = await api.get(`/users/gallery/${selectedCompanyId}`);
      const gallery = galleryRes.data;

      // 2. Perform ML Search
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gallery_data', JSON.stringify(gallery));

      const mlRes = await fetch('/api/ml/search', { method: 'POST', body: formData });
      const mlData = await mlRes.json();

      if (!mlData.liveness_pass) {
        setFeedback('Failed Liveness Check: Please blink to confirm presence.');
        setStatus('error');
        setTimeout(() => setStatus('idle'), 4000);
        return;
      }

      if (!mlData.user_id || mlData.user_id === 'unknown') {
        setFeedback('Face not recognized in this organization.');
        setStatus('error');
        setTimeout(() => setStatus('idle'), 4000);
        return;
      }

      // 3. Mark Attendance (auto-detects check-in vs check-out inside the route)
      const res = await api.post('/attendance/mark', {
        user_id: mlData.user_id,
        company_id: selectedCompanyId,
        mode: 'KIOSK'
      });

      setFeedback(res.data.message);
      setActionTaken(res.data.action);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setFeedback('');
        setActionTaken(null);
      }, 5000);

    } catch (err: any) {
      setFeedback(err.response?.data?.error || 'Verification failed. Try again.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col pt-8">
      
      <div className="absolute top-6 left-6 z-50">
        <button onClick={() => router.push(getDashboardUrl())} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-[13px] font-medium flex items-center gap-2 backdrop-blur-md">
          <ArrowLeft size={16} /> Exit Kiosk
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-[32px] font-black text-white tracking-widest hidden md:block">AURA KIOSK</h1>
          <p className="text-white/60">Face the camera to automatically mark your attendance</p>
        </div>

        {companies.length > 1 && (
          <div className="w-full max-w-sm">
            <select value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)} className="w-full bg-white/10 backdrop-blur border border-white/20 text-white rounded-md p-3 outline-none focus:border-primary text-[14px]">
              <option value="" className="text-black">Select Organization</option>
              {companies.map(c => <option key={c._id} value={c._id} className="text-black">{c.name}</option>)}
            </select>
          </div>
        )}

        <div className="w-full max-w-2xl aspect-video rounded-2xl border-4 border-white/10 bg-gray-950 overflow-hidden relative shadow-2xl">
          {status === 'idle' || status === 'scanning' ? (
            <>
              <CameraCapture onCapture={handleCapture} blinkMode={true} />
              <div className="absolute top-4 left-0 w-full text-center pointer-events-none">
                <span className="bg-black/50 text-white px-4 py-1.5 rounded-full text-[13px] font-medium backdrop-blur-md uppercase tracking-wider">
                  Look at camera & blink
                </span>
              </div>
            </>
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center space-y-4 ${status === 'success' ? 'bg-emerald-950' : 'bg-red-950'}`}>
              {status === 'success' && actionTaken === 'CHECK_IN' && <UserCheck size={64} className="text-emerald-400" />}
              {status === 'success' && actionTaken === 'CHECK_OUT' && <Clock size={64} className="text-emerald-400" />}
              {status === 'error' && <UserX size={64} className="text-red-400" />}
              
              <h2 className="text-[24px] font-bold text-white text-center max-w-md">{feedback}</h2>
            </div>
          )}
          
          {status === 'scanning' && (
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-white mb-4" size={48} />
              <p className="text-white font-medium text-[18px]">{feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// Note: We need a local LogOut icon import or reuse UserCheck. I will add local LogOut below just in case.
// Wait, LogOut is not imported, let's fix that.
// I can just replace LogOut with Clock for checkout.
