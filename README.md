# Sports Travel Platform - Technical Overview

## 🎯 Project Overview

This is an **enterprise-grade sports travel booking platform** designed for tour operators who sell packages to major sporting events (Formula 1, MotoGP, football, etc.). The platform handles the complete lifecycle from quote creation to booking fulfillment, with sophisticated inventory management and supplier contract handling.

---

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL 14+ with UUID primary keys
- **State Management**: Zustand (recommended)
- **Forms**: React Hook Form + Zod validation
- **API**: RESTful endpoints (Next.js API routes)

### Database: PostgreSQL

The application uses a **single PostgreSQL database** with 28+ tables organized into logical domains. All tables use:
- UUID primary keys (`gen_random_uuid()`)
- Soft deletes where appropriate
- Audit columns (`created_at`, `updated_at`, `created_by`)
- Multi-tenant via `organization_id` foreign keys

---

## 📊 Core Data Model

### **1. Organizations & Users (Multi-tenant)**

```
organizations (tour operator companies)
  ├─ users (staff members with roles)
  ├─ customers (travelers)
  └─ audit_log (change tracking)
```

**Key Concept**: Everything is scoped to an `organization_id` for multi-tenancy.

### **2. Products & Events**

```
events (Monaco GP 2025, Abu Dhabi GP, etc.)
  └─ products (Hotels, Tickets, Transfers)
       └─ product_options (Standard Room - 3 nights, Grandstand K, etc.)
```

**Product Structure**:
- **Product**: Generic item (e.g., "Fairmont Monte Carlo")
- **Product Option**: Specific variant (e.g., "Standard Room - 3 nights")
- Products can be linked to events OR standalone (transfers, flights)

**Example**:
```typescript
Product: "Fairmont Monte Carlo"
  ├─ Option: "Standard Room - 3 nights" (€3,600)
  ├─ Option: "Deluxe Room - 3 nights" (€4,800)
  └─ Option: "Suite - 3 nights" (€7,200)

Product: "Airport Transfer"
  └─ Option: "Nice Airport → Monaco" (€95)
```

### **3. Suppliers & Contracts**

```
suppliers (hotels, venues, transport companies)
  └─ contracts (negotiated deals)
       ├─ contract_allocations (inventory blocks)
       │    ├─ allocation_inventory (quantity tracking)
       │    └─ allocation_releases (release dates with penalties)
       └─ supplier_rates (pricing details)
```

**Contract Types**:
- **Allotment**: Room/seat blocks with release dates (must release by X date or pay penalty)
- **Batch**: Pre-purchased inventory (tickets bought upfront)
- **Free Sell**: Unlimited availability (on-request)
- **On Request**: Book first, source later (sell-first model!)

**Key Concept**: Not all products need contracts. Hotels have contracts with allocations. Airport transfers are booked on-request without pre-bought inventory.

### **4. Inventory Management**

```
contract_allocations (what you bought from supplier)
  └─ allocation_inventory (quantity tracking)
       ├─ total_quantity: 10 rooms
       ├─ available_quantity: 7 rooms
       └─ sold_quantity: 3 rooms
```

**Pooling** (Advanced):
```
allocation_pools (combine multiple allocations)
  ├─ allocation_pool_members (which allocations in pool)
  └─ usage_strategy (cost_optimization, expiry_first, etc.)
```

**Pooling Example**:
```
Pool: "Fairmont GP Weekend - All Rooms"
├─ Allocation A: 5 rooms @ €2,400 (cheap)
├─ Allocation B: 10 rooms @ €2,850 (regular)
└─ Allocation C: 5 rooms @ €3,500 (expensive)

Total: 20 rooms available
Strategy: Use cheapest first automatically!
```

When customer books 7 rooms:
- System auto-allocates: 5 from A, 2 from B
- Creates 2 booking items (different costs)
- Customer sees: "7 rooms booked ✓"

### **5. Rates (Pricing)**

```
supplier_rates (what supplier charges YOU)
  └─ pricing_details (JSONB)
       ├─ occupancy_pricing (single, double, triple)
       ├─ vehicle_rates (E-Class, S-Class, minivan)
       ├─ age_pricing (adult, child, infant)
       └─ extras (early check-in, extra bed, etc.)

selling_rates (what you charge CUSTOMER)
  └─ pricing_details (JSONB)
       └─ Similar structure with markup
```

