import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ManagementPage } from './ManagementPage';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

import api from '../services/api';
const mockApiGet   = api.get   as ReturnType<typeof vi.fn>;
const mockApiPatch = api.patch as ReturnType<typeof vi.fn>;

const DEMO_USER = { id: '1', name: 'Demo user 1', email: 'demo1@test.com', is_active: true };
const DEMO_USER_INACTIVE = { id: '2', name: 'Demo user 2', email: 'demo2@test.com', is_active: false };

describe('ManagementPage – type=users', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders "users Management" heading', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { users: [DEMO_USER] } });
    render(<ManagementPage type="users" />);
    await waitFor(() => expect(screen.getByText(/users Management/i)).toBeInTheDocument());
  });

  it('displays user rows after loading', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { users: [DEMO_USER, DEMO_USER_INACTIVE] } });
    render(<ManagementPage type="users" />);
    await waitFor(() => {
      expect(screen.getByText('Demo user 1')).toBeInTheDocument();
      expect(screen.getByText('Demo user 2')).toBeInTheDocument();
    });
  });

  it('shows demo data when API fails', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Network error'));
    render(<ManagementPage type="users" />);
    await waitFor(() => expect(screen.getByText(/Demo user 1/i)).toBeInTheDocument());
  });

  it('filters items by search term', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: { users: [DEMO_USER, { id: '3', name: 'John Doe', email: 'john@fng.com', is_active: true }] },
    });
    render(<ManagementPage type="users" />);
    await waitFor(() => screen.getByText('Demo user 1'));

    const search = screen.getByPlaceholderText(/search users/i);
    fireEvent.change(search, { target: { value: 'john' } });

    expect(screen.queryByText('Demo user 1')).not.toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('calls PATCH on toggle and updates row', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { users: [DEMO_USER] } });
    mockApiPatch.mockResolvedValueOnce({});
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

    render(<ManagementPage type="users" />);
    await waitFor(() => screen.getByText('Demo user 1'));

    const toggleBtn = screen.getByRole('button', { name: /disable/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => expect(mockApiPatch).toHaveBeenCalledWith(
      '/admin/users/1/status',
      { is_active: false }
    ));
  });

  it('does nothing on toggle when user cancels confirm', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { users: [DEMO_USER] } });
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);

    render(<ManagementPage type="users" />);
    await waitFor(() => screen.getByText('Demo user 1'));

    fireEvent.click(screen.getByRole('button', { name: /disable/i }));
    expect(mockApiPatch).not.toHaveBeenCalled();
  });
});

describe('ManagementPage – type=stores', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders "stores Management" heading', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { stores: [] } });
    render(<ManagementPage type="stores" />);
    await waitFor(() => expect(screen.getByText(/stores Management/i)).toBeInTheDocument());
  });

  it('uses /admin/stores/:id PATCH endpoint for stores', async () => {
    const store = { id: '5', name: 'FNG Biryani', email: 's@fng.com', is_active: true };
    mockApiGet.mockResolvedValueOnce({ data: { stores: [store] } });
    mockApiPatch.mockResolvedValueOnce({});
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

    render(<ManagementPage type="stores" />);
    await waitFor(() => screen.getByText('FNG Biryani'));

    fireEvent.click(screen.getByRole('button', { name: /disable/i }));
    await waitFor(() => expect(mockApiPatch).toHaveBeenCalledWith('/admin/stores/5', { is_active: false }));
  });
});
