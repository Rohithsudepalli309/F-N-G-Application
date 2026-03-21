-- Phase 9: Merchant KYC Support
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'not_started' 
  CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS kyc_document_url TEXT,
ADD COLUMN IF NOT EXISTS kyc_tax_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;

-- Index for admin dashboard fast lookup
CREATE INDEX IF NOT EXISTS idx_stores_kyc_status ON stores(kyc_status);

-- Ensure default verified status for existing stores to avoid disruption (optional)
UPDATE stores SET kyc_status = 'verified' WHERE is_verified = TRUE AND kyc_status = 'not_started';
