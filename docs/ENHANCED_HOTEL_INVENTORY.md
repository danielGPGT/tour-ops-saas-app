# Enhanced Hotel Inventory Management

This document explains the enhanced schema and simplified UI that handles complex hotel scenarios while maintaining simplicity for basic use cases.

## 🎯 Problem Solved

The original schema couldn't handle this real-world scenario:
- **100 rooms** from a hotel supplier
- **Shared pool** of double/twin rooms (customers can book either type)
- **Complex pricing**: £150/night base, single occupancy £130, additional person £30
- **Date ranges**: £110 pre-period, £150 main period, £120 post-period
- **City tax**: £6 per person per night
- **Rooming lists**: Track which passengers are in which rooms

## ✅ Solution Implemented

### 1. Enhanced Database Schema

#### Inventory Pools (Shared Room Types)
```sql
-- Groups variants that share inventory
CREATE TABLE inventory_pools (
  id bigint PRIMARY KEY,
  org_id bigint NOT NULL,
  supplier_id bigint NOT NULL,
  name text NOT NULL,
  pool_type text DEFAULT 'shared'
);

-- Allocation buckets can reference pools
ALTER TABLE allocation_buckets 
  ADD COLUMN inventory_pool_id bigint REFERENCES inventory_pools(id);
```

#### Flexible Occupancy Pricing
```sql
-- Enhanced rate occupancies with base + per-person model
CREATE TABLE rate_occupancies (
  id bigint PRIMARY KEY,
  rate_plan_id bigint NOT NULL,
  min_occupancy integer NOT NULL,
  max_occupancy integer NOT NULL,
  pricing_model text NOT NULL, -- 'fixed' | 'base_plus_pax' | 'per_person'
  base_amount numeric NOT NULL,
  per_person_amount numeric NULL -- for additional person pricing
);
```

#### Room Assignments & Occupants
```sql
-- Track actual room assignments
CREATE TABLE room_assignments (
  id bigint PRIMARY KEY,
  booking_item_id bigint NOT NULL,
  room_number text,
  room_type text NOT NULL,
  bedding_preference text,
  status text DEFAULT 'requested'
);

-- Link passengers to rooms
CREATE TABLE room_occupants (
  id bigint PRIMARY KEY,
  room_assignment_id bigint NOT NULL,
  passenger_id bigint NOT NULL,
  is_lead boolean DEFAULT false
);
```

### 2. Simplified UI Components

#### Product Creation Wizard
- **Step 1**: Choose template (Hotel, Activity, Transfer)
- **Step 2**: Basic info (name, supplier, cost, price)
- **Step 3**: Availability (unlimited, fixed quantity, on-request)
- **Step 4**: Review and create

Behind the scenes, this creates:
- 1 supplier (if new)
- 1 product + variant
- 1 contract + contract_version
- 1 rate_plan with seasons
- 30+ allocation_buckets
- Occupancy pricing rules
- Default taxes

#### Smart Import Wizard
- **Step 1**: Upload CSV/Excel file
- **Step 2**: Auto-map columns with fuzzy matching
- **Step 3**: Validate data and show preview
- **Step 4**: Import with error handling

#### Progressive Disclosure Dashboard
- **Primary**: Quick actions (New Booking, Add Product, Import)
- **Secondary**: Today's summary, alerts, schedule
- **Hidden**: Advanced settings (collapsed by default)

### 3. Service Layer Architecture

#### ProductService
```typescript
// Simple interface
const result = await ProductService.createProductFromWizard(orgId, {
  name: "Hotel ABC Deluxe Room",
  type: "hotel",
  supplier: { name: "Hotel ABC" },
  costPerPerson: 100,
  pricePerPerson: 150,
  availability: {
    type: "fixed",
    quantity: 100,
    startDate: new Date("2024-12-01"),
    endDate: new Date("2024-12-31")
  }
});
```

#### AvailabilityService
```typescript
// Simplified search
const results = await AvailabilityService.searchAvailability({
  orgId: 1,
  checkIn: new Date("2024-12-05"),
  checkOut: new Date("2024-12-07"),
  adults: 2,
  productTypes: ["hotel"]
});
```

#### BookingService
```typescript
// Simple booking creation
const booking = await BookingService.createBooking({
  orgId: 1,
  reference: "BK-2024-001",
  customer: { name: "John Doe", email: "john@example.com" },
  items: [{
    variantId: 123,
    checkIn: new Date("2024-12-05"),
    checkOut: new Date("2024-12-07"),
    adults: 2,
    roomPreferences: {
      roomType: "twin",
      beddingPreference: "2x single beds"
    }
  }],
  passengers: [
    { fullName: "John Doe", isLead: true },
    { fullName: "Jane Doe", isLead: false }
  ]
});
```

