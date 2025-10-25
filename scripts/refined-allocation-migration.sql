-- Refined Allocation Model: Simple BUT Traceable
-- This migration implements contract types and allocation types for optimal complexity
-- Version: 3.0 (Refined)

BEGIN;

-- ============================================================================
-- STEP 1: Update contract_type constraint to support new types
-- ============================================================================

-- Drop existing constraint first
ALTER TABLE contracts 
DROP CONSTRAINT IF EXISTS contracts_contract_type_check;

-- Add purchase-specific fields for simple contracts
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS purchase_order_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS total_cost NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS documents JSONB;

-- Add new check constraint that includes both old and new values
ALTER TABLE contracts 
ADD CONSTRAINT contracts_contract_type_check 
CHECK (contract_type IN (
  'net_rate',           -- Existing values
  'commissionable',     -- Existing values  
  'allocation',         -- Existing values
  'on_request',         -- Existing values
  'purchase'            -- New value for simple purchases
));

-- ============================================================================
-- STEP 2: Update allocation_type to support new types
-- ============================================================================

-- Add batch-specific fields for simple allocations
ALTER TABLE contract_allocations 
ADD COLUMN IF NOT EXISTS batch_quantity INTEGER,
ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS total_cost NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS batch_code VARCHAR(255);

-- Handle allocation_type constraint - find the actual ENUM type name
DO $$ 
DECLARE
  enum_type_name TEXT;
BEGIN
  -- Find the actual ENUM type name for allocation_type
  SELECT t.typname INTO enum_type_name
  FROM pg_type t 
  JOIN pg_enum e ON t.oid = e.enumtypid 
  WHERE e.enumlabel IN ('allotment', 'free_sell', 'on_request')
  LIMIT 1;
  
  IF enum_type_name IS NOT NULL THEN
    -- It's an ENUM, add new values if they don't exist
    BEGIN
      EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', enum_type_name, 'batch');
    EXCEPTION WHEN duplicate_object THEN 
      NULL;
    END;
    
    BEGIN
      EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', enum_type_name, 'hotel');
    EXCEPTION WHEN duplicate_object THEN 
      NULL;
    END;
  ELSE
    -- Try to find any ENUM type that might be used for allocation_type
    BEGIN
      -- Try common ENUM type names
      ALTER TYPE allocation_type ADD VALUE IF NOT EXISTS 'batch';
      ALTER TYPE allocation_type ADD VALUE IF NOT EXISTS 'hotel';
    EXCEPTION WHEN undefined_object THEN
      -- It's a VARCHAR, add check constraint
      ALTER TABLE contract_allocations 
      DROP CONSTRAINT IF EXISTS contract_allocations_allocation_type_check;

      ALTER TABLE contract_allocations 
      ADD CONSTRAINT contract_allocations_allocation_type_check 
      CHECK (allocation_type IN ('allotment', 'free_sell', 'on_request', 'batch', 'hotel'));
    END;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Update allocation_inventory for batch tracking
-- ============================================================================

-- Add batch-specific fields to allocation_inventory
ALTER TABLE allocation_inventory 
ADD COLUMN IF NOT EXISTS batch_cost_per_unit NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS sold_quantity INTEGER DEFAULT 0;

-- Add trigger to calculate sold_quantity
CREATE OR REPLACE FUNCTION calculate_sold_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- For batch type allocations, sold_quantity = total_quantity - available_quantity
  IF EXISTS (
    SELECT 1 FROM contract_allocations ca 
    WHERE ca.id = NEW.contract_allocation_id 
    AND ca.allocation_type = 'batch'
  ) THEN
    NEW.sold_quantity := NEW.total_quantity - NEW.available_quantity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_sold_quantity ON allocation_inventory;

CREATE TRIGGER trigger_calculate_sold_quantity
  BEFORE INSERT OR UPDATE ON allocation_inventory
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sold_quantity();

-- ============================================================================
-- STEP 4: Create helper functions for batch management
-- ============================================================================

