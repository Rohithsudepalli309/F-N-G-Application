const db = require('./src/config/db');
async function migrate() {
  try {
    console.log('Starting migration...');
    // 1. Add address column if it doesn't exist
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`);
    // 2. Make password_hash nullable
    await db.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`);
    console.log('Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}
migrate();
