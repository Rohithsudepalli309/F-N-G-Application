import request from 'supertest';
import express from 'express';

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../db', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock('../middleware/auth', () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));
jest.mock('bcryptjs', () => ({ compare: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn().mockReturnValue('mock.jwt.token') }));
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn().mockReturnValue({ toString: () => 'mock_refresh_token_hex' }),
}));

import pool from '../db';
import authRouter from '../routes/auth';
import bcrypt from 'bcryptjs';

const mockQuery   = pool.query as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;

const app = express();
app.use(express.json());
// Inject fake authenticated user for routes requiring auth
app.use((req: any, _res: any, next: any) => {
  req.user = { id: 1, role: 'customer' };
  next();
});
app.use('/', authRouter);

function resetMocks() {
  mockQuery.mockReset().mockResolvedValue({ rows: [] });
  mockCompare.mockReset().mockResolvedValue(false);
}

// ─── POST /otp ────────────────────────────────────────────────────────────────
describe('POST /otp', () => {
  beforeEach(resetMocks);

  it('returns 400 when phone is missing', async () => {
    const res = await request(app).post('/otp').send({ role: 'customer' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/phone/i);
  });

  it('returns 400 when phone is not 10 digits', async () => {
    const res = await request(app).post('/otp').send({ phone: '12345' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/10-digit/i);
  });

  it('returns 400 when phone contains non-digits', async () => {
    const res = await request(app).post('/otp').send({ phone: '98765abcde' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/10-digit/i);
  });

  it('returns 400 for invalid role', async () => {
    const res = await request(app).post('/otp').send({ phone: '9876543210', role: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid role/i);
  });

  it('returns 200 and OTP in dev mode for valid customer phone', async () => {
    // DELETE previous OTPs + INSERT new
    mockQuery
      .mockResolvedValueOnce({ rows: [] })   // DELETE old OTPs
      .mockResolvedValueOnce({ rows: [] });  // INSERT new OTP

    const res = await request(app).post('/otp').send({ phone: '9876543210', role: 'customer' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sent/i);
    // Dev mode returns OTP in response (NODE_ENV=test, not production)
    expect(res.body.otp).toBeDefined();
    expect(/^\d{6}$/.test(res.body.otp)).toBe(true);
  });

  it('returns 200 for valid driver phone', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/otp').send({ phone: '9876543210', role: 'driver' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('OTP sent');
  });

  it('calls pool.query to delete old OTPs and insert new one', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await request(app).post('/otp').send({ phone: '9876543210' });
    expect(mockQuery).toHaveBeenCalledTimes(2);
    // First call deletes old OTPs for that phone
    expect(mockQuery.mock.calls[0][0]).toContain('DELETE FROM otp_records');
    expect(mockQuery.mock.calls[0][1]).toContain('9876543210');
  });
});

// ─── POST /otp/verify ─────────────────────────────────────────────────────────
describe('POST /otp/verify', () => {
  beforeEach(resetMocks);

  it('returns 400 when phone is missing', async () => {
    const res = await request(app).post('/otp/verify').send({ otp: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/phone/i);
  });

  it('returns 400 when otp is missing', async () => {
    const res = await request(app).post('/otp/verify').send({ phone: '9876543210' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/otp/i);
  });

  it('returns 400 when OTP is invalid or expired', async () => {
    // otp_records query returns empty
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/otp/verify').send({ phone: '9876543210', otp: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('returns 200 with JWT for existing user', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1, phone: '9876543210', otp: '123456', verified: false }] }) // otp valid
      .mockResolvedValueOnce({ rows: [] })               // UPDATE verified
      .mockResolvedValueOnce({ rows: [{ id: 1, phone: '9876543210', role: 'customer', name: 'Alice' }] }) // existing user
      .mockResolvedValueOnce({ rows: [] });              // INSERT refresh_token

    const res = await request(app).post('/otp/verify').send({ phone: '9876543210', otp: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('mock.jwt.token');
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.phone).toBe('9876543210');
  });

  it('creates a new user when phone is not found', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 5, phone: '1111111111', otp: '654321' }] }) // otp valid
      .mockResolvedValueOnce({ rows: [] })               // UPDATE verified
      .mockResolvedValueOnce({ rows: [] })               // existing user NOT found
      .mockResolvedValueOnce({ rows: [{ id: 7, phone: '1111111111', role: 'customer', name: null }] }) // INSERT user
      .mockResolvedValueOnce({ rows: [] });              // INSERT refresh_token

    const res = await request(app).post('/otp/verify').send({ phone: '1111111111', otp: '654321' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.phone).toBe('1111111111');
  });

  it('includes storeId in JWT for merchant user', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 2, phone: '9999999999', otp: '111111' }] }) // otp valid
      .mockResolvedValueOnce({ rows: [] })               // UPDATE verified
      .mockResolvedValueOnce({ rows: [{ id: 2, phone: '9999999999', role: 'merchant', name: 'Bob' }] }) // existing merchant
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })    // store lookup
      .mockResolvedValueOnce({ rows: [] });              // INSERT refresh_token

    const res = await request(app).post('/otp/verify').send({ phone: '9999999999', otp: '111111' });
    expect(res.status).toBe(200);
    // jwt.sign should have been called with storeId=10
    const jwt = require('jsonwebtoken');
    const signCallArgs = jwt.sign.mock.calls[jwt.sign.mock.calls.length - 1];
    expect(signCallArgs[0]).toMatchObject({ storeId: 10 });
  });
});

