# Database Setup Guide

## Current Issue
The application is trying to connect to a Supabase database but can't reach it because the environment variables are not configured.

## Error Details
```
Can't reach database server at `aws-1-eu-west-2.pooler.supabase.com:5432`
```

## Solution

### Step 1: Create Environment File
Create a `.env.local` file in the root directory with the following content:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_PROJECT_ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"

# Optional: Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"
```

### Step 2: Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (or create a new one)
3. **Go to Settings > Database**
4. **Copy the Connection String** (URI format)
5. **Go to Settings > API**
6. **Copy the Project URL and anon/public key**

### Step 3: Replace Placeholders

Replace the following in your `.env.local` file:

- `[YOUR_PASSWORD]` → Your database password
- `[YOUR_PROJECT_ID]` → Your Supabase project ID
- `[YOUR_ANON_KEY]` → Your Supabase anon key
- `[YOUR_SERVICE_ROLE_KEY]` → Your Supabase service role key (optional)

### Step 4: Initialize Database

After setting up the environment variables:

```bash
# Generate Prisma client
npx prisma generate

# Push the schema to your database
npx prisma db push

# (Optional) Seed the database with initial data
npx prisma db seed
```

## Alternative: Local Development Database

If you don't want to use Supabase for development, you can set up a local PostgreSQL database:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/tour_ops_dev"
```

Then install PostgreSQL locally and create the database:

```sql
CREATE DATABASE tour_ops_dev;
```

## Troubleshooting

### Connection Issues
- Verify your Supabase project is active
- Check if your IP is whitelisted in Supabase (if using IP restrictions)
- Ensure the database password is correct

### Environment Variables
- Make sure `.env.local` is in the root directory
- Restart your development server after adding environment variables
- Check that there are no extra spaces or quotes in the values

### Prisma Issues
- Run `npx prisma generate` after changing the schema
- Use `npx prisma db push` to sync schema changes
- Check `npx prisma studio` to verify database connection
