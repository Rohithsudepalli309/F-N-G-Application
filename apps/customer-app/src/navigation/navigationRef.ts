import { createNavigationContainerRef, NavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: Record<string, unknown>) {
  if (navigationRef.isReady()) {
    (navigationRef as NavigationContainerRef<any>).navigate(name, params);
  }
}
