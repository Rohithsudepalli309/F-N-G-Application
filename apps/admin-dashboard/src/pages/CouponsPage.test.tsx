import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CouponsPage } from './CouponsPage';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import api from '../services/api';
const mockApiGet    = api.get    as ReturnType<typeof vi.fn>;
const mockApiPost   = api.post   as ReturnType<typeof vi.fn>;
const mockApiDelete = api.delete as ReturnType<typeof vi.fn>;

const COUPON = {
  id: 1,
  code: 'SAVE10',
  description: '10% off',
  discount_type: 'percent',
  discount_value: 10,
  min_order_amount: 20000,
  max_discount: null,
  max_uses: 100,
  used_count: 5,
  valid_until: null,
  is_active: true,
};

describe('CouponsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Coupons & Offers" heading', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { coupons: [] } });
    render(<CouponsPage />);
    await waitFor(() => expect(screen.getByText(/Coupons & Offers/i)).toBeInTheDocument());
  });

  it('calls /coupons on mount', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { coupons: [] } });
    render(<CouponsPage />);
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith('/coupons'));
  });

  it('displays coupon rows after loading', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { coupons: [COUPON] } });
    render(<CouponsPage />);
    await waitFor(() => expect(screen.getByText('SAVE10')).toBeInTheDocument());
  });

  it('"New Coupon" button opens form modal', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { coupons: [] } });
    render(<CouponsPage />);
    await waitFor(() => screen.getByRole('button', { name: /new coupon/i }));

    fireEvent.click(screen.getByRole('button', { name: /new coupon/i }));
    expect(screen.getByPlaceholderText('FLAT100')).toBeInTheDocument();
  });

  it('does NOT call api.post when form is empty (validation)', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { coupons: [] } });
    render(<CouponsPage />);
    await waitFor(() => screen.getByRole('button', { name: /new coupon/i }));

    fireEvent.click(screen.getByRole('button', { name: /new coupon/i }));
    // Submit without filling in required fields
    const createBtn = screen.getByRole('button', { name: /^create$/i });
    fireEvent.click(createBtn);
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('calls api.post when form is valid', async () => {
    mockApiGet.mockResolvedValue({ data: { coupons: [] } });
    mockApiPost.mockResolvedValueOnce({});
    render(<CouponsPage />);
    await waitFor(() => screen.getByRole('button', { name: /new coupon/i }));

    fireEvent.click(screen.getByRole('button', { name: /new coupon/i }));
    fireEvent.change(screen.getByPlaceholderText('FLAT100'), { target: { value: 'FLAT50' } });
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '50' } });

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith('/admin/coupons', expect.any(Object)));
  });

  it('calls api.delete when Deactivate button is clicked', async () => {
    mockApiGet.mockResolvedValue({ data: { coupons: [COUPON] } });
    mockApiDelete.mockResolvedValueOnce({});
    render(<CouponsPage />);
    await waitFor(() => screen.getByText('SAVE10'));

    // the deactivate / delete button
    const deactivateBtn = screen.getByRole('button', { name: /deactivate|delete/i });
    fireEvent.click(deactivateBtn);
    await waitFor(() => expect(mockApiDelete).toHaveBeenCalledWith('/admin/coupons/1'));
  });
});
