'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { CameraCapture } from '@/components/CameraCapture';
import { Fingerprint, Mail, Lock, ArrowRight, Loader2, Camera } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'password' | 'face'>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      
      if (res.data.user.role === 'Owner') router.push('/dashboard/platform');
      else if (res.data.user.role === 'SuperAdmin') router.push('/dashboard/company');
      else if (res.data.user.role === 'Admin') router.push('/dashboard/admin');
      else router.push('/dashboard/user'); // catches User, Employee, Student

    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = async (file: File) => {
    setLoading(true);
    setError('');
    
    try {
      // 1. Get the global system gallery from our backend
      const galleryRes = await api.get('/auth/system-gallery');
      const galleryData = galleryRes.data;

      if (!galleryData || galleryData.length === 0) {
        setError("No Face IDs registered in the system.");
        setLoading(false);
        return;
      }

      // 2. Query ML engine with the captured frame and the system gallery
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gallery_data', JSON.stringify(galleryData));

      const mlRes = await fetch('/api/ml/search', {
        method: 'POST', body: formData
      });
      const mlData = await mlRes.json();

      if (!mlRes.ok) {
        setError(mlData.detail || 'Biometric analysis failed.');
        setLoading(false);
        return;
      }

      if (!mlData.user_id || mlData.user_id === "unknown") {
        setError('Face not recognized. Please ensure you are in a well-lit area.');
        setLoading(false);
        return;
      }

      if (!mlData.liveness_pass) {
        setError('Liveness check failed. Please blink while facing the camera.');
        setLoading(false);
        return;
      }

      // 3. Confirm login with the backend using the match
      const loginRes = await api.post('/auth/login-face', { user_id: mlData.user_id });
      
      login(loginRes.data.user, loginRes.data.token);
      
      if (loginRes.data.user.role === 'Owner') router.push('/dashboard/platform');
      else if (loginRes.data.user.role === 'SuperAdmin') router.push('/dashboard/company');
      else if (loginRes.data.user.role === 'Admin') router.push('/dashboard/admin');
      else router.push('/dashboard/user'); // catches User, Employee, Student

    } catch (err: any) {
      setError(err.response?.data?.error || 'Face ID Login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="border border-border rounded-lg bg-white p-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-primary rounded-lg flex items-center justify-center">
              <Fingerprint className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-[24px] font-bold text-foreground">Welcome Back</h1>
            <p className="text-[12px] text-muted">Sign in to access your Aura dashboard</p>
          </div>

          {/* Form */}
          {loginMode === 'password' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-danger text-[12px] text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-md text-[14px] text-foreground placeholder-muted outline-none focus:border-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-md text-[14px] text-foreground placeholder-muted outline-none focus:border-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-[14px] font-medium rounded-md flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                <div className="relative flex justify-center text-[12px]"><span className="px-2 bg-white text-muted">Or continue with</span></div>
              </div>

              <button
                type="button"
                onClick={() => setLoginMode('face')}
                className="w-full py-2.5 bg-surface border border-border hover:bg-surface-hover text-foreground text-[14px] font-medium rounded-md flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" /> Login via Face ID
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-danger text-[12px] text-center">
                  {error}
                </div>
              )}
              
              <div className="rounded-md border-2 border-dashed border-border p-2 bg-surface overflow-hidden relative min-h-[300px] flex items-center justify-center">
                {loading ? (
                   <div className="flex flex-col items-center gap-3 text-muted">
                     <Loader2 className="w-8 h-8 animate-spin text-primary" />
                     <p className="text-[14px]">Verifying Face ID...</p>
                   </div>
                ) : (
                   <CameraCapture onCapture={handleFaceLogin} blinkMode={true} />
                )}
              </div>
              <p className="text-center text-[12px] text-muted">Look at the camera and blink to login instantly.</p>

              <button
                type="button"
                onClick={() => { setLoginMode('password'); setError(''); }}
                disabled={loading}
                className="w-full py-2.5 bg-surface border border-border hover:bg-surface-hover text-foreground text-[14px] font-medium rounded-md flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" /> Use Password Instead
              </button>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
