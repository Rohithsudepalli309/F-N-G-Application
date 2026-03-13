-- Add KYC support and Secure OTP flow
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS kyc_document_url TEXT,
ADD COLUMN IF NOT EXISTS kyc_license_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;

-- Index for admin dashboard fast lookup
CREATE INDEX IF NOT EXISTS idx_drivers_kyc_status ON drivers(kyc_status);

-- Secure OTP for Order fulfillment
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_otp VARCHAR(6),
ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ;

-- Migration to generate OTPs for active orders (if any)
UPDATE orders 
SET delivery_otp = floor(random() * 9000 + 1000)::text 
WHERE status NOT IN ('delivered', 'cancelled', 'refunded') AND delivery_otp IS NULL;
