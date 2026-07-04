# Database Schema Documentation

## Overview

The TrainArduino database uses PostgreSQL (via Supabase) with Row Level Security (RLS) to ensure data privacy and security. All tables are interconnected through foreign keys.

## Table Structure

### 1. **profiles** (User Profiles)
Linked to `auth.users` for additional user information.

```sql
id (UUID PRIMARY KEY)              -- Foreign key to auth.users
pseudo (VARCHAR UNIQUE)            -- Username
xp_total (INTEGER)                 -- Total XP earned
nivel_actuel (INTEGER)             -- Current level (1-10+)
module_actuel_id (INTEGER)         -- Current module being studied
created_at (TIMESTAMP)             -- Account creation
updated_at (TIMESTAMP)             -- Last update (auto)
```

**RLS Policies:**
- Users can view their own profile only
- Users can update their own profile only

---

### 2. **modules** (Course Modules)
Contains the main course structure.

```sql
id (SERIAL PRIMARY KEY)            -- Module ID
titre (VARCHAR)                    -- Module title
description (TEXT)                 -- Module description
ordre (INTEGER)                    -- Display order (1, 2, 3...)
palier_test (INTEGER)              -- Required level to unlock
created_at (TIMESTAMP)             -- Creation date
updated_at (TIMESTAMP)             -- Last update (auto)
```

**RLS Policies:**
- All authenticated users can read modules (public curriculum)

**Example Data:**
```
Module 1: Arduino Basics        (order: 1, level: 1)
Module 2: Digital I/O           (order: 2, level: 1)
Module 3: Analog Input          (order: 3, level: 2)
```

---

### 3. **lessons** (Lesson Content)
Theoretical content for each module.

```sql
id (SERIAL PRIMARY KEY)            -- Lesson ID
module_id (INTEGER FK)             -- Parent module
titre (VARCHAR)                    -- Lesson title
contenu (TEXT)                     -- Lesson content (markdown)
ordre (INTEGER)                    -- Order within module
created_at (TIMESTAMP)             -- Creation date
updated_at (TIMESTAMP)             -- Last update (auto)
```

**RLS Policies:**
- All authenticated users can read lessons

**Relationships:**
- `module_id` → modules(id) [CASCADE DELETE]

---

### 4. **exercises** (Code Exercises)
Coding challenges that users must solve.

```sql
id (SERIAL PRIMARY KEY)            -- Exercise ID
module_id (INTEGER FK)             -- Parent module
titre (VARCHAR)                    -- Exercise title
enonce (TEXT)                      -- Problem statement
critere_correction (TEXT)          -- Evaluation criteria (for AI)
exemple_solution (TEXT)            -- Reference solution
xp_recompense (INTEGER)            -- XP earned on completion
difficulte (VARCHAR)               -- easy, medium, hard
wokwi_project_url (TEXT)          -- Wokwi simulator link
ordre (INTEGER)                    -- Order within module
created_at (TIMESTAMP)             -- Creation date
updated_at (TIMESTAMP)             -- Last update (auto)
```

**RLS Policies:**
- All authenticated users can read exercises

**Relationships:**
- `module_id` → modules(id) [CASCADE DELETE]

---

### 5. **submissions** (User Code Submissions)
Stores user submissions for exercises.

```sql
id (SERIAL PRIMARY KEY)            -- Submission ID
user_id (UUID FK)                  -- User who submitted
exercise_id (INTEGER FK)           -- Exercise being solved
code_soumis (TEXT)                 -- User's code
feedback_ia (TEXT)                 -- AI feedback/corrections
statut (VARCHAR)                   -- pending, reviewing, approved, rejected
video_url (TEXT)                   -- Optional: video proof (for practical)
xp_gagne (INTEGER)                 -- XP awarded
note (NUMERIC)                     -- Score (0.0 - 1.0)
created_at (TIMESTAMP)             -- Submission date
updated_at (TIMESTAMP)             -- Last update (auto)
UNIQUE(user_id, exercise_id)       -- One submission per user per exercise
```

**RLS Policies:**
- Users can view only their own submissions
- Users can insert their own submissions
- Users can update their own submissions

**Relationships:**
- `user_id` → auth.users(id) [CASCADE DELETE]
- `exercise_id` → exercises(id) [CASCADE DELETE]

---

### 6. **progress** (User Progress)
Tracks user progress through modules.

```sql
id (SERIAL PRIMARY KEY)            -- Progress ID
user_id (UUID FK)                  -- User
module_id (INTEGER FK)             -- Module
statut (VARCHAR)                   -- locked, in_progress, completed
score (INTEGER)                    -- Module completion percentage
exercices_completes (INTEGER)      -- Number of exercises completed
created_at (TIMESTAMP)             -- Start date
updated_at (TIMESTAMP)             -- Last update (auto)
UNIQUE(user_id, module_id)         -- One progress per user per module
```

