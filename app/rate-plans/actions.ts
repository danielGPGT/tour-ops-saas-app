"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";

const RatePlanSchema = z.object({
  product_variant_id: z.number().or(z.bigint()),
  supplier_id: z.number().or(z.bigint()),
  contract_version_id: z.number().or(z.bigint()),
  inventory_model: z.enum(["committed", "on_request", "freesale"]),
  currency: z.string().min(3).max(3),
  preferred: z.boolean().optional().default(false),
  priority: z.number().int().optional().default(100),
  valid_from: z.coerce.date(),
  valid_to: z.coerce.date(),
  rate_doc: z.record(z.any()).optional(),
});

const SeasonSchema = z.object({
  season_from: z.coerce.date(),
  season_to: z.coerce.date(),
  dow_mask: z.number().int().min(0).max(127).optional().default(127),
  min_stay: z.number().int().nullable().optional(),
  max_stay: z.number().int().nullable().optional(),
  min_pax: z.number().int().nullable().optional(),
  max_pax: z.number().int().nullable().optional(),
});

const OccupancySchema = z.object({
  min_occupancy: z.number().int().min(1),
  max_occupancy: z.number().int().min(1),
  pricing_model: z.enum(["fixed", "base_plus_pax"]),
  base_amount: z.number().nullable().optional(),
  per_person_amount: z.number().nullable().optional(),
});

export async function createRatePlan(input: z.infer<typeof RatePlanSchema>) {
  const orgId = await getCurrentOrgId();
  const supabase = await createClient();
  const validated = RatePlanSchema.parse(input);
  const { data, error } = await supabase
    .from("rate_plans")
    .insert([{ ...validated, org_id: orgId }])
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateRatePlan(id: number | bigint, input: Partial<z.infer<typeof RatePlanSchema>>) {
  const orgId = await getCurrentOrgId();
  const supabase = await createClient();
  const partial = input ? { ...input } : {};
  if (partial.priority !== undefined) {
    partial.priority = z.number().int().parse(partial.priority);
  }
  const { data, error } = await supabase
    .from("rate_plans")
    .update(partial)
    .eq("org_id", orgId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function addRateSeasons(ratePlanId: number | bigint, seasons: Array<z.infer<typeof SeasonSchema>>) {
  const orgId = await getCurrentOrgId();
  const supabase = await createClient();
  const rows = seasons.map((s) => ({ ...SeasonSchema.parse(s), org_id: orgId, rate_plan_id: ratePlanId }));
  const { data, error } = await supabase.from("rate_seasons").insert(rows).select("*");
  if (error) throw error;
  return data;
}

export async function addRateOccupancies(ratePlanId: number | bigint, occupancies: Array<z.infer<typeof OccupancySchema>>) {
  const orgId = await getCurrentOrgId();
  const supabase = await createClient();
  const rows = occupancies.map((o) => ({ ...OccupancySchema.parse(o), org_id: orgId, rate_plan_id: ratePlanId }));
  const { data, error } = await supabase.from("rate_occupancies").insert(rows).select("*");
  if (error) throw error;
  return data;
}

// Allocation generation
const AllocationGenSchema = z.object({
  rate_plan_id: z.number().or(z.bigint()),
  product_variant_id: z.number().or(z.bigint()),
  supplier_id: z.number().or(z.bigint()),
  valid_from: z.coerce.date(),
  valid_to: z.coerce.date(),
  allocation_type: z.enum(["committed", "on_request", "freesale"]),
  default_quantity: z.number().int().min(0).default(0),
  weekend_multiplier: z.number().min(0).default(1),
});

export async function generateAllocationBucketsByPlan(input: z.infer<typeof AllocationGenSchema>) {
  const orgId = await getCurrentOrgId();
  const supabase = await createClient();
  const v = AllocationGenSchema.parse(input);

  // Build rows per day
  const rows: any[] = [];
  const start = new Date(v.valid_from);
  const end = new Date(v.valid_to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const jsDay = d.getDay(); // 0=Sun..6=Sat
    const isWeekend = jsDay === 0 || jsDay === 6;
    const qty = Math.round((v.default_quantity || 0) * (isWeekend ? v.weekend_multiplier : 1));
    rows.push({
      org_id: orgId,
      product_variant_id: v.product_variant_id,
      supplier_id: v.supplier_id,
      date: new Date(d),
      allocation_type: v.allocation_type,
      quantity: v.allocation_type === "freesale" ? null : qty,
      booked: 0,
      held: 0,
      stop_sell: false,
      blackout: false,
    });
  }

  if (rows.length === 0) return { inserted: 0 };

  // Upsert-like behavior: try insert; duplicates (unique key) will be ignored via ON CONFLICT if enabled
  const { data, error } = await supabase
    .from("allocation_buckets")
    .insert(rows)
    .select("id");
  if (error) throw error;
  return { inserted: data?.length || 0 };
}


