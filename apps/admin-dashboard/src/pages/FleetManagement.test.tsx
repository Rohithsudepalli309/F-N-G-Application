import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FleetManagement } from './FleetManagement';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import api from '../services/api';
const mockApiGet  = api.get  as ReturnType<typeof vi.fn>;
const mockApiPost = api.post as ReturnType<typeof vi.fn>;

const DRIVER = {
  id: 'd1',
  name: 'Ravi Kumar',
  phone: '9876543210',
  isOnline: true,
  deliveryStatus: 'delivering',
  activeOrderId: 'ord1',
  lastLat: 12.9,
  lastLng: 77.6,
};

describe('FleetManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Fleet Management" heading', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    render(<FleetManagement />);
    await waitFor(() => expect(screen.getByText(/Fleet Management/i)).toBeInTheDocument());
  });

  it('calls /analytics/fleet on mount', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    render(<FleetManagement />);
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith('/analytics/fleet'));
  });

  it('displays driver rows after loading', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [DRIVER] });
    render(<FleetManagement />);
    await waitFor(() => expect(screen.getByText('Ravi Kumar')).toBeInTheDocument());
  });

  it('"Register New Driver" button opens modal', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    render(<FleetManagement />);
    await waitFor(() => screen.getByRole('button', { name: /register new driver/i }));

    fireEvent.click(screen.getByRole('button', { name: /register new driver/i }));
    expect(screen.getByPlaceholderText('e.g. Rahul Sharma')).toBeInTheDocument();
  });

  it('X button closes the modal', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    render(<FleetManagement />);
    await waitFor(() => screen.getByRole('button', { name: /register new driver/i }));

    fireEvent.click(screen.getByRole('button', { name: /register new driver/i }));
    expect(screen.getByPlaceholderText('e.g. Rahul Sharma')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByPlaceholderText('e.g. Rahul Sharma')).not.toBeInTheDocument();
  });

  it('calls api.post on valid form submit', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    mockApiPost.mockResolvedValueOnce({});
    render(<FleetManagement />);
    await waitFor(() => screen.getByRole('button', { name: /register new driver/i }));

    fireEvent.click(screen.getByRole('button', { name: /register new driver/i }));
    fireEvent.change(screen.getByPlaceholderText('e.g. Rahul Sharma'), { target: { value: 'Test Driver' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 9876543210'), { target: { value: '9999999999' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'pass123' } });

    fireEvent.click(screen.getByRole('button', { name: /register driver/i }));
    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith('/admin/drivers', {
        name: 'Test Driver',
        phone: '9999999999',
        password: 'pass123',
      })
    );
  });

  it('shows formError when api.post rejects', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    mockApiPost.mockRejectedValueOnce({ response: { data: { error: 'Phone already registered' } } });
    render(<FleetManagement />);
    await waitFor(() => screen.getByRole('button', { name: /register new driver/i }));

    fireEvent.click(screen.getByRole('button', { name: /register new driver/i }));
    fireEvent.change(screen.getByPlaceholderText('e.g. Rahul Sharma'), { target: { value: 'Bad Driver' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 9876543210'), { target: { value: '9000000000' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'abc' } });

    fireEvent.click(screen.getByRole('button', { name: /register driver/i }));
    await waitFor(() => expect(screen.getByText(/phone already registered/i)).toBeInTheDocument());
  });
});
