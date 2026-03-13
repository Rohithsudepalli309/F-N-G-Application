-- 012_waitlist.sql
-- Waitlist table for pre-launch interest capture

CREATE TABLE IF NOT EXISTS waitlist (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(150) UNIQUE NOT NULL,
  phone      VARCHAR(15) UNIQUE NOT NULL,
  city       VARCHAR(100) NOT NULL,
  pincode    VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_city ON waitlist(city);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at DESC);
