import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AnalyticsPage from '../pages/AnalyticsPage';

// ── Mock recharts to avoid SVG rendering issues in jsdom ─────────────────────
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

// ── API mock ──────────────────────────────────────────────────────────────────
vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

import api from '../services/api';
const mockGet = api.get as ReturnType<typeof vi.fn>;

// ── Sample analytics data ─────────────────────────────────────────────────────
const sampleData = {
  ordersToday: 25,
  revenueToday: 320000,
  pendingOrders: 5,
  avgRating: 4.6,
  chart: [
    { label: 'Mon', revenue: 45000, orders: 8 },
    { label: 'Tue', revenue: 60000, orders: 12 },
  ],
  topProducts: [
    { name: 'Butter Chicken', units_sold: 15, revenue: 112500 },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AnalyticsPage />
    </MemoryRouter>
  );
}

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: sampleData });
  });

  // ─── Loading state ────────────────────────────────────────────────────────
  it('shows loading spinner on initial render', () => {
    mockGet.mockImplementation(() => new Promise(() => {}));
    renderPage();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // ─── API call ─────────────────────────────────────────────────────────────
  it('fetches analytics with period=week on mount', async () => {
    renderPage();
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/merchant/analytics?period=week')
    );
  });

  // ─── KPI cards ────────────────────────────────────────────────────────────
  it('renders all 4 KPI card labels', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Orders Today')).toBeInTheDocument();
      expect(screen.getByText('Revenue Today')).toBeInTheDocument();
      expect(screen.getByText('Pending Orders')).toBeInTheDocument();
      expect(screen.getByText('Avg Rating')).toBeInTheDocument();
    });
  });

  it('renders KPI values from API response', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();   // ordersToday
      expect(screen.getByText('5')).toBeInTheDocument();    // pendingOrders
      expect(screen.getByText('4.6')).toBeInTheDocument();  // avgRating
    });
  });

  // ─── Period toggle ────────────────────────────────────────────────────────
  it('renders This Week and This Month toggle buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'This Week' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Month' })).toBeInTheDocument();
    });
  });

  it('refetches with period=month when This Month is clicked', async () => {
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: 'This Month' }));
    await userEvent.click(screen.getByRole('button', { name: 'This Month' }));
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/merchant/analytics?period=month')
    );
  });

  it('refetches with period=week when This Week is clicked after month', async () => {
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: 'This Month' }));
    await userEvent.click(screen.getByRole('button', { name: 'This Month' }));
    await waitFor(() => mockGet.mock.calls.some(c => c[0].includes('month')));
    await userEvent.click(screen.getByRole('button', { name: 'This Week' }));
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/merchant/analytics?period=week')
    );
  });

  // ─── Charts ───────────────────────────────────────────────────────────────
  it('renders bar charts', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0)
    );
  });

  // ─── Top Products ─────────────────────────────────────────────────────────
  it('renders top products table entry', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Butter Chicken')).toBeInTheDocument()
    );
  });

  // ─── Error state ──────────────────────────────────────────────────────────
  it('shows error state when API fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Could not load analytics data')).toBeInTheDocument()
    );
  });

  // ─── Header ───────────────────────────────────────────────────────────────
  it('renders Analytics heading', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Analytics')).toBeInTheDocument()
    );
  });

  // ─── avgRating null branch ────────────────────────────────────────────────
  it('renders "—" and "No reviews yet" when avgRating is null', async () => {
    mockGet.mockResolvedValue({
      data: { ...sampleData, avgRating: null },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
      expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    });
  });

  it('renders "Based on reviews" when avgRating is non-null', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Based on reviews')).toBeInTheDocument()
    );
  });
});
