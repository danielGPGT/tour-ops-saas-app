-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.agent_commissions (
  id bigint NOT NULL DEFAULT nextval('agent_commissions_id_seq'::regclass),
  org_id bigint NOT NULL,
  booking_id bigint NOT NULL,
  basis text NOT NULL,
  rate numeric NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT agent_commissions_pkey PRIMARY KEY (id),
  CONSTRAINT agent_commissions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT agent_commissions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.agents (
  id bigint NOT NULL DEFAULT nextval('agents_id_seq'::regclass),
  org_id bigint NOT NULL,
  name text NOT NULL,
  terms jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT agents_pkey PRIMARY KEY (id),
  CONSTRAINT agents_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.allocation_buckets (
  id bigint NOT NULL DEFAULT nextval('allocation_buckets_id_seq'::regclass),
  org_id bigint NOT NULL,
  product_variant_id bigint NOT NULL,
  supplier_id bigint NOT NULL,
  date date,
  allocation_type text NOT NULL,
  quantity integer,
  booked integer NOT NULL DEFAULT 0,
  held integer NOT NULL DEFAULT 0,
  release_period_hours integer,
  stop_sell boolean NOT NULL DEFAULT false,
  blackout boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes text,
  unit_cost numeric DEFAULT 0,
  currency text DEFAULT 'USD'::text,
  committed_cost boolean DEFAULT false,
  contract_version_id bigint,
  contract_id bigint,
  CONSTRAINT allocation_buckets_pkey PRIMARY KEY (id),
  CONSTRAINT allocation_buckets_product_variant_id_fkey FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT allocation_buckets_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT allocation_buckets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.allocation_holds (
  id bigint NOT NULL DEFAULT nextval('allocation_holds_id_seq'::regclass),
  org_id bigint NOT NULL,
  allocation_bucket_id bigint NOT NULL,
  quantity integer NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  booking_ref text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT allocation_holds_pkey PRIMARY KEY (id),
  CONSTRAINT allocation_holds_allocation_bucket_id_fkey FOREIGN KEY (allocation_bucket_id) REFERENCES public.allocation_buckets(id),
  CONSTRAINT allocation_holds_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.booking_item_addons (
  id bigint NOT NULL DEFAULT nextval('booking_item_addons_id_seq'::regclass),
  org_id bigint NOT NULL,
  booking_item_id bigint NOT NULL,
  addon_id bigint,
  quantity integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT booking_item_addons_pkey PRIMARY KEY (id),
  CONSTRAINT booking_item_addons_booking_item_id_fkey FOREIGN KEY (booking_item_id) REFERENCES public.booking_items(id),
  CONSTRAINT booking_item_addons_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES public.product_addons(id),
  CONSTRAINT booking_item_addons_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.booking_items (
  id bigint NOT NULL DEFAULT nextval('booking_items_id_seq'::regclass),
  org_id bigint NOT NULL,
  booking_id bigint NOT NULL,
  product_variant_id bigint NOT NULL,
  supplier_id bigint,
  state text NOT NULL,
  service_start timestamp with time zone NOT NULL,
  service_end timestamp without time zone,
  quantity integer NOT NULL DEFAULT 1,
  pax_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  unit_cost numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  margin numeric NOT NULL DEFAULT 0,
  product_variant_name text NOT NULL,
  supplier_name text,
  rate_plan_code text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT booking_items_pkey PRIMARY KEY (id),
  CONSTRAINT booking_items_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT booking_items_product_variant_id_fkey FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT booking_items_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT booking_items_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.bookings (
  id bigint NOT NULL DEFAULT nextval('bookings_id_seq'::regclass),
  org_id bigint NOT NULL,
  reference text NOT NULL,
  channel text NOT NULL,
  status text NOT NULL,
  total_cost numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  total_margin numeric NOT NULL DEFAULT 0,
  currency text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.commission_payments (
  id bigint NOT NULL DEFAULT nextval('commission_payments_id_seq'::regclass),
  org_id bigint NOT NULL,
  agent_id bigint NOT NULL,
  amount numeric NOT NULL,
  paid_at timestamp with time zone NOT NULL,
  reference text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT commission_payments_pkey PRIMARY KEY (id),
  CONSTRAINT commission_payments_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id),
  CONSTRAINT commission_payments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.contract_deadlines (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  org_id bigint NOT NULL,
  ref_type text NOT NULL CHECK (ref_type = ANY (ARRAY['allocation'::text, 'contract'::text, 'booking'::text])),
  ref_id bigint NOT NULL,
  deadline_type text NOT NULL,
  deadline_date date NOT NULL,
  penalty_type text,
  penalty_value numeric,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'met'::text, 'missed'::text, 'waived'::text])),
  actioned_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contract_deadlines_pkey PRIMARY KEY (id),
  CONSTRAINT contract_deadlines_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.contract_versions (
  id bigint NOT NULL DEFAULT nextval('contract_versions_id_seq'::regclass),
  org_id bigint NOT NULL,
  contract_id bigint NOT NULL,
  valid_from date NOT NULL,
  valid_to date NOT NULL,
  supersedes_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  commission_rate numeric CHECK (commission_rate IS NULL OR commission_rate >= 0::numeric AND commission_rate <= 100::numeric),
  currency text DEFAULT 'USD'::text,
  booking_cutoff_days integer CHECK (booking_cutoff_days IS NULL OR booking_cutoff_days > 0),
  cancellation_policies jsonb NOT NULL DEFAULT '[]'::jsonb,
  payment_policies jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT contract_versions_pkey PRIMARY KEY (id),
  CONSTRAINT contract_versions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id),
  CONSTRAINT contract_versions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT contract_versions_supersedes_id_fkey FOREIGN KEY (supersedes_id) REFERENCES public.contract_versions(id)
);
CREATE TABLE public.contracts (
  id bigint NOT NULL DEFAULT nextval('contracts_id_seq'::regclass),
  org_id bigint NOT NULL,
  supplier_id bigint NOT NULL,
  reference text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  contract_type text CHECK (contract_type = ANY (ARRAY['net_rate'::text, 'commissionable'::text, 'allocation'::text])),
  signed_date date,
  notes text,
  signed_document_url text,
  terms_and_conditions text,
  special_terms text,
  CONSTRAINT contracts_pkey PRIMARY KEY (id),
  CONSTRAINT contracts_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT contracts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.fulfillment_tasks (
  id bigint NOT NULL DEFAULT nextval('fulfillment_tasks_id_seq'::regclass),
  org_id bigint NOT NULL,
  booking_item_id bigint NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  due_at timestamp without time zone,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fulfillment_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT fulfillment_tasks_booking_item_id_fkey FOREIGN KEY (booking_item_id) REFERENCES public.booking_items(id),
  CONSTRAINT fulfillment_tasks_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.inventory_pools (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  org_id bigint NOT NULL,
  supplier_id bigint NOT NULL,
  name text NOT NULL,
  description text,
  pool_type text NOT NULL DEFAULT 'shared'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inventory_pools_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_pools_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT inventory_pools_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
);
CREATE TABLE public.org_settings (
  org_id bigint NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT org_settings_pkey PRIMARY KEY (org_id),
  CONSTRAINT org_settings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.organizations (
  id bigint NOT NULL DEFAULT nextval('organizations_id_seq'::regclass),
  name text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.package_components (
  id bigint NOT NULL DEFAULT nextval('package_components_id_seq'::regclass),
  org_id bigint NOT NULL,
  package_id bigint NOT NULL,
  product_variant_id bigint NOT NULL,
  sequence integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  pricing_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT package_components_pkey PRIMARY KEY (id),
  CONSTRAINT package_components_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id),
  CONSTRAINT package_components_product_variant_id_fkey FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT package_components_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.packages (
  id bigint NOT NULL DEFAULT nextval('packages_id_seq'::regclass),
  org_id bigint NOT NULL,
  name text NOT NULL,
  description text,
  pricing_mode text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT packages_pkey PRIMARY KEY (id),
  CONSTRAINT packages_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.passengers (
  id bigint NOT NULL DEFAULT nextval('passengers_id_seq'::regclass),
  org_id bigint NOT NULL,
  booking_id bigint NOT NULL,
  full_name text NOT NULL,
  dob date,
  age integer,
  gender text,
  passport text,
  nationality text,
  dietary text,
  medical text,
  is_lead boolean NOT NULL DEFAULT false,
  assignment jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT passengers_pkey PRIMARY KEY (id),
  CONSTRAINT passengers_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT passengers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.payment_schedules (
  id bigint NOT NULL DEFAULT nextval('payment_schedules_id_seq'::regclass),
  org_id bigint NOT NULL,
  booking_id bigint NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  due_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payment_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT payment_schedules_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT payment_schedules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.payments (
  id bigint NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
  org_id bigint NOT NULL,
  payment_schedule_id bigint NOT NULL,
  amount numeric NOT NULL,
  received_at timestamp with time zone NOT NULL,
  method text NOT NULL,
  status text NOT NULL,
  reference text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_payment_schedule_id_fkey FOREIGN KEY (payment_schedule_id) REFERENCES public.payment_schedules(id),
  CONSTRAINT payments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.product_addons (
  id bigint NOT NULL DEFAULT nextval('product_addons_id_seq'::regclass),
  org_id bigint NOT NULL,
  product_variant_id bigint NOT NULL,
  name text NOT NULL,
  price_type text NOT NULL,
  amount numeric NOT NULL,
  taxable boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_addons_pkey PRIMARY KEY (id),
  CONSTRAINT product_addons_product_variant_id_fkey FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT product_addons_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.product_subtypes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  org_id bigint NOT NULL,
  product_type_id bigint,
  name text NOT NULL,
  description text,
  icon text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_subtypes_pkey PRIMARY KEY (id),
  CONSTRAINT product_subtypes_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT product_subtypes_product_type_id_fkey FOREIGN KEY (product_type_id) REFERENCES public.product_types(id)
);
CREATE TABLE public.product_templates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  product_type text NOT NULL,
  template_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.product_types (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  org_id bigint NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  color text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_types_pkey PRIMARY KEY (id),
  CONSTRAINT product_types_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.product_variants (
  id bigint NOT NULL DEFAULT nextval('product_variants_id_seq'::regclass),
  org_id bigint NOT NULL,
  product_id bigint NOT NULL,
  name text NOT NULL,
  subtype text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  product_subtype_id bigint,
  images jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_variants_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT product_variants_product_subtype_id_fkey FOREIGN KEY (product_subtype_id) REFERENCES public.product_subtypes(id)
);
CREATE TABLE public.products (
  id bigint NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  org_id bigint NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  product_type_id bigint,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT products_product_type_id_fkey FOREIGN KEY (product_type_id) REFERENCES public.product_types(id)
);
CREATE TABLE public.rate_adjustments (
  id bigint NOT NULL DEFAULT nextval('rate_adjustments_id_seq'::regclass),
  org_id bigint NOT NULL,
  rate_plan_id bigint NOT NULL,
  scope text NOT NULL,
  condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  adjustment_type text NOT NULL,
  value numeric NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rate_adjustments_pkey PRIMARY KEY (id),
  CONSTRAINT rate_adjustments_rate_plan_id_fkey FOREIGN KEY (rate_plan_id) REFERENCES public.rate_plans(id),
  CONSTRAINT rate_adjustments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.rate_age_bands (
  id bigint NOT NULL DEFAULT nextval('rate_age_bands_id_seq'::regclass),
  org_id bigint NOT NULL,
  rate_plan_id bigint NOT NULL,
  label text NOT NULL,
  min_age integer NOT NULL,
  max_age integer NOT NULL,
  price_type text NOT NULL,
  value numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rate_age_bands_pkey PRIMARY KEY (id),
  CONSTRAINT rate_age_bands_rate_plan_id_fkey FOREIGN KEY (rate_plan_id) REFERENCES public.rate_plans(id),
  CONSTRAINT rate_age_bands_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.rate_occupancies (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  org_id bigint NOT NULL,
  rate_plan_id bigint NOT NULL,
  min_occupancy integer NOT NULL,
  max_occupancy integer NOT NULL,
  pricing_model text NOT NULL CHECK (pricing_model = ANY (ARRAY['fixed'::text, 'base_plus_pax'::text, 'per_person'::text])),
  base_amount numeric NOT NULL,
  per_person_amount numeric CHECK (per_person_amount IS NULL OR per_person_amount >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rate_occupancies_pkey PRIMARY KEY (id),
  CONSTRAINT rate_occupancies_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT rate_occupancies_rate_plan_id_fkey FOREIGN KEY (rate_plan_id) REFERENCES public.rate_plans(id)
);
CREATE TABLE public.rate_plans (
  id bigint NOT NULL DEFAULT nextval('rate_plans_id_seq'::regclass),
  org_id bigint NOT NULL,
  product_variant_id bigint NOT NULL,
  supplier_id bigint NOT NULL,
  contract_version_id bigint NOT NULL,
  inventory_model text NOT NULL,
  currency text NOT NULL,
  markets ARRAY,
  channels ARRAY,
  preferred boolean NOT NULL DEFAULT false,
  valid_from date NOT NULL,
  valid_to date NOT NULL,
  rate_doc jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  priority integer DEFAULT 100,
  CONSTRAINT rate_plans_pkey PRIMARY KEY (id),
  CONSTRAINT rate_plans_product_variant_id_fkey FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT rate_plans_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT rate_plans_contract_version_id_fkey FOREIGN KEY (contract_version_id) REFERENCES public.contract_versions(id),
  CONSTRAINT rate_plans_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.rate_seasons (
  id bigint NOT NULL DEFAULT nextval('rate_seasons_id_seq'::regclass),
  org_id bigint NOT NULL,
  rate_plan_id bigint NOT NULL,
  season_from date NOT NULL,
  season_to date NOT NULL,
  dow_mask integer NOT NULL DEFAULT 127,
  min_stay integer,
  max_stay integer,
  min_pax integer,
  max_pax integer,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rate_seasons_pkey PRIMARY KEY (id),
  CONSTRAINT rate_seasons_rate_plan_id_fkey FOREIGN KEY (rate_plan_id) REFERENCES public.rate_plans(id),
  CONSTRAINT rate_seasons_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.rate_taxes_fees (
  id bigint NOT NULL DEFAULT nextval('rate_taxes_fees_id_seq'::regclass),
  org_id bigint NOT NULL,
  rate_plan_id bigint NOT NULL,
  name text NOT NULL,
  jurisdiction text,
  inclusive boolean NOT NULL DEFAULT false,
  calc_base text NOT NULL,
  amount_type text NOT NULL,
  value numeric NOT NULL,
  rounding_rule text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rate_taxes_fees_pkey PRIMARY KEY (id),
  CONSTRAINT rate_taxes_fees_rate_plan_id_fkey FOREIGN KEY (rate_plan_id) REFERENCES public.rate_plans(id),
  CONSTRAINT rate_taxes_fees_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.room_assignments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  org_id bigint NOT NULL,
  booking_item_id bigint NOT NULL,
  room_number text,
  room_type text NOT NULL CHECK (room_type = ANY (ARRAY['single'::text, 'double'::text, 'twin'::text, 'triple'::text, 'quad'::text, 'suite'::text])),
  bedding_preference text,
  floor_preference text,
  adjacent_to bigint,
  status text NOT NULL DEFAULT 'requested'::text CHECK (status = ANY (ARRAY['requested'::text, 'confirmed'::text, 'checked_in'::text, 'checked_out'::text, 'cancelled'::text])),
  special_requests text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT room_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT room_assignments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT room_assignments_booking_item_id_fkey FOREIGN KEY (booking_item_id) REFERENCES public.booking_items(id),
  CONSTRAINT room_assignments_adjacent_to_fkey FOREIGN KEY (adjacent_to) REFERENCES public.room_assignments(id)
);
CREATE TABLE public.room_occupants (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  org_id bigint NOT NULL,
  room_assignment_id bigint NOT NULL,
  passenger_id bigint NOT NULL,
  is_lead boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT room_occupants_pkey PRIMARY KEY (id),
  CONSTRAINT room_occupants_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT room_occupants_room_assignment_id_fkey FOREIGN KEY (room_assignment_id) REFERENCES public.room_assignments(id),
  CONSTRAINT room_occupants_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.passengers(id)
);
CREATE TABLE public.supplier_payments (
  id bigint NOT NULL DEFAULT nextval('supplier_payments_id_seq'::regclass),
  org_id bigint NOT NULL,
  booking_item_id bigint NOT NULL,
  amount numeric NOT NULL,
  due_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  invoice_ref text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT supplier_payments_pkey PRIMARY KEY (id),
  CONSTRAINT supplier_payments_booking_item_id_fkey FOREIGN KEY (booking_item_id) REFERENCES public.booking_items(id),
  CONSTRAINT supplier_payments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.suppliers (
  id bigint NOT NULL DEFAULT nextval('suppliers_id_seq'::regclass),
  org_id bigint NOT NULL,
  name text NOT NULL,
  terms jsonb NOT NULL DEFAULT '{}'::jsonb,
  channels ARRAY,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT suppliers_pkey PRIMARY KEY (id),
  CONSTRAINT suppliers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.time_slots (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  org_id bigint NOT NULL,
  product_variant_id bigint NOT NULL,
  slot_time time without time zone NOT NULL,
  slot_name text,
  duration_minutes integer CHECK (duration_minutes > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT time_slots_pkey PRIMARY KEY (id),
  CONSTRAINT time_slots_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT time_slots_product_variant_id_fkey FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id)
);