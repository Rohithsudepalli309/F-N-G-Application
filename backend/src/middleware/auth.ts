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
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401));
  }
  const token = header.slice(7);
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
