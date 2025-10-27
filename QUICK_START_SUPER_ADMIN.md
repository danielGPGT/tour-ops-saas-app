# Quick Start: Super Admin Setup

## The Problem
The admin page is showing an error because the database migration hasn't been applied yet.

## Quick Fix

### Step 1: Apply the Migration

You need to run the migration file in your Supabase database. Here's how:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project (Project ID: xhjxfpnsxxnwcfhadgad)

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste Migration**
   - Open the file: `db/migrations/006_super_admin_system.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor
   - Click "Run" or press Cmd+Enter

4. **Verify Success**
   - You should see a success message
   - Check if the functions were created:
     - Click "Database" → "Functions"
     - You should see: `get_all_organizations`, `create_organization_with_admin`, etc.

### Step 2: Change Super Admin Credentials

**⚠️ SECURITY: Do this immediately!**

After running the migration, you'll have a default super admin:
- Email: `admin@system.com`
- Password: `CHANGE_THIS_PASSWORD_HASH`

Update it in Supabase SQL Editor:

```sql
-- First, generate a password hash (or use your auth system)
-- Then update the super admin:
UPDATE users 
SET 
  email = 'your-real-email@example.com',
  password_hash = '$2a$10$YOUR_HASHED_PASSWORD_HERE'
WHERE email = 'admin@system.com'
AND is_super_admin = true;
```

### Step 3: Refresh the Page

Go back to your app and refresh `/admin/organizations`

The error should be gone and you'll see your organizations!

## What the Migration Does

The migration adds:
- ✅ `is_super_admin` column to users table
- ✅ Subscription plan columns to organizations table
- ✅ User limit tracking
- ✅ 4 RPC functions for managing organizations
- ✅ Default super admin user

## Troubleshooting

### Still seeing errors?

1. **Check browser console** - Look for the actual error message
2. **Check Supabase logs** - Go to Logs → Postgres Logs
3. **Verify migration ran** - Go to Database → Functions and check if functions exist
4. **Check table structure** - Go to Database → Tables → organizations and verify new columns exist

### Common Issues

**Error: "relation does not exist"**
- The migration didn't run completely
- Check Supabase logs for SQL errors

**Error: "permission denied"**
- Make sure you're logged into Supabase dashboard
- Try running the migration again

**Page still shows error**
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for new errors

## Next Steps

Once the migration is applied:

1. ✅ Create your first organization via the admin page
2. ✅ Set up proper authentication
3. ✅ Add route protection for `/admin/*`
4. ✅ Configure password hashing

## Need Help?

If you're still stuck, check:
- Migration file: `db/migrations/006_super_admin_system.sql`
- Admin page: `app/admin/organizations/page.tsx`
- Documentation: `db/migrations/README_SUPER_ADMIN.md`
