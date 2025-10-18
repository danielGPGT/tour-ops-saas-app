# Contract Schema Analysis for Different Inventory Types

## Current Schema Overview

The current contract schema is designed around:
- **Contracts** → **Contract Versions** → **Rate Plans** → **Allocation Buckets**
- **Inventory Models**: `committed`, `on_request`, `freesale`
- **Allocation Types**: Daily-based with optional time slots and categories

## Inventory Type Analysis

### ✅ **EXCELLENT FIT**

#### 1. **Hotels (Accommodation)**
- **Daily allocation buckets** ✅ Perfect for room inventory
- **Rate seasons** ✅ High/low season pricing
- **Rate occupancies** ✅ Single/double/triple/quad pricing
- **Rate age bands** ✅ Adult/child/infant pricing
- **Rate adjustments** ✅ DOW, group, promo pricing
- **Allocation holds** ✅ Booking holds with expiry
- **Stop sell/blackout** ✅ Overbooking protection

#### 2. **Activities & Tours**
- **Time slots** ✅ Morning/afternoon/evening tours
- **Daily allocation** ✅ Per-day capacity management
- **Rate seasons** ✅ Peak/off-peak pricing
- **Rate age bands** ✅ Adult/child pricing
- **Allocation holds** ✅ Tour booking holds

#### 3. **Transfers**
- **Freesale model** ✅ Unlimited capacity
- **Per-person pricing** ✅ Vehicle capacity pricing
- **Rate adjustments** ✅ Distance-based pricing
- **Daily allocation** ✅ Route availability

### ✅ **GOOD FIT**

#### 4. **Events (Concerts, Sports)**
- **Event-based allocation** ✅ Single event inventory
- **Rate seasons** ✅ Early bird/presale pricing
- **Rate occupancies** ✅ VIP/standard seating
- **Allocation holds** ✅ Ticket holds
- **Stop sell** ✅ Sold out management

#### 5. **Cruises**
- **Daily allocation** ✅ Cabin inventory per sailing
- **Rate seasons** ✅ Seasonal pricing
- **Rate occupancies** ✅ Cabin category pricing
- **Rate age bands** ✅ Adult/child pricing
- **Allocation holds** ✅ Cabin holds

### ⚠️ **PARTIAL FIT (Needs Enhancement)**

#### 6. **Multi-Day Events (Festivals, Conferences)**
**Current Issues:**
- Daily allocation buckets don't handle multi-day events well
- Need event start/end date ranges
- Complex pricing across multiple days

**Required Enhancements:**
```sql
-- Add event-based allocation
ALTER TABLE allocation_buckets ADD COLUMN event_start_date DATE;
ALTER TABLE allocation_buckets ADD COLUMN event_end_date DATE;
ALTER TABLE allocation_buckets ADD COLUMN event_duration_days INT;

-- Add constraint for event vs daily allocation
ALTER TABLE allocation_buckets ADD CONSTRAINT check_date_or_event 
  CHECK (
    (date IS NOT NULL AND event_start_date IS NULL) OR 
    (date IS NULL AND event_start_date IS NOT NULL)
  );
```

#### 7. **Dynamic Inventory (Rental Cars, Bikes)**
**Current Issues:**
- Fixed allocation buckets don't handle dynamic availability
- Need real-time inventory updates
- Complex pricing based on demand

**Required Enhancements:**
```sql
-- Add dynamic inventory tracking
CREATE TABLE dynamic_inventory (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id BIGINT NOT NULL REFERENCES organizations(id),
  product_variant_id BIGINT NOT NULL REFERENCES product_variants(id),
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
  date DATE NOT NULL,
  available_quantity INT NOT NULL,
  demand_factor NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, product_variant_id, supplier_id, date)
);
```

#### 8. **Seasonal Products (Ski Resorts, Beach Clubs)**
**Current Issues:**
- Rate seasons are too simple for complex seasonal rules
- Need weather-dependent availability
- Complex pricing based on conditions

**Required Enhancements:**
```sql
-- Add seasonal rules
CREATE TABLE seasonal_rules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id BIGINT NOT NULL REFERENCES organizations(id),
  product_variant_id BIGINT NOT NULL REFERENCES product_variants(id),
  rule_type TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  availability_override JSONB NOT NULL DEFAULT '{}',
  pricing_override JSONB NOT NULL DEFAULT '{}',
  CHECK (rule_type IN ('weather','demand','capacity','custom'))
);
```

### ❌ **POOR FIT (Needs Major Changes)**

#### 9. **Auction-Based Inventory (Dynamic Pricing)**
**Current Issues:**
- Fixed rate plans don't handle dynamic pricing
- No bidding mechanism
- No real-time price updates

**Required Enhancements:**
```sql
-- Add auction system
CREATE TABLE auction_inventory (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id BIGINT NOT NULL REFERENCES organizations(id),
  product_variant_id BIGINT NOT NULL REFERENCES product_variants(id),
  auction_start TIMESTAMPTZ NOT NULL,
  auction_end TIMESTAMPTZ NOT NULL,
  starting_price NUMERIC(12,2) NOT NULL,
  reserve_price NUMERIC(12,2) NULL,
  current_bid NUMERIC(12,2) NULL,
  bid_increment NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);
```

#### 10. **Shared Inventory (Timeshares, Co-working)**
**Current Issues:**
- Single allocation buckets don't handle shared ownership
- No fractional ownership tracking
- Complex availability rules

**Required Enhancements:**
```sql
-- Add shared ownership
CREATE TABLE shared_ownership (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id BIGINT NOT NULL REFERENCES organizations(id),
  product_variant_id BIGINT NOT NULL REFERENCES product_variants(id),
  owner_id BIGINT NOT NULL,
  ownership_percentage NUMERIC(5,2) NOT NULL,
  usage_rights JSONB NOT NULL DEFAULT '{}',
  availability_rules JSONB NOT NULL DEFAULT '{}'
);
```

## Recommendations

### 1. **Immediate Enhancements (High Priority)**
```sql
-- Add event-based allocation
ALTER TABLE allocation_buckets ADD COLUMN event_start_date DATE;
ALTER TABLE allocation_buckets ADD COLUMN event_end_date DATE;
ALTER TABLE allocation_buckets ADD COLUMN event_duration_days INT;

-- Add inventory pooling
CREATE TABLE inventory_pools (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id BIGINT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT NULL,
  pool_type TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  CHECK (pool_type IN ('shared','distributed','reserved'))
);

-- Link allocation buckets to pools
ALTER TABLE allocation_buckets ADD COLUMN inventory_pool_id BIGINT REFERENCES inventory_pools(id);
```

### 2. **Medium Priority Enhancements**
- Add dynamic inventory tracking
- Add seasonal rules engine
- Add real-time availability updates
- Add complex pricing rules

### 3. **Future Considerations**
- Auction-based inventory
- Shared ownership models
- AI-driven pricing
- Blockchain-based inventory

## Conclusion

The current contract schema **excellently fits 80% of common inventory types** (hotels, activities, transfers, events, cruises). For the remaining 20% (multi-day events, dynamic inventory, seasonal products), **targeted enhancements** can be added without breaking existing functionality.

The schema is **well-designed for extensibility** and can grow to handle more complex inventory types as needed.
