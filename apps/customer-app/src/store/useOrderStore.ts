/**
 * useOrderStore.ts
 * Spec §5.1.3 — OrderStore: active order tracking, history.
 * Real-time order status + driver location held in memory.
 */
import { create } from 'zustand';

export type OrderStatus =
  | 'pending' | 'placed' | 'preparing' | 'ready'
  | 'pickup' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DriverLocation {
  lat: number;
  lng: number;
  bearing: number;
  timestamp?: number;
}

export interface ActiveOrder {
  id: string;
  storeId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  address: string;
  createdAt: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    location?: DriverLocation;
  };
  estimatedDelivery?: string; // ISO string
  otp?: string;
}

interface OrderState {
  activeOrder: ActiveOrder | null;
  orderHistory: ActiveOrder[];
  isPolling: boolean;

  setActiveOrder:   (order: ActiveOrder) => void;
  updateStatus:     (status: OrderStatus) => void;
  updateDriverLocation: (location: DriverLocation) => void;
  clearActiveOrder: () => void;
  addToHistory:     (order: ActiveOrder) => void;
  setPolling:       (v: boolean) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  activeOrder: null,
  orderHistory: [],
  isPolling: false,

  setActiveOrder: (order) => set({ activeOrder: order }),

  updateStatus: (status) =>
    set((state) => ({
      activeOrder: state.activeOrder ? { ...state.activeOrder, status } : null,
    })),

  updateDriverLocation: (location) =>
    set((state) => ({
      activeOrder: state.activeOrder
        ? {
            ...state.activeOrder,
            driver: state.activeOrder.driver
              ? { ...state.activeOrder.driver, location }
              : { id: '', name: '', phone: '', vehicle: '', location },
          }
        : null,
    })),

  clearActiveOrder: () => {
    const current = get().activeOrder;
    if (current) {
      set((state) => ({
        activeOrder: null,
        orderHistory: [current, ...state.orderHistory].slice(0, 50),
      }));
    }
  },

  addToHistory: (order) =>
    set((state) => ({
      orderHistory: [order, ...state.orderHistory].slice(0, 50),
    })),

  setPolling: (v) => set({ isPolling: v }),
}));
