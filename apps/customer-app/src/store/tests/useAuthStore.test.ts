import { useAuthStore } from '../useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear store state before each test
    const { logout } = useAuthStore.getState();
    logout();
  });

  it('should initialize with null token and false authentication', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should update state on successful login', () => {
    const { login } = useAuthStore.getState();
    login('mock_jwt_token', { id: '1', name: 'Test User', role: 'customer' });
    
    const state = useAuthStore.getState();
    expect(state.token).toBe('mock_jwt_token');
    expect(state.isAuthenticated).toBe(true);
  });

  it('should clear state on logout', () => {
    const { login, logout } = useAuthStore.getState();
    login('mock_jwt_token', { id: '1', name: 'Test User', role: 'customer' });
    logout();
    
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
