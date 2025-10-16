Tour Ops SaaS – Multi‑Tenant Inventory, Quotes, and Bookings Platform
====================================================================

What this is
-------------
An enterprise‑grade, multi‑tenant SaaS for small–medium tour operators to manage suppliers, products, contracts, rates, availability, quotes and bookings, payments, supplier payables, agent commissions, and operations. Tenants (organizations) have users, seats, roles/permissions, and subscription tiers that gate features.

Core goals
----------
- Multi‑tenant by design with strict tenant isolation on all data operations
- Enterprise‑ready inventory and pricing: suppliers, contracts, rate plans, seasons, occupancy/age, channel pricing, taxes/fees
- Availability models: committed, on‑request, freesale; holds and release/stop‑sell
- Full booking lifecycle: search → price → book → supplier confirm → fulfill → settle money in/out
- Operability: audit logs, observability, performance, i18n/timezones/currency

Tech stack
---------
- Web: Next.js 15 App Router (React 19), TypeScript, Server/Client Components
- UI: shadcn/ui (v3) + Tailwind CSS v4, lucide-react icons, app‑wide theme tokens (see `app/globals.css`)
- Auth: Supabase Auth (JWT) – or pluggable later
- Database: Supabase Postgres
- ORM: Prisma 5 (hybrid normalized schema)
- Pricing/Availability: hybrid model (normalized tables + `rate_doc` JSON for write/import)

Architecture at a glance
------------------------
- App shell: shadcn Sidebar + Header; content inside rounded card container
- Domain model (Postgres): organizations, suppliers, products, product_variants, contracts + contract_versions, rate_plans (+ rate_seasons, rate_occupancies, rate_age_bands, rate_adjustments, rate_taxes_fees), allocation_buckets + allocation_holds, packages + components, bookings + items + addons + passengers, payment_schedules + payments, supplier_payments, agents + agent_commissions + commission_payments, fulfillment_tasks
- Pricing evaluation order: base → season → DOW → occupancy/age → group → channel → promo → taxes/fees → rounding
- Availability: daily buckets with quantity/booked/held; multi‑night = must satisfy all nights; holds auto‑expire

Local development
-----------------
1) Prereqs
- Node 20+, npm
- Supabase project (or Postgres). Get credentials from Supabase → Settings → Database.

2) Environment
Create `.env` (CLI reads `.env`; app reads `.env.local` in dev). Use one of these DATABASE_URLs:

- Direct (IPv6 networks):
  `postgresql://postgres:DB_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require`

- Session Pooler (IPv4; recommended for Prisma/CLI):
  `postgresql://postgres.PROJECT_REF:DB_PASSWORD@aws-REGION.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=1`

- Transaction Pooler (serverless only):
  `postgresql://postgres.PROJECT_REF:DB_PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1`
  and set `PRISMA_DISABLE_PREPARED_STATEMENTS=1`

Also add:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

3) Install & DB sync
```
npm install
npm run prisma:generate
npm run db:push
```

4) Seed (optional)
```
npm run db:seed
```

5) Run
```
npm run dev
```

Project structure (high level)
------------------------------
```
app/
  layout.tsx           # App shell (Header + Sidebar container)
  page.tsx             # Status check
components/
  AppSidebar.tsx       # shadcn sidebar
  Header.tsx           # top bar
  ui/                  # shadcn primitives (sidebar, accordion, ...)
db/
  initial_schema.sql   # Initial normalized SQL schema (reference)
lib/
  db.ts                # Prisma client helper
prisma/
  schema.prisma        # Prisma models aligned with SQL
  seed.ts              # Minimal seed (org/supplier/product/variant/etc.)
```

Theming & tokens
----------------
All colors/radius/border tokens are defined in `app/globals.css`. Use Tailwind utilities that map to these tokens (e.g., `bg-sidebar`, `text-sidebar-foreground`, `border-border`, `bg-card`, `text-muted-foreground`). Keep custom colors out of components.

Feature roadmap (phased)
------------------------
Phase 0 – Foundation (Done/Partial)
- App shell with shadcn Sidebar + Header
- Supabase client/server wiring
- Prisma schema covering inventory/booking/payments
- Seed + basic status page

Phase 1 – Inventory MVP
- Suppliers CRUD
- Products + Variants CRUD (extensible `attributes`)
- Contracts + immutable contract_versions
- Rate plan builder: accept `rate_doc` JSON; materialize to normalized tables
- Availability management (allocation_buckets UI)

Phase 2 – Sales MVP
- Quote builder: search variant → select supplier/rate plan → compute price
- Booking creation: items, passengers, add‑ons, payment schedule
- Supplier confirmation flows: committed vs on‑request

Phase 3 – Finance & Ops
- Customer payments (Stripe integration), reconciliation status
- Supplier payables and due tracking
- Agent commissions and payouts
- Fulfillment tasks (transfers/tickets/rooming lists)

Phase 4 – Enterprise
- RBAC & org seats; feature flags per subscription tier
- Audit logging across critical mutations
- Observability (structured logs/metrics/tracing) + alerts
- i18n, currency FX, timezone handling
- Usage metering and tier limits

Security & tenancy
------------------
- Every hot path queries by `org_id` (enforced across Prisma code)
- Consider Postgres RLS as defense‑in‑depth (when Supabase Auth is finalized)
- Separate secrets by environment; rotate regularly; least privilege DB roles

Performance
-----------
- Covering indexes for time‑range queries
- Partition hot tables over date/org when volume grows (allocations, booking_items, payments)
- Cache candidate rate plans and availability snapshots (Redis) if needed

CI/CD & hosting
---------------
- Vercel for Next.js frontend/server components
- Supabase Postgres (managed). Configure env via platform secrets
- Use `prisma migrate dev` locally and `prisma migrate deploy` in CI for versioned schema changes (use `db:push` only for early dev)

Developer workflow
------------------
- Add or change Prisma models → `npm run prisma:generate` → `npm run db:push` (or migrations)
- Keep UI components on theme tokens from `globals.css`
- Prefer Server Components for data reads; Client Components for interactions

Domain notes (short)
--------------------
- Rate plans connect supplier ↔ contract_version ↔ product_variant and define inventory model + pricing
- Availability uses per‑date buckets; holds tracked separately with expiry
- Pricing evaluation order is deterministic and auditable; store computed breakdown on `booking_items`

Useful scripts
--------------
```
npm run dev                # start app
npm run prisma:generate    # generate prisma client
npm run db:push            # sync prisma schema to DB (dev)
npm run db:migrate         # apply migrations (prod/CI)
npm run db:studio          # open Prisma Studio
npm run db:seed            # seed demo data
```

References
----------
- shadcn/ui Sidebar docs: https://v3.shadcn.com/docs/components/sidebar
- Prisma: https://www.prisma.io/docs
- Supabase: https://supabase.com/docs

Questions / next steps
----------------------
- Do you want Supabase Auth wired immediately (RLS + org_id in JWT claims), or proceed with local admin onboarding first?
- Should we cut an initial Suppliers UI (list/create/edit) next, or build the Rate Plan builder first?

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
