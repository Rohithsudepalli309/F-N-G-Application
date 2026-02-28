/**
 * useUIStore.ts
 * Spec §5.1.3 — UIStore: loading overlays, toast messages, bottom sheet state.
 */
import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIState {
  // Global loading overlay
  isGlobalLoading: boolean;
  loadingMessage: string;

  // Toast / snack bar queue
  toasts: Toast[];

  // Network
  isOnline: boolean;

  // Address selection flow
  selectedAddressId: string | null;

  // Active segment on home (food / instamart)
  homeSegment: 'food' | 'instamart';

  // Actions
  showLoading:  (msg?: string) => void;
  hideLoading:  () => void;
  showToast:    (msg: string, type?: Toast['type'], duration?: number) => void;
  dismissToast: (id: string) => void;
  setOnline:    (v: boolean) => void;
  setSelectedAddress: (id: string | null) => void;
  setHomeSegment: (seg: 'food' | 'instamart') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  loadingMessage: '',
  toasts: [],
  isOnline: true,
  selectedAddressId: null,
  homeSegment: 'food',

  showLoading: (msg = 'Loading…') => set({ isGlobalLoading: true, loadingMessage: msg }),
  hideLoading: () => set({ isGlobalLoading: false, loadingMessage: '' }),

  showToast: (message, type = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }));
    // Auto-dismiss
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setOnline: (v) => set({ isOnline: v }),
  setSelectedAddress: (id) => set({ selectedAddressId: id }),
  setHomeSegment: (seg) => set({ homeSegment: seg }),
}));