## 🏨 Hotel Scenario Implementation

### Setup (One-time)
```sql
-- 1. Create inventory pool
INSERT INTO inventory_pools (org_id, supplier_id, name) 
VALUES (1, 100, 'Hotel XYZ Dec 2024 Pool');

-- 2. Create allocation buckets (100 rooms Dec 4-8)
INSERT INTO allocation_buckets 
  (org_id, product_variant_id, supplier_id, date, quantity, inventory_pool_id)
SELECT 1, 456, 100, generate_series('2024-12-04'::date, '2024-12-08'::date, '1 day')::date, 100, 500;

-- 3. Create rate seasons
INSERT INTO rate_seasons (org_id, rate_plan_id, season_from, season_to)
VALUES 
  (1, 600, '2024-12-01', '2024-12-03'), -- £110
  (1, 600, '2024-12-04', '2024-12-08'), -- £150
  (1, 600, '2024-12-09', '2024-12-31'); -- £120

-- 4. Create occupancy pricing
INSERT INTO rate_occupancies (org_id, rate_plan_id, min_occupancy, max_occupancy, pricing_model, base_amount, per_person_amount)
VALUES 
  (1, 600, 1, 1, 'fixed', 130, null), -- single occupancy
  (1, 600, 2, 4, 'base_plus_pax', 150, 30); -- 2+ people: base £150 + £30/extra

-- 5. Add city tax
INSERT INTO rate_taxes_fees (org_id, rate_plan_id, name, calc_base, amount_type, value)
VALUES (1, 600, 'City Tax', 'per_person_per_night', 'fixed', 6);
```

### Booking (Runtime)
```typescript
// Customer books: 2 adults, Dec 5-7 (2 nights)
const booking = await BookingService.createBooking({
  orgId: 1,
  reference: "BK-2024-001",
  customer: { name: "Alice Johnson" },
  items: [{
    variantId: 456, // Hotel room variant
    checkIn: new Date("2024-12-05"),
    checkOut: new Date("2024-12-07"),
    adults: 2,
    roomPreferences: {
      roomType: "twin",
      beddingPreference: "2x single beds"
    }
  }],
  passengers: [
    { fullName: "Alice Johnson", isLead: true },
    { fullName: "Bob Johnson", isLead: false }
  ]
});

// Result:
// - Booking created with total price £324 (£162/night)
// - Room assignment created (status: requested)
// - Passengers linked to room
// - Inventory decremented (shared pool)
// - Rooming list generated
```

### Rooming List Generation
```typescript
const roomingList = await BookingService.generateRoomingList(1, bookingId);

// Output:
[
  {
    roomNumber: null, // Assigned later by hotel
    roomType: "twin",
    beddingPreference: "2x single beds",
    status: "requested",
    checkIn: "2024-12-05",
    checkOut: "2024-12-07",
    passengers: [
      { name: "Alice Johnson", isLead: true, age: 35 },
      { name: "Bob Johnson", isLead: false, age: 37 }
    ]
  }
]
```

## 🎨 UI/UX Principles Applied

### 1. Progressive Disclosure
- **Layer 1**: Simple wizards (Product Creation, Import)
- **Layer 2**: Advanced settings (collapsed by default)
- **Layer 3**: Power user features (behind feature flags)
- **Layer 4**: Full schema complexity (users never see)

### 2. Opinionated Defaults
```typescript
const DEFAULT_SETTINGS = {
  inventoryModel: "committed", // Simplest to understand
  currency: "GBP", // Use org's base currency
  pricingModel: "per_person", // Most common
  markets: ["all"], // Don't force market segmentation
  channels: ["direct", "agent"], // Basic channels
  cancellationPolicy: STANDARD_30_DAY // Reasonable default
};
```

### 3. Templates & Cloning
- **3-Star Hotel Room**: Standard accommodation template
- **Full-Day Activity**: Activity template with group pricing
- **Airport Transfer**: Transfer template with capacity limits

### 4. Smart Validation
- **Auto-detect**: Date formats, currency symbols, column types
- **Fuzzy matching**: "Guest Name" → customer_name
- **Preview**: Show data before committing
- **Partial imports**: Skip problematic rows, import the rest

## 🚀 Performance Optimizations

### 1. Database Indexes
```sql
-- Critical indexes for availability search
CREATE INDEX idx_allocation_buckets_search_optimized 
  ON allocation_buckets (org_id, product_variant_id, date) 
  INCLUDE (quantity, booked, held, allocation_type);

-- Partial index for available inventory only
CREATE INDEX idx_allocation_buckets_available 
  ON allocation_buckets (product_variant_id, date) 
  WHERE (quantity IS NULL OR quantity > booked + held);
```

