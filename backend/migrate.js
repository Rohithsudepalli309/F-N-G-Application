/**
 * migrate.js — F&G Backend migration runner
 *
 * Runs every SQL file in src/migrations/ in filename order,
 * tracking which have already been applied in a `_migrations` bookkeeping table.
 *
 * Usage:
 *   node migrate.js              — apply all pending migrations
 *   node migrate.js --status     — list applied / pending without changing anything
 */

'use strict';

require('dotenv').config();
const { Pool } = require('pg');
const fs       = require('fs');
const path     = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'src', 'migrations');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureBookkeepingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL PRIMARY KEY,
      filename   TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getApplied(client) {
  const res = await client.query(`SELECT filename FROM _migrations ORDER BY id`);
  return new Set(res.rows.map(r => r.filename));
}

function getSqlFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

async function run() {
  const showStatus = process.argv.includes('--status');
  const client = await pool.connect();
  try {
    await ensureBookkeepingTable(client);
    const applied = await getApplied(client);
    const files   = getSqlFiles();

    const pending = files.filter(f => !applied.has(f));

    if (showStatus) {
      console.log('\n── Migration Status ────────────────────────');
      for (const f of files) {
        console.log(`  ${applied.has(f) ? '✓ applied ' : '○ pending '} ${f}`);
      }
      console.log(`\n${applied.size} applied, ${pending.length} pending.\n`);
      return;
    }

    if (pending.length === 0) {
      console.log('All migrations already applied — nothing to do.');
      return;
    }

    for (const filename of pending) {
      const filepath = path.join(MIGRATIONS_DIR, filename);
      const sql = fs.readFileSync(filepath, 'utf8');

      console.log(`→ Applying ${filename} …`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING`,
          [filename]
        );
        await client.query('COMMIT');
        console.log(`  ✓ ${filename} applied`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ✗ ${filename} FAILED:`, err.message);
        process.exit(1);
      }
    }

    console.log(`\n${pending.length} migration(s) applied successfully.`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('[migrate] Unexpected error:', err.message);
  process.exit(1);
});
