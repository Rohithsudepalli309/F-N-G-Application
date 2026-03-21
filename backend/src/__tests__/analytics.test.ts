import request from 'supertest';
import express from 'express';
import analyticsRouter from '../routes/analytics';
import pool from '../db';

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../middleware/auth', () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../db', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const app = express();
app.use(express.json());
app.use('/analytics', analyticsRouter);

describe('Analytics API — SQL Injection Safety (TEST-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject invalid date formats (SQL Injection attempt)', async () => {
    const maliciousDate = "2024-01-01'; DROP TABLE orders;--";
    const response = await request(app)
      .get(`/analytics/stats?startDate=${maliciousDate}&endDate=2024-12-31`);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid startDate format');
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('should accept valid date formats and call pool.query with parameters', async () => {
    (pool.query as jest.Mock).mockResolvedValue({ 
      rows: [{ totalOrders: 10, activeOrders: 5, activeDrivers: 2, dailyRevenue: 1000, chartData: [] }] 
    });

    const response = await request(app)
      .get('/analytics/stats?startDate=2024-01-01&endDate=2024-01-31');

    expect(response.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('$1'),
      expect.arrayContaining(['2024-01-01', '2024-01-31'])
    );
  });

  it('should handle fleet pagination safely', async () => {
     (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

     const response = await request(app)
       .get('/analytics/fleet?limit=10&offset=20');

     expect(response.status).toBe(200);
     expect(pool.query).toHaveBeenCalledWith(
       expect.stringContaining('LIMIT $1 OFFSET $2'),
       [10, 20]
     );
  });
});
