const bcrypt = require('bcryptjs');
const db = require('../src/config/db');
const { initDb } = require('../src/config/init_db');
const logger = require('../src/config/logger');

const seedAdmin = async () => {
  try {
    // Ensure table exists first
    await initDb();

    const email = 'admin1@gmail.com';
    const password = 'admin';
    const name = 'Admin User';
    const role = 'admin';

    logger.info(`Seeding admin user: ${email}...`);

    // Check if exists
    const check = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      logger.info('Admin user already exists. Updating password...');
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
      logger.info('Admin user seeded successfully.');
    }

    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedAdmin();
