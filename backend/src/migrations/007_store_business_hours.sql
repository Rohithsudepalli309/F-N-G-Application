-- Add business hours JSON storage for merchant profile settings
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb;
