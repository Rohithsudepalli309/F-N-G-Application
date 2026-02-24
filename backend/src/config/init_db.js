const db = require('./db');
const logger = require('./logger');

const initDb = async () => {
  try {
    logger.info('Initializing database schema...');

    // 1. Create Users Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE,
        email VARCHAR(255) UNIQUE,
        password_hash TEXT, -- Nullable for OTP users
        role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'merchant', 'driver', 'admin')),
        name VARCHAR(100) NOT NULL,
        address TEXT, -- New: for Zepto flow
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Create Stores Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        store_type VARCHAR(20) NOT NULL CHECK (store_type IN ('food', 'grocery')),
        region VARCHAR(50),
        rating DECIMAL(2,1) DEFAULT 0.0,
        distance DECIMAL(4,2),
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Create Products Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        store_id VARCHAR(50) REFERENCES stores(id),
        name VARCHAR(100) NOT NULL,
        price INTEGER NOT NULL, -- Price in Paisa
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    logger.info('Database schema initialized successfully.');
  } catch (err) {
    logger.error('Database initialization failed:', err);
    // Don't exit process here, let app handle it if critical
    throw err;
  }
};

module.exports = { initDb };