**Multi-occupancy Example**:
```typescript
supplier_rates: {
  base_cost: 950,  // per night
  pricing_details: {
    occupancy_pricing: {
      single: { adults: 1, cost_per_night: 950 },
      double: { adults: 2, cost_per_night: 950 },  // Same rate
      triple: { adults: 3, cost_per_night: 1000 }  // +€50 for extra bed
    }
  }
}

// At booking time:
Customer books for 3 adults
→ System uses "triple" pricing
→ Cost: €1,000/night × 3 nights = €3,000
```

### **6. Bookings (The Core)**

```
bookings (customer reservations)
  ├─ booking_items (individual products/services)
  │    └─ Links to allocation_inventory (tracks which allocation used)
  ├─ booking_passengers (guest details)
  ├─ transport_segments (flights, transfers)
  └─ payments (deposit, balance, refunds)
```

**Booking Status Flow**:
```
quote → provisional → confirmed → completed
         ↓
      cancelled / no_show
```

**Quote to Booking Workflow**:
1. Create booking with `booking_status = 'quote'`
2. Customer accepts → Change to `provisional` (awaiting deposit)
3. Deposit paid → Change to `confirmed` (inventory decremented)
4. Service delivered → `completed`

**Key Fields**:
```typescript
bookings: {
  booking_status: 'quote' | 'provisional' | 'confirmed' | 'cancelled',
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded',
  
  // Pricing
  total_cost: 5000,         // What it costs you (EUR)
  base_currency: 'EUR',     // Your cost currency
  total_price: 6500,        // What customer pays (GBP)
  display_currency: 'GBP',  // Customer's currency
  
  // FX tracking
  fx_rate: 1.17,            // GBP/EUR rate at booking time
  rate_locked: true,        // Price locked even if FX changes
  
  // Quote tracking
  quote_reference: 'QUOTE-123',
  quote_expires_at: '2025-05-15',
  quote_version: 1,
  converted_from_quote_id: null  // If converted from quote
}
```

### **7. Booking Items (Individual Line Items)**

```typescript
booking_items: {
  id: uuid,
  booking_id: uuid,
  
  // Product
  product_id: uuid,
  product_option_id: uuid,
  
  // Inventory tracking
  allocation_inventory_id: uuid,      // Which allocation used
  allocation_pool_id: uuid,           // If from pool
  contract_allocation_id: uuid,       // Which contract
  supplier_rate_id: uuid,             // Which rate used
  
  // Quantity & Dates
  quantity: 2,                        // 2 rooms
  adults: 4,                          // 2 adults per room
  children: 0,
  service_date_from: '2025-05-22',
  service_date_to: '2025-05-25',
  
  // Pricing (per item)
  unit_cost: 2850.00,                 // Cost per room (EUR)
  cost_currency: 'EUR',
  total_cost: 5700.00,                // 2 × €2,850
  
  unit_price: 3600.00,                // Price per room (GBP)
  price_currency: 'GBP',
  total_price: 7200.00,               // 2 × £3,600
  
  // Status
  item_status: 'confirmed',           // or 'on_request' for sell-first
  
  // Customer preferences
  special_requests: 'Twin beds preferred',
  attributes: {
    bed_preference: 'twin',
    floor_preference: 'high'
  }
}
```

**Item Status**:
- `provisional`: In quote, not confirmed
- `on_request`: Sold but not sourced yet (sell-first!)
- `confirmed`: Fully sourced and confirmed
- `cancelled`: Item cancelled

**Sell-First Model**:
```
Customer books airport transfer:
→ Create booking_item with item_status = 'on_request'
→ No allocation needed (no pre-bought inventory)
→ Operations team sources it later

View: items_needing_sourcing
Shows all items with status = 'on_request'
Sorted by urgency (service_date_from ASC)
```

### **8. Multi-Currency & FX**

```
exchange_rates (cached FX rates)
  ├─ from_currency: 'EUR'
  ├─ to_currency: 'GBP'
  ├─ rate: 1.17
  └─ date: '2025-05-01'
```

**How it works**:
1. Costs stored in supplier's currency (EUR)
2. Prices stored in customer's currency (GBP)
3. FX rate locked at booking time
4. Reporting converts everything to `base_currency` for consistency

```typescript
// Example booking
Fairmont room cost: €2,850
FX rate on May 1: 1 EUR = 1.17 GBP
Customer pays: £3,600 (includes margin)

Stored as:
{
  unit_cost: 2850.00,
  cost_currency: 'EUR',
  unit_price: 3600.00,
  price_currency: 'GBP',
  fx_rate: 1.17,
  rate_locked: true
}
```

