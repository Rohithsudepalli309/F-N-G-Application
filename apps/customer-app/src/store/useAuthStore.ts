import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveToken, removeToken } from '../utils/storage';

interface AuthState {
  user: { id: string; name: string; role: string; address?: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: any) => void;
  updateUser: (user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, user) => {
        saveToken(token);
        set({ token, user, isAuthenticated: true });
      },
      updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
      logout: () => {
        removeToken();
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
