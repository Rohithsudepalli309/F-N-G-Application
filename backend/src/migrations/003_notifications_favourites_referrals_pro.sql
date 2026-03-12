-- F&G Migration 003 — Notifications, Favourites, Referrals, Pro Subscriptions
-- Run AFTER 001_schema.sql and 002_wallet_surge.sql.
-- Safe to re-run (IF NOT EXISTS / IF NOT EXISTS column guards throughout).

-- ─── Notifications inbox ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        VARCHAR(20) NOT NULL DEFAULT 'system'
                CHECK (type IN ('order', 'offer', 'system', 'delivery')),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  data        JSONB,               -- e.g. { "orderId": "42", "screen": "OrderTracking" }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- ─── Favourites (users ↔ stores many-to-many) ───────────────────────────────
CREATE TABLE IF NOT EXISTS favourites (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id    INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, store_id)
);
CREATE INDEX IF NOT EXISTS idx_favourites_user ON favourites(user_id);

-- ─── Referral columns on users ───────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by   INT REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins         INT NOT NULL DEFAULT 0;

-- ─── Referral event log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_events (
  id              SERIAL PRIMARY KEY,
  referrer_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coins_granted   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referee_id)          -- one referral credit per new user
);
CREATE INDEX IF NOT EXISTS idx_referral_referrer ON referral_events(referrer_id);

-- ─── FNG Pro subscriptions ───────────────────────────────────────────────────
-- NOTE (L-8): Subscriptions are never auto-expired. Add a pg_cron job:
--   SELECT cron.schedule('expire-pro-subscriptions', '0 1 * * *',
--     $$UPDATE pro_subscriptions SET status='expired'
--       WHERE status='active' AND expires_at < NOW()$$);
CREATE TABLE IF NOT EXISTS pro_subscriptions (
  id                   SERIAL PRIMARY KEY,
  user_id              INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id              VARCHAR(20) NOT NULL
                         CHECK (plan_id IN ('monthly', 'quarterly', 'annual')),
  status               VARCHAR(20) NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'expired', 'cancelled')),
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  starts_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at           TIMESTAMPTZ NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pro_user ON pro_subscriptions(user_id, expires_at DESC);
