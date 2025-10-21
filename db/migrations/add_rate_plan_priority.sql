-- Add priority column to rate_plans for overlap resolution
ALTER TABLE rate_plans
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 100;

-- Helpful index when sorting/selecting best plans
CREATE INDEX IF NOT EXISTS idx_rate_plans_priority
ON rate_plans(org_id, product_variant_id, valid_from, valid_to, priority DESC);



