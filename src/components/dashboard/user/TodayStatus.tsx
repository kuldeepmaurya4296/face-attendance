'use client';

import React, { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CameraCapture } from '@/components/CameraCapture';
import { Clock, CheckCircle2, LogIn, LogOut, Camera, Loader2, AlertTriangle } from 'lucide-react';

export default function TodayStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = () => {
    api.get('/attendance/status')
      .then(res => { 
        // Handle both standard axios response wrapper and our new { success: true, data: ... } wrapper
        const responseData = res.data?.success && res.data?.data ? res.data.data : res.data;
        setStatus(responseData); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Live timer
  useEffect(() => {
    if (status?.checked_in && !status?.checked_out && status?.check_in_time) {
      const updateTimer = () => {
        const diff = (Date.now() - new Date(status.check_in_time).getTime()) / 1000;
        setElapsed(Math.floor(diff));
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [status?.checked_in, status?.checked_out, status?.check_in_time]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleFaceScan = async (file: File) => {
    setScanStatus('scanning');
    setScanMessage('Verifying face...');

    try {
      // Get gallery for face matching
      const galleryRes = await api.get(`/users/gallery/${user?.company_id}`);
      const gallery = galleryRes.data?.success && galleryRes.data?.data ? galleryRes.data.data : galleryRes.data;

      const galleryData = gallery.map((p: any) => ({
        user_id: p.user_id,
        embeddings: p.embeddings
      }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('gallery_data', JSON.stringify(galleryData));

      const mlRes = await fetch('/api/ml/search', { method: 'POST', body: formData });
      const mlData = await mlRes.json();

      if (!mlData.liveness_pass) {
        setScanStatus('error');
        setScanMessage('Blink required for liveness verification.');
        setTimeout(() => { setScanStatus('idle'); setShowCamera(false); }, 3000);
        return;
      }

      if (!mlData.user_id || mlData.user_id === 'unknown') {
        setScanStatus('error');
        setScanMessage('Face not recognized.');
        setTimeout(() => { setScanStatus('idle'); setShowCamera(false); }, 3000);
        return;
      }

      // Verify the matched face is the logged-in user
      if (mlData.user_id !== user?._id) {
        setScanStatus('error');
        setScanMessage('Face does not match your account.');
        setTimeout(() => { setScanStatus('idle'); setShowCamera(false); }, 3000);
        return;
      }

      // Mark attendance
      const res = await api.post('/attendance/mark', {
        user_id: user?._id,
        company_id: user?.company_id,
        mode: 'SELF'
      });

      setScanStatus('success');
      setScanMessage(res.data.message);
      setTimeout(() => {
        setScanStatus('idle');
        setShowCamera(false);
        fetchStatus();
      }, 3000);
    } catch (err: any) {
      setScanStatus('error');
      setScanMessage(err.response?.data?.error || 'Verification failed');
      setTimeout(() => { setScanStatus('idle'); setShowCamera(false); }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="border border-border rounded-lg bg-white p-6">
        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" size={24} /></div>
      </div>
    );
  }

  const canSelfCheckin = status?.allow_self_checkin || status?.attendance_mode === 'SELF' || status?.attendance_mode === 'BOTH';
  const isCheckedIn = status?.checked_in;
  const isCheckedOut = status?.checked_out;

  return (
    <div className="border border-border rounded-lg bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold">Today&apos;s Status</h3>
        <span className="text-[12px] text-muted">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Status Display */}
      <div className="space-y-3">
        {!isCheckedIn && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-md border border-amber-200">
            <LogIn size={20} className="text-amber-600" />
            <div>
              <p className="font-semibold text-[14px] text-amber-800">Not Checked In</p>
              <p className="text-[12px] text-amber-600">Shift: {status?.shift_start} — {status?.shift_end}</p>
            </div>
          </div>
        )}

        {isCheckedIn && !isCheckedOut && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-md border border-emerald-200">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <div className="flex-1">
              <p className="font-semibold text-[14px] text-emerald-800">
                Checked In at {new Date(status.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {status.is_late && <span className="ml-2 text-amber-600 text-[12px]">({status.late_minutes} min late)</span>}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={14} className="text-emerald-600" />
                <span className="text-[13px] font-mono text-emerald-700 font-bold">{formatElapsed(elapsed)}</span>
              </div>
            </div>
          </div>
        )}

        {isCheckedIn && isCheckedOut && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-md border border-blue-200">
            <CheckCircle2 size={20} className="text-blue-600" />
            <div>
              <p className="font-semibold text-[14px] text-blue-800">Day Complete</p>
              <p className="text-[12px] text-blue-600">
                {new Date(status.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {' '}
                {new Date(status.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {' '}
                {status.work_hours}h worked
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {canSelfCheckin && !isCheckedOut && (
        <div className="space-y-3">
          {isCheckedIn && status.can_checkout === false && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
              <AlertTriangle size={16} className="mt-0.5" />
              <div>
                <p className="text-[13px] font-bold">Too Early to Checkout</p>
                <p className="text-[12px] opacity-90">
                  Minimum {status.min_checkout_hours}h required. Please wait another {status.remaining_minutes_for_checkout} minutes.
                  Checking out now will result in an "Early Exit" marker.
                </p>
              </div>
            </div>
          )}

          {!showCamera ? (
            <button
              onClick={() => setShowCamera(true)}
              className="w-full p-3 rounded-md bg-primary hover:bg-primary-hover text-white text-[14px] font-medium flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              {isCheckedIn ? 'Face Scan to Check Out' : 'Face Scan to Check In'}
            </button>
          ) : (
            <div className="space-y-3">
              {scanStatus === 'idle' && (
                <>
                  <div className="rounded-md border-2 border-dashed border-primary/30 bg-surface overflow-hidden min-h-[250px]">
                    <CameraCapture onCapture={handleFaceScan} blinkMode={true} />
                  </div>
                  <button
                    onClick={() => setShowCamera(false)}
                    className="w-full p-2 rounded-md bg-surface border border-border text-[13px] font-medium"
                  >
                    Cancel
                  </button>
                </>
              )}
              {scanStatus !== 'idle' && (
                <div className={`p-4 rounded-md text-center ${
                  scanStatus === 'scanning' ? 'bg-blue-50 border border-blue-200' :
                  scanStatus === 'success' ? 'bg-emerald-50 border border-emerald-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  {scanStatus === 'scanning' && <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} />}
                  {scanStatus === 'success' && <CheckCircle2 className="mx-auto mb-2 text-emerald-600" size={24} />}
                  {scanStatus === 'error' && <AlertTriangle className="mx-auto mb-2 text-danger" size={24} />}
                  <p className="text-[14px] font-medium">{scanMessage}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!canSelfCheckin && !isCheckedOut && (
        <div className="p-3 bg-surface rounded-md border border-border text-center">
          <p className="text-[13px] text-muted">📷 Please use the organization Kiosk for attendance</p>
        </div>
      )}
    </div>
  );
}
