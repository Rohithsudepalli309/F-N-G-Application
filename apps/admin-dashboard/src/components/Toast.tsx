import { useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

type ToastFn = (type: ToastType, message: string) => void;

export function useToast(): { toast: ToastFn } {
  const toast = useCallback<ToastFn>((type, message) => {
    // Minimal stub for now; replace with a UI toaster when ready.
    const prefix = type.toUpperCase();
    console.log(`[Toast:${prefix}] ${message}`);
  }, []);

  return { toast };
}
