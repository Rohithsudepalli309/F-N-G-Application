import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
  const shouldLog = !isTest || err.statusCode >= 500 || process.env.LOG_TEST_ERRORS === 'true';

  if (shouldLog) {
    logger.error('Request failed', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Production response
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err.message,
      message: err.message
    });
  }

  // Programming or other unknown errors: don't leak details
  return res.status(500).json({
    status: 'error',
    error: 'Something went very wrong!',
    message: 'Something went very wrong!'
  });
};
