import { Pool, QueryResultRow } from 'pg';
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 25,                   // CLEAN-004: increased from 20 for higher concurrency
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.DATABASE_SSL === 'true'
    ? {
        // MED-5: always verify the server certificate to prevent MITM attacks.
        // DATABASE_SSL_CA may contain literal \n sequences (common when storing
        // multiline PEM in a single-line env var) — replace them before use.
        rejectUnauthorized: true,
        ...(process.env.DATABASE_SSL_CA
          ? { ca: process.env.DATABASE_SSL_CA.replace(/\\n/g, '\n') }
          : {}),
      }
    : false,
});

pool.on('error', (err) => {
  logger.error('[DB] Unexpected pool error', { message: err.message });
});

export default pool;

export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) => pool.query<T>(text, params);
