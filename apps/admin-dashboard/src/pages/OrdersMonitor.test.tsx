import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { OrdersMonitor } from './OrdersMonitor';

vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

vi.mock('../services/socket', () => ({
  socketService: {
    connect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: (selector: any) => selector({ token: 'jwt_token' }),
}));

import api from '../services/api';
import { socketService } from '../services/socket';

const mockApiGet = api.get as ReturnType<typeof vi.fn>;
const mockSocketOn = socketService.on as ReturnType<typeof vi.fn>;
const mockSocketOff = socketService.off as ReturnType<typeof vi.fn>;
const mockSocketConnect = socketService.connect as ReturnType<typeof vi.fn>;

describe('OrdersMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: { orders: [] } });
  });

  it('renders the Live Orders Monitor heading', async () => {
    render(<OrdersMonitor />);
    await waitFor(() => expect(screen.getByText(/Live Orders Monitor/i)).toBeInTheDocument());
  });

  it('fetches orders from API on mount', async () => {
    render(<OrdersMonitor />);
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith('/admin/orders?limit=50'));
  });

  it('connects to socket with token on mount', async () => {
    render(<OrdersMonitor />);
    await waitFor(() => expect(mockSocketConnect).toHaveBeenCalledWith('jwt_token'));
  });

  it('subscribes to order.platform.update socket event', async () => {
    render(<OrdersMonitor />);
    await waitFor(() => expect(mockSocketOn).toHaveBeenCalledWith('order.platform.update', expect.any(Function)));
  });

  it('shows empty state message when there are no orders', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { orders: [] } });
    render(<OrdersMonitor />);
    await waitFor(() => expect(screen.getByText(/no active orders found/i)).toBeInTheDocument());
  });

  it('renders order rows for each fetched order', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        orders: [
          { id: '1', customer_name: 'Alice', store_name: 'FNG Biryani', status: 'placed', total_amount: 35000, created_at: '2026-03-10T10:00:00Z' },
          { id: '2', customer_name: 'Bob', store_name: 'FNG Pizza', status: 'delivered', total_amount: 25000, created_at: '2026-03-10T11:00:00Z' },
        ],
      },
    });
    render(<OrdersMonitor />);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('FNG Biryani')).toBeInTheDocument();
    });
  });

  it('displays status badges with correct text', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        orders: [
          { id: '3', customer_name: 'Charlie', store_name: 'S1', status: 'cancelled', total_amount: 10000, created_at: '2026-03-10T09:00:00Z' },
        ],
      },
    });
    render(<OrdersMonitor />);
    await waitFor(() => expect(screen.getByText('cancelled')).toBeInTheDocument());
  });

  it('shows last refreshed time after fetching', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { orders: [] } });
    render(<OrdersMonitor />);
    await waitFor(() => expect(screen.getByText(/updated/i)).toBeInTheDocument());
  });

  it('updates orders list when socket event fires', async () => {
    let socketCallback: ((data: any) => void) | null = null;
    mockSocketOn.mockImplementation((event: string, cb: (data: any) => void) => {
      if (event === 'order.platform.update') socketCallback = cb;
    });
    mockApiGet.mockResolvedValueOnce({
      data: {
        orders: [{ id: '1', customer_name: 'Alice', store_name: 'S1', status: 'placed', total_amount: 100, created_at: '' }],
      },
    });

    render(<OrdersMonitor />);
    await waitFor(() => expect(socketCallback).not.toBeNull());

    // Fire socket update for the same order
    socketCallback!({ id: '1', customer_name: 'Alice', store_name: 'S1', status: 'delivered', total_amount: 100, created_at: '' });

    await waitFor(() => expect(screen.getByText('delivered')).toBeInTheDocument());
  });

  it('unregisters socket listener and timer on unmount', async () => {
    const { unmount } = render(<OrdersMonitor />);
    await waitFor(() => expect(mockSocketOn).toHaveBeenCalled());
    unmount();
    expect(mockSocketOff).toHaveBeenCalledWith('order.platform.update');
  });

  it('handles Refresh button click', async () => {
    mockApiGet.mockResolvedValue({ data: { orders: [] } });
    render(<OrdersMonitor />);
    await waitFor(() => screen.getByRole('button', { name: /refresh/i }));
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    // Should trigger another API call
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledTimes(2));
  });
});
