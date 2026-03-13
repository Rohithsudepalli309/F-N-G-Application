/**
 * usePersistedOrderStore.ts
 * Phase 4: Offline Resiliency (Local Caching)
 * Uses react-native-mmkv for high-performance persistence of the active delivery details.
 * This ensures drivers and customers can see order details even with NO signal.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

// Custom storage adapter for MMKV
const mmkvStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.delete(name),
};

export interface OrderLocation {
  lat: number;
  lng: number;
  bearing?: number;
}

export interface CachedOrder {
  id: string;
  status: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: Array<{ name: string; quantity: number }>;
  totalAmount: number;
  deliveryInstructions?: string;
  otp?: string;
  storeLocation?: OrderLocation;
  customerLocation?: OrderLocation;
  lastUpdated: number;
}

interface OfflineOrderState {
  activeOrder: CachedOrder | null;
  lastKnownSignal: 'online' | 'offline';
  
  syncOrder: (order: CachedOrder) => void;
  setSignalStatus: (status: 'online' | 'offline') => void;
  clearCache: () => void;
}

export const useOfflineOrderStore = create<OfflineOrderState>()(
  persist(
    (set) => ({
      activeOrder: null,
      lastKnownSignal: 'online',

      syncOrder: (order) => set({ 
        activeOrder: { ...order, lastUpdated: Date.now() } 
      }),

      setSignalStatus: (status) => set({ lastKnownSignal: status }),

      clearCache: () => set({ activeOrder: null }),
    }),
    {
      name: 'fng-offline-order-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
