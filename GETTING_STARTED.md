# TrainArduino - Getting Started with Auth & Database

## Quick Setup (5 minutes)

### Step 1: Create Supabase Project
1. Go to https://supabase.com → Sign up/Login
2. Create new project with strong password
3. Copy `Project URL` and `anon public key`

### Step 2: Configure Environment
Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Run Database Migrations
1. In Supabase dashboard → SQL Editor
2. Create new query
3. Copy entire content from `database/migrations.sql`
4. Click Run

### Step 4: Test It Out
```bash
npm run dev
```

Visit http://localhost:3000:
- Click "Sign Up"
- Create account (e.g., test@example.com / password123 / testuser)
- Complete positioning test (5 questions)
- See your dashboard!

## What Was Created

### Authentication Files
```
lib/auth.ts                          # Server Actions (signup, signin, signout)
components/SignoutButton.tsx         # Logout button component
middleware.ts                        # Session protection & redirects
```

### Database Files
```
database/migrations.sql              # Create profiles table with RLS
```

### Pages
```
app/(auth)/login/page.tsx           # Login form
app/(auth)/signup/page.tsx          # Signup form
app/(onboarding)/positioning-test/  # Initial level test
```

### Documentation
```
AUTH_IMPLEMENTATION.md              # Full auth setup guide
SUPABASE_SETUP.md                  # Supabase configuration
```

## Features Implemented

✅ **Email/Password Authentication**
- Sign up with email, password, username
- Sign in with email/password
- Sign out functionality

✅ **Session Management**
- Middleware protects dashboard routes
- Auto-redirect based on auth status
- Secure cookie-based sessions

✅ **User Profiles**
- Created `profiles` table in Supabase
- Linked to `auth.users` via foreign key
- Row Level Security policies for data privacy

✅ **Positioning Test**
- 5-question adaptive test
- Calculates level: Beginner/Intermediate/Advanced
- Results saved to database (coming next)

✅ **Protected Routes**
- `/dashboard` - requires login
- `/modules` - requires login
- `/onboarding/positioning-test` - requires login
- `/auth/*` - redirects if already logged in

## Data Flow

```
Landing Page (/page.tsx)
    ↓
Sign Up (/auth/signup)
    ↓
Server Action: signup()
    ├─ Create user in auth.users
    └─ Create profile in profiles table
    ↓
Redirect to Positioning Test (/onboarding/positioning-test)
    ↓
Take 5-Question Test
    ↓
Calculate Level
    ↓
Redirect to Dashboard (/dashboard)
```

## Middleware Protection

The middleware (`middleware.ts`) ensures:
- Unauthenticated users can't access `/dashboard`, `/modules`, `/onboarding`
- Logged-in users can't access `/auth/login` or `/auth/signup`
- Automatically handles all redirects

## Database Schema

### profiles
```
id (UUID)                    ← User ID from auth.users
pseudo (VARCHAR)             ← Username  
xp_total (INTEGER)          ← Total XP earned
niveau_actuel (INTEGER)     ← Current level (1-10)
module_actuel_id (INTEGER)  ← Current module ID
created_at (TIMESTAMP)      ← When account created
updated_at (TIMESTAMP)      ← Auto-updated on changes
```

### Row Level Security
Each user can only:
- View their own profile
- Update their own profile
- Enforced at database level (secure!)

## Troubleshooting

### Can't sign up
→ Check `.env.local` has Supabase credentials
→ Check migrations.sql was run in SQL Editor

### Middleware not working
→ Restart dev server after .env.local changes
→ Check middleware.ts is in project root

### "profiles" table doesn't exist
→ Run migrations.sql in Supabase SQL Editor

### Can't login after signup
→ Check browser cookies (middleware uses them)
→ Try incognito/private window
→ Check browser console for errors

## Next Steps

1. ✅ Auth is working
2. ⏳ Save positioning test results to database
3. ⏳ Create modules table with curriculum
4. ⏳ Build exercise submission system
5. ⏳ Integrate Monaco Editor
6. ⏳ Add Wokwi simulator
7. ⏳ Implement AI code checking
8. ⏳ Add gamification (XP, badges, streaks)

## Key Documentation
- [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md) - Detailed auth guide
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Supabase configuration
- [README.md](README.md) - Project overview
