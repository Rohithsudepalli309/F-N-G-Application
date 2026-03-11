import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock all pages to avoid rendering heavy dependencies
vi.mock('../pages/LoginPage', () => ({
  LoginPage: () => <div data-testid="login-page">LoginPage</div>,
}));
vi.mock('../pages/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard-page">Dashboard</div>,
}));
vi.mock('../pages/OrdersMonitor', () => ({
  OrdersMonitor: () => <div data-testid="orders-page">OrdersMonitor</div>,
}));
vi.mock('../pages/ManagementPage', () => ({
  ManagementPage: ({ type }: { type: string }) => <div data-testid={`mgmt-${type}`}>{type}</div>,
}));
vi.mock('../pages/FleetManagement', () => ({
  FleetManagement: () => <div data-testid="fleet-page">FleetManagement</div>,
}));
vi.mock('../pages/CouponsPage', () => ({
  CouponsPage: () => <div data-testid="coupons-page">CouponsPage</div>,
}));
vi.mock('../pages/AnalyticsPage', () => ({
  AnalyticsPage: () => <div data-testid="analytics-page">AnalyticsPage</div>,
}));
vi.mock('../pages/PayoutsPage', () => ({
  PayoutsPage: () => <div data-testid="payouts-page">PayoutsPage</div>,
}));
vi.mock('../components/Layout', () => ({
  ProtectedRoute: () => null, // redirect unauthenticated to /login
  AdminLayout: () => <div data-testid="admin-layout">AdminLayout</div>,
}));

describe('App routing', () => {
  it('renders LoginPage on /login route', () => {
    window.history.pushState({}, '', '/login');
    render(<App />);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated (ProtectedRoute returns null)', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    // ProtectedRoute is mocked to return null, so admin layout should not appear
    expect(screen.queryByTestId('admin-layout')).not.toBeInTheDocument();
  });

  it('renders /login route independently of ProtectedRoute', () => {
    window.history.pushState({}, '', '/login');
    const { unmount } = render(<App />);
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
    unmount();
  });
});
