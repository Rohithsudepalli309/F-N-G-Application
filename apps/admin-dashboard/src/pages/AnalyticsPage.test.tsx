import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AnalyticsPage } from './AnalyticsPage';

vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import api from '../services/api';
const mockApiGet = api.get as ReturnType<typeof vi.fn>;

const ANALYTICS_DATA = {
  daily: [
    { date: '2024-01-01', orders: 10, revenue: 50000 },
    { date: '2024-01-02', orders: 15, revenue: 80000 },
  ],
  topStores: [
    { name: 'FNG Biryani', order_count: 50, revenue: 150000 },
  ],
};

const STATS_DATA = {
  ordersToday: 25,
  totalCustomers: 1200,
  totalDrivers: 30,
  revenueToday: 95000,
};

describe('AnalyticsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a loading spinner while fetching', () => {
    let resolve: (v: unknown) => void;
    const pending = new Promise(r => { resolve = r; });
    mockApiGet.mockReturnValue(pending);

    render(<AnalyticsPage />);
    expect(document.querySelector('svg.animate-spin, [class*="animate-spin"]')).not.toBeNull();
  });

  it('calls both /admin/analytics and /admin/stats', async () => {
    mockApiGet
      .mockResolvedValueOnce({ data: ANALYTICS_DATA })
      .mockResolvedValueOnce({ data: STATS_DATA });

    render(<AnalyticsPage />);
    await waitFor(() => screen.getByText('Orders Today'));

    expect(mockApiGet).toHaveBeenCalledWith('/admin/analytics');
    expect(mockApiGet).toHaveBeenCalledWith('/admin/stats');
  });

  it('renders KPI cards after data loads', async () => {
    mockApiGet
      .mockResolvedValueOnce({ data: ANALYTICS_DATA })
      .mockResolvedValueOnce({ data: STATS_DATA });

    render(<AnalyticsPage />);
    await waitFor(() => {
      expect(screen.getByText('Orders Today')).toBeInTheDocument();
      expect(screen.getByText('Revenue Today')).toBeInTheDocument();
      expect(screen.getByText('Total Customers')).toBeInTheDocument();
      expect(screen.getByText('Active Drivers')).toBeInTheDocument();
    });
  });

  it('renders the bar chart when daily data present', async () => {
    mockApiGet
      .mockResolvedValueOnce({ data: ANALYTICS_DATA })
      .mockResolvedValueOnce({ data: STATS_DATA });

    render(<AnalyticsPage />);
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());
  });

  it('shows "No delivery data yet" when daily array is empty', async () => {
    mockApiGet
      .mockResolvedValueOnce({ data: { daily: [], topStores: [] } })
      .mockResolvedValueOnce({ data: STATS_DATA });

    render(<AnalyticsPage />);
    await waitFor(() => expect(screen.getByText(/no delivery data yet/i)).toBeInTheDocument());
  });

  it('renders top stores table rows', async () => {
    mockApiGet
      .mockResolvedValueOnce({ data: ANALYTICS_DATA })
      .mockResolvedValueOnce({ data: STATS_DATA });

    render(<AnalyticsPage />);
    await waitFor(() => expect(screen.getByText('FNG Biryani')).toBeInTheDocument());
  });
});
