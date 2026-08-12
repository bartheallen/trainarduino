# Supabase Local Migration Guide

This guide provides step-by-step instructions for migrating the TrainArduino project's database schema to your local Supabase instance using PowerShell scripts.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Your Database Connection String](#getting-your-database-connection-string)
3. [Installing PostgreSQL Client Tools](#installing-postgresql-client-tools)
4. [Applying Migrations](#applying-migrations)
5. [Verifying Migrations](#verifying-migrations)
6. [Alternative Method: SQL Editor](#alternative-method-sql-editor)
7. [Troubleshooting](#troubleshooting)
8. [Rollback (If Needed)](#rollback-if-needed)

---

## Prerequisites

Before starting, ensure you have:

- [ ] A Supabase project created at https://app.supabase.com
- [ ] Windows PowerShell 5.0+ (or PowerShell Core)
- [ ] PostgreSQL client tools (`psql`) - we'll help you install this
- [ ] This project cloned to your local machine

---

## Getting Your Database Connection String

### Step 1: Log into Supabase Console

Go to https://app.supabase.com and select your TrainArduino project.

### Step 2: Navigate to Database Settings

1. Click **Settings** in the left sidebar
2. Select **Database** from the submenu
3. Look for the **Connection string** section

### Step 3: Copy the Connection String

Under "Postgres", you'll see different connection options:
- Copy the **URI** format (starts with `postgres://`)
- The format looks like: `postgres://postgres:PASSWORD@db.XXXXX.supabase.co:5432/postgres`

### Step 4: Set Environment Variable

In PowerShell, set the `DATABASE_URL` environment variable:

```powershell
$env:DATABASE_URL = "postgres://postgres:YOUR_PASSWORD@db.XXXXX.supabase.co:5432/postgres"
```

**Important:**
- Replace `YOUR_PASSWORD` with your actual Supabase database password
- Replace `XXXXX` with your project ID
- Keep this connection string secure and never commit it to version control

### Step 5: Verify the Connection String

Test that your connection string is correct:

```powershell
$env:DATABASE_URL -split '@'
```

You should see something like:
```
postgres://postgres:PASSWORD
db.XXXXX.supabase.co:5432/postgres
```

---

## Installing PostgreSQL Client Tools

The migration script uses `psql` (PostgreSQL command-line tool). Install it based on your operating system:

### Windows (Recommended: Chocolatey)

If you have Chocolatey installed:

```powershell
choco install postgresql
```

### Windows (Official Installer)

1. Download from https://www.postgresql.org/download/windows/
2. Run the installer
3. **Important**: Install at least "Command Line Tools"
4. During installation, note the installation path (default: `C:\Program Files\PostgreSQL\15`)
5. Verify installation by running in PowerShell:
   ```powershell
   psql --version
   ```

### macOS (Homebrew)

```bash
brew install postgresql
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

### Linux (Fedora/RHEL)

```bash
sudo dnf install postgresql
```

### Verify Installation

After installing, verify `psql` is available in your PATH:

```powershell
Get-Command psql
```

If this fails, see [Troubleshooting](#troubleshooting) section.

---

## Applying Migrations

### Step 1: Open PowerShell

Open PowerShell as **Administrator** (important for some systems).

### Step 2: Navigate to Project Directory

```powershell
cd C:\path\to\trainarduino
```

### Step 3: Set Database URL

```powershell
$env:DATABASE_URL = "postgres://postgres:YOUR_PASSWORD@db.XXXXX.supabase.co:5432/postgres"
```

### Step 4: Run Migration Script

```powershell
.\scripts\apply-migrations.ps1
```

### Expected Output

You should see:
- ✅ Database URL validation
- ✅ psql availability check
- ✅ Connection test: PASSED
- ✅ Database information (current_database, current_user, version)
- ✅ Migration output from SQL file
- ✅ Success message

### Example Output

```
====================================================================
Supabase Migration Script - Apply Migrations
====================================================================

Database URL: db.XXXXX.supabase.co:5432/postgres
Migration file: C:\path\to\trainarduino\database\migrations.sql
File size: 89234 bytes

Testing database connection...
Connection test PASSED

Database information:
 postgres | postgres | PostgreSQL 15.1 on x86_64-pc-linux-gnu, compiled by gcc...

Applying migrations...
================================================================
CREATE TABLE
CREATE TABLE
... (more output)
================================================================

Migrations applied successfully!

Next steps:
1. Run verification: ./scripts/verify-migrations.ps1
2. Check tables in Supabase Dashboard: https://app.supabase.com
3. Test your application
```

---

## Verifying Migrations

After applying migrations, verify everything was created correctly:

### Step 1: Run Verification Script

```powershell
.\scripts\verify-migrations.ps1
```

### Step 2: Check Results

The script will verify:
- ✅ Critical recommendation tables (recommendation_weights, recommendation_history, recommendation_feedback)
- ✅ Learning profile tables (learning_dna, student_learning_profiles, dashboard_projections)
- ✅ Concept tables (concept_states, concept_mastery_history, concepts)
- ✅ Database indexes on recommendation_weights
- ✅ Triggers (auto-update functions)
- ✅ Row-level security (RLS) policies
- ✅ Exercise table extensions (experience_id, skills_learned columns)

### Example Output

```
====================================================================
Supabase Migration Script - Verify Migrations
====================================================================

Testing database connection...
Connection OK

====== CRITICAL RECOMMENDATION TABLES ======
recommendation_weights table...
✓ Found: recommendation_weights

recommendation_history table...
✓ Found: recommendation_history

... (more checks)

====== SUMMARY STATISTICS ======

Total public tables: 45
Total public indexes: 28
Total triggers: 12
Total RLS policies: 24

====== VERIFICATION COMPLETE ======
```

### All Checks Should Pass

Each check should show `✓ Found:`. If any show `✗ Not found`, refer to [Troubleshooting](#troubleshooting).

---

## Alternative Method: SQL Editor

If you don't have PostgreSQL client tools installed, you can use Supabase's built-in SQL Editor:

### Step 1: Open SQL Editor

1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Create New Query

1. Click **New query**
2. Give it a name: "TrainArduino Migrations"

### Step 3: Copy SQL Content

1. Open `database/migrations.sql` in your text editor
2. Copy all the SQL content

### Step 4: Paste into SQL Editor

1. Paste the SQL into the Supabase SQL Editor text box
2. Click **Run** button

### Step 5: Monitor Execution

- The query will execute and create all tables
- You should see "Query executed successfully" message
- Total execution time typically 2-10 seconds

### Important Notes

- The SQL file is idempotent (safe to run multiple times)
- If you run it twice, you'll see "relation already exists" notices (normal)
- All tables are created with `CREATE TABLE IF NOT EXISTS`

---

## Troubleshooting

### Issue: psql not found in PATH

**Error Message:** `ERROR: psql command not found in PATH.`

**Solutions:**

1. **Verify Installation:**
   ```powershell
   Get-Command psql
   ```

2. **Reinstall PostgreSQL:**
   - Windows: Use official installer from https://www.postgresql.org/download/windows/
   - Ensure "Command Line Tools" is selected
   - Restart PowerShell after installation

3. **Add to PATH Manually:**
   - Find PostgreSQL installation (usually `C:\Program Files\PostgreSQL\15\bin`)
   - Add to System PATH environment variable
   - Restart PowerShell

4. **Use Alternative Method:**
   - Use Supabase SQL Editor instead (see [Alternative Method](#alternative-method-sql-editor))

### Issue: Cannot connect to database

**Error Message:** `ERROR: Failed to connect to database`

**Solutions:**

1. **Verify DATABASE_URL:**
   ```powershell
   Write-Host $env:DATABASE_URL
   ```
   Should show: `postgres://postgres:PASSWORD@db.XXXXX.supabase.co:5432/postgres`

2. **Check for typos:**
   - Verify password is correct (from Supabase Settings > Database)
   - Verify project ID (the XXXXX part)

3. **Test connection manually:**
   ```powershell
   psql "postgres://postgres:PASSWORD@db.XXXXX.supabase.co:5432/postgres" -c "SELECT 1;"
   ```

4. **Check Supabase status:**
   - Go to https://app.supabase.com
   - Verify your database is running (green status)
   - Check project region (sometimes affects connectivity)

5. **Network connectivity:**
   - Ensure you have internet connection
   - Check if Supabase is accessible: Test with `ping db.XXXXX.supabase.co`

### Issue: "relation already exists" error

**Error Message:** In migration output, you see messages like "relation already exists"

**This is normal!** It means:
- The script runs tables with `CREATE TABLE IF NOT EXISTS`
- If run multiple times, these notices are expected
- Existing data is preserved
- Re-running migrations is safe

### Issue: Verification shows missing tables

**Error Message:** `✗ Not found` in verification output

**Solutions:**

1. **Recheck migrations.sql:**
   ```powershell
   Test-Path "database\migrations.sql"
   ```

2. **Check file size:**
   ```powershell
   (Get-Item "database\migrations.sql").Length
   ```
   Should be ~80KB+

3. **Run migration script again:**
   ```powershell
   .\scripts\apply-migrations.ps1
   ```

4. **Check Supabase Dashboard:**
   - Go to https://app.supabase.com
   - Open SQL Editor
   - Run: `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;`
   - Verify tables exist

### Issue: Permission denied errors

**Error Message:** `permission denied` or `insufficient privilege`

**Solutions:**

1. **Verify user role:**
   - Log into Supabase with project owner account
   - Not a collaborator with limited permissions

2. **Check RLS policies:**
   - Go to Authentication > Policies
   - Ensure policies are not blocking migrations
   - (Migrations run as admin, so RLS shouldn't block)

3. **Use different database user:**
   - Supabase by default provides `postgres` user with full permissions
   - Connection string should use `postgres` user, not other roles

---

## Rollback (If Needed)

If you need to undo the migrations (delete all created tables), use the rollback script:

### ⚠️ WARNING

Rollback is **destructive**. It will delete all tables and data including:
- recommendation_weights
- learning_dna
- student_learning_profiles
- All exercise submissions and progress data
- And more...

**This cannot be undone without a Supabase backup.**

### Step 1: Create Backup (Recommended)

Before rollback, backup your database:
1. Go to https://app.supabase.com
2. Click **Backups** in left sidebar
3. Click **Create backup**

### Step 2: Run Rollback Script

```powershell
$env:DATABASE_URL = "postgres://postgres:PASSWORD@db.XXXXX.supabase.co:5432/postgres"
.\scripts\rollback-migrations.ps1
```

### Step 3: Confirm

When prompted `Are you absolutely sure you want to rollback? Type 'yes' to confirm`:

Type: `yes` and press Enter

### Step 4: Verify Rollback

```powershell
.\scripts\verify-migrations.ps1
```

All checks should now show `✗ Not found` or lower counts.

### Restore from Backup

If you need to restore after rollback:
1. Go to https://app.supabase.com
2. Click **Backups**
3. Select the backup you created
4. Click **Restore**

---

## What's in the Migrations?

The `database/migrations.sql` file creates:

### Core Tables (45+ total)
- **Authentication & Profiles**: profiles, auth.users
- **Modules & Learning**: modules, lessons, exercises, submissions
- **Recommendation Engine**: recommendation_history, recommendation_feedback, **recommendation_weights**
- **Learning Engine**: concepts, concept_states, concept_mastery_history, learning_dna
- **Adaptive Learning**: student_learning_profiles, dashboard_projections
- **Missions**: missions, mission_steps, mission_progress
- **AI Integration**: ai_evaluations, ai_conversations
- **Skills & Experiences**: projects, experiences, skills

### Indexes
- Performance indexes on frequently queried fields
- Especially for recommendation_weights (user_id, concept_id, recommendation_id)

### Triggers
- Auto-update `updated_at` timestamps
- Profile creation on user signup

### Row-Level Security (RLS)
- Each user can only see their own data
- Policies on all sensitive tables
- Enforced at database level

### Features
- **Idempotent**: Safe to run multiple times
- **No data destruction**: Uses CREATE TABLE IF NOT EXISTS
- **Full type safety**: Proper constraints, indexes, checks
- **Referential integrity**: Foreign key relationships

---

## Environment Variables (.env.local)

After migrations are applied, ensure your `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Get these from Supabase Dashboard:
1. Go to **Settings > API**
2. Copy "Project URL" → `SUPABASE_URL`
3. Copy "anon public" key → `SUPABASE_ANON_KEY`

---

## Support

For issues or questions:

1. **Check SQL Syntax**: Review `database/migrations.sql` for any issues
2. **Verify Connection**: Test with `psql` directly
3. **Check Supabase Status**: https://status.supabase.com
4. **Review Logs**: Supabase Dashboard > Logs section
5. **Consult Documentation**:
   - Supabase: https://supabase.com/docs
   - PostgreSQL: https://www.postgresql.org/docs/
   - Next.js: https://nextjs.org/docs

---

**Last Updated**: 2025-01-14  
**Status**: Complete and Tested ✅
