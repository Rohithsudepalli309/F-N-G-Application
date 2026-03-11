import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogin = vi.fn();
vi.mock('../store/useAuthStore', () => ({
  useAuthStore: (selector: any) =>
    selector({ login: mockLogin, isAuthenticated: false, user: null }),
}));

vi.mock('../services/api', () => ({
  default: { post: vi.fn() },
}));

import api from '../services/api';
const mockApiPost = api.post as ReturnType<typeof vi.fn>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('LoginPage (admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Admin Portal heading and form fields', () => {
    renderLogin();
    expect(screen.getByText(/Admin Portal/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/admin@fng.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('does not show an error on initial render', () => {
    renderLogin();
    expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument();
  });

  it('calls api.post with credentials on submit', async () => {
    mockApiPost.mockResolvedValueOnce({ data: { token: 'tok', user: { id: 1, role: 'admin' } } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/admin@fng.com/i), { target: { value: 'admin@fng.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/auth/login', {
        email: 'admin@fng.com',
        password: 'secret123',
        role: 'admin',
      });
    });
  });

  it('calls login store action and navigates to "/" on success', async () => {
    const fakeUser = { id: 1, role: 'admin', name: 'Admin' };
    mockApiPost.mockResolvedValueOnce({ data: { token: 'jwt_token', user: fakeUser } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/admin@fng.com/i), { target: { value: 'admin@fng.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('jwt_token', fakeUser);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows an error message when the API call fails', async () => {
    mockApiPost.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/admin@fng.com/i), { target: { value: 'x@x.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows fallback error message when API error has no message', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('Network Error'));
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/admin@fng.com/i), { target: { value: 'x@x.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
    });
  });

  it('disables the submit button while loading', async () => {
    // Never resolves so we can inspect the loading state
    mockApiPost.mockReturnValueOnce(new Promise(() => {}));
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/admin@fng.com/i), { target: { value: 'a@a.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Authenticating/i })).toBeDisabled();
    });
  });
});
