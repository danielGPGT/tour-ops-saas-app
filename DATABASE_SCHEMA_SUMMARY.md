# Database Schema Summary

## Complete List of Tables in `database_schema.sql`

### 1. Organizations & Users
- `organizations` - Multi-tenant organization management
- `users` - User accounts
- `user_organizations` - User-organization relationships
- `invitations` - User invitation system

### 2. Suppliers
- `suppliers` - Supplier/vendor information
  - Has: email, phone, address_line1, city, country (VARCHAR(2)), default_currency
  - NO contact_info JSONB anymore (flattened structure)

### 3. Products & Options
- `product_types` - Product categories (accommodation, event_ticket, etc.)
- `products` - Product definitions
  - Has: supplier_id, venue_name, event_id, location (JSONB)
- `product_options` - Product variations (room types, ticket tiers, etc.)

### 4. Events (Optional)
- `events` - Sports events (F1, golf, tennis, etc.)

### 5. Contracts & Allocations
- `contracts` - Main contract table
  - Has: contract_number, contract_name, contract_type, valid_from, valid_to
  - Financial: currency, total_cost, commission_rate
  - Terms (TEXT): payment_terms, cancellation_policy, terms_and_conditions, notes
  - Status: contract_status enum (draft, active, expired, cancelled)
  - NO signed_date, booking_cutoff_days, special_terms, commission_type
  
- `contract_allocations` - Product-level allocations within a contract
  - Has: allocation_name, allocation_type, total_quantity, valid_from, valid_to
  - Pricing: total_cost, cost_per_unit, currency, release_days
  - NO allocation_code, priority, metadata

- `allocation_releases` - Release schedule for hotel blocks
  - Has: release_date, release_percentage, release_quantity, penalty_applies
  
- `allocation_inventory` - Specific product option inventory
  - Has: total_quantity, available_quantity, sold_quantity
  - Cost: batch_cost_per_unit, currency
  - Flags: is_virtual_capacity (for sell-first!)
  
- `allocation_pools` - Pool multiple allocations together
- `allocation_pool_members` - Links allocations to pools

- `availability` - Daily calendar for hotels (optional)

### 6. Pricing
- `supplier_rates` - What you pay suppliers (COST)
  - Has: product_id, product_option_id, contract_id (optional!)
  - Rate: rate_name, rate_basis (per_night/per_person/per_unit)
  - Validity: valid_from, valid_to
  - Pricing: base_cost, currency, pricing_details (JSONB)
  
- `selling_rates` - What you sell to customers (PRICE)
  - Has: product_id, product_option_id
  - NO contract_id (independent!)
  - Pricing: base_price, currency, markup_type, markup_amount
  - Has: pricing_details (JSONB) for advanced pricing

### 7. Customers & Bookings
- `customers` - Customer information
- `bookings` - Main booking records
- `booking_items` - Individual items in a booking
- `booking_payments` - Payment tracking
- `booking_documents` - Documents/receipts

### 8. Quotes
- `quotes` - Quote management (before booking)
- `quote_items` - Items in quotes

### 9. Other Tables
- `exchange_rates` - FX rates
- `email_templates` - Email system
- `audit_logs` - Activity tracking

## Key Schema Facts

### ✅ What EXISTS:
- `contracts` table with all TEXT fields (flexible!)
- `contract_allocations` for product-level terms
- `allocation_inventory` for tracking inventory
- `allocation_releases` for release schedules
- `supplier_rates` and `selling_rates` for pricing
- `is_virtual_capacity` flag for sell-first model

### ❌ What Does NOT Exist:
- No `payment_schedules` table
- No `deadlines` table
- No `commission_tiers` table
- No `signed_date` in contracts
- No `booking_cutoff_days` in contracts
- No `special_terms` in contracts
- No `commission_type` in contracts
- No `allocation_code` in contract_allocations
- No `contract_versions` table
- No audit table integration (yet)

### ⭐ Key Features:
1. **Flexible TEXT fields** - payment_terms, cancellation_policy, etc. are all TEXT
2. **Virtual Capacity** - `is_virtual_capacity` flag enables sell-first!
3. **Optional contract_id** in supplier_rates
4. **Allocation Pools** - Pool multiple allocations together
5. **Release Schedule** - Prevent attrition charges with allocation_releases
6. **Multi-currency** - Built-in currency support
