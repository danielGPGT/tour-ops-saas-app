# Database Setup Script

## Quick Setup Guide

### Step 1: Create Environment File

Create a `.env.local` file in your project root:

```bash
# Copy the example file
cp .env.example .env.local
```

Or create it manually with this content:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_PROJECT_ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"

# Optional: Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"
```

### Step 2: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to **Settings > Database**
4. Copy the **Connection String** (URI format)
5. Go to **Settings > API**
6. Copy the **Project URL** and **anon/public key**

### Step 3: Update Environment Variables

Replace the placeholders in `.env.local`:
- `[YOUR_PASSWORD]` → Your database password
- `[YOUR_PROJECT_ID]` → Your Supabase project ID
- `[YOUR_ANON_KEY]` → Your Supabase anon key

### Step 4: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push the schema to your database
npx prisma db push

# (Optional) Seed with initial data
npx prisma db seed
```

### Step 5: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Verification

After setup, you should see:
- ✅ No database connection errors
- ✅ Real data in suppliers and contracts pages
- ✅ Working forms and actions

## Troubleshooting

### Still Getting Connection Errors?

1. **Check your credentials** - Make sure the DATABASE_URL is correct
2. **Verify Supabase project** - Ensure the project is active
3. **Check network** - Make sure you can reach Supabase servers
4. **Restart server** - Always restart after changing environment variables

### Common Issues

- **Wrong password**: Double-check the database password
- **Wrong project ID**: Make sure you're using the correct Supabase project
- **Missing environment file**: Ensure `.env.local` is in the project root
- **Cached connection**: Restart the development server

### Getting Help

If you're still having issues:
1. Check the Supabase dashboard for project status
2. Verify your IP is whitelisted (if using IP restrictions)
3. Try the connection string in a database client like pgAdmin
