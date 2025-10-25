-- Fix allocation_inventory table schema
-- Run this in your Supabase SQL editor

-- Add missing columns to allocation_inventory table
ALTER TABLE public.allocation_inventory 
ADD COLUMN IF NOT EXISTS min_quantity_per_booking integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_quantity_per_booking integer,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS availability_generated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Fix the alternate_option_ids column type
ALTER TABLE public.allocation_inventory 
ALTER COLUMN alternate_option_ids TYPE uuid[] USING COALESCE(alternate_option_ids, '{}'::uuid[]);

-- Rename availability_date to date in availability table if needed
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'availability' AND column_name = 'availability_date') THEN
        ALTER TABLE public.availability RENAME COLUMN availability_date TO date;
    END IF;
END $$;

-- Add unique constraint to availability table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'availability_unique_date'
    ) THEN
        ALTER TABLE public.availability 
        ADD CONSTRAINT availability_unique_date UNIQUE (allocation_inventory_id, date);
    END IF;
END $$;

-- Create the generate_availability RPC function
CREATE OR REPLACE FUNCTION generate_availability(
  inventory_ids uuid[],
  date_from date,
  date_to date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inventory_id uuid;
  loop_date date;
  result jsonb := '[]'::jsonb;
BEGIN
  -- Loop through each inventory item
  FOREACH inventory_id IN ARRAY inventory_ids
  LOOP
    -- Loop through each date in the range
    loop_date := date_from;
    WHILE loop_date <= date_to
    LOOP
      -- Insert availability record if it doesn't exist
      INSERT INTO availability (
        allocation_inventory_id,
        date,
        total_available,
        booked,
        provisional,
        held,
        available
      )
      VALUES (
        inventory_id,
        loop_date,
        (SELECT total_quantity FROM allocation_inventory WHERE id = inventory_id),
        0,
        0,
        0,
        (SELECT total_quantity FROM allocation_inventory WHERE id = inventory_id)
      )
      ON CONFLICT (allocation_inventory_id, date) DO NOTHING;
      
      loop_date := loop_date + INTERVAL '1 day';
    END LOOP;
    
    -- Update the allocation_inventory to mark availability as generated
    UPDATE allocation_inventory 
    SET availability_generated = true 
    WHERE id = inventory_id;
  END LOOP;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Availability generated successfully',
    'inventory_count', array_length(inventory_ids, 1),
    'date_range', jsonb_build_object(
      'from', date_from,
      'to', date_to
    )
  );
END;
$$;
