# Database Migrations

This directory contains SQL migration files for database schema changes.

## Migration 001: Custom Product Types

**File:** `001_add_custom_product_types.sql`

**Purpose:** Replace hardcoded product types and subtypes with customizable lookup tables.

### What it does:

1. **Creates new tables:**
   - `product_types` - Customizable product types per organization
   - `product_subtypes` - Customizable product subtypes per product type

2. **Adds new columns:**
   - `products.product_type_id` - References product_types table
   - `product_variants.product_subtype_id` - References product_subtypes table

3. **Seeds default data:**
   - Creates default product types (accommodation, activity, event, transfer, package)
   - Creates default subtypes for each type
   - Migrates existing data to use new relationships

4. **Preserves backward compatibility:**
   - Keeps old `type` and `subtype` columns during transition
   - CHECK constraints are commented out but not removed

### How to apply:

```bash
# 1. Run the migration SQL
psql -d your_database -f db/migrations/001_add_custom_product_types.sql

# 2. Update Prisma schema
npm run prisma:generate

# 3. Seed product types (if needed)
npm run db:seed-product-types

# 4. Push changes to database
npm run db:push
```

### Benefits:

- ✅ **Custom product types** per organization
- ✅ **Custom subtypes** per product type
- ✅ **Icon and color themes** for UI consistency
- ✅ **Multi-tenant isolation** with org_id
- ✅ **Backward compatibility** during transition
- ✅ **Default types** for new organizations

### Future cleanup:

Once all code is updated to use the new relationships:
1. Remove old `type` and `subtype` columns
2. Remove CHECK constraints
3. Update all queries to use new relationships
