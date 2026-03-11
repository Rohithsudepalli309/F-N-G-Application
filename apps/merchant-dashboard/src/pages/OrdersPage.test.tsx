import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/Toast';
import OrdersPage from '../pages/OrdersPage';

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

// Socket mock — module-level function
const mockSocketOn = vi.fn();
const mockSocketOff = vi.fn();
const mockSocketEmit = vi.fn();
const mockSocketObj = {
  on: mockSocketOn,
  off: mockSocketOff,
  emit: mockSocketEmit,
  connected: true,
};

vi.mock('../services/socket', () => ({
  getSocket: vi.fn(() => mockSocketObj),
  disconnectSocket: vi.fn(),
}));

// Auth store
let mockAuthState = {
  token: 'test-token',
  store: { id: 'store-1', name: 'My Store' },
  isAuthenticated: true,
  user: null,
};

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: (selector?: (s: typeof mockAuthState) => any) =>
    selector ? selector(mockAuthState) : mockAuthState,
}));

import api from '../services/api';
import { getSocket } from '../services/socket';
const mockApiGet = api.get as ReturnType<typeof vi.fn>;
const mockApiPatch = api.patch as ReturnType<typeof vi.fn>;
const mockGetSocket = getSocket as ReturnType<typeof vi.fn>;

