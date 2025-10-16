# Database Connection Troubleshooting

## Current Issues Fixed

### 1. Supabase Server Configuration
- ✅ Fixed `cookies()` and `headers()` async issues in Next.js 15
- ✅ Updated `createSupabaseServerClient()` to be async

### 2. Prisma Connection Pooling
- ✅ Added connection timeout configurations
- ✅ Enhanced error handling and logging
- ✅ Created safe database query wrapper

## Environment Variables Setup

### Required Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration (from project dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Alternative naming (some templates use this):
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# Database Configuration (for Prisma)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"

# Optional: Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### How to Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings > API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Go to **Settings > Database**
6. Copy the **Connection string** → `DATABASE_URL`

### Important DATABASE_URL Format

For Supabase with connection pooling, use this format:

```
postgresql://postgres:[PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

**Key parameters:**
- `pgbouncer=true` - Enables connection pooling
- `connection_limit=1` - Limits connections per client (important for serverless)

### Alternative Direct Connection (if pooling doesn't work)

If you continue having issues, try the direct connection:

```
postgresql://postgres:[PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
```

## Troubleshooting Steps

### 1. Verify Your Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings > Database**
4. Copy the **Connection String** (URI format)
5. Make sure to use the **Pooler** connection string, not the direct one

### 2. Check Your Environment Variables

```bash
# Check if variables are loaded
echo $DATABASE_URL
echo $NEXT_PUBLIC_SUPABASE_URL
```

### 3. Test Database Connection

```bash
# Test Prisma connection
npx prisma db push

# Generate Prisma client
npx prisma generate

# Test with Prisma Studio
npx prisma studio
```

### 4. Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Common Issues and Solutions

### Issue: "Can't reach database server"
**Solution:**
1. Verify your Supabase project is active
2. Check if your IP is whitelisted (if using IP restrictions)
3. Ensure you're using the correct connection string format

### Issue: Connection keeps connecting/disconnecting
**Solution:**
1. Use the pooler connection string with `pgbouncer=true`
2. Add `connection_limit=1` parameter
3. Check if you have too many concurrent connections

### Issue: "cookies() should be awaited" error
**Solution:**
- ✅ Already fixed in the codebase
- This was a Next.js 15 compatibility issue

### Issue: Prisma client errors
**Solution:**
1. Regenerate Prisma client: `npx prisma generate`
2. Push schema to database: `npx prisma db push`
3. Check your schema file for any issues

## Verification

After fixing these issues, you should see:

1. ✅ No more Supabase server errors
2. ✅ No more Prisma connection errors
3. ✅ Database status shows "connected" on the home page
4. ✅ All pages load without database errors

## Still Having Issues?

If you're still experiencing problems:

1. **Check Supabase Status**: Visit [status.supabase.com](https://status.supabase.com)
2. **Verify Network**: Try accessing your Supabase project from a different network
3. **Check Logs**: Look at your Supabase project logs in the dashboard
4. **Test with Different Client**: Try connecting with a tool like pgAdmin or DBeaver

## Next Steps

Once the connection is stable:
1. Run `npx prisma db push` to sync your schema
2. Optionally run `npx prisma db seed` to add sample data
3. Test all your pages to ensure they're working correctly
