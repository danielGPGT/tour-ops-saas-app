# Migration 002: Recreate Product Subtypes Table

This migration recreates the `product_subtypes` table with proper normalization and adds the necessary relationships.

## What This Migration Does:

1. **Creates `product_subtypes` table** with proper structure
2. **Adds `product_subtype_id`** column to `product_variants` 
3. **Creates performance indexes**
4. **Seeds default subtypes** for each product type
5. **Updates existing variants** with appropriate subtype values

## How to Run:

### Option 1: Copy SQL Directly
Copy the entire contents of `002_remove_product_subtypes.sql` and run it in your Supabase SQL editor.

### Option 2: Run Individual Commands
```sql
-- 1. Create the table
CREATE TABLE IF NOT EXISTS product_subtypes (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_type_id   BIGINT REFERENCES product_types(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  icon              TEXT,
  is_default        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, product_type_id, name)
);

-- 2. Add foreign key column
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS product_subtype_id BIGINT REFERENCES product_subtypes(id) ON DELETE RESTRICT;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_product_subtypes_org_type ON product_subtypes(org_id, product_type_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_subtype ON product_variants(org_id, product_subtype_id);

-- 4. Make subtype nullable
ALTER TABLE product_variants ALTER COLUMN subtype DROP NOT NULL;

-- 5. Update existing variants (run all the UPDATE statements from the file)

-- 6. Seed default subtypes (run all the INSERT statements from the file)
```

## After Migration:

1. **Generate Prisma Client**: `npx prisma generate`
2. **Push to Database**: `npx prisma db push` (optional, for schema sync)

## Default Subtypes Created:

- **Accommodation**: `room_category` (Bed icon)
- **Transfer**: `seat_tier` (Users icon)  
- **Activity/Event**: `time_slot` (Clock icon)
- **All Types**: `none` (Package icon)

## Benefits:

- **Normalized Structure**: Proper foreign key relationships
- **Customizable**: Add your own subtypes per product type
- **Performance**: Indexed for fast queries
- **Flexible**: Both text subtype and FK subtype available
- **Backward Compatible**: Existing `subtype` column preserved
