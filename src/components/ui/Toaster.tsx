'use client';

import React from 'react';
import { useToastStore } from '@/stores/toastStore';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styleMap = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColorMap = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export default function Toaster() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const Icon = iconMap[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in ${styleMap[t.type]}`}
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${iconColorMap[t.type]}`} />
            <p className="text-[14px] font-medium flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
