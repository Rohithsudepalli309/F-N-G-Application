-- 006_security_hardening.sql
-- Security hardening: OTP attempt tracking + hashed refresh tokens

-- HIGH-4: Track failed OTP attempts to enable per-phone lockout after 5 tries
ALTER TABLE otp_records
  ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0;

-- MED-2: Refresh tokens are now stored as SHA-256 hashes.
-- Existing plaintext tokens will no longer match — all active sessions are
-- invalidated on this migration, which is the safe fallback.
-- (No schema change needed; token column is already VARCHAR/TEXT.)
