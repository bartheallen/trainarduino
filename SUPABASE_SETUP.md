# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to https://supabase.com
2. Sign up or login
3. Create a new project:
   - Choose a project name (e.g., "trainarduino")
   - Choose a strong database password
   - Choose a region closest to you
   - Click "Create new project"

## 2. Get Your Credentials

Once your project is created:

1. Go to **Project Settings** > **API**
2. Copy `Project URL` and `anon public` key
3. Add them to your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 3. Create Database Tables

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `database/migrations.sql`
4. Click **Run**

This will create:
- `profiles` table with RLS policies
- Indexes for better performance
- Triggers for automatic `updated_at` timestamps

## 4. Test Authentication

1. Start your dev server: `npm run dev`
2. Go to http://localhost:3000
3. Click "Sign Up"
4. Create a test account

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure `.env.local` contains both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart the dev server after updating `.env.local`

### Error: "relation 'profiles' does not exist"
- The SQL migrations haven't been run yet
- Follow step 3 above to create the tables

### Error: "new row violates row-level security policy"
- The RLS policies need to be configured correctly
- Make sure the migrations.sql was fully executed
- Check the profiles table policies in Supabase

## Database Schema

### profiles table
- `id` (UUID): User ID from auth.users
- `pseudo` (VARCHAR): Username
- `xp_total` (INTEGER): Total XP earned
- `niveau_actuel` (INTEGER): Current level
- `module_actuel_id` (INTEGER): Current module ID
- `created_at` (TIMESTAMP): Account creation date
- `updated_at` (TIMESTAMP): Last update timestamp

## Row Level Security (RLS)

The `profiles` table has RLS enabled with the following policies:
- Users can view their own profile
- Users can update their own profile
- Users can insert their own profile

This ensures data privacy and security.
