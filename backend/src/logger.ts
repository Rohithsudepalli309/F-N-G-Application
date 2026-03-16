/**
 * logger.ts — Winston structured JSON logger
 *
 * Dev:  colourised, human-readable single-line output
 * Prod: JSON — one log entry per line; ingestible by Datadog / CloudWatch / Loki
 *
 * Usage:
 *   import { logger } from './logger';
 *   logger.info('Order placed', { orderId, userId, ms: Date.now() - start });
 *   logger.error('DB error', { err: e.message, stack: e.stack });
 */
import { createLogger, format, transports, Logger } from 'winston';

const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

const devFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const extras = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message}${extras}`;
  })
);

const prodFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

export const logger: Logger = createLogger({
  level: process.env.LOG_LEVEL ?? (isTest ? 'error' : isDev ? 'debug' : 'info'),
  defaultMeta: { service: 'fng-backend', version: process.env.npm_package_version ?? '1.0.0' },
  transports: [
    new transports.Console({
      format: isDev ? devFormat : prodFormat,
    }),
  ],
});

// Capture unhandled promise rejections so they appear in structured logs
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});
