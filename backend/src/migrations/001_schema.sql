-- F&G Application Database Schema
-- Run: psql $DATABASE_URL -f src/migrations/001_schema.sql

-- ─── Extensions ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  phone       VARCHAR(15) UNIQUE,
  email       VARCHAR(150) UNIQUE,
  name        VARCHAR(150),
  password    TEXT,                       -- bcrypt hash (admin/merchant only)
  role        VARCHAR(20) NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'merchant', 'driver', 'admin')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  fcm_token   TEXT,                       -- push notifications
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── OTP Records ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_records (
  id          SERIAL PRIMARY KEY,
  phone       VARCHAR(15) NOT NULL,
  otp         VARCHAR(6)  NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_records(phone);

-- ─── Refresh Tokens ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Stores ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id                  SERIAL PRIMARY KEY,
  owner_id            INT REFERENCES users(id) ON DELETE SET NULL,
  name                VARCHAR(200) NOT NULL,
  description         TEXT,
  store_type          VARCHAR(50) NOT NULL DEFAULT 'restaurant'
                        CHECK (store_type IN ('restaurant', 'grocery', 'fashion', 'tools', 'household')),
  cuisine_tags        TEXT[],              -- e.g. ['Indian','Chinese']
  image_url           TEXT,
  banner_url          TEXT,
  owner_name          VARCHAR(150),
  phone               VARCHAR(15),
  email               VARCHAR(150),
  address             TEXT,
  lat                 DECIMAL(10,8),
  lng                 DECIMAL(11,8),
  delivery_time_min   INT DEFAULT 30,      -- estimated delivery in minutes
  min_order_amount    INT DEFAULT 0,       -- in paise
  rating              DECIMAL(3,2) DEFAULT 5.00,
  total_ratings       INT DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);

-- ─── Products ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              SERIAL PRIMARY KEY,
  store_id        INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  price           INT NOT NULL,            -- in paise
  original_price  INT,                     -- MRP in paise
  category        VARCHAR(100),
  brand           VARCHAR(100),
  image_url       TEXT,
  stock           INT NOT NULL DEFAULT 0,
  unit            VARCHAR(30),             -- '500g', '1L', 'piece'
  is_veg          BOOLEAN NOT NULL DEFAULT TRUE,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(store_id, is_available);

-- ─── Addresses ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label         VARCHAR(50) NOT NULL DEFAULT 'Home',  -- Home/Work/Other
  address_line  TEXT NOT NULL,
  city          VARCHAR(100),
  pincode       VARCHAR(10),
  lat           DECIMAL(10,8),
  lng           DECIMAL(11,8),
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- ─── Coupons ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id                SERIAL PRIMARY KEY,
  code              VARCHAR(50) UNIQUE NOT NULL,
  description       TEXT,
  discount_type     VARCHAR(10) NOT NULL CHECK (discount_type IN ('flat', 'percent')),
  discount_value    INT NOT NULL,           -- flat: paise; percent: 0-100
  min_order_amount  INT NOT NULL DEFAULT 0, -- paise
  max_discount      INT,                    -- paise cap for percent; NULL = no cap
  max_uses          INT NOT NULL DEFAULT 1000,
  used_count        INT NOT NULL DEFAULT 0,
  valid_until       TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Drivers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id              SERIAL PRIMARY KEY,
  user_id         INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(150) NOT NULL,
  phone           VARCHAR(15) NOT NULL UNIQUE,
  vehicle_type    VARCHAR(30) DEFAULT 'bike',
  vehicle_number  VARCHAR(20),
  license_no      VARCHAR(50),
  is_available    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  current_lat     DECIMAL(10,8),
  current_lng     DECIMAL(11,8),
  last_seen_at    TIMESTAMPTZ,
  rating          DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  total_ratings   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_available, is_active);

-- ─── Orders ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                    SERIAL PRIMARY KEY,
  order_number          VARCHAR(20) UNIQUE NOT NULL,
  customer_id           INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  store_id              INT REFERENCES stores(id) ON DELETE SET NULL,
  store_name            VARCHAR(200),
  driver_id             INT REFERENCES drivers(id) ON DELETE SET NULL,

  -- Amounts (paise)
  subtotal              INT NOT NULL DEFAULT 0,
  delivery_fee          INT NOT NULL DEFAULT 0,
  handling_fee          INT NOT NULL DEFAULT 0,
  discount_amount       INT NOT NULL DEFAULT 0,
  total_amount          INT NOT NULL,

  -- Coupon
  coupon_id             INT REFERENCES coupons(id) ON DELETE SET NULL,
  coupon_code           VARCHAR(50),

  -- Delivery
  delivery_address      JSONB NOT NULL,   -- snapshot at order time
  estimated_minutes     INT,

  -- Status
  status                VARCHAR(30) NOT NULL DEFAULT 'placed'
                          CHECK (status IN ('placed','confirmed','preparing','ready',
                                            'pickup','out_for_delivery','delivered',
                                            'cancelled','refunded')),
  -- Payment
  payment_method        VARCHAR(20) NOT NULL DEFAULT 'cod'
                          CHECK (payment_method IN ('cod','online','wallet')),
  payment_status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (payment_status IN ('pending','paid','failed','refunded')),
  razorpay_order_id     TEXT,
  razorpay_payment_id   TEXT,

  -- Review
  rating                INT CHECK (rating BETWEEN 1 AND 5),
  review                TEXT,

  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at          TIMESTAMPTZ,
  preparing_at          TIMESTAMPTZ,
  ready_at              TIMESTAMPTZ,
  picked_at             TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,

  instructions          TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ─── Order Items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INT REFERENCES products(id) ON DELETE SET NULL,
  name        VARCHAR(200) NOT NULL,        -- snapshot
  image_url   TEXT,
  price       INT NOT NULL,                 -- per unit at time of order (paise)
  quantity    INT NOT NULL DEFAULT 1,
  total       INT NOT NULL                  -- price * quantity
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ─── Delivery Tracking ───────────────────────────────────────────────────────
-- NOTE (L-9): delivery_tracking grows unbounded. Add a pg_cron cleanup job:
--   SELECT cron.schedule('cleanup-delivery-tracking', '0 3 * * *',
--     $$DELETE FROM delivery_tracking WHERE recorded_at < NOW() - INTERVAL '90 days'$$);
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id          SERIAL PRIMARY KEY,
  order_id    INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id   INT REFERENCES drivers(id) ON DELETE SET NULL,
  lat         DECIMAL(10,8) NOT NULL,
  lng         DECIMAL(11,8) NOT NULL,
  bearing     DECIMAL(5,2) DEFAULT 0,
  status      VARCHAR(30),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tracking_order ON delivery_tracking(order_id, recorded_at DESC);

-- ─── Helper: update updated_at automatically ─────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_stores BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_products BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_drivers BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ─── Seed: admin user (email: admin@fng.app / password: Admin@123) ─────────
INSERT INTO users (email, name, password, role) VALUES
  ('admin@fng.app', 'F&G Admin',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8XsK5J3H4LfS1bXQDri', 'admin')
ON CONFLICT (email) DO NOTHING;
