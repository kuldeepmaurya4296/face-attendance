'use client';

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, type, message, duration }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// Helper functions for easy usage
export const toast = {
  success: (msg: string) => useToastStore.getState().addToast('success', msg),
  error: (msg: string) => useToastStore.getState().addToast('error', msg, 6000),
  warning: (msg: string) => useToastStore.getState().addToast('warning', msg),
  info: (msg: string) => useToastStore.getState().addToast('info', msg),
};
