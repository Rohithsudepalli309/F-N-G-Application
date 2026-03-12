/**
 * useOrderStore.ts — Available order queue + active order state.
 *
 * Available orders: fetched periodically from GET /driver/orders.
 * Active order:     set when the driver accepts an order (via socket event or
 *                   accept API call), cleared on delivery / cancellation.
 */
import {create} from 'zustand';

export interface AvailableOrder {
  id:            number;
  orderNumber:   string;
  storeName:     string;
  storeAddress:  string;
  storeLat:      number;
  storeLng:      number;
  deliveryAddress: string;
  deliveryLat:   number;
  deliveryLng:   number;
  totalAmount:   number;
  itemCount:     number;
  estimatedKm:   number;
  driverPayout:  number;
}

export interface ActiveOrder extends AvailableOrder {
  status:         string;
  customerName:   string;
  customerPhone:  string;
  deliveryOtp:    string;
}

interface OrderState {
  available:     AvailableOrder[];
  activeOrder:   ActiveOrder | null;
  activeOrderId: number | null;

  setAvailable:    (orders: AvailableOrder[]) => void;
  setActiveOrder:  (order: ActiveOrder | null) => void;
  setActiveOrderId:(id: number | null) => void;
  removeAvailable: (id: number) => void;
}

export const useOrderStore = create<OrderState>()((set) => ({
  available:     [],
  activeOrder:   null,
  activeOrderId: null,

  setAvailable:    (orders) => set({available: orders}),
  setActiveOrder:  (order)  => set({activeOrder: order, activeOrderId: order?.id ?? null}),
  setActiveOrderId:(id)     => set({activeOrderId: id}),
  removeAvailable: (id)     =>
    set((s) => ({available: s.available.filter((o) => o.id !== id)})),
}));
