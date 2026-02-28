/**
 * useGroceryCartStore.ts
 * Completely separate cart for Instamart/grocery orders.
 * Food (CartScreen) and Grocery (GroceryCartScreen) NEVER share state.
 * Persisted under 'grocery-cart-storage' key.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GroceryCartItem {
  productId: string;
  name: string;
  price: number;       // stored in paise
  quantity: number;
  image?: string;
  unit?: string;
  brand?: string;
}

interface GroceryCartState {
  items: GroceryCartItem[];
  addItem: (item: Omit<GroceryCartItem, 'quantity'>) => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;          // returns total in paise
  itemCount: () => number;      // total units across all products
}

export const useGroceryCartStore = create<GroceryCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const { items } = get();
        const existing = items.find(i => i.productId === newItem.productId);
        if (existing) {
          set({
            items: items.map(i =>
              i.productId === newItem.productId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...newItem, quantity: 1 }] });
        }
      },

      decrementItem: (productId) => {
        const { items } = get();
        const existing = items.find(i => i.productId === productId);
        if (!existing) return;
        if (existing.quantity <= 1) {
          set({ items: items.filter(i => i.productId !== productId) });
        } else {
          set({
            items: items.map(i =>
              i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
            ),
          });
        }
      },

      removeItem: (productId) =>
        set(state => ({ items: state.items.filter(i => i.productId !== productId) })),

      updateQty: (productId, quantity) => {
        if (quantity <= 0) {
          set(state => ({ items: state.items.filter(i => i.productId !== productId) }));
        } else {
          set(state => ({
            items: state.items.map(i =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          }));
        }
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'grocery-cart-storage',          // separate key from food cart
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
