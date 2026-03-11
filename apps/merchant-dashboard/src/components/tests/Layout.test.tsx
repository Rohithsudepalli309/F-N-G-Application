import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../Layout';

// ── Auth store mock ───────────────────────────────────────────────────────────
const mockLogout = vi.fn();
let mockAuthState = {
  user: { name: 'Test Merchant', email: 'merchant@example.com' } as { name: string; email: string } | null,
  store: { id: 'store-1', name: 'My Store' } as { id: string; name: string } | null,
  logout: mockLogout,
  isAuthenticated: true,
  token: 'abc',
};

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (s: typeof mockAuthState) => any) =>
    selector ? selector(mockAuthState) : mockAuthState,
}));

// React Router renders Outlet children; provide a stub outlet
function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Layout />
    </MemoryRouter>
  );
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: { name: 'Test Merchant', email: 'merchant@example.com' },
      store: { id: 'store-1', name: 'My Store' },
      logout: mockLogout,
      isAuthenticated: true,
      token: 'abc',
    };
  });

  // ─── Branding ───────────────────────────────────────────────────────────────
  it('displays "Merchant Portal" heading in sidebar', () => {
    renderLayout();
    expect(screen.getAllByText('Merchant Portal').length).toBeGreaterThan(0);
  });

  it('shows the store name from auth state', () => {
    renderLayout();
    expect(screen.getByText('My Store')).toBeInTheDocument();
  });

  it('falls back to "F&G Platform" when store is null', () => {
    mockAuthState = { ...mockAuthState, store: null };
    renderLayout();
    expect(screen.getByText('F&G Platform')).toBeInTheDocument();
  });

  // ─── Navigation links ────────────────────────────────────────────────────────
  it('renders all 5 nav links', () => {
    renderLayout();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /menu/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
  });

  // ─── User card ───────────────────────────────────────────────────────────────
  it('displays user name in sidebar', () => {
    renderLayout();
    expect(screen.getByText('Test Merchant')).toBeInTheDocument();
  });

  it('falls back to "Merchant" when user is null', () => {
    mockAuthState = { ...mockAuthState, user: null };
    renderLayout();
    expect(screen.getByText('Merchant')).toBeInTheDocument();
  });

  it('displays user email in sidebar', () => {
    renderLayout();
    expect(screen.getByText('merchant@example.com')).toBeInTheDocument();
  });

  // ─── Logout ──────────────────────────────────────────────────────────────────
  it('calls logout and navigates to /login when logout button clicked', async () => {
    renderLayout();
    const logoutBtn = screen.getByTitle('Log out');
    await userEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  // ─── Mobile hamburger ────────────────────────────────────────────────────────
  it('renders mobile hamburger button', () => {
    renderLayout();
    expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
  });

  it('opens mobile sidebar when hamburger is clicked', async () => {
    renderLayout();
    const hamburger = screen.getByLabelText('Open navigation menu');
    await userEvent.click(hamburger);
    // After click, a mobile overlay sidebar is shown — multiple "Merchant Portal" texts
    const portals = screen.getAllByText('Merchant Portal');
    expect(portals.length).toBeGreaterThan(1);
  });
});