**RLS Policies:**
- Users can view only their own progress
- Users can insert their own progress
- Users can update their own progress

**Relationships:**
- `user_id` → auth.users(id) [CASCADE DELETE]
- `module_id` → modules(id) [CASCADE DELETE]

**Status Values:**
- `locked` - Module not yet unlocked
- `in_progress` - User is working through module
- `completed` - User finished the module

---

### 7. **positioning_test_results** (Initial Placement Test)
Stores results from the initial positioning test.

```sql
id (SERIAL PRIMARY KEY)            -- Result ID
user_id (UUID FK)                  -- User who took the test
palier_atteint (INTEGER)          -- Level achieved (1, 2, 3...)
score (INTEGER)                    -- Percentage score
reponses_correctes (INTEGER)      -- Number of correct answers
total_questions (INTEGER)          -- Total questions asked
created_at (TIMESTAMP)             -- Test date
UNIQUE(user_id)                    -- One result per user
```

**RLS Policies:**
- Users can view only their own test results
- Users can insert their own test results (once)

**Relationships:**
- `user_id` → auth.users(id) [CASCADE DELETE]

---

## Database Relationships Diagram

```
auth.users
  ├─ profiles (1:1)
  ├─ submissions (1:N)
  ├─ progress (1:N)
  └─ positioning_test_results (1:1)

modules (1:N)
  ├─ lessons
  ├─ exercises
  ├─ progress
  └─ submissions (via exercises)

exercises (1:N)
  └─ submissions

submissions
  ├─ user_id → auth.users
  └─ exercise_id → exercises
```

---

## Security: Row Level Security (RLS)

### Public Read Tables (for all authenticated users)
- `modules` - Everyone can read the curriculum
- `lessons` - Everyone can read lesson content
- `exercises` - Everyone can read exercise descriptions

### Private Tables (users can only access their own data)
- `profiles` - User profile
- `submissions` - User's code submissions
- `progress` - User's progress
- `positioning_test_results` - User's test results

### Example RLS Policy
```sql
CREATE POLICY "Users can view their own submissions" ON submissions
  FOR SELECT USING (auth.uid() = user_id);
```

This ensures:
- User A cannot see User B's submissions
- User A cannot see User B's progress
- Enforced at the database level (secure!)

---

## Indexes

Indexes are created for performance optimization:

```
profiles:
  - pseudo (unique lookup)

modules:
  - ordre (sorting)

lessons:
  - module_id (find lessons by module)
  - ordre (sorting within module)

exercises:
  - module_id (find exercises by module)
  - difficulte (filter by difficulty)
  - module_id + ordre (common query)

submissions:
  - user_id (find user's submissions)
  - exercise_id (find submissions for exercise)
  - statut (filter by status)
  - exercise_id + user_id (common query)
  - created_at (recent submissions)

progress:
  - user_id (find user's progress)
  - module_id (find module progress)
  - statut (filter by status)
  - created_at (recent progress)

positioning_test_results:
  - user_id (lookup user's result)
  - palier_atteint (filter by level)
```

---

## Common Queries

### Get all modules a user can access
```sql
SELECT m.* FROM modules m
WHERE m.palier_test <= (SELECT niveau_actuel FROM profiles WHERE id = $1)
ORDER BY m.ordre;
```

### Get all lessons for a module
```sql
SELECT * FROM lessons
WHERE module_id = $1
ORDER BY ordre;
```

### Get user's exercises completed
```sql
SELECT COUNT(*) FROM submissions
WHERE user_id = $1 AND statut = 'approved';
```

### Get user's total XP
```sql
SELECT COALESCE(SUM(xp_gagne), 0) FROM submissions
WHERE user_id = $1 AND statut = 'approved';
```

### Update user level based on XP
```sql
UPDATE profiles
SET niveau_actuel = 
  CASE 
    WHEN xp_total >= 5000 THEN 10
    WHEN xp_total >= 4000 THEN 9
    -- ... etc
    ELSE 1
  END
WHERE id = $1;
```

---

## Migration Instructions

1. **In Supabase Dashboard:**
   - Go to SQL Editor
   - Create New Query
   - Paste entire `database/migrations.sql`
   - Click "Run"

2. **Verify Tables:**
   - Go to Table Editor
   - Confirm all 7 tables are created
   - Check RLS policies are enabled

3. **Test RLS:**
   - Create test user account
   - Verify they can only see their own data

---

## Notes

- All timestamps use `TIMESTAMP WITH TIME ZONE` (supports timezones)
- `updated_at` is automatically updated via trigger on any change
- Foreign keys use `ON DELETE CASCADE` to maintain referential integrity
- Unique constraints prevent duplicate entries (e.g., one submission per user per exercise)
- RLS is enforced at database level, not application level (secure by default!)
