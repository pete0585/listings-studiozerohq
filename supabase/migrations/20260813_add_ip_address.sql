-- Add ip_address column to listing_generations for per-IP rate limiting
-- This column stores the anonymized IP of anonymous (non-authenticated) users only.
-- For authenticated users it is always NULL.
ALTER TABLE listing_generations
  ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Index for fast per-IP lookups
CREATE INDEX IF NOT EXISTS idx_listing_generations_ip_address
  ON listing_generations (ip_address, created_at)
  WHERE ip_address IS NOT NULL AND user_id IS NULL;
