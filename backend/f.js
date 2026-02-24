const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const db = {
  query: (text, params) => pool.query(text, params),
};

const initDb = async () => {
    console.log('Initializing database schema...');
    // 1. Create Users Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE,
        email VARCHAR(255) UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'merchant', 'driver', 'admin')),
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Users table checked/created.');
};

const seedAdmin = async () => {
  try {
    await initDb();

    const email = 'admin1@gmail.com';
    const password = 'admin';
    const name = 'Admin User';
    const role = 'admin';

    console.log(`Seeding admin user: ${email}...`);

    const check = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      console.log('Admin user already exists. Updating password...');
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [hashedPassword, email]
      );
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4)',
        [email, hashedPassword, role, name]
      );
      console.log('Admin user seeded successfully.');
    }

    console.log('✅ Fat Seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedAdmin();
