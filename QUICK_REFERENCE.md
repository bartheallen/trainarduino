# 🎯 Quick Reference Guide

## 📁 File Structure

```
trainarduino/
├── app/
│   ├── (auth)/             ← Login/Signup pages
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/        ← User dashboard
│   ├── (modules)/          ← Module/lesson/exercise pages
│   ├── (onboarding)/       ← Positioning test
│   │   └── positioning-test/page.tsx
│   ├── layout.tsx
│   └── page.tsx            ← Home page
│
├── lib/
│   ├── auth.ts             ← Server Actions (signup, signin, signout)
│   ├── supabase.ts         ← Supabase client
│   ├── types.ts            ← TypeScript types
│   └── db.ts               ← Database utilities (30+ functions)
│
├── components/
│   └── SignoutButton.tsx   ← Logout button
│
├── database/
│   ├── migrations.sql      ← CREATE ALL TABLES (run this!)
│   └── seed.sql            ← Optional sample data
│
├── middleware.ts           ← Protect routes, manage sessions
│
├── documentation/
│   ├── GETTING_STARTED.md  ← 5-min setup
│   ├── SUPABASE_SETUP.md   ← Create Supabase project
│   ├── MIGRATIONS_SETUP.md ← Run migrations step-by-step
│   ├── AUTH_IMPLEMENTATION.md ← How auth works
│   ├── DATABASE_SCHEMA.md  ← All 7 tables explained
│   ├── DATABASE_UTILS.md   ← How to use db functions
│   └── IMPLEMENTATION_SUMMARY.md ← Full summary
```

## 🔑 Setup (3 Steps)

### 1. Create Supabase Project
```bash
1. Go to https://supabase.com
2. Sign up/Login
3. Create project
4. Copy credentials to .env.local
```

### 2. Run Migrations
```bash
1. Open Supabase SQL Editor
2. Paste database/migrations.sql
3. Click Run
4. Verify 7 tables created
```

### 3. Start Dev Server
```bash
npm run dev
# Visit http://localhost:3000
```

## 🚀 Main Features

### Authentication (lib/auth.ts)
```typescript
import { signup, signin, signout, getCurrentUser } from '@/lib/auth';

// Sign up
const result = await signup(formData);

// Sign in
const result = await signin(formData);

// Sign out
await signout();

// Get current user
const user = await getCurrentUser();
```

### Database Utilities (lib/db.ts)

**Modules:**
```typescript
const modules = await getModules();
const module = await getModule(1);
```

**Exercises:**
```typescript
const exercises = await getExercisesByModule(1);
const submission = await createSubmission(userId, exerciseId, code);
```

**Progress:**
```typescript
const progress = await getUserProgress(userId);
await updateModuleProgress(userId, moduleId, 'completed', 100, 5);
```

**XP & Levels:**
```typescript
await updateUserXP(userId, 100);  // Add XP + auto-level
const profile = await getUserProfile(userId);
console.log(profile.niveau_actuel);  // Current level
```

## 🗄️ Database Tables (7 Total)

| Table | Rows | Purpose |
|-------|------|---------|
| `auth.users` | Supabase | Authentication |
| `profiles` | Users | User metadata (XP, level) |
| `modules` | 1-20 | Course modules |
| `lessons` | 2-5/module | Lesson content |
| `exercises` | 2-5/module | Code exercises |
| `submissions` | User → Exerc | User code + feedback |
| `progress` | User × Module | Module progress |
| `positioning_test_results` | 1/user | Initial level test |

## 🔒 Security

### RLS (Row Level Security)
- Public read: modules, lessons, exercises
- Private: profiles, submissions, progress, positioning_test_results
- Enforced at database level (secure!)

### API Protection
```typescript
// middleware.ts redirects:
// ✅ Unauthenticated → /auth/login
// ✅ Authenticated at /auth/* → /dashboard
```

## 🎮 Common Workflows

### Sign up → Positioning test → Dashboard
```
1. User submits form at /auth/signup
2. Server Action: createProfile()
3. Auto-redirect to /onboarding/positioning-test
4. User takes 5-question test
5. Redirect to /dashboard with level assigned
```

### Complete Exercise
```
1. User writes code in editor
2. Submit → Server Action: createSubmission()
3. AI reviews code (TODO)
4. Update submission with feedback
5. If approved: updateUserXP() → auto-level
6. UI updates progress
```

### Progress Through Curriculum
```
1. User gets initial level from test
2. unlock appropriate modules
3. Complete exercises → gain XP
4. Level up → unlock new modules
5. Repeat until max level
```

## 📊 XP & Level System

```
Level 1:  0 XP
Level 2:  200 XP
Level 3:  600 XP
Level 4:  1,200 XP
Level 5:  2,000 XP
Level 6:  3,000 XP
Level 7:  4,500 XP
Level 8:  6,000 XP
Level 9:  8,000 XP
Level 10: 10,000 XP
```

Each exercise awards XP (default 50-100).

## 🏗️ Architecture

### Server Components (Safe for DB Calls)
```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const profile = await getUserProfile(userId);
  return <div>{profile.pseudo}</div>;
}
```

### Client Components → Server Actions
```typescript
// lib/actions.ts
'use server';
import { createSubmission } from '@/lib/db';

export async function submitExercise(code: string) {
  return await createSubmission(userId, exerciseId, code);
}
```

```typescript
// components/CodeEditor.tsx
'use client';
import { submitExercise } from '@/lib/actions';

export function CodeEditor() {
  return (
    <button onClick={() => submitExercise(code)}>
      Submit
    </button>
  );
}
```

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| "Table doesn't exist" | Run migrations.sql |
| "Permission denied" | Check .env.local has anon key (not service role) |
| "User not found" | Make sure signup created profile |
| "Can't read other user's data" | RLS working correctly! |
| Middleware not protecting routes | Restart dev server |

## 📚 Documentation Files

**To get started:** `GETTING_STARTED.md`
**To understand database:** `DATABASE_SCHEMA.md`
**To use utilities:** `DATABASE_UTILS.md`
**For step-by-step setup:** `MIGRATIONS_SETUP.md`
**For full summary:** `IMPLEMENTATION_SUMMARY.md`

## 🔗 Important Files

| File | Purpose |
|------|---------|
| `.env.local` | Supabase credentials |
| `middleware.ts` | Route protection |
| `lib/auth.ts` | Authentication logic |
| `lib/db.ts` | Database utilities |
| `lib/types.ts` | TypeScript types |
| `database/migrations.sql` | Create tables |
| `database/seed.sql` | Sample data (optional) |

## 🎯 Next Steps

After setup:

1. ✅ Test signup/login
2. → Build dashboard UI
3. → Add module content
4. → Integrate Monaco Editor
5. → Add Wokwi simulator
6. → Implement AI code checking
7. → Build gamification UI

## 💡 Pro Tips

- Use `lib/db.ts` functions everywhere - they handle RLS automatically
- Always use Server Actions for database calls in client components
- Cache results in React when appropriate
- Test RLS by creating 2 user accounts
- Monitor Supabase logs for errors
- Use TypeScript types from `lib/types.ts`

## 🚀 Deploy to Vercel

```bash
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy!
```

Supabase works with Vercel automatically (serverless functions support).

## 📞 Support

- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Arduino reference: https://www.arduino.cc/reference/

---

**Ready to build? Start with GETTING_STARTED.md! 🚀**