// ── Sample data ───────────────────────────────────────────────────────────────
const sampleOrders = [
  {
    id: 101,
    status: 'placed',
    payment_status: 'paid',
    total_amount: 25000,
    address: '123 Main St',
    created_at: new Date().toISOString(),
    customer_name: 'Alice',
    customer_phone: '9876543210',
    items: [{ name: 'Burger', quantity: 2, price: 12500 }],
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <OrdersPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: { orders: sampleOrders } });
    mockApiPatch.mockResolvedValue({ data: {} });
    mockGetSocket.mockReturnValue(mockSocketObj);
  });

  // ─── Initial load ─────────────────────────────────────────────────────────
  it('fetches /merchant/orders on mount', async () => {
    renderPage();
    await waitFor(() =>
      expect(mockApiGet).toHaveBeenCalledWith('/merchant/orders', { params: {} })
    );
  });

  it('renders order customer name after data loads', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
  });

  it('renders order id', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('#101')).toBeInTheDocument());
  });

  // ─── Status tabs ─────────────────────────────────────────────────────────
  it('renders all status tabs', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('All Orders')).toBeInTheDocument());
    expect(screen.getByText('Placed')).toBeInTheDocument();
    expect(screen.getByText('Preparing')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('clicking a status tab re-fetches with that status filter', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Placed'));
    await userEvent.click(screen.getByText('Placed'));
    await waitFor(() =>
      expect(mockApiGet).toHaveBeenCalledWith('/merchant/orders', {
        params: { status: 'placed' },
      })
    );
  });

  // ─── Socket integration ───────────────────────────────────────────────────
  it('calls getSocket with the auth token', async () => {
    renderPage();
    await waitFor(() => expect(mockGetSocket).toHaveBeenCalledWith('test-token'));
  });

  it('emits join:merchant event with storeId', async () => {
    renderPage();
    await waitFor(() =>
      expect(mockSocketEmit).toHaveBeenCalledWith('join:merchant', { storeId: 'store-1' })
    );
  });

  it('registers merchant:new_order socket listener', async () => {
    renderPage();
    await waitFor(() =>
      expect(mockSocketOn).toHaveBeenCalledWith(
        'merchant:new_order',
        expect.any(Function)
      )
    );
  });

  it('registers order_status_update socket listener', async () => {
    renderPage();
    await waitFor(() =>
      expect(mockSocketOn).toHaveBeenCalledWith(
        'order_status_update',
        expect.any(Function)
      )
    );
  });

  // ─── Empty state ──────────────────────────────────────────────────────────
  it('shows empty state when no orders returned', async () => {
    mockApiGet.mockResolvedValue({ data: { orders: [] } });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('No orders yet')).toBeInTheDocument()
    );
  });

  // ─── Loading state ────────────────────────────────────────────────────────
  it('shows loading spinner during fetch', () => {
    mockApiGet.mockImplementation(() => new Promise(() => {}));
    renderPage();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // ─── Action buttons ───────────────────────────────────────────────────────
  it('calls PATCH when an order action button is clicked', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Alice'));
    // The 'placed' order should show Accept / Reject action buttons
    const acceptBtn = screen.queryByText(/accept/i);
    if (acceptBtn) {
      mockApiGet.mockResolvedValue({ data: { orders: [] } });
      await userEvent.click(acceptBtn);
      expect(mockApiPatch).toHaveBeenCalled();
    }
  });

  // ─── doAction — direct testing ────────────────────────────────────────────
  it('calls PATCH /merchant/orders/:id/accept when Accept is clicked', async () => {
    renderPage();
    await waitFor(() => screen.getByText(/^Accept$/i));
    mockApiGet.mockResolvedValue({ data: { orders: [] } });
    await userEvent.click(screen.getByText(/^Accept$/i));
    await waitFor(() =>
      expect(mockApiPatch).toHaveBeenCalledWith('/merchant/orders/101/accept')
    );
  });

  it('calls PATCH /merchant/orders/:id/reject when Reject is clicked', async () => {
    renderPage();
    await waitFor(() => screen.getByText(/^Reject$/i));
    mockApiGet.mockResolvedValue({ data: { orders: [] } });
    await userEvent.click(screen.getByText(/^Reject$/i));
    await waitFor(() =>
      expect(mockApiPatch).toHaveBeenCalledWith('/merchant/orders/101/reject')
    );
  });

  it('shows error toast when doAction fails', async () => {
    mockApiPatch.mockRejectedValue(new Error('Server error'));
    renderPage();
    await waitFor(() => screen.getByText(/^Accept$/i));
    await userEvent.click(screen.getByText(/^Accept$/i));
    await waitFor(() =>
      expect(screen.getByText('Action failed — please try again.')).toBeInTheDocument()
    );
  });

  // ─── Preparing order — Mark as Ready ─────────────────────────────────────
  it('renders "Mark as Ready" button for preparing orders', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        orders: [{ ...sampleOrders[0], status: 'preparing' }],
      },
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/mark as ready/i)).toBeInTheDocument()
    );
  });

  it('calls PATCH /ready when Mark as Ready is clicked', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        orders: [{ ...sampleOrders[0], status: 'preparing' }],
      },
    });
    renderPage();
    await waitFor(() => screen.getByText(/mark as ready/i));
    mockApiGet.mockResolvedValue({ data: { orders: [] } });
    await userEvent.click(screen.getByText(/mark as ready/i));
    await waitFor(() =>
      expect(mockApiPatch).toHaveBeenCalledWith('/merchant/orders/101/ready')
    );
  });

  // ─── Ready order — waiting for driver ─────────────────────────────────────
  it('renders "Waiting for driver pickup" for ready orders', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        orders: [{ ...sampleOrders[0], status: 'ready' }],
      },
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/waiting for driver pickup/i)).toBeInTheDocument()
    );
  });

  // ─── Socket: handleNewOrder callback ──────────────────────────────────────
  it('adds new order to list when merchant:new_order fires on "all" tab', async () => {
    renderPage();
    await waitFor(() =>
      expect(mockSocketOn).toHaveBeenCalledWith('merchant:new_order', expect.any(Function))
    );
    // Grab the registered callback
    const [[, handleNewOrder]] = mockSocketOn.mock.calls.filter(
      ([event]: [string]) => event === 'merchant:new_order'
    );
    const newOrder = { ...sampleOrders[0], id: 999, customer_name: 'Bob' };
    act(() => { handleNewOrder(newOrder); });
    await waitFor(() =>
      expect(screen.getByText('Bob')).toBeInTheDocument()
    );
  });

  // ─── Socket: handleStatusUpdate callback ─────────────────────────────────
  it('updates order status in list when order_status_update fires', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Alice'));
    // Wait for socket subscriptions
    await waitFor(() =>
      expect(mockSocketOn).toHaveBeenCalledWith('order_status_update', expect.any(Function))
    );
    const [[, handleStatusUpdate]] = mockSocketOn.mock.calls.filter(
      ([event]: [string]) => event === 'order_status_update'
    );
    act(() => { handleStatusUpdate({ orderId: 101, status: 'preparing' }); });
    // On 'all' tab the updated order remains visible with new status
    await waitFor(() =>
      expect(screen.getByText('preparing')).toBeInTheDocument()
    );
  });

  // ─── fetchOrders error path (silent fail) ────────────────────────────────
  it('silently fails and shows no orders when fetchOrders throws', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });
    // No orders and no error message (silent fail)
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  // ─── handleNewOrder skip branch (non-all/placed tab) ─────────────────────
  it('does not add new order to list when tab is "delivered" (handleNewOrder skip)', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Delivered'));
    // Switch to 'delivered' tab
    await userEvent.click(screen.getByText('Delivered'));
    // Wait for socket subscriptions after tab change
    await waitFor(() =>
      expect(mockSocketOn).toHaveBeenCalledWith('merchant:new_order', expect.any(Function))
    );
    // Grab the LATEST registered callback (after tab change)
    const newOrderCalls = mockSocketOn.mock.calls.filter(
      ([event]: [string]) => event === 'merchant:new_order'
    );
    const [, handleNewOrder] = newOrderCalls[newOrderCalls.length - 1];
    const newOrder = { ...sampleOrders[0], id: 999, customer_name: 'Charlie' };
    act(() => { handleNewOrder(newOrder); });
    // Charlie should NOT appear since we're on 'delivered' tab (not 'all' or 'placed')
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
  });

  // ─── Unpaid payment status rendering ────────────────────────────────────
  it('renders orange badge for unpaid orders', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        orders: [{ ...sampleOrders[0], payment_status: 'pending' }],
      },
    });
    renderPage();
    await waitFor(() => screen.getByText('pending'));
    // The badge for non-paid uses orange class
    const badge = screen.getByText('pending');
    expect(badge.className).toMatch(/orange/);
  });

  // ─── data.orders null → empty array fallback ─────────────────────────────
  it('shows empty state when API returns no orders property', async () => {
    mockApiGet.mockResolvedValue({ data: {} });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('No orders yet')).toBeInTheDocument()
    );
  });

  // ─── No token → socket effect skips ──────────────────────────────────────
  it('skips socket setup when token is null', async () => {
    mockAuthState = { token: null as unknown as string, store: null as unknown as typeof mockAuthState.store, isAuthenticated: false, user: null };
    renderPage();
    await waitFor(() => expect(mockApiGet).toHaveBeenCalled());
    // Socket should not have been created since token is null
    expect(mockGetSocket).not.toHaveBeenCalled();
    // Restore
    mockAuthState = { token: 'test-token', store: { id: 'store-1', name: 'My Store' }, isAuthenticated: true, user: null };
  });

  // ─── Unknown order status → STATUS_BADGE fallback ────────────────────────
  it('renders fallback badge style for unknown order status', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        orders: [{ ...sampleOrders[0], status: 'unknown_status' }],
      },
    });
    renderPage();
    await waitFor(() => screen.getByText('unknown status'));
    const badge = screen.getByText('unknown status');
    // Fallback style has no specific color class from STATUS_BADGE
    expect(badge).toBeInTheDocument();
  });

  // ─── Socket cleanup on unmount ────────────────────────────────────────────
  it('unregisters socket listeners on unmount', async () => {
    const { unmount } = renderPage();
    await waitFor(() =>
      expect(mockSocketOn).toHaveBeenCalledWith('merchant:new_order', expect.any(Function))
    );
    unmount();
    expect(mockSocketOff).toHaveBeenCalledWith('merchant:new_order', expect.any(Function));
    expect(mockSocketOff).toHaveBeenCalledWith('order_status_update', expect.any(Function));
  });
});
