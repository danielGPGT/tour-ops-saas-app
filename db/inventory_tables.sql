-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.allocation_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contract_allocation_id uuid NOT NULL,
  product_option_id uuid NOT NULL,
  total_quantity integer NOT NULL,
  available_quantity integer NOT NULL,
  sold_quantity integer DEFAULT 0,
  batch_cost_per_unit numeric,
  currency character varying DEFAULT 'USD'::character varying,
  is_virtual_capacity boolean DEFAULT false,
  minimum_viable_quantity integer,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT allocation_inventory_pkey PRIMARY KEY (id),
  CONSTRAINT allocation_inventory_contract_allocation_id_fkey FOREIGN KEY (contract_allocation_id) REFERENCES public.contract_allocations(id),
  CONSTRAINT allocation_inventory_product_option_id_fkey FOREIGN KEY (product_option_id) REFERENCES public.product_options(id)
);
CREATE TABLE public.allocation_pool_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  allocation_pool_id uuid NOT NULL,
  contract_allocation_id uuid NOT NULL,
  priority integer DEFAULT 0,
  units_used integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT allocation_pool_members_pkey PRIMARY KEY (id),
  CONSTRAINT allocation_pool_members_allocation_pool_id_fkey FOREIGN KEY (allocation_pool_id) REFERENCES public.allocation_pools(id),
  CONSTRAINT allocation_pool_members_contract_allocation_id_fkey FOREIGN KEY (contract_allocation_id) REFERENCES public.contract_allocations(id)
);
CREATE TABLE public.allocation_pools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_option_id uuid,
  pool_name character varying NOT NULL,
  pool_code character varying,
  usage_strategy character varying DEFAULT 'lowest_cost'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT allocation_pools_pkey PRIMARY KEY (id),
  CONSTRAINT allocation_pools_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT allocation_pools_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT allocation_pools_product_option_id_fkey FOREIGN KEY (product_option_id) REFERENCES public.product_options(id)
);
CREATE TABLE public.allocation_releases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contract_allocation_id uuid NOT NULL,
  release_date date NOT NULL,
  release_percentage numeric,
  release_quantity integer,
  penalty_applies boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT allocation_releases_pkey PRIMARY KEY (id),
  CONSTRAINT allocation_releases_contract_allocation_id_fkey FOREIGN KEY (contract_allocation_id) REFERENCES public.contract_allocations(id)
);
CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  entity_type character varying NOT NULL,
  entity_id uuid NOT NULL,
  action character varying NOT NULL,
  old_values jsonb,
  new_values jsonb,
  changed_by uuid,
  changed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  ip_address inet,
  user_agent text,
  CONSTRAINT audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT audit_log_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT audit_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id)
);
CREATE TABLE public.availability (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  allocation_inventory_id uuid NOT NULL,
  date date NOT NULL,
  total_available integer NOT NULL,
  booked integer DEFAULT 0,
  available integer NOT NULL,
  is_closed boolean DEFAULT false,
  last_modified timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT availability_pkey PRIMARY KEY (id),
  CONSTRAINT availability_allocation_inventory_id_fkey FOREIGN KEY (allocation_inventory_id) REFERENCES public.allocation_inventory(id)
);

CREATE TABLE public.contract_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  product_id uuid NOT NULL,
  allocation_name character varying,
  allocation_type USER-DEFINED DEFAULT 'on_request'::allocation_type,
  total_quantity integer,
  valid_from date NOT NULL,
  valid_to date NOT NULL,
  total_cost numeric,
  cost_per_unit numeric,
  currency character varying DEFAULT 'USD'::character varying,
  release_days integer,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT contract_allocations_pkey PRIMARY KEY (id),
  CONSTRAINT contract_allocations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT contract_allocations_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id),
  CONSTRAINT contract_allocations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  supplier_id uuid,
  event_id uuid,
  contract_number character varying NOT NULL,
  contract_name character varying,
  contract_type character varying DEFAULT 'on_request'::character varying,
  valid_from date NOT NULL,
  valid_to date NOT NULL,
  currency character varying DEFAULT 'USD'::character varying,
  total_cost numeric,
  commission_rate numeric,
  payment_terms text,
  cancellation_policy text,
  terms_and_conditions text,
  contract_files jsonb DEFAULT '[]'::jsonb,
  notes text,
  status USER-DEFINED DEFAULT 'draft'::contract_status,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  CONSTRAINT contracts_pkey PRIMARY KEY (id),
  CONSTRAINT contracts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT contracts_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT contracts_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT contracts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