---

## 🎯 Key Business Concepts

### **1. Allocation vs Inventory vs Pool**

```
Allocation = What you bought from supplier
  "We have 10 rooms for Monaco GP weekend"

Inventory = What you track for selling
  total: 10, available: 7, sold: 3

Pool = Combine multiple allocations
  Allocation A (5 @ €2,400) + Allocation B (10 @ €2,850)
  = Pool of 15 rooms (auto-use cheapest first)
```

### **2. Contracts vs Rates**

**Contract** = The legal agreement
- Contract number, dates, terms
- Allocations (inventory blocks)
- Release dates and penalties

**Supplier Rate** = The pricing details
- How much supplier charges
- Multi-occupancy, seasonal pricing
- Extras and add-ons
- Can exist without contract (ad-hoc pricing)

**When to use which**:
- Hotels with allocations → Full contract + rates
- Pre-bought tickets → Contract with batch inventory
- Airport transfers → Just rates (no contract/allocation)
- On-request services → Just rates

### **3. Quote → Booking Conversion**

```
Step 1: Create Quote
  booking_status = 'quote'
  quote_expires_at = +7 days
  No inventory decremented

Step 2: Customer Accepts
  booking_status = 'provisional'
  Payment link sent

Step 3: Deposit Paid
  booking_status = 'confirmed'
  Inventory decremented
  Allocation confirmed with supplier

Step 4: Service Delivered
  booking_status = 'completed'
```

**Price Locking**:
```typescript
booking: {
  rate_locked: true,  // Price won't change
  locked_at: '2025-05-01',
  fx_rate: 1.17  // Locked FX rate
}

// Even if FX changes to 1.20 tomorrow,
// customer still pays the locked price
```

### **4. Items Needing Sourcing (Sell-First)**

```sql
-- View: items_needing_sourcing
SELECT 
  booking_reference,
  product_name,
  quantity,
  service_date_from,
  days_until_service,
  priority
FROM booking_items
WHERE item_status = 'on_request'
  AND booking_status NOT IN ('cancelled', 'quote')
ORDER BY service_date_from ASC;

-- Priority:
-- urgent: < 7 days
-- high: 7-30 days
-- normal: > 30 days
```

**Operations Dashboard**:
- Shows all items that need sourcing
- Sorted by urgency
- Operations team books with suppliers
- Updates `item_status` to 'confirmed'

---

## 📁 Recommended Project Structure

```
/app
  /api
    /bookings
    /contracts
    /rates
    /inventory
    /products
  /(dashboard)
    /bookings
    /contracts
    /inventory
    /products
    /customers
    /reports

/components
  /ui (shadcn components)
  /bookings
  /contracts
  /inventory
  /products
  /forms

/lib
  /db (database utilities)
  /api (API helpers)
  /utils (formatters, validators)
  /types (TypeScript types)

/types
  database.types.ts (generated from schema)
  api.types.ts
  booking.types.ts
  contract.types.ts
```

---

## 🎨 UI/UX Guidelines

### Design System
- **Component Library**: shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Fonts**: Inter (body), Geist (headings)
- **Spacing**: 4px grid system
- **Colors**: 
  - Primary: Blue (bookings, actions)
  - Success: Green (confirmed, active)
  - Warning: Yellow (provisional, expiring)
  - Danger: Red (cancelled, urgent)
  - Neutral: Gray (inactive, disabled)

### Key UI Patterns

**1. Inline Editing**
```tsx
<EditableField
  label="Rate Name"
  value={rate.rate_name}
  onSave={updateRate}
  required
/>
```
- Click to edit
- Enter to save
- Escape to cancel
- Auto-save on blur

**2. Expandable Cards**
```tsx
<Card>
  <CardHeader onClick={toggle}>
    <Title>Allocation Name</Title>
    <QuickStats>...</QuickStats>
  </CardHeader>
  <CardBody expanded={isExpanded}>
    {/* Full details */}
  </CardBody>
</Card>
```

**3. Accordions for Complex Forms**
```tsx
<Accordion>
  <AccordionItem value="occupancy">
    <AccordionTrigger>Multi-Occupancy Pricing</AccordionTrigger>
    <AccordionContent>
      {/* Pricing tables */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**4. Status Badges**
```tsx
<Badge variant={getStatusVariant(status)}>
  {status}
</Badge>

// Variants: default, success, warning, destructive, outline
```

**5. Data Tables**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead sortable>Product</TableHead>
      <TableHead sortable>Cost</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {/* Rows with inline actions */}
  </TableBody>
</Table>
```

