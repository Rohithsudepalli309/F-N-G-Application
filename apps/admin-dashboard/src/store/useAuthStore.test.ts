import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './useAuthStore';

// Isolate each test with a fresh store state
beforeEach(() => {
  localStorage.clear(); // must clear BEFORE setState to prevent persist re-hydration
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
  });
});

describe('useAuthStore', () => {
  it('starts unauthenticated with no user or token', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('login sets isAuthenticated, token and user', () => {
    const { result } = renderHook(() => useAuthStore());
    const fakeUser = { id: '1', name: 'Admin', email: 'admin@fng.app', role: 'admin' as const };
    act(() => result.current.login('jwt-token-abc', fakeUser));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('jwt-token-abc');
    expect(result.current.user?.email).toBe('admin@fng.app');
  });

  it('login persists token to the persist storage key', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.login('tok', { id: '2', name: 'A', email: 'a@b.com', role: 'admin' }));
    // persist writes to 'admin-auth-storage', not a raw 'admin_token' key
    const stored = JSON.parse(localStorage.getItem('admin-auth-storage') ?? '{}');
    expect(stored?.state?.token).toBe('tok');
    expect(stored?.state?.isAuthenticated).toBe(true);
    // no orphaned raw key
    expect(localStorage.getItem('admin_token')).toBeNull();
  });

  it('logout clears state and the persist storage key', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.login('tok', { id: '1', name: 'A', email: 'a@b.com', role: 'admin' }));
    expect(localStorage.getItem('admin-auth-storage')).not.toBeNull();
    act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('admin-auth-storage')).toBeNull();
  });
});
