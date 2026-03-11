import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// ── PrivateRoute guard (mirrors App.tsx logic) ────────────────────────────────
// Tests use MemoryRouter so no window.location.origin is needed (jsdom-safe)
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function TestRoutes({ initialEntry = '/' }: { initialEntry?: string }) {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <div data-testid="protected-page">Protected</div>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear(); // prevent persist rehydration from bleeding across tests
  useAuthStore.setState({ token: null, user: null, store: null, isAuthenticated: false });
});

describe('PrivateRoute guard', () => {
  it('redirects to /login when unauthenticated and navigating to /', () => {
    render(<TestRoutes initialEntry="/" />);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders protected content when authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'tok', user: null, store: null });
    render(<TestRoutes initialEntry="/" />);
    expect(screen.getByTestId('protected-page')).toBeInTheDocument();
  });

  it('renders /login page directly when navigating to /login', () => {
    render(<TestRoutes initialEntry="/login" />);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});

// ── App component rendering ────────────────────────────────────────────────────
// Mock all heavy pages so we can render the real App component
vi.mock('../pages/LoginPage', () => ({
  default: () => <div data-testid="login-page-real">LoginPage</div>,
}));
vi.mock('../pages/DashboardPage', () => ({
  default: () => <div data-testid="dashboard-page-real">DashboardPage</div>,
}));
vi.mock('../pages/OrdersPage', () => ({
  default: () => <div data-testid="orders-page-real">OrdersPage</div>,
}));
vi.mock('../pages/MenuPage', () => ({
  default: () => <div data-testid="menu-page-real">MenuPage</div>,
}));
vi.mock('../pages/AnalyticsPage', () => ({
  default: () => <div data-testid="analytics-page-real">AnalyticsPage</div>,
}));
vi.mock('../pages/ProfilePage', () => ({
  default: () => <div data-testid="profile-page-real">ProfilePage</div>,
}));
vi.mock('../components/Layout', () => ({
  default: () => <div data-testid="layout-real">Layout</div>,
}));

import App from '../App';

describe('App component', () => {
  it('renders LoginPage when navigating to /login', () => {
    window.history.pushState({}, '', '/login');
    render(<App />);
    expect(screen.getByTestId('login-page-real')).toBeInTheDocument();
  });

  it('redirects unauthenticated user at / to /login', () => {
    useAuthStore.setState({ isAuthenticated: false, token: null, user: null, store: null });
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByTestId('login-page-real')).toBeInTheDocument();
    expect(screen.queryByTestId('layout-real')).not.toBeInTheDocument();
  });

  it('renders Layout when authenticated at /', () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'tok', user: null, store: null });
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByTestId('layout-real')).toBeInTheDocument();
  });
});

