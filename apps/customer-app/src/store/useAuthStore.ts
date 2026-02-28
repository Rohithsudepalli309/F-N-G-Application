import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveToken, removeToken } from '../utils/storage';
import { registerFcmToken } from '../utils/notifications';

interface AuthState {
  user: { id: string; name: string; role: string; address?: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  lastOtp: string | null;
  login: (token: string, user: any) => void;
  updateUser: (user: any) => void;
  logout: () => void;
  setLastOtp: (otp: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      lastOtp: null,
      login: (token, user) => {
        saveToken(token);
        set({ token, user, isAuthenticated: true });
        // Register FCM token asynchronously — non-blocking, degrades gracefully
        registerFcmToken();
      },
      updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
      logout: () => {
        removeToken();
        set({ token: null, user: null, isAuthenticated: false });
      },
      setLastOtp: (otp) => set({ lastOtp: otp }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }), // Exclude lastOtp from persistence
    }
  )
);
