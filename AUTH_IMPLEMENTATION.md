# Authentication Implementation

## Overview

TrainArduino uses Supabase Authentication with email/password and a custom `profiles` table for user data storage.

## Key Files

### 1. `lib/auth.ts` - Server Actions
Contains all authentication logic:
- `signup(formData)` - Create new user and profile
- `signin(formData)` - User login
- `signout()` - User logout
- `getCurrentUser()` - Fetch current user + profile

### 2. `middleware.ts` - Session Protection
- Protects dashboard, modules, and onboarding routes
- Redirects unauthenticated users to login
- Redirects logged-in users away from auth pages

### 3. `components/SignoutButton.tsx`
Client component for logout button with loading state

## Flow

```
1. User visits app
   ↓
2. No session? → Redirect to /auth/login
   ↓
3. User signs up at /auth/signup
   ↓
4. Server Action:
   - Creates user in auth.users
   - Creates profile in profiles table
   - Redirect to /onboarding/positioning-test
   ↓
5. User takes positioning test
   ↓
6. Results calculated → Redirect to /dashboard
   ↓
7. Dashboard shows user's XP, level, modules
```

## Database Structure

### profiles table
```sql
id (UUID)                    -- User ID from auth.users
pseudo (VARCHAR)             -- Username
xp_total (INTEGER)          -- Total XP
niveau_actuel (INTEGER)     -- Current level (1-10)
module_actuel_id (INTEGER)  -- Current module ID
created_at (TIMESTAMP)      -- Registration date
updated_at (TIMESTAMP)      -- Last update (auto)
```

## Row Level Security (RLS)

All `profiles` queries are protected by RLS policies:
- Users can only see their own profile
- Users can only update their own profile
- Users can only insert their own profile

This is enforced at the database level.

## Usage Examples

### Sign Up
```tsx
const result = await signup(formData);
if (result?.error) {
  // Handle error
}
// User is redirected to positioning test on success
```

### Sign In
```tsx
const result = await signin(formData);
if (result?.error) {
  // Handle error
}
// User is redirected to dashboard on success
```

### Sign Out
```tsx
// Use the SignoutButton component
// Or call directly:
import { signout } from '@/lib/auth';
await signout();
```

### Get Current User
```tsx
import { getCurrentUser } from '@/lib/auth';
const user = await getCurrentUser();
console.log(user?.email);
console.log(user?.profile?.pseudo);
```

## Setup Instructions

1. Create Supabase project (see SUPABASE_SETUP.md)
2. Run migrations (database/migrations.sql)
3. Update .env.local with credentials
4. Test signup/login at http://localhost:3000

## Error Handling

All auth functions return:
```ts
{
  error?: string;  // Error message if something went wrong
}
```

On success, they redirect automatically (via `redirect()` from Next.js).

## Security Notes

- Passwords are hashed by Supabase Auth
- Sessions are managed via secure cookies
- All database queries use parameterized queries (Supabase SDK)
- RLS policies prevent unauthorized data access
- Server Actions run on the backend, not exposed to client
