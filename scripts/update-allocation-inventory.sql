-- Migration to add missing columns to allocation_inventory table
-- Run this script in your Supabase SQL editor

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

-- Add unique constraint to availability table
ALTER TABLE public.availability 
ADD CONSTRAINT IF NOT EXISTS availability_unique_date UNIQUE (allocation_inventory_id, date);

-- Rename availability_date to date in availability table if needed
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'availability' AND column_name = 'availability_date') THEN
        ALTER TABLE public.availability RENAME COLUMN availability_date TO date;
    END IF;
END $$;
