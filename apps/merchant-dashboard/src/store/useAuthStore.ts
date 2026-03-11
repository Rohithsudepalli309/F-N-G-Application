import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MerchantUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Store {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

interface AuthState {
  token: string | null;
  user: MerchantUser | null;
  store: Store | null;
  isAuthenticated: boolean;
  login: (token: string, user: MerchantUser) => void;
  setStore: (store: Store) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      store: null,
      isAuthenticated: false,

      login: (token, user) =>
        set({ token, user, isAuthenticated: true }),

      setStore: (store) =>
        set({ store }),

      logout: () => {
        set({ token: null, user: null, store: null, isAuthenticated: false });
        // Remove AFTER set() so persist middleware's synchronous re-write is overridden
        localStorage.removeItem('merchant_auth');
      },
    }),
    {
      name: 'merchant_auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        store: state.store,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
