import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './useAuthStore';

const fakeUser = { id: 1, name: 'Merchant', email: 'merchant@fng.app', role: 'merchant' };
const fakeStore = { id: '10', name: 'FNG Kitchen', type: 'restaurant', is_active: true };

beforeEach(() => {
  localStorage.clear(); // prevent persisted state from bleeding across tests
  useAuthStore.setState({
    token: null,
    user: null,
    store: null,
    isAuthenticated: false,
  });
});

describe('useAuthStore (merchant)', () => {
  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.store).toBeNull();
  });

  it('login sets isAuthenticated and user', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.login('jwt-xyz', fakeUser));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe('Merchant');
    expect(result.current.token).toBe('jwt-xyz');
  });

  it('setStore attaches store to state', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.login('tok', fakeUser));
    act(() => result.current.setStore(fakeStore));
    expect(result.current.store?.name).toBe('FNG Kitchen');
    expect(result.current.store?.is_active).toBe(true);
  });

  it('logout resets all fields to null', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.login('tok', fakeUser));
    act(() => result.current.setStore(fakeStore));
    act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.store).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('logout clears the persisted localStorage key', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.login('tok', fakeUser));
    // persist writes to localStorage under 'merchant_auth'
    expect(localStorage.getItem('merchant_auth')).not.toBeNull();
    act(() => result.current.logout());
    expect(localStorage.getItem('merchant_auth')).toBeNull();
  });
});
