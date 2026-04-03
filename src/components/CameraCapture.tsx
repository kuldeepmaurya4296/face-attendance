'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, Eye, CheckCircle, Loader2 } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel?: () => void;
  autoCaptureInterval?: number; // For kiosk mode
  blinkMode?: boolean; // For Face ID registration — auto-capture on blink
}

type BlinkState = 'waiting' | 'detecting' | 'captured' | 'error';

export function CameraCapture({ onCapture, onCancel, autoCaptureInterval, blinkMode = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [blinkState, setBlinkState] = useState<BlinkState>('waiting');
  const blinkCapturedRef = useRef(false);

  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
        };
      }
    } catch (err: any) {
      setError('Could not access camera. Please check permissions.');
    }
  }, []);

  const getFrameBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current || !isReady) {
        resolve(null);
        return;
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
    });
  }, [isReady]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        onCapture(file);
      }
    }, 'image/jpeg', 0.8);
  }, [isReady, onCapture]);

  useEffect(() => {
    initializeCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeCamera]);

  // Kiosk auto-capture (existing behavior)
  useEffect(() => {
    if (autoCaptureInterval && isReady && !blinkMode) {
      const interval = setInterval(captureFrame, autoCaptureInterval);
      return () => clearInterval(interval);
    }
  }, [autoCaptureInterval, isReady, captureFrame, blinkMode]);

  // Blink detection mode for Face ID registration
  useEffect(() => {
    if (!blinkMode || !isReady || blinkCapturedRef.current) return;

    setBlinkState('detecting');
    let cancelled = false;

    const checkBlink = async () => {
      if (cancelled || blinkCapturedRef.current) return;
      
      const blob = await getFrameBlob();
      if (!blob || cancelled || blinkCapturedRef.current) return;

      try {
        const formData = new FormData();
        formData.append('file', new File([blob], 'frame.jpg', { type: 'image/jpeg' }));
        
        const res = await fetch(`/api/ml/detect-blink`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (data.blinked && !blinkCapturedRef.current) {
          blinkCapturedRef.current = true;
          setBlinkState('captured');
          
          // Wait a moment then capture the actual frame (eyes open after blink)
          setTimeout(async () => {
            if (cancelled) return;
            const captureBlob = await getFrameBlob();
            if (captureBlob) {
              const file = new File([captureBlob], 'face_id.jpg', { type: 'image/jpeg' });
              onCapture(file);
            }
          }, 400);
          return; // stop polling
        }
      } catch (err) {
        // ML service might be down, continue polling
      }

      // Poll every 800ms
      if (!cancelled && !blinkCapturedRef.current) {
        setTimeout(checkBlink, 800);
      }
    };

    // Start polling after a short delay
    const startTimer = setTimeout(checkBlink, 1000);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [blinkMode, isReady, getFrameBlob, onCapture]);

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-md overflow-hidden bg-surface border border-border aspect-video flex items-center justify-center">
      {error ? (
        <div className="text-center p-6 text-danger text-[14px]">
          <p>{error}</p>
          <button onClick={initializeCamera} className="mt-3 px-4 py-2 bg-surface border border-border rounded-md text-foreground text-[14px] hover:bg-surface-hover">
            Try Again
          </button>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Blink mode status overlay */}
          {blinkMode && (
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/90 p-3 text-center">
              {blinkState === 'waiting' && (
                <p className="text-[14px] text-muted flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Initializing camera...
                </p>
              )}
              {blinkState === 'detecting' && (
                <p className="text-[14px] text-foreground flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4 text-primary" /> Look at camera and blink to capture Face ID
                </p>
              )}
              {blinkState === 'captured' && (
                <p className="text-[14px] text-success flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Blink detected — Face ID captured!
                </p>
              )}
            </div>
          )}

          {/* Manual capture button (non-blink, non-auto mode) */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-20">
            {!autoCaptureInterval && !blinkMode && isReady && (
              <button
                onClick={captureFrame}
                className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center hover:bg-surface"
              >
                <Camera className="w-5 h-5 text-primary" />
              </button>
            )}
          </div>
          
          {onCancel && (
            <button onClick={onCancel} className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-foreground hover:bg-surface">
              <X className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
