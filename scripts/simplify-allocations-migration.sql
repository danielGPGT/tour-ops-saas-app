-- Migration: Simplify Contract Allocations for Tour Operators
-- This migration adds support for different allocation types with varying complexity
-- Version: 2.0 (Fixed)

BEGIN;

-- ============================================================================
-- STEP 1: Add new columns to contract_allocations
-- ============================================================================

ALTER TABLE contract_allocations 
ADD COLUMN IF NOT EXISTS supplier_id UUID,
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS purchase_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS total_quantity INTEGER,
ADD COLUMN IF NOT EXISTS available_quantity INTEGER,
ADD COLUMN IF NOT EXISTS sold_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS total_cost NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- ============================================================================
-- STEP 2: Populate supplier_id from contracts for existing records
-- ============================================================================

-- First, add the column as nullable and populate it
UPDATE contract_allocations ca
SET supplier_id = c.supplier_id
FROM contracts c
WHERE ca.contract_id = c.id
  AND ca.supplier_id IS NULL;

-- Now make supplier_id NOT NULL and add foreign key
ALTER TABLE contract_allocations 
ALTER COLUMN supplier_id SET NOT NULL;

ALTER TABLE contract_allocations 
ADD CONSTRAINT fk_contract_allocations_supplier 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT;

-- ============================================================================
-- STEP 3: Make contract_id nullable (for direct purchases without contracts)
-- ============================================================================

ALTER TABLE contract_allocations 
ALTER COLUMN contract_id DROP NOT NULL;

-- ============================================================================
-- STEP 4: Update allocation_type enum
-- ============================================================================

-- Check if allocation_type is defined as an ENUM or VARCHAR with constraint
-- This handles both cases

-- Drop existing check constraint if it exists
ALTER TABLE contract_allocations 
DROP CONSTRAINT IF EXISTS contract_allocations_allocation_type_check;

