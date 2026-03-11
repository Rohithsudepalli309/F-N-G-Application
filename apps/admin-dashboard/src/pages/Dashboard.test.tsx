import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';

// Heavy chart / map deps mocked away
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../components/DashboardMap', () => ({
  default: () => <div data-testid="dashboard-map" />,
  DashboardMap: () => <div data-testid="dashboard-map" />,
}));

vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

import api from '../services/api';
const mockApiGet = api.get as ReturnType<typeof vi.fn>;

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Dashboard heading', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        totalOrders: 100,
        activeOrders: 5,
        activeDrivers: 3,
        dailyRevenue: 50000,
        chartData: [],
      },
    });
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
  });

  it('renders KPI card labels', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        totalOrders: 200,
        activeOrders: 10,
        activeDrivers: 8,
        dailyRevenue: 120000,
        chartData: [],
      },
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('Active Orders')).toBeInTheDocument();
      expect(screen.getByText('Active Drivers')).toBeInTheDocument();
      expect(screen.getByText('Daily Revenue')).toBeInTheDocument();
    });
  });

  it('shows demo data and API error banner when request fails', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Network error'));
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/cached demo data/i)).toBeInTheDocument();
    });
    // KPI cards still render with demo numbers
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
  });

  it('renders "Orders Trend" and "Revenue Growth" chart headings', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { totalOrders: 0, activeOrders: 0, activeDrivers: 0, dailyRevenue: 0, chartData: [] } });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Orders Trend')).toBeInTheDocument();
      expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
    });
  });

  it('formats daily revenue with rupee sign', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        totalOrders: 0, activeOrders: 0, activeDrivers: 0,
        dailyRevenue: 100000, // ₹1,000
        chartData: [],
      },
    });
    render(<Dashboard />);
    await waitFor(() => {
      // Multiple elements may contain ₹ (e.g. badge + KPI value)
      expect(screen.getAllByText(/₹/).length).toBeGreaterThan(0);
    });
  });
});