---

## 🔧 Key Functions & Utilities

### **1. Check Availability**
```typescript
async function checkAvailability(
  productId: string,
  quantity: number,
  serviceDate: string
): Promise<AvailabilityResult> {
  // 1. Check if pooled
  const pool = await getPoolForProduct(productId);
  
  if (pool) {
    // Use pool allocation function
    return checkPoolAvailability(pool.id, quantity, serviceDate);
  }
  
  // 2. Check direct allocation
  const allocation = await getAllocationForProduct(productId, serviceDate);
  
  if (!allocation) {
    // 3. Check if on-request product
    return { available: true, type: 'on_request' };
  }
  
  // 4. Check inventory
  const inventory = await getInventory(allocation.id);
  return {
    available: inventory.available_quantity >= quantity,
    quantity_available: inventory.available_quantity
  };
}
```

### **2. Allocate from Pool**
```typescript
async function allocateFromPool(
  poolId: string,
  quantity: number,
  serviceDate: string
): Promise<AllocationResult[]> {
  // Get pool strategy
  const pool = await getPool(poolId);
  
  // Get members sorted by strategy
  const members = await getPoolMembers(poolId, {
    sortBy: pool.usage_strategy,
    availableOnly: true
  });
  
  const allocations = [];
  let remaining = quantity;
  
  for (const member of members) {
    if (remaining === 0) break;
    
    const toAllocate = Math.min(remaining, member.available_quantity);
    
    // Decrement inventory
    await decrementInventory(member.id, toAllocate);
    
    allocations.push({
      allocation_inventory_id: member.id,
      quantity: toAllocate,
      cost: member.batch_cost_per_unit,
      supplier: member.supplier_name
    });
    
    remaining -= toAllocate;
  }
  
  if (remaining > 0) {
    throw new Error('Insufficient inventory');
  }
  
  return allocations;
}
```

### **3. Calculate Cost from Rate**
```typescript
function calculateCostFromRate(
  rate: SupplierRate,
  occupancy: { adults: number; children: number }
): number {
  // Multi-occupancy pricing
  if (rate.pricing_details?.occupancy_pricing) {
    const totalGuests = occupancy.adults + occupancy.children;
    
    // Find matching occupancy
    for (const [type, pricing] of Object.entries(rate.pricing_details.occupancy_pricing)) {
      if (
        pricing.adults === occupancy.adults &&
        (pricing.children || 0) === occupancy.children
      ) {
        return pricing.total_cost || pricing.cost_per_night * getNights(rate);
      }
    }
  }
  
  // Fallback to base cost
  return rate.base_cost;
}
```

### **4. Get FX Rate**
```typescript
async function getFxRate(
  fromCurrency: string,
  toCurrency: string,
  date: string
): Promise<number> {
  // Same currency
  if (fromCurrency === toCurrency) {
    return 1.0;
  }
  
  // Check cache
  const cached = await db.query(`
    SELECT rate FROM exchange_rates
    WHERE from_currency = $1
      AND to_currency = $2
      AND date = $3
  `, [fromCurrency, toCurrency, date]);
  
  if (cached.rows[0]) {
    return cached.rows[0].rate;
  }
  
  // Fetch from API and cache
  const rate = await fetchFxRateFromAPI(fromCurrency, toCurrency, date);
  
  await db.query(`
    INSERT INTO exchange_rates (from_currency, to_currency, rate, date)
    VALUES ($1, $2, $3, $4)
  `, [fromCurrency, toCurrency, rate, date]);
  
  return rate;
}
```

---

## 🚀 Common Workflows

### **Workflow 1: Create a Quote**

```typescript
// 1. Customer inquiry
const customer = await createOrGetCustomer({
  email: 'james@example.com',
  first_name: 'James',
  last_name: 'Thompson'
});

// 2. Create quote
const quote = await createBooking({
  customer_id: customer.id,
  booking_status: 'quote',
  quote_expires_at: addDays(new Date(), 7),
  display_currency: 'GBP'
});

// 3. Add items
await addBookingItem(quote.id, {
  product_option_id: 'fairmont-standard-3n',
  quantity: 2,
  adults: 4,
  service_date_from: '2025-05-22',
  service_date_to: '2025-05-25',
  
  // Pricing calculated from rates
  unit_cost: 2850,
  cost_currency: 'EUR',
  unit_price: 3600,
  price_currency: 'GBP',
  
  item_status: 'provisional'  // In quote, not confirmed
});

// 4. Send to customer
await sendQuoteEmail(quote.id);
```

