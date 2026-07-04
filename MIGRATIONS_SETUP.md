# 🚀 Complete Supabase Migration Setup

This guide will walk you through running all database migrations for TrainArduino.

## Prerequisites

1. ✅ Supabase project created (see SUPABASE_SETUP.md)
2. ✅ Credentials in `.env.local`
3. ✅ Dev server stopped (optional)

## Step-by-Step Setup

### 1️⃣ Navigate to Supabase SQL Editor

- Go to https://supabase.com
- Open your TrainArduino project
- Click **SQL Editor** (left sidebar)
- Click **New Query**

### 2️⃣ Copy Migration SQL

Open [database/migrations.sql](database/migrations.sql) and copy **ALL the content** (everything from line 1 to the end).

### 3️⃣ Paste and Execute

- Paste the entire SQL into the Supabase SQL Editor
- Click **Run** button (top right)
- Wait for completion (should be ~2-5 seconds)

You should see: **Query successful (no rows)**

### 4️⃣ Verify Tables

In Supabase, click **Table Editor** (left sidebar) and verify all tables exist:

- ✅ `profiles`
- ✅ `modules`
- ✅ `lessons`
- ✅ `exercises`
- ✅ `submissions`
- ✅ `progress`
- ✅ `positioning_test_results`

## What Gets Created

### Tables (7 total)

1. **profiles** - User data linked to auth.users
2. **modules** - Course modules
3. **lessons** - Lesson content
4. **exercises** - Code exercises
5. **submissions** - User code submissions with AI feedback
6. **progress** - User progress through modules
7. **positioning_test_results** - Initial placement test results

### Security

- **Row Level Security (RLS)** enabled on all tables
- Public read on: modules, lessons, exercises
- Private read/write on: profiles, submissions, progress, positioning_test_results
- Users can only access their own data

### Indexes

- Performance indexes on foreign keys
- Indexes on common filter columns
- Indexes on sort columns

### Triggers

- Automatic `updated_at` timestamp on all tables
- Updates whenever a record is modified

## Troubleshooting

### Error: "syntax error"

→ You probably didn't copy the entire migrations.sql file
→ Make sure you copied everything from top to bottom
→ Try again, copying line by line if needed

### Error: "relation 'profiles' does not exist"

→ Migration wasn't fully executed
→ Click **Run** again to re-run the full migration
→ Check no errors appear during execution

### Error: "permission denied"

→ You're likely using a service role key instead of anon key
→ Check `.env.local` has `NEXT_PUBLIC_SUPABASE_ANON_KEY`
→ Not the service role key!

### Tables created but can't query

→ RLS policies might be blocking
→ Go to each table in Supabase → RLS policies
→ Verify policies are enabled and correctly configured

### Error: "duplicate key value violates unique constraint"

→ You ran migrations twice
→ This is fine! Just don't run them again
→ All tables already exist

## Manual Table Creation (Alternative)

If copy-paste fails, you can create tables one by one:

1. **profiles** first (depends on auth.users)
2. **modules** (standalone)
3. **lessons** (depends on modules)
4. **exercises** (depends on modules)
5. **submissions** (depends on exercises + auth.users)
6. **progress** (depends on modules + auth.users)
7. **positioning_test_results** (depends on auth.users)

But it's better to just copy the full migrations.sql once!

## Test the Database

After migration, test it:

```bash
npm run dev
```

1. Go to http://localhost:3000
2. Click **Sign Up**
3. Create an account
4. Check Supabase **Table Editor** → **profiles**
5. You should see your new user profile!

## What the Migration Does

The migrations.sql file:

1. Creates `profiles` table (linked to auth.users)
2. Creates `modules` table (curriculum)
3. Creates `lessons` table (lesson content)
4. Creates `exercises` table (coding exercises)
5. Creates `submissions` table (user submissions)
6. Creates `progress` table (user progress)
7. Creates `positioning_test_results` table (test results)
8. Enables RLS on all tables
9. Creates RLS policies for data privacy
10. Creates indexes for performance
11. Creates triggers for auto-updating timestamps

## After Migration

You can now:

✅ Sign up (creates profile)
✅ Take positioning test
✅ See modules and exercises
✅ Submit code solutions
✅ Track progress through courses

## Database Schema Diagram

```
auth.users
  ├─ profiles (1:1)
  ├─ submissions (1:N)
  ├─ progress (1:N)
  └─ positioning_test_results (1:1)

modules
  ├─ lessons (1:N)
  ├─ exercises (1:N)
  └─ progress (1:N)

exercises
  └─ submissions (1:N)
```

## Seeding Sample Data (Optional)

To add sample modules/lessons/exercises, create a new SQL query:

```sql
-- Add sample modules
INSERT INTO modules (titre, description, ordre, palier_test) VALUES
  ('Arduino Basics', 'Learn Arduino fundamentals', 1, 1),
  ('Digital I/O', 'Work with digital inputs and outputs', 2, 1),
  ('Analog Input', 'Read analog sensors', 3, 2);

-- Add lessons for Module 1
INSERT INTO lessons (module_id, titre, contenu, ordre) VALUES
  (1, 'What is Arduino?', 'Arduino is an open-source electronics platform...', 1),
  (1, 'Setup Function', 'The setup() function runs once when the board powers on...', 2);

-- Add exercises for Module 1
INSERT INTO exercises (module_id, titre, enonce, xp_recompense, difficulte, ordre) VALUES
  (1, 'Blink LED', 'Make an LED blink every second', 50, 'easy', 1);
```

## Next Steps

1. ✅ Run migrations
2. ✅ Test signup/login
3. → Build modules and lessons UI
4. → Integrate Monaco Editor
5. → Add Wokwi simulator
6. → Implement AI code checking

## Quick Reference

| Table | Purpose | User Access |
|-------|---------|-------------|
| profiles | User data | Own profile only |
| modules | Course structure | Read-only (all users) |
| lessons | Lesson content | Read-only (all users) |
| exercises | Code exercises | Read-only (all users) |
| submissions | User submissions | Own submissions only |
| progress | User progress | Own progress only |
| positioning_test_results | Test results | Own results only |

## Security Features

- ✅ RLS prevents unauthorized data access
- ✅ Foreign keys maintain referential integrity
- ✅ Unique constraints prevent duplicates
- ✅ Automatic timestamps on all records
- ✅ Cascade deletes maintain data consistency

## Support

If migrations fail:

1. Copy the full migrations.sql again
2. Check for any error messages in Supabase
3. Try running in smaller sections
4. Check Supabase documentation: https://supabase.com/docs

See also:
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- [DATABASE_UTILS.md](DATABASE_UTILS.md)
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
