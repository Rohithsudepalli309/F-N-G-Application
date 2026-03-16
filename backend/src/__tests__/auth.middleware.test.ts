import { requireAuth, requireRole } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'unit-test-secret';
});

// ─── requireAuth ────────────────────────────────────────────────────────────
describe('requireAuth', () => {
  it('401 when Authorization header is missing', () => {
    const req  = { headers: {} } as Request;
    const res  = mockRes();
    const next = jest.fn() as NextFunction;
    requireAuth(req, res, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('401 when header does not start with Bearer', () => {
    const req  = { headers: { authorization: 'Basic abc123' } } as unknown as Request;
    const res  = mockRes();
    const next = jest.fn() as NextFunction;
    requireAuth(req, res, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('401 when jwt.verify throws', () => {
    const req  = { headers: { authorization: 'Bearer badtoken' } } as unknown as Request;
    const res  = mockRes();
    const next = jest.fn() as NextFunction;
    mockJwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });
    requireAuth(req, res, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('sets req.user and calls next for a valid token', () => {
    const req  = { headers: { authorization: 'Bearer validtoken' } } as unknown as Request;
    const res  = mockRes();
    const next = jest.fn() as NextFunction;
    (mockJwt.verify as jest.Mock).mockReturnValue({ id: 42, role: 'driver', storeId: undefined });
    requireAuth(req as any, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({ id: 42, role: 'driver', storeId: undefined });
  });
});

// ─── requireRole ────────────────────────────────────────────────────────────
describe('requireRole', () => {
  it('403 when user has a different role', () => {
    const req  = { user: { id: 1, role: 'customer' } } as any;
    const res  = mockRes();
    const next = jest.fn() as NextFunction;
    requireRole('admin')(req, res, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('403 when req.user is missing', () => {
    const req  = {} as any;
    const res  = mockRes();
    const next = jest.fn() as NextFunction;
    requireRole('driver')(req, res, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('calls next when single matching role', () => {
    const req  = { user: { id: 1, role: 'driver' } } as any;
    const res  = mockRes();
    const next = jest.fn() as NextFunction;
    requireRole('driver')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls next when role matches one of multiple allowed roles', () => {
    const req  = { user: { id: 1, role: 'admin' } } as any;
    const res  = mockRes();
    const next = jest.fn() as NextFunction;
    requireRole('admin', 'merchant')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
