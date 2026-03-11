import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/Toast';
import DashboardPage from '../pages/DashboardPage';

// ── API mock ──────────────────────────────────────────────────────────────────
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../services/api';
const mockApiGet = api.get as ReturnType<typeof vi.fn>;
const mockApiPatch = api.patch as ReturnType<typeof vi.fn>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const mockStore = {
  id: 'store-1',
  name: 'Test Kitchen',
  type: 'restaurant',
  rating: 4.5,
  is_active: true,
  image_url: null,
  owner_name: 'Chef Test',
};

const mockKpis = {
  ordersToday: 12,
  revenueToday: 150000,
  pendingOrders: 3,
  avgRating: 4.4,
};

const mockOrders = [
  {
    id: 'ord-1',
    status: 'placed',
    total_amount: 25000,
    created_at: new Date().toISOString(),
    customer_name: 'Alice',
    items_count: 2,
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <DashboardPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/merchant/profile')
        return Promise.resolve({ data: { store: mockStore } });
      if (url === '/merchant/analytics?period=week')
        return Promise.resolve({ data: mockKpis });
      if (url === '/merchant/orders?limit=6')
        return Promise.resolve({ data: { orders: mockOrders } });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    mockApiPatch.mockResolvedValue({
      data: { store: { ...mockStore, is_active: false } },
    });
  });

  // ─── Loading state ────────────────────────────────────────────────────────
  it('shows loading spinner on initial render', () => {
    // Don't resolve immediately — use a pending promise
    mockApiGet.mockImplementation(() => new Promise(() => {}));
    renderPage();
    // The spinner is an svg icon from lucide with animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // ─── Data rendering ───────────────────────────────────────────────────────
  it('renders store name after data loads', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Test Kitchen')).toBeInTheDocument());
  });

  it('renders all 4 KPI card labels', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Orders Today')).toBeInTheDocument();
      expect(screen.getByText('Revenue Today')).toBeInTheDocument();
      expect(screen.getByText('Pending Orders')).toBeInTheDocument();
      expect(screen.getByText('Avg Rating')).toBeInTheDocument();
    });
  });

  it('renders KPI values from analytics response', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument(); // ordersToday
      expect(screen.getByText('3')).toBeInTheDocument();  // pendingOrders
      expect(screen.getByText('4.4')).toBeInTheDocument(); // avgRating
    });
  });

  it('renders recent order customer name', async () => {
    renderPage();
    // customer_name is rendered inside "Alice · 2 items" text node
    await waitFor(() => expect(screen.getByText(/Alice/)).toBeInTheDocument());
  });

  // ─── Store open/closed toggle ─────────────────────────────────────────────
  it('shows "Store is Open" button when store is active', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Store is Open')).toBeInTheDocument()
    );
  });

  it('calls PATCH /merchant/store/toggle when toggle button clicked', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Store is Open')).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText('Store is Open'));
    expect(mockApiPatch).toHaveBeenCalledWith('/merchant/store/toggle');
  });

  it('shows "Store is Closed" after toggling to inactive', async () => {
    mockApiPatch.mockResolvedValue({
      data: { store: { ...mockStore, is_active: false } },
    });
    renderPage();
    await waitFor(() => screen.getByText('Store is Open'));
    await userEvent.click(screen.getByText('Store is Open'));
    await waitFor(() =>
      expect(screen.getByText('Store is Closed')).toBeInTheDocument()
    );
  });

  // ─── API calls ────────────────────────────────────────────────────────────
  it('calls all 3 API endpoints on mount', async () => {
    renderPage();
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledTimes(3));
    expect(mockApiGet).toHaveBeenCalledWith('/merchant/profile');
    expect(mockApiGet).toHaveBeenCalledWith('/merchant/analytics?period=week');
    expect(mockApiGet).toHaveBeenCalledWith('/merchant/orders?limit=6');
  });

  // ─── Error handling ───────────────────────────────────────────────────────
  it('hides store banner when profile fetch fails', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'));
    renderPage();
    // Loading ends, no store data — banner (which needs store) not shown
    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Test Kitchen')).not.toBeInTheDocument();
  });

  // ─── timeAgo branches ─────────────────────────────────────────────────────
  it('shows "m ago" for order created ~3 minutes ago', async () => {
    const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/merchant/profile')
        return Promise.resolve({ data: { store: mockStore } });
      if (url === '/merchant/analytics?period=week')
        return Promise.resolve({ data: mockKpis });
      if (url === '/merchant/orders?limit=6')
        return Promise.resolve({
          data: {
            orders: [{ ...mockOrders[0], created_at: threeMinAgo }],
          },
        });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/\dm ago/)).toBeInTheDocument()
    );
  });

  it('shows "h ago" for order created ~2 hours ago', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/merchant/profile')
        return Promise.resolve({ data: { store: mockStore } });
      if (url === '/merchant/analytics?period=week')
        return Promise.resolve({ data: mockKpis });
      if (url === '/merchant/orders?limit=6')
        return Promise.resolve({
          data: {
            orders: [{ ...mockOrders[0], created_at: twoHoursAgo }],
          },
        });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/\dh ago/)).toBeInTheDocument()
    );
  });

  // ─── All caught up empty state ────────────────────────────────────────────
  it('renders "All caught up!" when no placed/preparing orders', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/merchant/profile')
        return Promise.resolve({ data: { store: mockStore } });
      if (url === '/merchant/analytics?period=week')
        return Promise.resolve({ data: mockKpis });
      if (url === '/merchant/orders?limit=6')
        return Promise.resolve({
          data: {
            orders: [
              { ...mockOrders[0], status: 'delivered' },
            ],
          },
        });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('All caught up!')).toBeInTheDocument()
    );
  });

  // ─── Store image branch ───────────────────────────────────────────────────
  it('renders store img when image_url is set', async () => {
    const storeWithImage = { ...mockStore, image_url: 'https://example.com/store.jpg' };
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/merchant/profile')
        return Promise.resolve({ data: { store: storeWithImage } });
      if (url === '/merchant/analytics?period=week')
        return Promise.resolve({ data: mockKpis });
      if (url === '/merchant/orders?limit=6')
        return Promise.resolve({ data: { orders: mockOrders } });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    renderPage();
    await waitFor(() => {
      const img = document.querySelector('img[alt="Test Kitchen"]');
      expect(img).toBeInTheDocument();
    });
  });

  // ─── Toggle store error path ──────────────────────────────────────────────
  it('shows error toast when store toggle API fails', async () => {
    mockApiPatch.mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => screen.getByText('Store is Open'));
    await userEvent.click(screen.getByText('Store is Open'));
    await waitFor(() =>
      expect(screen.getByText('Could not update store status.')).toBeInTheDocument()
    );
  });

  // ─── store.type null → fallback "Restaurant" ─────────────────────────────
  it('renders "Restaurant" fallback when store type is null', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/merchant/profile')
        return Promise.resolve({ data: { store: { ...mockStore, type: null } } });
      if (url === '/merchant/analytics?period=week')
        return Promise.resolve({ data: mockKpis });
      if (url === '/merchant/orders?limit=6')
        return Promise.resolve({ data: { orders: mockOrders } });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Restaurant')).toBeInTheDocument()
    );
  });

  // ─── items_count singular ────────────────────────────────────────────────
  it('renders "1 item" (singular) for order with items_count === 1', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/merchant/profile')
        return Promise.resolve({ data: { store: mockStore } });
      if (url === '/merchant/analytics?period=week')
        return Promise.resolve({ data: mockKpis });
      if (url === '/merchant/orders?limit=6')
        return Promise.resolve({
          data: {
            orders: [{ ...mockOrders[0], items_count: 1 }],
          },
        });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Alice · 1 item$/)).toBeInTheDocument()
    );
  });

  // ─── null customer_name fallback ─────────────────────────────────────────
  it('renders "Customer" when order customer_name is null', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/merchant/profile')
        return Promise.resolve({ data: { store: mockStore } });
      if (url === '/merchant/analytics?period=week')
        return Promise.resolve({ data: mockKpis });
      if (url === '/merchant/orders?limit=6')
        return Promise.resolve({
          data: {
            orders: [{ ...mockOrders[0], customer_name: null, status: 'placed' }],
          },
        });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Customer ·/)).toBeInTheDocument()
    );
  });

  // ─── null items_count → '?' fallback ────────────────────────────────────
  it('renders "?" when items_count is null', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/merchant/profile')
        return Promise.resolve({ data: { store: mockStore } });
      if (url === '/merchant/analytics?period=week')
        return Promise.resolve({ data: mockKpis });
      if (url === '/merchant/orders?limit=6')
        return Promise.resolve({
          data: {
            orders: [{ ...mockOrders[0], items_count: null, status: 'placed' }],
          },
        });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/· \? item/)).toBeInTheDocument()
    );
  });

  // ─── null orders in fetchAll → [] fallback ────────────────────────────────
  it('renders "All caught up!" when orders API returns null orders', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/merchant/profile')
        return Promise.resolve({ data: { store: mockStore } });
      if (url === '/merchant/analytics?period=week')
        return Promise.resolve({ data: mockKpis });
      if (url === '/merchant/orders?limit=6')
        return Promise.resolve({ data: { orders: null } });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('All caught up!')).toBeInTheDocument()
    );
  });

  // ─── Toggle from closed → open ('Store is now open.' branch) ─────────────
  it('shows "Store is now open." toast when toggling closed store to open', async () => {
    const closedStore = { ...mockStore, is_active: false };
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/merchant/profile')
        return Promise.resolve({ data: { store: closedStore } });
      if (url === '/merchant/analytics?period=week')
        return Promise.resolve({ data: mockKpis });
      if (url === '/merchant/orders?limit=6')
        return Promise.resolve({ data: { orders: mockOrders } });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    mockApiPatch.mockResolvedValue({
      data: { store: { ...closedStore, is_active: true } },
    });
    renderPage();
    await waitFor(() => screen.getByText('Store is Closed'));
    await userEvent.click(screen.getByText('Store is Closed'));
    await waitFor(() =>
      expect(screen.getByText('Store is now open.')).toBeInTheDocument()
    );
  });
});
