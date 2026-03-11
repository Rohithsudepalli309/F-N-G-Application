-- F&G Migration 002 — Wallet + Surge tables
-- Run AFTER 001_schema.sql on existing databases.
-- Safe to run multiple times (IF NOT EXISTS / DO NOTHING guards).

-- ─── Wallet ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id          SERIAL PRIMARY KEY,
  user_id     INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance     INT NOT NULL DEFAULT 0,         -- paise
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_wallets BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ─── Wallet Transactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            SERIAL PRIMARY KEY,
  wallet_id     INT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount        INT NOT NULL,  -- paise; positive = credit, negative = debit
  type          VARCHAR(20) NOT NULL CHECK (type IN ('credit','debit','refund','cashback')),
  reference_id  TEXT,          -- order_id or external payment ID
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id, created_at DESC);

-- ─── Surge Log ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surge_log (
  id            SERIAL PRIMARY KEY,
  store_id      INT REFERENCES stores(id) ON DELETE CASCADE,
  multiplier    DECIMAL(4,2) NOT NULL,
  demand_count  INT NOT NULL,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_surge_store ON surge_log(store_id, recorded_at DESC);

-- ─── Driver Assignments (30-second accept timer) ─────────────────────────────
CREATE TABLE IF NOT EXISTS driver_assignments (
  id          SERIAL PRIMARY KEY,
  order_id    INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id   INT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','rejected','expired')),
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE (order_id, driver_id)
);
CREATE INDEX IF NOT EXISTS idx_assignments_order ON driver_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_assignments_driver ON driver_assignments(driver_id, status);