### 2. Caching Strategy
```typescript
// Cache availability search results for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
const cacheKey = `search:${orgId}:${checkIn}:${checkOut}:${adults}`;

// Invalidate cache when bookings change
AvailabilityService.clearCache(orgId);
```

### 3. Materialized Views
```sql
-- Pre-computed availability windows
CREATE MATERIALIZED VIEW available_inventory AS
SELECT 
  ab.org_id,
  ab.product_variant_id,
  ab.date,
  (COALESCE(ab.quantity, 999999) - ab.booked - ab.held) as available
FROM allocation_buckets ab;
```

## 📊 Migration Strategy

### Phase 1: Essential Data Only
```typescript
// Migration wizard - Phase 1
"What do you want to bring over?"

☑ Future bookings (42 found)
☑ Customer contacts (156 found)  
☑ Active products (12 found)
☐ Historical data (archive separately)

Estimated time: 15 minutes
[Start Migration]
```

### Phase 2: Parallel Run
```
Month 1-2: Dual System Operation
├── Old System (Excel/Legacy) - Primary source of truth
├── New System (Your SaaS) - Learning phase
└── Daily sync (one-way: Old → New)

Month 3: Flip the switch
├── New System → Primary
└── Old System → Archive (read-only)
```

### Phase 3: Assisted Migration
```
Pricing Tiers:
├── Self-Service ($0) - Import wizards & guides
├── Assisted Migration ($500) - 1-hour onboarding call
└── Full White-Glove ($2,000) - We do the entire migration
```

## 🎯 Key Benefits

### ✅ Handles Complex Scenarios
- Shared room type pools
- Flexible occupancy pricing
- Multi-night availability
- Rooming list management
- Complex rate structures

### ✅ Maintains Simplicity
- 4-step product creation wizard
- Auto-mapping import wizard
- Progressive disclosure dashboard
- Opinionated defaults
- Template-based setup

### ✅ Performance Optimized
- Critical database indexes
- Redis caching layer
- Materialized views for reports
- Efficient availability queries
- Background job processing

### ✅ Migration-Friendly
- Smart import wizards
- Parallel run strategy
- Assisted migration services
- Data validation and preview
- Partial import support

## 🔧 Usage Examples

### Creating a Hotel Product
```typescript
// User fills out simple wizard form
const productData = {
  name: "Hotel ABC Deluxe Room",
  type: "hotel",
  supplier: { name: "Hotel ABC" },
  costPerPerson: 100,
  pricePerPerson: 150,
  availability: {
    type: "fixed",
    quantity: 100,
    startDate: new Date("2024-12-01"),
    endDate: new Date("2024-12-31")
  }
};

// Service handles all complexity
const result = await ProductService.createProductFromWizard(1, productData);
// Creates 35+ database records automatically
```

### Searching Availability
```typescript
// User searches for hotels
const results = await AvailabilityService.searchAvailability({
  orgId: 1,
  checkIn: new Date("2024-12-05"),
  checkOut: new Date("2024-12-07"),
  adults: 2,
  productTypes: ["hotel"]
});

// Returns simple, actionable results
[
  {
    productName: "Hotel ABC Deluxe Room",
    available: true,
    minAvailable: 15,
    totalPrice: 324,
    priceBreakdown: {
      basePrice: 300,
      taxes: 24,
      total: 324
    }
  }
]
```

### Creating a Booking
```typescript
// User creates booking through simple form
const booking = await BookingService.createBooking({
  orgId: 1,
  reference: "BK-2024-001",
  customer: { name: "John Doe" },
  items: [{
    variantId: 123,
    checkIn: new Date("2024-12-05"),
    checkOut: new Date("2024-12-07"),
    adults: 2,
    roomPreferences: { roomType: "twin" }
  }],
  passengers: [
    { fullName: "John Doe", isLead: true },
    { fullName: "Jane Doe", isLead: false }
  ]
});

// Service handles:
// - Price calculation
// - Availability check
// - Room assignment
// - Passenger linking
// - Inventory update
// - Rooming list generation
```

## 🎉 Result

**Before**: Complex schema that users couldn't understand
**After**: Simple UI that handles complex hotel scenarios automatically

Users see:
- ✅ 4-step product creation wizard
- ✅ Smart import with auto-mapping
- ✅ Progressive disclosure dashboard
- ✅ One-click booking creation

Behind the scenes:
- ✅ 35+ database tables properly linked
- ✅ Complex pricing calculations
- ✅ Shared inventory pools
- ✅ Rooming list management
- ✅ Performance optimizations

This implementation successfully handles the complex hotel scenario while maintaining the simplicity that SMB tour operators need to succeed.
