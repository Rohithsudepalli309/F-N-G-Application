import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  storeId: string | null;
  items: CartItem[];
  addToCart: (storeId: string, item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      storeId: null,
      items: [],
      addToCart: (storeId, newItem) => {
        const { items, storeId: currentStore } = get();
        
        // Reset cart if adding from different store
        if (currentStore && currentStore !== storeId) {
           set({ storeId, items: [newItem] });
           return;
        }

        const existingItem = items.find(i => i.productId === newItem.productId);
        if (existingItem) {
          set({
            storeId,
            items: items.map(i => 
              i.productId === newItem.productId 
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            )
          });
        } else {
          set({ storeId, items: [...items, newItem] });
        }
      },
      removeFromCart: (productId) => set((state) => ({
        items: state.items.filter(i => i.productId !== productId)
      })),
      clearCart: () => set({ items: [], storeId: null }),
      total: () => get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
