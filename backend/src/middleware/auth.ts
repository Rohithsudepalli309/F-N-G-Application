import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { redis, redisEnabled } from '../redis';

export interface AuthRequest extends Request {
  user?: { id: number; role: string; storeId?: number };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  let token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  // SEC-005: Fallback to reading from httpOnly cookie (for admin dashboard)
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
      const [k, v] = c.trim().split('=');
      if (k && v) acc[k] = v;
      return acc;
    }, {} as Record<string, string>);
    token = cookies['accessToken'] || null;
  }

  if (!token) {
    return next(new AppError('Unauthorized', 401));
  }
  try {
    // SEC-002: Check Redis blacklist — reject tokens invalidated on logout
    if (redisEnabled) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const blocked = await redis.get(`bl:${tokenHash}`).catch(() => null);
      if (blocked) return next(new AppError('Token revoked. Please log in again.', 401));
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number; role: string; storeId?: number };
    req.user = payload;
    next();
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }
}

export function requireRole(...roles: Array<string | string[]>) {
  const roleList = Array.isArray(roles[0]) ? (roles[0] as string[]) : (roles as string[]);
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roleList.includes(req.user.role)) {
      return next(new AppError(`Access denied. ${roleList.join('/')} required.`, 403));
    }
    next();
  };
}
