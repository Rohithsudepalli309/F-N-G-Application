/**
 * useAuthStore.ts — Driver authentication state (Zustand + AsyncStorage persist).
 *
 * Persists tokens to AsyncStorage so the driver stays logged in across app
 * restarts. On mount, SplashScreen reads the stored tokens and either routes
 * to Home or Login.
 *
 * DRIVER PROFILE:
 *   id, name, phone, vehicleType, profileImage (optional)
 */
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DriverProfile {
  id:           number;
  name:         string;
  phone:        string;
  vehicleType:  'bike' | 'bicycle' | 'car';
  profileImage?: string;
  isOnline:     boolean;
}

interface AuthState {
  accessToken:  string | null;
  refreshToken: string | null;
  driver:       DriverProfile | null;

  setTokens:  (access: string, refresh: string) => void;
  setDriver:  (driver: DriverProfile) => void;
  setOnline:  (online: boolean) => void;
  logout:     () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken:  null,
      refreshToken: null,
      driver:       null,

      setTokens: (access, refresh) =>
        set({accessToken: access, refreshToken: refresh}),

      setDriver: (driver) => set({driver}),

      setOnline: (online) =>
        set((s) => ({
          driver: s.driver ? {...s.driver, isOnline: online} : s.driver,
        })),

      logout: () =>
        set({accessToken: null, refreshToken: null, driver: null}),
    }),
    {
      name:    'fng-driver-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
