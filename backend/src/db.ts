import { Pool, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
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
  console.error('[DB] Unexpected pool error:', err.message);
});

export default pool;

export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) => pool.query<T>(text, params);
