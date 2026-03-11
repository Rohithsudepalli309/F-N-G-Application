import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ProtectedRoute, AdminLayout } from '../Layout';

// ── Shared mock state ────────────────────────────────────────────────────────
const mockLogout = vi.fn();
let mockAuthState = {
  isAuthenticated: false,
  user: null as { name: string; role: string } | null,
  token: null as string | null,
  logout: mockLogout,
};

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (s: typeof mockAuthState) => any) =>
    selector ? selector(mockAuthState) : mockAuthState,
}));

vi.mock('../../services/api', () => ({
  default: { get: vi.fn() },
}));

vi.mock('../DashboardMap', () => ({
  default: () => <div data-testid="dashboard-map" />,
  DashboardMap: () => <div data-testid="dashboard-map" />,
}));

import api from '../../services/api';
const mockApiGet = api.get as ReturnType<typeof vi.fn>;

// ── ProtectedRoute ────────────────────────────────────────────────────────────
describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = { isAuthenticated: false, user: null, token: null, logout: mockLogout };
  });

  it('redirects to /login when not authenticated', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('redirects to /login when authenticated but not admin', () => {
    mockAuthState = { isAuthenticated: true, user: { name: 'Bob', role: 'merchant' }, token: 'tok', logout: mockLogout };
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <ProtectedRoute />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders Outlet when user is an authenticated admin', () => {
    mockAuthState = { isAuthenticated: true, user: { name: 'Admin', role: 'admin' }, token: 'tok', logout: mockLogout };
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div data-testid="protected-content" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});

// ── AdminLayout ───────────────────────────────────────────────────────────────
describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      isAuthenticated: true,
      user: { name: 'Jane Admin', role: 'admin' },
      token: 'jwt',
      logout: mockLogout,
    };
    mockApiGet.mockResolvedValue({ data: { count: 0 } });
  });

  function renderLayout(outlet = <div data-testid="page-outlet" />) {
    return render(
      <MemoryRouter>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/" element={outlet} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders FNG Admin branding in sidebar', async () => {
    renderLayout();
    await waitFor(() => expect(screen.getByText('FNG Admin')).toBeInTheDocument());
  });

  it('renders all nav links', async () => {
    renderLayout();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Live Orders/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Fleet/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Analytics/i })).toBeInTheDocument();
    });
  });

  it('shows user name or "Administrator" fallback', async () => {
    renderLayout();
    await waitFor(() => expect(screen.getByText('Jane Admin')).toBeInTheDocument());
  });

  it('shows "Administrator" when user has no name', async () => {
    mockAuthState.user = { name: '', role: 'admin' };
    renderLayout();
    await waitFor(() => expect(screen.getByText('Administrator')).toBeInTheDocument());
  });

  it('renders the page outlet', async () => {
    renderLayout();
    await waitFor(() => expect(screen.getByTestId('page-outlet')).toBeInTheDocument());
  });

  it('fetches pending order count on mount', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { count: 7 } });
    renderLayout();
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith('/admin/orders/pending-count'));
  });

  it('shows badge when there are pending orders', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { count: 5 } });
    renderLayout();
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
  });

  it('shows 99+ when pending count exceeds 99', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { count: 150 } });
    renderLayout();
    await waitFor(() => expect(screen.getByText('99+')).toBeInTheDocument());
  });

  it('calls logout when logout button is clicked', async () => {
    renderLayout();
    await waitFor(() => screen.getByText('FNG Admin'));
    const logoutBtn = screen.getByRole('button', { name: /sign out/i });
    await userEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalled();
  });
});
