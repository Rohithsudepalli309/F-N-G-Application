import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PayoutsPage } from './PayoutsPage';

vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

import api from '../services/api';
const mockApiGet = api.get as ReturnType<typeof vi.fn>;

const PAYOUT = {
  driver_id: 1,
  driver_name: 'Ravi Kumar',
  phone: '9876543210',
  total_deliveries: 20,
  gross_earnings: 100000,
  platform_commission: 10000,
  net_payout: 90000,
};

describe('PayoutsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
  });

  it('renders "Driver Payouts" heading', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { payouts: [] } });
    render(<PayoutsPage />);
    await waitFor(() => expect(screen.getByText(/Driver Payouts/i)).toBeInTheDocument());
  });

  it('fetches /admin/payouts?period=week on mount', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { payouts: [] } });
    render(<PayoutsPage />);
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith('/admin/payouts?period=week'));
  });

  it('switching to "This Month" fetches period=month', async () => {
    mockApiGet
      .mockResolvedValueOnce({ data: { payouts: [] } })
      .mockResolvedValueOnce({ data: { payouts: [] } });

    render(<PayoutsPage />);
    await waitFor(() => screen.getByRole('button', { name: /this month/i }));

    fireEvent.click(screen.getByRole('button', { name: /this month/i }));
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith('/admin/payouts?period=month'));
  });

  it('renders payout rows when data present', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { payouts: [PAYOUT] } });
    render(<PayoutsPage />);
    await waitFor(() => expect(screen.getByText('Ravi Kumar')).toBeInTheDocument());
  });

  it('Export CSV button is disabled when no payouts', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { payouts: [] } });
    render(<PayoutsPage />);
    await waitFor(() => {
      const exportBtn = screen.getByRole('button', { name: /export csv/i });
      expect(exportBtn).toBeDisabled();
    });
  });

  it('Export CSV button is enabled and triggers download when payouts present', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { payouts: [PAYOUT] } });
    render(<PayoutsPage />);
    await waitFor(() => screen.getByText('Ravi Kumar'));

    const exportBtn = screen.getByRole('button', { name: /export csv/i });
    expect(exportBtn).not.toBeDisabled();

    fireEvent.click(exportBtn);
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
