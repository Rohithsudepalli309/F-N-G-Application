-- Add merchant fulfillment fields
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS est_prep_time_min INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;