create table public.events (
  id uuid not null default gen_random_uuid (),
  organization_id uuid null,
  event_name character varying(255) not null,
  event_code character varying(50) null,
  event_type character varying(50) null,
  venue_name character varying(255) null,
  city character varying(100) null,
  country character varying(2) null,
  event_date_from date not null,
  event_date_to date not null,
  event_status character varying(20) null default 'scheduled'::character varying,
  description text null,
  event_image_url text null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint events_pkey primary key (id),
  constraint events_organization_id_fkey foreign KEY (organization_id) references organizations (id)
) TABLESPACE pg_default;

create index IF not exists idx_events_dates on public.events using btree (event_date_from, event_date_to) TABLESPACE pg_default;

create index IF not exists idx_events_upcoming on public.events using btree (event_date_from) TABLESPACE pg_default;

create trigger update_events_updated_at BEFORE
update on events for EACH row
execute FUNCTION update_updated_at_column ();
CREATE TABLE public.product_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  option_name character varying NOT NULL,
  option_code character varying NOT NULL,
  description text,
  attributes jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  sort_order integer,
  CONSTRAINT product_options_pkey PRIMARY KEY (id),
  CONSTRAINT product_options_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  product_type_id uuid NOT NULL,
  name character varying NOT NULL,
  code character varying NOT NULL,
  description text,
  location jsonb,
  venue_name character varying,
  attributes jsonb DEFAULT '{}'::jsonb,
  event_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  media jsonb DEFAULT '[]'::jsonb CHECK (jsonb_typeof(media) = 'array'::text),
  tags ARRAY DEFAULT '{}'::text[],
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT products_product_type_id_fkey FOREIGN KEY (product_type_id) REFERENCES public.product_types(id),
  CONSTRAINT products_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.selling_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_option_id uuid,
  rate_name character varying,
  rate_basis character varying NOT NULL,
  valid_from date NOT NULL,
  valid_to date NOT NULL,
  base_price numeric NOT NULL,
  currency character varying DEFAULT 'USD'::character varying,
  markup_type character varying,
  markup_amount numeric,
  pricing_details jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  target_cost numeric,
  CONSTRAINT selling_rates_pkey PRIMARY KEY (id),
  CONSTRAINT selling_rates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT selling_rates_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT selling_rates_product_option_id_fkey FOREIGN KEY (product_option_id) REFERENCES public.product_options(id)
);
CREATE TABLE public.supplier_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_option_id uuid,
  contract_id uuid,
  rate_name character varying,
  rate_basis character varying NOT NULL,
  valid_from date NOT NULL,
  valid_to date NOT NULL,
  base_cost numeric NOT NULL,
  currency character varying DEFAULT 'USD'::character varying,
  pricing_details jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  supplier_id uuid,
  CONSTRAINT supplier_rates_pkey PRIMARY KEY (id),
  CONSTRAINT supplier_rates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT supplier_rates_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT supplier_rates_product_option_id_fkey FOREIGN KEY (product_option_id) REFERENCES public.product_options(id),
  CONSTRAINT supplier_rates_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id),
  CONSTRAINT supplier_rates_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
);
create table public.suppliers (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  name character varying(255) not null,
  code character varying(50) not null,
  supplier_type character varying(50) null,
  email character varying(255) null,
  phone character varying(50) null,
  contact_info jsonb null,
  address_line1 character varying(255) null,
  city character varying(100) null,
  country character varying(2) null,
  default_currency character varying(3) null default 'USD'::character varying,
  is_active boolean null default true,
  notes text null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint suppliers_pkey primary key (id),
  constraint suppliers_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_suppliers_org on public.suppliers using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_suppliers_active on public.suppliers using btree (is_active) TABLESPACE pg_default
where
  (is_active = true);

create trigger update_suppliers_updated_at BEFORE
update on suppliers for EACH row
execute FUNCTION update_updated_at_column ();