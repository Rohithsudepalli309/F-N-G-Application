-- Migration 005: Extend addresses table with line2 and landmark fields
-- Run: psql $DATABASE_URL -f src/migrations/005_addresses_v2.sql

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS line2    TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS landmark TEXT;
