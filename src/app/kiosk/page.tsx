'use client';

import React, { useState, useEffect } from 'react';
import { CameraCapture } from '@/components/CameraCapture';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, XCircle, AlertTriangle, Users, Search, Clock, Loader2 } from 'lucide-react';

type MatchStatus = 'idle' | 'scanning' | 'success' | 'failure' | 'no-blink';

export default function KioskPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<MatchStatus>('idle');
  const [message, setMessage] = useState('Stand in front of the camera to verify');
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    if (user?.company_id) {
       api.get(`/attendance/kiosk-data/${user.company_id}`)
         .then(res => setPersonnel(res.data))
         .catch(err => console.error("Kiosk Data Error:", err))
         .finally(() => setLoadingInitial(false));
    }
  }, [user]);

  const handleCapture = async (file: File) => {
    if (status !== 'idle' || personnel.length === 0) return;

    setStatus('scanning');
    setMessage('Identifying...');
    
    const galleryData = personnel.map(p => ({
       user_id: p._id,
       embeddings: p.face_embeddings
    }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('gallery_data', JSON.stringify(galleryData)); 

    try {
      const mlRes = await fetch('/api/ml/search', {
        method: 'POST', body: formData
      });
      const mlData = await mlRes.json();
      
      if (!mlData.liveness_pass) {
        setStatus('no-blink');
        setMessage('Blink Required: Please blink to verify liveness.');
        setTimeout(() => setStatus('idle'), 3000);
        return;
      }
      
      if (!mlData.user_id || mlData.user_id === "unknown") {
        setStatus('failure');
        setMessage('Unrecognized: Face not found in the personnel list.');
        setTimeout(() => setStatus('idle'), 3000);
        return;
      }
      
      const res = await api.post('/attendance/mark', {
        user_id: mlData.user_id,
        company_id: user?.company_id,
        mode: 'KIOSK'
      });
      
      setStatus('success');
      setMessage(res.data.message); 
      
      setTimeout(() => {
        setStatus('idle');
        setMessage('Ready for Next User');
      }, 5000);
      
    } catch (err: any) {
      console.error("Kiosk Error:", err);
      setStatus('failure');
      const errorMsg = err.response?.data?.error || 'System Connection Error';
      setMessage(errorMsg);
      setTimeout(() => {
        setStatus('idle');
        setMessage('Stand in front of the camera to verify');
      }, 4000);
    }
  };

  if (loadingInitial) {
     return (
       <div className="min-h-screen flex items-center justify-center text-foreground text-[14px]">
         <Loader2 className="w-5 h-5 animate-spin mr-2" /> Configuring Kiosk Mode...
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Info Panel */}
        <div className="space-y-4 flex flex-col justify-center">
          <h1 className="text-[24px] font-bold text-foreground">
            Aura <span className="text-primary">Kiosk</span>
          </h1>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-surface rounded-md border border-border">
              <Search className="text-primary" size={20} />
              <div>
                <h4 className="font-semibold text-[14px] text-foreground">Auto-Scan</h4>
                <p className="text-[12px] text-muted">Hands-free identification active.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2 text-muted text-[12px]">
              <div className="flex items-center gap-1.5">
                <Users size={14} /> <span>{personnel.length} Personnel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} /> <span>Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Panel */}
        <div className="lg:col-span-2 relative">
          <CameraCapture 
             onCapture={handleCapture} 
             autoCaptureInterval={status === 'idle' ? 3000 : undefined} 
          />
          
          {status !== 'idle' && (
            <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center rounded-md
              ${status === 'success' ? 'bg-green-50/95' : status === 'scanning' ? 'bg-blue-50/95' : 'bg-red-50/95'}
            `}>
              <div className="border border-border rounded-md bg-white p-8 flex flex-col items-center max-w-sm w-full m-4">
                {status === 'success' && <CheckCircle2 className="w-16 h-16 mb-4 text-success" />}
                {status === 'failure' && <XCircle className="w-16 h-16 mb-4 text-danger" />}
                {status === 'no-blink' && <AlertTriangle className="w-16 h-16 mb-4 text-warning" />}
                {status === 'scanning' && (
                  <Loader2 className="w-16 h-16 mb-4 text-primary animate-spin" />
                )}
                
                <h3 className="text-[16px] font-semibold text-foreground mb-1 text-center">
                   {status === 'scanning' ? 'Scanning...' : status === 'success' ? 'Welcome' : 'Notice'}
                </h3>
                <p className="text-center text-[14px] text-muted">
                  {message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
