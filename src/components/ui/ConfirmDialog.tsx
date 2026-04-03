'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const btnColors = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-primary hover:bg-primary-hover text-white';

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/40" onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg border border-border shadow-xl max-w-sm w-full p-6 space-y-4 animate-scale-in"
      >
        <div className="flex items-start gap-3">
          {variant === 'danger' && (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          )}
          <div>
            <h3 className="text-[16px] font-bold text-foreground">{title}</h3>
            <p className="text-[14px] text-muted mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 p-2.5 rounded-md bg-surface border border-border text-[14px] font-medium hover:bg-surface-hover transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 p-2.5 rounded-md text-[14px] font-medium transition-colors ${btnColors}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
