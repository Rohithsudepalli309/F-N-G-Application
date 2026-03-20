import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null, // SEC-005: no longer stored in state/localStorage
      isAuthenticated: false,
      login: (_token, user) => {
        set({ user, token: null, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('admin-auth-storage');
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
);
