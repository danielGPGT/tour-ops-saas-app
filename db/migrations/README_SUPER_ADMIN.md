# Super Admin System Documentation

## Overview

The super admin system allows you to manage organizations and their users without needing invitations. A super admin is distinct from organization admins - they manage the entire software platform.

## What Was Created

### 1. Database Migration: `006_super_admin_system.sql`

**Added to `users` table:**
- `is_super_admin BOOLEAN` - Flag to identify super admins

**Added to `organizations` table:**
- `subscription_plan VARCHAR(50)` - Free, Starter, Professional, Enterprise
- `subscription_status VARCHAR(50)` - Active, Trial, Cancelled, etc.
- `max_users INTEGER` - User limit for the organization
- `current_users INTEGER` - Current user count

**Database Functions:**
- `create_organization_with_admin()` - Create org + admin user in one step
- `get_all_organizations()` - List all organizations
- `toggle_organization_status()` - Activate/deactivate orgs
- `update_organization_subscription()` - Change subscription plan

**Initial Super Admin:**
- Default super admin: `admin@system.com`
- **⚠️ You MUST change this email and password!**

### 2. Admin Page: `app/admin/organizations/page.tsx`

Features:
- View all organizations
- Create new organizations with admin users
- Set subscription plans
- Activate/deactivate organizations
- View user counts per organization

## How to Use

### Step 1: Run the Migrations

```bash
# Apply the migrations to your Supabase database
psql -h your-db-host -U postgres -d your_db -f db/migrations/006_super_admin_system.sql
```

### Step 2: Change the Super Admin Credentials

After running the migration, you'll have a super admin:
- Email: `admin@system.com`
- Password: `CHANGE_THIS_PASSWORD_HASH`

**DO THIS IMMEDIATELY:**

1. Log into your database
2. Update the super admin:
```sql
UPDATE users 
SET 
  email = 'your-real-email@example.com',
  password_hash = '$2a$10$YOUR_HASHED_PASSWORD_HERE'
WHERE email = 'admin@system.com';
```

### Step 3: Access the Admin Panel

Navigate to: `/admin/organizations`

Only users with `is_super_admin = true` should be able to access this page.

### Step 4: Create Your First Organization

1. Click "Create Organization"
2. Fill in organization details
3. Set subscription plan (Free, Starter, Professional, Enterprise)
4. Create the initial admin user
5. Click "Create Organization"

The system will:
- Create the organization
- Create the admin user with role `owner`
- Set up the subscription
- Initialize user counts

## Super Admin vs Organization Admin

| Feature | Super Admin | Organization Admin |
|---------|-------------|-------------------|
| Role | Manages entire software | Manages their organization |
| Access | All organizations | Only their organization |
| Can Create Orgs | ✅ Yes | ❌ No |
| Can Invite Users | ❌ No | ✅ Yes (within their org) |
| Login Path | `/admin/organizations` | `/dashboard` |

## Protecting the Admin Route

You should add middleware to protect `/admin/*` routes:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname

  // Protect admin routes
  if (url.startsWith('/admin')) {
    // Check if user is super admin
    const isSuperAdmin = request.cookies.get('is_super_admin')?.value === 'true'
    
    if (!isSuperAdmin) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}
```

## Subscription Plans

Default plans included:
- **Free** - 5 users max
- **Starter** - 10 users max
- **Professional** - 50 users max
- **Enterprise** - Unlimited users

You can customize these in the migration file.

## Next Steps

1. ✅ Run migration `006_super_admin_system.sql`
2. ✅ Change super admin credentials
3. ⚠️ Add route protection for `/admin/*`
4. ⚠️ Add password hashing to `create_organization_with_admin`
5. ⚠️ Connect to Supabase Auth (if using it)
6. ⚠️ Set up proper authentication flow

## Security Notes

- The super admin password is stored as plain text in the migration
- You should hash passwords before storing them
- Consider integrating with Supabase Auth for better security
- Add 2FA for super admin accounts

## Support

If you have questions or issues, check:
- Migration logs in Supabase
- Browser console for errors
- Server logs for RPC errors
