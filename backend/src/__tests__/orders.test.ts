import request from 'supertest';
import express from 'express';
import pool from '../db';
import ordersRouter from '../routes/orders';
import { errorHandler } from '../middleware/errorHandler';

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../db', () => ({
  __esModule: true,
  default: { query: jest.fn(), connect: jest.fn() },
}));
jest.mock('../server', () => ({
  io: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
}));
jest.mock('../middleware/auth', () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));
jest.mock('../services/fcm', () => ({ sendPushToUser: jest.fn() }));
jest.mock('../services/surge', () => ({
  recordDemand: jest.fn().mockResolvedValue(undefined),
  getSurgeMultiplier: jest.fn().mockResolvedValue(1),
}));
jest.mock('../services/loyaltyEngine', () => ({
  calculateLoyaltyBenefits: jest.fn().mockResolvedValue({ autoDiscount: 0, deliveryFeeOverride: null }),
}));
jest.mock('../services/loyalty', () => ({
  earnPoints: jest.fn().mockResolvedValue(undefined),
  redeemPoints: jest.fn().mockResolvedValue(true),
  getUserPoints: jest.fn().mockResolvedValue(500),
}));
jest.mock('../services/eventBus', () => ({
  publishOrderEvent: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../redis', () => ({
  redis: { geopos: jest.fn(), georadius: jest.fn(), get: jest.fn().mockResolvedValue(null) },
  DRIVER_GEO_KEY: 'driver:geo',
}));
jest.mock('../services/featureFlags', () => ({
  isEnabled: jest.fn().mockResolvedValue(false),
}));

const mockQuery   = pool.query   as jest.Mock;
const mockConnect = pool.connect as jest.Mock;
const mockTxQuery  = jest.fn();
const mockRelease  = jest.fn();
const mockClient   = { query: mockTxQuery, release: mockRelease };

const app = express();
app.use(express.json());
app.use((req: any, _res: any, next: any) => {
  req.user = { id: 1, role: 'customer' };
  next();
});
app.use('/', ordersRouter);
app.use(errorHandler);

describe('Orders API — Stock Management (TEST-002)', () => {
  beforeEach(() => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1, order_number: 'FNG-1', items: [] }] });
    mockConnect.mockReset().mockResolvedValue(mockClient);
    mockTxQuery.mockReset().mockResolvedValue({ rows: [] });
    mockRelease.mockReset();
  });

  it('should decrement stock and commit transaction on successful order', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)   // 1. BEGIN
      .mockResolvedValueOnce({            // 2. products lookup
        rows: [{ id: 1, store_id: 1, name: 'Milk', price: 5000, is_available: true, stock: 10 }],
      })
      .mockResolvedValueOnce({            // 3. UPDATE products stock
        rows: [{ id: 1 }],
      })
      .mockResolvedValueOnce({ rows: [] }) // 4. pro subscription check
      .mockResolvedValueOnce({ rows: [{ name: 'Store' }] }) // 5. store name
      .mockResolvedValueOnce({            // 6. INSERT order
        rows: [{ id: 1, order_number: 'FNG-1', total_amount: 5750, status: 'placed', payment_method: 'cod' }],
      })
      .mockResolvedValueOnce(undefined)   // 7. INSERT order_item
      .mockResolvedValueOnce(undefined);  // 8. COMMIT

    const response = await request(app).post('/').send({
      storeId: 1,
      items: [{ productId: 1, quantity: 2 }],
      deliveryAddress: { label: 'Home', address_line: '1', city: 'B', pincode: '560001' }
    });

    expect(response.status).toBe(201);
    // Verify stock update call
    expect(mockTxQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE products SET stock = stock - $1'),
      [2, 1]
    );
  });

  it('should rollback if stock is insufficient', async () => {
    mockTxQuery
      .mockResolvedValueOnce(undefined)   // 1. BEGIN
      .mockResolvedValueOnce({            // 2. products lookup
        rows: [{ id: 1, store_id: 1, name: 'Milk', price: 5000, is_available: true, stock: 1 }],
      })
      .mockResolvedValueOnce({ rows: [] }); // 3. UPDATE products stock (0 rows returned because stock < quantity)

    const response = await request(app).post('/').send({
      storeId: 1,
      items: [{ productId: 1, quantity: 2 }],
      deliveryAddress: { label: 'Home', address_line: '1', city: 'B', pincode: '560001' }
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('does not have enough stock');
    expect(mockTxQuery).toHaveBeenCalledWith('ROLLBACK');
  });
});