-- Function to get available batches for a product option (FIFO order)
CREATE OR REPLACE FUNCTION get_available_batches(
  product_option_uuid UUID,
  org_id UUID
)
RETURNS TABLE (
  inventory_id UUID,
  allocation_id UUID,
  batch_name VARCHAR,
  batch_code VARCHAR,
  available_quantity INTEGER,
  cost_per_unit NUMERIC,
  purchase_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.id as inventory_id,
    ca.id as allocation_id,
    ca.allocation_name as batch_name,
    ca.batch_code,
    ai.available_quantity,
    ai.batch_cost_per_unit as cost_per_unit,
    ca.purchase_date
  FROM allocation_inventory ai
  JOIN contract_allocations ca ON ai.contract_allocation_id = ca.id
  WHERE ai.product_option_id = product_option_uuid
    AND ca.organization_id = org_id
    AND ca.allocation_type = 'batch'
    AND ca.is_active = true
    AND ai.is_active = true
    AND ai.available_quantity > 0
  ORDER BY ca.purchase_date ASC NULLS LAST, ca.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to book inventory using FIFO (First In, First Out)
CREATE OR REPLACE FUNCTION book_inventory_fifo(
  product_option_uuid UUID,
  org_id UUID,
  quantity_to_book INTEGER,
  OUT batch_used UUID,
  OUT cost_per_unit NUMERIC,
  OUT remaining_quantity INTEGER
)
RETURNS RECORD AS $$
DECLARE
  batch RECORD;
  deduct_quantity INTEGER;
BEGIN
  -- Get the oldest batch with availability
  SELECT 
    ai.id,
    ai.available_quantity,
    ai.batch_cost_per_unit
  INTO batch
  FROM allocation_inventory ai
  JOIN contract_allocations ca ON ai.contract_allocation_id = ca.id
  WHERE ai.product_option_id = product_option_uuid
    AND ca.organization_id = org_id
    AND ca.allocation_type = 'batch'
    AND ca.is_active = true
    AND ai.is_active = true
    AND ai.available_quantity > 0
  ORDER BY ca.purchase_date ASC NULLS LAST, ca.created_at ASC
  LIMIT 1
  FOR UPDATE; -- Lock the row
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No available inventory for this product option';
  END IF;
  
  IF batch.available_quantity < quantity_to_book THEN
    RAISE EXCEPTION 'Insufficient inventory. Available: %, Requested: %', 
      batch.available_quantity, quantity_to_book;
  END IF;
  
  -- Update the inventory
  UPDATE allocation_inventory
  SET 
    available_quantity = available_quantity - quantity_to_book,
    sold_quantity = sold_quantity + quantity_to_book,
    updated_at = NOW()
  WHERE id = batch.id;
  
  -- Return the booking details
  batch_used := batch.id;
  cost_per_unit := batch.batch_cost_per_unit;
  remaining_quantity := batch.available_quantity - quantity_to_book;
END;
$$ LANGUAGE plpgsql;

-- Function to restore inventory (for cancellations)
CREATE OR REPLACE FUNCTION restore_inventory_batch(
  inventory_uuid UUID,
  quantity_to_restore INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE allocation_inventory
  SET 
    available_quantity = available_quantity + quantity_to_restore,
    sold_quantity = sold_quantity - quantity_to_restore,
    updated_at = NOW()
  WHERE id = inventory_uuid
    AND sold_quantity >= quantity_to_restore; -- Ensure we don't go negative
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot restore inventory: insufficient sold quantity';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Create views for easy querying
-- ============================================================================

-- View for purchase contracts (simple)
CREATE OR REPLACE VIEW purchase_contracts AS
SELECT 
  c.id,
  c.organization_id,
  c.contract_type,
  c.purchase_order_number,
  c.purchase_date,
  c.total_cost,
  c.notes,
  c.is_active,
  c.created_at,
  
  -- Supplier info
  s.id as supplier_id,
  s.name as supplier_name,
  s.code as supplier_code,
  
  -- Count allocations
  COUNT(ca.id) as allocation_count,
  COUNT(ca.id) FILTER (WHERE ca.allocation_type = 'batch') as batch_count,
  COUNT(ca.id) FILTER (WHERE ca.allocation_type = 'hotel') as hotel_count
  
FROM contracts c
LEFT JOIN suppliers s ON c.supplier_id = s.id
LEFT JOIN contract_allocations ca ON c.id = ca.contract_id
WHERE c.contract_type = 'purchase'
GROUP BY c.id, c.organization_id, c.contract_type, c.purchase_order_number, 
         c.purchase_date, c.total_cost, c.notes, c.is_active, c.created_at,
         s.id, s.name, s.code;

-- View for batch allocations (simple)
CREATE OR REPLACE VIEW batch_allocations AS
SELECT 
  ca.id,
  ca.organization_id,
  ca.allocation_name,
  ca.batch_code,
  ca.allocation_type,
  ca.batch_quantity,
  ca.cost_per_unit,
  ca.total_cost,
  ca.purchase_date,
  ca.is_active,
  ca.created_at,
  
  -- Contract info
  c.id as contract_id,
  c.contract_type,
  c.purchase_order_number,
  
  -- Supplier info
  s.id as supplier_id,
  s.name as supplier_name,
  s.code as supplier_code,
  
  -- Product info
  p.id as product_id,
  p.name as product_name,
  p.code as product_code,
  
  -- Inventory summary
  COALESCE(SUM(ai.available_quantity), 0) as total_available,
  COALESCE(SUM(ai.sold_quantity), 0) as total_sold,
  COALESCE(SUM(ai.total_quantity), 0) as total_quantity,
  
  -- Utilization
  CASE 
    WHEN COALESCE(SUM(ai.total_quantity), 0) > 0 
    THEN ROUND((COALESCE(SUM(ai.sold_quantity), 0)::NUMERIC / COALESCE(SUM(ai.total_quantity), 0)::NUMERIC) * 100, 2)
    ELSE 0 
  END as utilization_percentage
  
FROM contract_allocations ca
LEFT JOIN contracts c ON ca.contract_id = c.id
LEFT JOIN suppliers s ON c.supplier_id = s.id
LEFT JOIN products p ON ca.product_id = p.id
LEFT JOIN allocation_inventory ai ON ca.id = ai.contract_allocation_id
WHERE ca.allocation_type = 'batch'
GROUP BY ca.id, ca.organization_id, ca.allocation_name, ca.batch_code, 
         ca.allocation_type, ca.batch_quantity, ca.cost_per_unit, ca.total_cost,
         ca.purchase_date, ca.is_active, ca.created_at,
         c.id, c.contract_type, c.purchase_order_number,
         s.id, s.name, s.code,
         p.id, p.name, p.code;

-- View for product inventory summary (shows all batches)
CREATE OR REPLACE VIEW product_batch_summary AS
SELECT 
  p.id as product_id,
  p.organization_id,
  p.name as product_name,
  p.code as product_code,
  
  -- Batch summary
  COUNT(DISTINCT ca.id) as total_batches,
  COALESCE(SUM(ca.batch_quantity), 0) as total_quantity,
  COALESCE(SUM(ai.available_quantity), 0) as available_quantity,
  COALESCE(SUM(ai.sold_quantity), 0) as sold_quantity,
  
  -- Cost analysis
  COALESCE(SUM(ca.total_cost), 0) as total_investment,
  CASE 
    WHEN COALESCE(SUM(ai.available_quantity), 0) > 0
    THEN ROUND(
      SUM(ca.cost_per_unit * ai.available_quantity) / SUM(ai.available_quantity), 
      2
    )
    ELSE 0 
  END as weighted_avg_cost,
  
  -- Utilization
  CASE 
    WHEN COALESCE(SUM(ca.batch_quantity), 0) > 0
    THEN ROUND(
      (COALESCE(SUM(ai.sold_quantity), 0)::NUMERIC / COALESCE(SUM(ca.batch_quantity), 0)::NUMERIC) * 100, 
      2
    )
    ELSE 0 
  END as utilization_percentage
  
FROM products p
LEFT JOIN contract_allocations ca ON p.id = ca.product_id 
  AND ca.allocation_type = 'batch' 
  AND ca.is_active = true
LEFT JOIN allocation_inventory ai ON ca.id = ai.contract_allocation_id 
  AND ai.is_active = true
GROUP BY p.id, p.organization_id, p.name, p.code;

-- ============================================================================
-- STEP 6: Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_contracts_contract_type 
  ON contracts(contract_type);
  
CREATE INDEX IF NOT EXISTS idx_contracts_purchase_date 
  ON contracts(purchase_date);
  
CREATE INDEX IF NOT EXISTS idx_contract_allocations_allocation_type 
  ON contract_allocations(allocation_type);
  
CREATE INDEX IF NOT EXISTS idx_contract_allocations_purchase_date 
  ON contract_allocations(purchase_date);
  
CREATE INDEX IF NOT EXISTS idx_allocation_inventory_batch_cost 
  ON allocation_inventory(batch_cost_per_unit);

-- ============================================================================
-- STEP 7: Add comments and documentation
-- ============================================================================

COMMENT ON TABLE contracts IS 
  'Contracts can be either simple purchases (invoices/POs) or complex allocations (hotels).
  
  contract_type:
  - purchase: Simple invoice/PO (tickets, tours, transfers)
  - allocation: Complex contract (hotels with terms)
  
  For purchases: Use purchase_order_number, purchase_date, total_cost
  For allocations: Use contract_number, contract_name, start_date, end_date';

COMMENT ON COLUMN contracts.contract_type IS 
  'Type of contract: purchase (simple invoice/PO) or allocation (complex hotel contract)';

COMMENT ON COLUMN contracts.purchase_order_number IS 
  'PO number, invoice number, or reference for purchase contracts';

COMMENT ON COLUMN contracts.purchase_date IS 
  'Date of purchase for purchase contracts';

COMMENT ON COLUMN contracts.total_cost IS 
  'Total cost of purchase for purchase contracts';

COMMENT ON TABLE contract_allocations IS 
  'Allocations can be simple batches (tickets) or complex hotel allocations.
  
  allocation_type:
  - batch: Simple purchase batch (quantity + cost tracking)
  - hotel: Complex allocation (daily availability, restrictions)
  
  For batches: Use batch_quantity, cost_per_unit, purchase_date
  For hotels: Use valid_from, valid_to, min_nights, max_nights, etc.';

COMMENT ON COLUMN contract_allocations.allocation_type IS 
  'Type of allocation: batch (simple purchase) or hotel (complex allocation)';

COMMENT ON COLUMN contract_allocations.batch_quantity IS 
  'Total quantity purchased for batch allocations';

COMMENT ON COLUMN contract_allocations.cost_per_unit IS 
  'Cost per unit for batch allocations';

COMMENT ON COLUMN contract_allocations.batch_code IS 
  'Unique code for batch (e.g., F1-VIP-JAN-2025)';

COMMENT ON FUNCTION get_available_batches IS 
  'Returns available batches for a product option in FIFO order (oldest first)';

COMMENT ON FUNCTION book_inventory_fifo IS 
  'Books inventory using FIFO method, returns batch details and cost for accurate margin tracking';

COMMENT ON FUNCTION restore_inventory_batch IS 
  'Restores inventory for a specific batch (used for booking cancellations)';

COMMENT ON VIEW purchase_contracts IS 
  'Simple view of purchase contracts with supplier and allocation counts';

COMMENT ON VIEW batch_allocations IS 
  'Detailed view of batch allocations with inventory and utilization metrics';

COMMENT ON VIEW product_batch_summary IS 
  'Summary of all batches for a product with cost analysis and utilization';

-- ============================================================================
-- STEP 8: Create sample data for testing
-- ============================================================================

-- Insert sample purchase contract (only if suppliers exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM suppliers WHERE name = 'F1 Events' LIMIT 1) THEN
    INSERT INTO contracts (
      organization_id, supplier_id, contract_type, 
      purchase_order_number, purchase_date, total_cost,
      notes, is_active
    ) VALUES (
      '11111111-1111-1111-1111-111111111111',
      (SELECT id FROM suppliers WHERE name = 'F1 Events' LIMIT 1),
      'purchase',
      'PO-2025-001',
      '2025-01-15',
      50000.00,
      'F1 Abu Dhabi GP 2025 - VIP Tickets',
      true
    ) ON CONFLICT (contract_number) DO NOTHING;
  END IF;
END $$;

-- Insert sample batch allocation (only if contract and products exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM contracts WHERE purchase_order_number = 'PO-2025-001') 
     AND EXISTS (SELECT 1 FROM products WHERE name LIKE '%F1%' LIMIT 1) THEN
    INSERT INTO contract_allocations (
      organization_id, contract_id, product_id, allocation_name, allocation_type,
      batch_quantity, cost_per_unit, total_cost, purchase_date, batch_code,
      is_active
    ) VALUES (
      '11111111-1111-1111-1111-111111111111',
      (SELECT id FROM contracts WHERE purchase_order_number = 'PO-2025-001'),
      (SELECT id FROM products WHERE name LIKE '%F1%' LIMIT 1),
      'January VIP Batch',
      'batch',
      100,
      500.00,
      50000.00,
      '2025-01-15',
      'F1-VIP-JAN-2025',
      true
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Refined allocation model migration completed!';
  RAISE NOTICE 'Added support for:';
  RAISE NOTICE '  - Purchase contracts (simple invoices/POs)';
  RAISE NOTICE '  - Batch allocations (tickets, tours, transfers)';
  RAISE NOTICE '  - Hotel allocations (complex with daily availability)';
  RAISE NOTICE '  - FIFO cost tracking for accurate margins';
  RAISE NOTICE '  - Comprehensive views and helper functions';
END $$;
