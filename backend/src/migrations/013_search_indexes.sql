-- Migration 013: Performance indexes and full-text search support
-- Run this migration against your PostgreSQL database.

-- ── Full-text search: GIN index on product names ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_fts
  ON products USING GIN (to_tsvector('english', name));

-- ── Customer order history: most common query pattern ───────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_customer_created
  ON orders (customer_id, created_at DESC);

-- ── Driver active orders: status filter is always applied ───────────────────
CREATE INDEX IF NOT EXISTS idx_orders_driver_status
  ON orders (driver_id, status)
  WHERE status NOT IN ('delivered', 'cancelled', 'refunded');

-- ── OTP lookup: phone + unverified + not expired ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_otp_phone_active
  ON otp_records (phone, verified, expires_at);

-- ── Wallet transactions by wallet ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_created
  ON wallet_transactions (wallet_id, created_at DESC);

-- ── Delivery tracking: prune old rows (add TTL logic in application layer) ───
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order
  ON delivery_tracking (order_id, recorded_at DESC);

-- ── Fraud flag lookup ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_fraud_flag
  ON users ((metadata->>'fraud_flag'))
  WHERE metadata->>'fraud_flag' = 'true';