// ─── POST /login ──────────────────────────────────────────────────────────────
describe('POST /login', () => {
  beforeEach(resetMocks);

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/login').send({ password: 'secret' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('returns 401 when user not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/login').send({ email: 'no@one.com', password: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('returns 403 when account is disabled', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@b.com', is_active: false, role: 'admin', password: 'hash' }] });
    const res = await request(app).post('/login').send({ email: 'a@b.com', password: 'secret' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/disabled/i);
  });

  it('returns 401 when password does not match', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@b.com', is_active: true, role: 'admin', password: 'hash' }] });
    mockCompare.mockResolvedValueOnce(false);
    const res = await request(app).post('/login').send({ email: 'a@b.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('returns 200 with JWT for valid admin credentials', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1, email: 'admin@fng.com', is_active: true, role: 'admin', name: 'Admin', password: 'hash' }] })
      .mockResolvedValueOnce({ rows: [] }); // INSERT refresh_token
    mockCompare.mockResolvedValueOnce(true);

    const res = await request(app).post('/login').send({ email: 'admin@fng.com', password: 'correct' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('mock.jwt.token');
    expect(res.body.user.role).toBe('admin');
  });

  it('includes storeId for merchant login', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 5, email: 'm@fng.com', is_active: true, role: 'merchant', name: 'Merchant', password: 'hash' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })  // store lookup
      .mockResolvedValueOnce({ rows: [] });            // INSERT refresh_token
    mockCompare.mockResolvedValueOnce(true);

    const res = await request(app).post('/login').send({ email: 'm@fng.com', password: 'correct' });
    expect(res.status).toBe(200);
    expect(res.body.user.storeId).toBe(3);
  });
});

// ─── POST /refresh ────────────────────────────────────────────────────────────
describe('POST /refresh', () => {
  beforeEach(resetMocks);

  it('returns 400 when refreshToken is missing', async () => {
    const res = await request(app).post('/refresh').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/refreshToken/i);
  });

  it('returns 401 when refresh token is invalid or expired', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/refresh').send({ refreshToken: 'stale_token' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('returns 200 with new tokens when refresh token is valid', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1, role: 'customer' }] }) // valid RT
      .mockResolvedValueOnce({ rows: [] })   // DELETE old RT
      .mockResolvedValueOnce({ rows: [] });  // INSERT new RT

    const res = await request(app).post('/refresh').send({ refreshToken: 'valid_token' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('mock.jwt.token');
    expect(res.body.refreshToken).toBeDefined();
  });
});

// ─── POST /logout ─────────────────────────────────────────────────────────────
describe('POST /logout', () => {
  beforeEach(resetMocks);

  it('returns 200 and deletes the refresh token', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/logout').send({ refreshToken: 'some_token' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM refresh_tokens'),
      expect.any(Array)
    );
  });

  it('returns 200 even without a refresh token body', async () => {
    const res = await request(app).post('/logout').send({});
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

// ─── GET /me ─────────────────────────────────────────────────────────────────
describe('GET /me', () => {
  beforeEach(resetMocks);

  it('returns user profile', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, phone: '9876543210', email: null, name: 'Alice', role: 'customer' }] });
    const res = await request(app).get('/me');
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(1);
    expect(res.body.user.role).toBe('customer');
  });

  it('returns null user when not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/me');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });
});