### **Workflow 2: Convert Quote to Booking**

```typescript
// 1. Customer accepts quote
const booking = await convertQuoteToBooking(quoteId);

// Updates:
// - booking_status: 'quote' → 'provisional'
// - converted_from_quote_id: quoteId
// - quote_version incremented

// 2. Send payment link
await sendPaymentLink(booking.id);

// 3. On deposit received
await processPayment(booking.id, {
  amount: booking.total_price * 0.3,  // 30% deposit
  payment_method: 'stripe'
});

// Updates:
// - payment_status: 'pending' → 'partial'
// - booking_status: 'provisional' → 'confirmed'
// - Inventory decremented

// 4. Confirm with supplier
await confirmWithSupplier(booking.id);
```

### **Workflow 3: Create Contract with Allocation**

```typescript
// 1. Create contract
const contract = await createContract({
  supplier_id: supplierId,
  contract_name: 'Fairmont Monaco GP 2025',
  contract_type: 'allotment',
  valid_from: '2025-05-22',
  valid_to: '2025-05-25',
  currency: 'EUR'
});

// 2. Add allocation
const allocation = await createAllocation({
  contract_id: contract.id,
  product_id: productId,
  allocation_name: 'Standard Rooms',
  allocation_type: 'allotment',
  total_quantity: 10,
  cost_per_unit: 2850,
  release_days: 60
});

// 3. Add release schedule
await createRelease({
  contract_allocation_id: allocation.id,
  release_date: '2025-03-22',  // 60 days before
  release_percentage: 100,
  penalty_applies: true,
  penalty_percentage: 100  // Pay full amount if not released
});

// 4. Create inventory tracking
await createInventory({
  contract_allocation_id: allocation.id,
  total_quantity: 10,
  available_quantity: 10,
  sold_quantity: 0,
  batch_cost_per_unit: 2850
});

// 5. Add supplier rate
await createSupplierRate({
  contract_id: contract.id,
  product_id: productId,
  rate_name: 'Fairmont Standard - GP Weekend',
  rate_basis: 'per_night',
  base_cost: 950,  // per night
  currency: 'EUR',
  valid_from: '2025-05-22',
  valid_to: '2025-05-25',
  pricing_details: {
    occupancy_pricing: {
      single: { adults: 1, cost_per_night: 950 },
      double: { adults: 2, cost_per_night: 950 },
      triple: { adults: 3, cost_per_night: 1000 }
    }
  }
});
```

---

## 📊 Reporting Queries

### **Booking Revenue by Month**
```sql
SELECT 
  DATE_TRUNC('month', booking_date) as month,
  COUNT(*) as booking_count,
  SUM(total_price) as revenue,
  SUM(total_cost) as cost,
  SUM(total_price - total_cost) as margin
FROM bookings
WHERE booking_status IN ('confirmed', 'completed')
  AND organization_id = $1
GROUP BY month
ORDER BY month DESC;
```

### **Allocation Utilization**
```sql
SELECT 
  ca.allocation_name,
  ai.total_quantity,
  ai.sold_quantity,
  ai.available_quantity,
  ROUND(ai.sold_quantity::NUMERIC / ai.total_quantity * 100, 2) as utilization_pct,
  ca.release_days,
  ca.valid_from - CURRENT_DATE as days_until_release
FROM contract_allocations ca
JOIN allocation_inventory ai ON ca.id = ai.contract_allocation_id
WHERE ca.contract_id = $1
ORDER BY utilization_pct DESC;
```

### **Items Needing Sourcing**
```sql
SELECT 
  b.booking_reference,
  p.name as product_name,
  bi.quantity,
  bi.service_date_from,
  bi.service_date_from - CURRENT_DATE as days_until_service,
  CASE 
    WHEN bi.service_date_from - CURRENT_DATE < 7 THEN 'urgent'
    WHEN bi.service_date_from - CURRENT_DATE < 30 THEN 'high'
    ELSE 'normal'
  END as priority
FROM booking_items bi
JOIN bookings b ON bi.booking_id = b.id
JOIN products p ON bi.product_id = p.id
WHERE bi.item_status = 'on_request'
  AND b.booking_status NOT IN ('cancelled', 'quote')
ORDER BY bi.service_date_from ASC;
```

---

## 🔐 Security & Permissions

