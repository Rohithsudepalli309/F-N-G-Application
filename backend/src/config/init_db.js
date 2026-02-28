const db = require('./db');
const logger = require('./logger');

const initDb = async () => {
  try {
    logger.info('Initializing database schema...');

    // 1. Users
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE,
        email VARCHAR(255) UNIQUE,
        password_hash TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'merchant', 'driver', 'admin')),
        name VARCHAR(100),
        fcm_token TEXT,
        fng_coins INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        is_online BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Addresses (spec §7.1)
    await db.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        label VARCHAR(30) DEFAULT 'Home',
        line1 TEXT NOT NULL,
        line2 TEXT,
        city VARCHAR(60) DEFAULT 'Hyderabad',
        pincode VARCHAR(10),
        lat DECIMAL(10,7),
        lng DECIMAL(10,7),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. OTPs
    await db.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Stores (restaurants)
    await db.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50),
        store_type VARCHAR(20) NOT NULL DEFAULT 'grocery' CHECK (store_type IN ('food', 'grocery')),
        region VARCHAR(50),
        rating DECIMAL(2,1) DEFAULT 0.0,
        distance DECIMAL(4,2),
        image_url TEXT,
        lat DECIMAL(10,7),
        lng DECIMAL(10,7),
        is_active BOOLEAN DEFAULT TRUE,
        cuisine_tags TEXT[],
        delivery_time_min INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Products
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        store_id VARCHAR(50) REFERENCES stores(id),
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        original_price INTEGER,
        unit VARCHAR(30),
        category VARCHAR(100),
        brand VARCHAR(100),
        image_url TEXT,
        stock INTEGER DEFAULT 100,
        is_available BOOLEAN DEFAULT TRUE,
        is_veg BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. Grocery categories
    await db.query(`
      CREATE TABLE IF NOT EXISTS grocery_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        image_url TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    // 7. Grocery products
    await db.query(`
      CREATE TABLE IF NOT EXISTS grocery_products (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES grocery_categories(id),
        name VARCHAR(150) NOT NULL,
        brand VARCHAR(100),
        unit VARCHAR(30),
        price INTEGER NOT NULL,
        mrp INTEGER NOT NULL,
        image_url TEXT,
        barcode VARCHAR(50),
        stock_quantity INTEGER DEFAULT 50,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 8. Coupons (spec §7.1)
    await db.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(30) UNIQUE NOT NULL,
        description TEXT,
        discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('flat', 'percent')),
        discount_value INTEGER NOT NULL,
        min_order_amount INTEGER DEFAULT 0,
        max_discount INTEGER,
        max_uses INTEGER DEFAULT 1000,
        used_count INTEGER DEFAULT 0,
        valid_from TIMESTAMP DEFAULT NOW(),
        valid_until TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 9. Orders (spec §7.1 — with status state machine)
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id),
        store_id VARCHAR(50) REFERENCES stores(id),
        status VARCHAR(30) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending','placed','preparing','ready','pickup','out_for_delivery','delivered','cancelled')),
        payment_status VARCHAR(20) DEFAULT 'pending'
          CHECK (payment_status IN ('pending','paid','failed','refunded')),
        payment_method VARCHAR(20) DEFAULT 'upi',
        total_amount INTEGER NOT NULL,
        delivery_fee INTEGER DEFAULT 0,
        gst_amount INTEGER DEFAULT 0,
        platform_fee INTEGER DEFAULT 500,
        coupon_code VARCHAR(30),
        coupon_discount INTEGER DEFAULT 0,
        address TEXT,
        address_lat DECIMAL(10,7),
        address_lng DECIMAL(10,7),
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        otp VARCHAR(6),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 10. Order items
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(50) REFERENCES products(id),
        name VARCHAR(150) NOT NULL,
        price INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        total_price INTEGER GENERATED ALWAYS AS (price * quantity) STORED
      );
    `);

    // 11. Order assignments (driver)
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_assignments (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id),
        agent_id INTEGER REFERENCES users(id),
        agent_lat DECIMAL(10,7),
        agent_lng DECIMAL(10,7),
        last_ping TIMESTAMP DEFAULT NOW(),
        assigned_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 12. Agent locations
    await db.query(`
      CREATE TABLE IF NOT EXISTS agent_locations (
        user_id INTEGER PRIMARY KEY REFERENCES users(id),
        lat DECIMAL(10,7),
        lng DECIMAL(10,7),
        is_available BOOLEAN DEFAULT FALSE,
        current_order_id VARCHAR(50),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 13. Reviews
    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id),
        user_id INTEGER REFERENCES users(id),
        store_id VARCHAR(50) REFERENCES stores(id),
        rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
        food_rating SMALLINT CHECK (food_rating BETWEEN 1 AND 5),
        delivery_rating SMALLINT CHECK (delivery_rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 14. Deliveries (delivery lifecycle — driver assignments)
    await db.query(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
        driver_id INTEGER REFERENCES users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'assigned'
          CHECK (status IN ('assigned','picked_up','delivered','cancelled')),
        pickup_time TIMESTAMP,
        delivery_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 15. Notifications
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(150),
        body TEXT,
        type VARCHAR(30) DEFAULT 'general',
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    logger.info('Database schema initialized successfully (v2 — full spec).');
  } catch (err) {
    logger.error('Database initialization failed:', err);
    throw err;
  }
};

module.exports = { initDb };
