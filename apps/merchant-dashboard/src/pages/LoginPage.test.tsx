import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogin = vi.fn();
const mockSetStore = vi.fn();
vi.mock('../store/useAuthStore', () => ({
  useAuthStore: () => ({ login: mockLogin, setStore: mockSetStore }),
}));

vi.mock('../services/api', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

import api from '../services/api';
const mockApiPost = api.post as ReturnType<typeof vi.fn>;
const mockApiGet  = api.get  as ReturnType<typeof vi.fn>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('LoginPage (merchant)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Merchant Portal heading and form fields', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /Merchant Portal/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('does not show an error initially', () => {
    renderLogin();
    expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
  });

  it('calls api.post with credentials on submit', async () => {
    mockApiPost.mockResolvedValueOnce({
      data: { accessToken: 'tok', user: { id: 1, role: 'merchant' } },
    });
    mockApiGet.mockResolvedValueOnce({ data: { store: { id: 5, name: 'FNG Eats' } } });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'merchant@fng.com' },
    });
    // Find password input by type
    const pwInput = document.querySelector('input[type="password"]') as HTMLElement;
    fireEvent.change(pwInput, { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/auth/login', {
        email: 'merchant@fng.com',
        password: 'pass123',
      });
    });
  });

  it('calls login, fetches store, and navigates on success', async () => {
    const fakeUser = { id: 1, role: 'merchant' };
    mockApiPost.mockResolvedValueOnce({ data: { accessToken: 'tok', user: fakeUser } });
    mockApiGet.mockResolvedValueOnce({ data: { store: { id: 3, name: 'FNG Biryani' } } });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'm@fng.com' },
    });
    const pwInput = document.querySelector('input[type="password"]') as HTMLElement;
    fireEvent.change(pwInput, { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('tok', fakeUser);
      expect(mockSetStore).toHaveBeenCalledWith({ id: 3, name: 'FNG Biryani' });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error when user role is not merchant or admin', async () => {
    mockApiPost.mockResolvedValueOnce({
      data: { accessToken: 'tok', user: { id: 2, role: 'driver' } },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'd@fng.com' },
    });
    const pwInput = document.querySelector('input[type="password"]') as HTMLElement;
    fireEvent.change(pwInput, { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/restricted to merchant accounts/i)).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows error message on failed login', async () => {
    mockApiPost.mockRejectedValueOnce({
      response: { data: { error: 'Wrong password' } },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'x@x.com' },
    });
    const pwInput = document.querySelector('input[type="password"]') as HTMLElement;
    fireEvent.change(pwInput, { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Wrong password/i)).toBeInTheDocument();
    });
  });

  it('shows fallback error on network failure', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('Network Error'));

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'x@x.com' },
    });
    const pwInput = document.querySelector('input[type="password"]') as HTMLElement;
    fireEvent.change(pwInput, { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  // ─── Store fetch edge cases ───────────────────────────────────────────────
  it('still navigates when profile returns no store property', async () => {
    mockApiPost.mockResolvedValueOnce({
      data: { accessToken: 'tok', user: { id: 1, role: 'merchant' } },
    });
    // Profile returns data without a store
    mockApiGet.mockResolvedValueOnce({ data: {} });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'm@fng.com' },
    });
    const pwInput = document.querySelector('input[type="password"]') as HTMLElement;
    fireEvent.change(pwInput, { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
    // setStore should NOT have been called
    expect(mockSetStore).not.toHaveBeenCalled();
  });

  it('still navigates when store profile fetch throws', async () => {
    mockApiPost.mockResolvedValueOnce({
      data: { accessToken: 'tok', user: { id: 1, role: 'merchant' } },
    });
    // Store fetch fails
    mockApiGet.mockRejectedValueOnce(new Error('Network error'));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'm@fng.com' },
    });
    const pwInput = document.querySelector('input[type="password"]') as HTMLElement;
    fireEvent.change(pwInput, { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Should still navigate even though store fetch errored
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  // ─── Show/hide password toggle ──────────────────────────────────────────
  it('toggles password field to text type when eye button is clicked', () => {
    renderLogin();
    const pwInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    expect(pwInput).toBeInTheDocument();

    // Click the show-password toggle button (the eye icon button)
    const toggleBtn = pwInput.parentElement!.querySelector('button[type="button"]') as HTMLButtonElement;
    fireEvent.click(toggleBtn);

    // After toggle, the input type should be 'text'
    const visibleInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    expect(visibleInput).toBeInTheDocument();
  });
});