-- If using ENUM type, add new values (this won't error if they already exist)
DO $$ 
BEGIN
  -- Try to add new enum values
  BEGIN
    ALTER TYPE allocation_type_enum ADD VALUE IF NOT EXISTS 'hotel_allocation';
  EXCEPTION WHEN duplicate_object THEN 
    NULL;
  END;
  
  BEGIN
    ALTER TYPE allocation_type_enum ADD VALUE IF NOT EXISTS 'purchased_inventory';
  EXCEPTION WHEN duplicate_object THEN 
    NULL;
  END;
  
  BEGIN
    ALTER TYPE allocation_type_enum ADD VALUE IF NOT EXISTS 'on_request';
  EXCEPTION WHEN duplicate_object THEN 
    NULL;
  END;
  
  BEGIN
    ALTER TYPE allocation_type_enum ADD VALUE IF NOT EXISTS 'unlimited';
  EXCEPTION WHEN duplicate_object THEN 
    NULL;
  END;
EXCEPTION WHEN undefined_object THEN
  -- If the type doesn't exist, it's probably a VARCHAR, so we'll add a check constraint
  NULL;
END $$;

-- Add check constraint (supports both old and new values for backwards compatibility)
ALTER TABLE contract_allocations 
ADD CONSTRAINT contract_allocations_allocation_type_check 
CHECK (allocation_type IN (
  'allotment', 
  'free_sell', 
  'on_request', 
  'hotel_allocation', 
  'purchased_inventory', 
  'unlimited'
));

-- Migrate old allocation types to new system
UPDATE contract_allocations
SET allocation_type = 'hotel_allocation'
WHERE allocation_type IN ('allotment', 'free_sell');

-- ============================================================================
-- STEP 5: Add organization_id to child tables
-- ============================================================================

-- Add to allocation_inventory
ALTER TABLE allocation_inventory 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Backfill from parent
UPDATE allocation_inventory ai
SET organization_id = ca.organization_id
FROM contract_allocations ca
WHERE ai.contract_allocation_id = ca.id
  AND ai.organization_id IS NULL;

-- Make it required
ALTER TABLE allocation_inventory 
ALTER COLUMN organization_id SET NOT NULL;

-- Add foreign key
ALTER TABLE allocation_inventory 
ADD CONSTRAINT fk_allocation_inventory_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Add to availability
ALTER TABLE availability 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Backfill from parent
UPDATE availability a
SET organization_id = ai.organization_id
FROM allocation_inventory ai
WHERE a.allocation_inventory_id = ai.id
  AND a.organization_id IS NULL;

-- Make it required
ALTER TABLE availability 
ALTER COLUMN organization_id SET NOT NULL;

-- Add foreign key
ALTER TABLE availability 
ADD CONSTRAINT fk_availability_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 6: Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_contract_allocations_supplier_id 
  ON contract_allocations(supplier_id);
  
CREATE INDEX IF NOT EXISTS idx_contract_allocations_allocation_type 
  ON contract_allocations(allocation_type);
  
CREATE INDEX IF NOT EXISTS idx_contract_allocations_purchase_date 
  ON contract_allocations(purchase_date);
  
CREATE INDEX IF NOT EXISTS idx_contract_allocations_product_active 
  ON contract_allocations(product_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_allocation_inventory_org 
  ON allocation_inventory(organization_id);
  
CREATE INDEX IF NOT EXISTS idx_availability_org 
  ON availability(organization_id);

CREATE INDEX IF NOT EXISTS idx_availability_date 
  ON availability(availability_date);

-- ============================================================================
-- STEP 7: Add triggers for data consistency
-- ============================================================================

-- Trigger to ensure quantities are consistent
CREATE OR REPLACE FUNCTION check_allocation_quantities()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for purchased_inventory type
  IF NEW.allocation_type = 'purchased_inventory' THEN
    -- Set available_quantity to total if not specified
    IF NEW.available_quantity IS NULL AND NEW.total_quantity IS NOT NULL THEN
      NEW.available_quantity := NEW.total_quantity;
    END IF;
    
    -- Set sold_quantity if not specified
    IF NEW.sold_quantity IS NULL THEN
      NEW.sold_quantity := 0;
    END IF;
    
    -- Ensure sold + available = total
    IF NEW.sold_quantity + NEW.available_quantity != NEW.total_quantity THEN
      RAISE EXCEPTION 'Quantity mismatch: sold (%) + available (%) must equal total (%)',
        NEW.sold_quantity, NEW.available_quantity, NEW.total_quantity;
    END IF;
    
    -- Calculate total_cost if not provided
    IF NEW.total_cost IS NULL AND NEW.cost_per_unit IS NOT NULL AND NEW.total_quantity IS NOT NULL THEN
      NEW.total_cost := NEW.cost_per_unit * NEW.total_quantity;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_allocation_quantities ON contract_allocations;

CREATE TRIGGER trigger_check_allocation_quantities
  BEFORE INSERT OR UPDATE ON contract_allocations
  FOR EACH ROW
  EXECUTE FUNCTION check_allocation_quantities();

-- ============================================================================
-- STEP 8: Create helper functions
-- ============================================================================

-- Function to get available quantity for a product
CREATE OR REPLACE FUNCTION get_product_available_quantity(
  product_uuid UUID,
  org_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  total_available INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(available_quantity), 0)
  INTO total_available
  FROM contract_allocations
  WHERE product_id = product_uuid
    AND allocation_type = 'purchased_inventory'
    AND is_active = true
    AND available_quantity > 0
    AND (org_id IS NULL OR organization_id = org_id);
  
  RETURN total_available;
END;
$$ LANGUAGE plpgsql;

-- Function to get weighted average cost for a product
CREATE OR REPLACE FUNCTION get_product_weighted_avg_cost(
  product_uuid UUID,
  org_id UUID DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  weighted_cost NUMERIC := 0;
  total_quantity INTEGER := 0;
BEGIN
  SELECT 
    COALESCE(SUM(cost_per_unit * available_quantity), 0),
    COALESCE(SUM(available_quantity), 0)
  INTO weighted_cost, total_quantity
  FROM contract_allocations
  WHERE product_id = product_uuid
    AND allocation_type = 'purchased_inventory'
    AND is_active = true
    AND available_quantity > 0
    AND (org_id IS NULL OR organization_id = org_id);
  
  IF total_quantity > 0 THEN
    RETURN weighted_cost / total_quantity;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to deduct inventory using FIFO (First In, First Out)
CREATE OR REPLACE FUNCTION deduct_inventory_fifo(
  product_uuid UUID,
  org_id UUID,
  quantity_to_deduct INTEGER,
  OUT allocation_ids UUID[],
  OUT quantities_used INTEGER[],
  OUT costs_per_unit NUMERIC[]
)
RETURNS RECORD AS $$
DECLARE
  allocation RECORD;
  remaining_to_deduct INTEGER := quantity_to_deduct;
  deduct_from_this INTEGER;
BEGIN
  allocation_ids := ARRAY[]::UUID[];
  quantities_used := ARRAY[]::INTEGER[];
  costs_per_unit := ARRAY[]::NUMERIC[];
  
  -- Loop through allocations in FIFO order (oldest purchase_date first)
  FOR allocation IN
    SELECT id, available_quantity, cost_per_unit
    FROM contract_allocations
    WHERE product_id = product_uuid
      AND organization_id = org_id
      AND allocation_type = 'purchased_inventory'
      AND is_active = true
      AND available_quantity > 0
    ORDER BY purchase_date ASC NULLS LAST, created_at ASC
    FOR UPDATE  -- Lock rows to prevent race conditions
  LOOP
    EXIT WHEN remaining_to_deduct <= 0;
    
    -- Deduct as much as possible from this allocation
    deduct_from_this := LEAST(allocation.available_quantity, remaining_to_deduct);
    
    -- Update the allocation
    UPDATE contract_allocations
    SET 
      available_quantity = available_quantity - deduct_from_this,
      sold_quantity = sold_quantity + deduct_from_this,
      updated_at = NOW()
    WHERE id = allocation.id;
    
    -- Track which allocations we used and how much
    allocation_ids := array_append(allocation_ids, allocation.id);
    quantities_used := array_append(quantities_used, deduct_from_this);
    costs_per_unit := array_append(costs_per_unit, allocation.cost_per_unit);
    
    remaining_to_deduct := remaining_to_deduct - deduct_from_this;
  END LOOP;
  
  -- Check if we deducted everything
  IF remaining_to_deduct > 0 THEN
    RAISE EXCEPTION 'Insufficient inventory. Need %, only deducted %', 
      quantity_to_deduct, quantity_to_deduct - remaining_to_deduct;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to restore inventory (for cancellations)
CREATE OR REPLACE FUNCTION restore_inventory(
  allocation_uuid UUID,
  quantity_to_restore INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE contract_allocations
  SET 
    available_quantity = available_quantity + quantity_to_restore,
    sold_quantity = sold_quantity - quantity_to_restore,
    updated_at = NOW()
  WHERE id = allocation_uuid
    AND allocation_type = 'purchased_inventory'
    AND sold_quantity >= quantity_to_restore;  -- Ensure we don't go negative
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot restore inventory: allocation not found or insufficient sold quantity';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 9: Create useful views
-- ============================================================================

-- View for allocation summary with all details
CREATE OR REPLACE VIEW allocation_summary AS
SELECT 
  ca.id,
  ca.organization_id,
  ca.allocation_name,
  ca.allocation_code,
  ca.allocation_type,
  ca.valid_from,
  ca.valid_to,
  ca.is_active,
  
  -- Supplier info
  s.id as supplier_id,
  s.name as supplier_name,
  s.code as supplier_code,
  
  -- Product info
  p.id as product_id,
  p.name as product_name,
  p.code as product_code,
  p.product_type,
  
  -- Contract info (if applicable)
  c.id as contract_id,
  c.contract_name,
  c.contract_number,
  
  -- Inventory info (for purchased_inventory)
  ca.total_quantity,
  ca.available_quantity,
  ca.sold_quantity,
  ca.cost_per_unit,
  ca.total_cost,
  ca.currency,
  CASE 
    WHEN ca.total_quantity > 0 
    THEN ROUND((ca.sold_quantity::NUMERIC / ca.total_quantity::NUMERIC) * 100, 2)
    ELSE 0 
  END as utilization_percentage,
  
  -- Hotel-specific info (for hotel_allocation)
  ca.min_nights,
  ca.max_nights,
  ca.release_days,
  ca.dow_arrival,
  ca.dow_departure,
  ca.blackout_dates,
  ca.allow_overbooking,
  ca.overbooking_limit,
  
  -- Purchase info
  ca.purchase_date,
  ca.purchase_reference,
  
  ca.notes,
  ca.created_at,
  ca.updated_at
FROM contract_allocations ca
LEFT JOIN suppliers s ON ca.supplier_id = s.id
LEFT JOIN products p ON ca.product_id = p.id
LEFT JOIN contracts c ON ca.contract_id = c.id;

-- View for product inventory summary
CREATE OR REPLACE VIEW product_inventory_summary AS
SELECT 
  p.id as product_id,
  p.organization_id,
  p.name as product_name,
  p.code as product_code,
  p.product_type,
  
  -- Aggregate all active allocations
  COUNT(ca.id) as total_allocations,
  COUNT(ca.id) FILTER (WHERE ca.allocation_type = 'purchased_inventory') as purchase_batches,
  COUNT(ca.id) FILTER (WHERE ca.allocation_type = 'hotel_allocation') as hotel_allocations,
  
  -- Inventory totals (for purchased_inventory only)
  COALESCE(SUM(ca.total_quantity) FILTER (WHERE ca.allocation_type = 'purchased_inventory'), 0) as total_quantity,
  COALESCE(SUM(ca.available_quantity) FILTER (WHERE ca.allocation_type = 'purchased_inventory'), 0) as available_quantity,
  COALESCE(SUM(ca.sold_quantity) FILTER (WHERE ca.allocation_type = 'purchased_inventory'), 0) as sold_quantity,
  
  -- Cost analysis
  COALESCE(SUM(ca.total_cost) FILTER (WHERE ca.allocation_type = 'purchased_inventory'), 0) as total_cost_basis,
  CASE 
    WHEN SUM(ca.available_quantity) FILTER (WHERE ca.allocation_type = 'purchased_inventory') > 0
    THEN ROUND(
      SUM(ca.cost_per_unit * ca.available_quantity) FILTER (WHERE ca.allocation_type = 'purchased_inventory') / 
      SUM(ca.available_quantity) FILTER (WHERE ca.allocation_type = 'purchased_inventory'), 
      2
    )
    ELSE 0 
  END as weighted_avg_cost,
  
  -- Utilization
  CASE 
    WHEN SUM(ca.total_quantity) FILTER (WHERE ca.allocation_type = 'purchased_inventory') > 0
    THEN ROUND(
      (SUM(ca.sold_quantity) FILTER (WHERE ca.allocation_type = 'purchased_inventory')::NUMERIC / 
       SUM(ca.total_quantity) FILTER (WHERE ca.allocation_type = 'purchased_inventory')::NUMERIC) * 100, 
      2
    )
    ELSE 0 
  END as utilization_percentage

FROM products p
LEFT JOIN contract_allocations ca ON p.id = ca.product_id AND ca.is_active = true
GROUP BY p.id, p.organization_id, p.name, p.code, p.product_type;

-- ============================================================================
-- STEP 10: Add comments
-- ============================================================================

COMMENT ON TABLE contract_allocations IS 
  'Inventory batches from suppliers - can be linked to formal contracts OR simple invoices/purchases. 
  Contract is OPTIONAL - many operators work with invoices only.
  
  Types:
  - hotel_allocation: Formal contract with terms, daily availability tracking
  - purchased_inventory: Simple invoice-based purchase (e.g., bought 100 tickets)
  - on_request: Rate quote from supplier, book per request
  - unlimited: Always available from supplier
  
  For simple purchases: Leave contract_id NULL, use purchase_reference for invoice number.';

COMMENT ON COLUMN contract_allocations.allocation_type IS 
  'Type of allocation: hotel_allocation (full complexity), purchased_inventory (simple batch tracking), on_request (no inventory), unlimited (always available)';

COMMENT ON COLUMN contract_allocations.supplier_id IS 
  'Direct supplier reference (always required, can work without contract)';

COMMENT ON COLUMN contract_allocations.contract_id IS 
  'OPTIONAL: Link to formal contract document if one exists. 
  Leave NULL for simple invoice-based purchases - use purchase_reference instead for invoice/PO numbers.
  Example: Buy tickets with invoice INV-2025-001 → contract_id=NULL, purchase_reference="INV-2025-001"';

COMMENT ON COLUMN contract_allocations.purchase_date IS 
  'Date of purchase (for purchased_inventory type, used for FIFO)';

COMMENT ON COLUMN contract_allocations.purchase_reference IS 
  'Invoice number, PO number, quote reference, or any identifier for the purchase.
  Examples: "INV-2025-001", "PO-12345", "Quote-F1-2025", "Email confirmation 15-Jan"
  Use this instead of contract when working with simple invoices.';

COMMENT ON COLUMN contract_allocations.total_quantity IS 
  'Total quantity purchased (for purchased_inventory type)';

COMMENT ON COLUMN contract_allocations.available_quantity IS 
  'Quantity still available for sale (decrements on booking)';

COMMENT ON COLUMN contract_allocations.sold_quantity IS 
  'Quantity already sold (increments on booking)';

COMMENT ON COLUMN contract_allocations.cost_per_unit IS 
  'Cost per unit/item from supplier';

COMMENT ON COLUMN contract_allocations.total_cost IS 
  'Total cost of purchase (cost_per_unit * total_quantity)';

COMMENT ON FUNCTION deduct_inventory_fifo IS 
  'Deducts inventory using FIFO (First In First Out) method, returns allocation IDs, quantities used, and costs for accurate margin tracking';

COMMENT ON FUNCTION restore_inventory IS 
  'Restores inventory for a specific allocation (used for booking cancellations)';

COMMENT ON VIEW allocation_summary IS 
  'Comprehensive view of all allocations with joined supplier, product, and contract information';

COMMENT ON VIEW product_inventory_summary IS 
  'Aggregated inventory summary per product showing total quantities, costs, and utilization';

COMMIT;

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE 'Added support for simplified allocation types:';
  RAISE NOTICE '  - hotel_allocation: Full complexity with daily availability';
  RAISE NOTICE '  - purchased_inventory: Simple batch tracking with FIFO';
  RAISE NOTICE '  - on_request: No inventory tracking';
  RAISE NOTICE '  - unlimited: Always available';
END $$;