### Role-Based Access Control
```typescript
enum UserRole {
  OWNER = 'owner',        // Full access
  ADMIN = 'admin',        // Manage everything except billing
  AGENT = 'agent',        // Create bookings, view contracts
  VIEWER = 'viewer'       // Read-only
}

// Permission checks
function canEditContract(user: User): boolean {
  return ['owner', 'admin'].includes(user.role);
}

function canCreateBooking(user: User): boolean {
  return ['owner', 'admin', 'agent'].includes(user.role);
}
```

### Data Isolation
All queries must filter by `organization_id`:
```typescript
// ✅ Correct
const bookings = await db.query(`
  SELECT * FROM bookings
  WHERE organization_id = $1
`, [user.organization_id]);

// ❌ Wrong - exposes all organizations!
const bookings = await db.query(`SELECT * FROM bookings`);
```

---

## 🧪 Testing Strategy

### Unit Tests
- Utility functions (formatters, calculators)
- Business logic (allocation, pricing)
- Validation (Zod schemas)

### Integration Tests
- API endpoints
- Database queries
- FX rate fetching

### E2E Tests
- Complete booking flow
- Quote conversion
- Contract creation

---

## 🚨 Important Notes for Cursor

### When Creating New Features:

1. **Always use organization_id** - Multi-tenant by default
2. **Use UUIDs** - All IDs are UUIDs, not integers
3. **Follow naming conventions** - Snake_case for DB, camelCase for TS
4. **Include audit fields** - created_at, updated_at, created_by
5. **Use JSONB for flexible data** - pricing_details, attributes, settings
6. **Handle FX carefully** - Lock rates at booking time
7. **Status enums** - Use existing enums, don't create new statuses
8. **Soft deletes** - Use is_active flags where appropriate
9. **shadcn/ui components** - Always use shadcn for UI
10. **TypeScript strict mode** - All code must be fully typed

### Common Gotchas:

1. **Pooling splits bookings** - One customer order → Multiple booking_items
2. **Quotes don't decrement inventory** - Only confirmed bookings do
3. **Rates are optional** - Not everything needs a rate (simple products)
4. **Contracts are optional** - On-request products have no contract
5. **Currency is everywhere** - Always track both cost AND price currencies
6. **Product ≠ Product Option** - Product is generic, option is specific
7. **Allocation ≠ Inventory** - Allocation is contract, inventory is tracking

---

## 📚 Resources

### Key Files to Reference:
- `/database/schema.sql` - Complete database schema
- `/types/database.types.ts` - TypeScript types
- `/components/ui/*` - shadcn/ui components
- `/lib/utils.ts` - Helper functions

### Useful Queries:
```sql
-- Get all active allocations for product
SELECT * FROM contract_allocations 
WHERE product_id = $1 AND is_active = true;

-- Get pool for product
SELECT * FROM allocation_pools 
WHERE product_id = $1 AND is_active = true;

-- Check inventory availability
SELECT available_quantity FROM allocation_inventory
WHERE contract_allocation_id = $1;

-- Get active rate for date
SELECT * FROM supplier_rates
WHERE product_id = $1 
  AND valid_from <= $2 
  AND valid_to >= $2
  AND is_active = true;
```

---

## 🎯 Next Steps for Development

### Phase 1: Core Booking Flow
1. Products & options management
2. Customer management
3. Quote creation
4. Quote → Booking conversion
5. Payment processing

### Phase 2: Inventory Management
1. Contracts & allocations
2. Inventory tracking
3. Release date monitoring
4. Utilization reporting

### Phase 3: Advanced Features
1. Pooling
2. Multi-currency
3. Supplier rates
4. Items needing sourcing
5. Advanced reporting

### Phase 4: Operations
1. Automated release notifications
2. Supplier confirmations
3. Booking modifications
4. Cancellations & refunds

---

## 💡 Philosophy

This platform follows these principles:

1. **Flexibility First** - Support complex, real-world scenarios
2. **Data Integrity** - Track everything for audit and reporting
3. **User Experience** - Inline editing, accordions, smooth UX
4. **Enterprise Ready** - Multi-tenant, role-based, scalable
5. **Pragmatic** - Use JSONB for flexible data, not 100 tables

The goal is to handle the **messy reality** of tour operations:
- Multiple suppliers for same product
- Different currencies everywhere
- Complex pricing (occupancy, seasonal, extras)
- Sell-first, source later
- Quote management
- Inventory pooling

This is NOT a simple e-commerce platform. It's an **enterprise B2B booking system** for tour operators! 🚀

---

**Made with ❤️ for sports travel professionals**