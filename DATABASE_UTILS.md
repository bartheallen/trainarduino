# Database Utilities Guide

The `lib/db.ts` file provides TypeScript-safe database utilities for interacting with Supabase. All functions are async and handle errors gracefully.

## Setup

First, ensure migrations are run in Supabase (see SUPABASE_SETUP.md).

## Types

All database types are defined in `lib/types.ts`:

```typescript
import type {
  Module,
  Lesson,
  Exercise,
  Submission,
  Progress,
  Profile,
  PositioningTestResult,
} from '@/lib/types';
```

## Usage Examples

### Modules

**Get all modules:**
```typescript
import { getModules } from '@/lib/db';

const modules = await getModules();
// Returns: Module[] sorted by order
```

**Get single module:**
```typescript
const module = await getModule(1);
```

### Lessons

**Get lessons for a module:**
```typescript
import { getLessonsByModule } from '@/lib/db';

const lessons = await getLessonsByModule(moduleId);
// Returns: Lesson[] sorted by order
```

**Get single lesson:**
```typescript
const lesson = await getLesson(lessonId);
```

### Exercises

**Get exercises for a module:**
```typescript
import { getExercisesByModule } from '@/lib/db';

const exercises = await getExercisesByModule(moduleId);
// Returns: Exercise[] sorted by order
```

**Get single exercise:**
```typescript
const exercise = await getExercise(exerciseId);
```

### Submissions

**Get user's submissions:**
```typescript
import { getUserSubmissions } from '@/lib/db';

const submissions = await getUserSubmissions(userId);
// Returns: Submission[] sorted by newest first
```

**Get submission for specific exercise:**
```typescript
import { getUserSubmissionForExercise } from '@/lib/db';

const submission = await getUserSubmissionForExercise(userId, exerciseId);
// Returns: Submission | null
```

**Create/update submission:**
```typescript
import { createSubmission } from '@/lib/db';

const submission = await createSubmission(
  userId,
  exerciseId,
  `void setup() { 
    pinMode(13, OUTPUT); 
  }`,
  // optional video URL
);
```

**Update submission with feedback:**
```typescript
import { updateSubmissionStatus } from '@/lib/db';

await updateSubmissionStatus(
  submissionId,
  'approved',  // or 'pending', 'reviewing', 'rejected'
  'Great code! Well done.',  // feedback
  100,  // XP gained
  0.95  // score (0.0 - 1.0)
);
```

### Progress

**Get all progress for user:**
```typescript
import { getUserProgress } from '@/lib/db';

const progress = await getUserProgress(userId);
// Returns: Progress[] for all modules
```

**Get progress for specific module:**
```typescript
import { getModuleProgress } from '@/lib/db';

const moduleProgress = await getModuleProgress(userId, moduleId);
// Returns: Progress | null
```

**Update module progress:**
```typescript
import { updateModuleProgress } from '@/lib/db';

await updateModuleProgress(
  userId,
  moduleId,
  'in_progress',  // status: 'locked' | 'in_progress' | 'completed'
  75,             // score (0-100%)
  3               // exercises completed
);
```

### Profile & XP

**Get user profile:**
```typescript
import { getUserProfile } from '@/lib/db';

const profile = await getUserProfile(userId);
// Returns: { pseudo, xp_total, niveau_actuel, ... }
```

**Add XP to user (auto-calculates level):**
```typescript
import { updateUserXP } from '@/lib/db';

await updateUserXP(userId, 100);  // Add 100 XP
// Automatically recalculates level based on total XP
```

**Update user level:**
```typescript
import { updateUserLevel } from '@/lib/db';

await updateUserLevel(userId, 3);
```

**Update current module:**
```typescript
import { updateCurrentModule } from '@/lib/db';

await updateCurrentModule(userId, 2);
```

**Manually update profile:**
```typescript
import { updateUserProfile } from '@/lib/db';

await updateUserProfile(userId, {
  pseudo: 'newUsername',
  xp_total: 5000,
  niveau_actuel: 5,
});
```

### Positioning Test

**Get test result:**
```typescript
import { getPositioningTestResult } from '@/lib/db';

const result = await getPositioningTestResult(userId);
// Returns: PositioningTestResult | null
```

**Save test result:**
```typescript
import { createPositioningTestResult } from '@/lib/db';

await createPositioningTestResult(
  userId,
  2,    // palier achieved (level)
  80,   // score percentage
  4,    // correct answers
  5     // total questions
);
```

## Helper Functions

### Calculate XP from submissions
```typescript
import { calculateUserXP } from '@/lib/db';

const totalXP = await calculateUserXP(userId);
// Sum of all XP from approved submissions
```

### Get completed exercises in module
```typescript
import { getCompletedExercisesInModule } from '@/lib/db';

const count = await getCompletedExercisesInModule(userId, moduleId);
```

### Unlock next module
```typescript
import { unlockNextModule } from '@/lib/db';

const nextModule = await unlockNextModule(userId);
// Creates progress for next available module
// Returns: Module | null
```

## XP Level Thresholds

The system automatically calculates levels based on XP:

```
Level 1: 0 XP
Level 2: 200 XP
Level 3: 600 XP
Level 4: 1,200 XP
Level 5: 2,000 XP
Level 6: 3,000 XP
Level 7: 4,500 XP
Level 8: 6,000 XP
Level 9: 8,000 XP
Level 10: 10,000 XP
```

Modify these in `lib/db.ts` function `calculateLevelFromXP()` as needed.

## Error Handling

All functions throw errors if something fails. Handle them in your components:

```typescript
try {
  const modules = await getModules();
} catch (error) {
  console.error('Failed to fetch modules:', error.message);
  // Show error to user
}
```

## In Server Components

These functions are safe to use in Server Components:

```typescript
// app/dashboard/page.tsx
import { getUserProfile, getUserProgress } from '@/lib/db';

export default async function DashboardPage() {
  const profile = await getUserProfile(userId);
  const progress = await getUserProgress(userId);

  return (
    <div>
      <h1>{profile.pseudo}</h1>
      <p>Level {profile.niveau_actuel}</p>
      <p>XP: {profile.xp_total}</p>
    </div>
  );
}
```

## In Client Components

For client components, wrap database calls in Server Actions:

```typescript
// lib/actions.ts
'use server';

import { getUserProfile } from '@/lib/db';

export async function loadUserProfile(userId: string) {
  return await getUserProfile(userId);
}
```

```typescript
// components/UserCard.tsx
'use client';

import { loadUserProfile } from '@/lib/actions';

export default function UserCard({ userId }: { userId: string }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadUserProfile(userId).then(setProfile);
  }, [userId]);

  return <div>{profile?.pseudo}</div>;
}
```

## Common Workflows

### Complete an exercise:
```typescript
import { 
  createSubmission, 
  updateUserXP, 
  getModuleProgress,
  updateModuleProgress 
} from '@/lib/db';

async function completeExercise(userId: string, exerciseId: number, code: string) {
  // 1. Save submission
  const submission = await createSubmission(userId, exerciseId, code);
  
  // 2. Approve and add XP (after AI review)
  await updateSubmissionStatus(submission.id, 'approved', 'Great work!', 100);
  
  // 3. Add XP to user
  await updateUserXP(userId, 100);
  
  // 4. Update module progress
  const moduleId = /* get from exercise */;
  const completed = await getCompletedExercisesInModule(userId, moduleId);
  await updateModuleProgress(userId, moduleId, 'in_progress', 50, completed);
}
```

### Level up system:
```typescript
async function checkAndLevelUp(userId: string) {
  const totalXP = await calculateUserXP(userId);
  const profile = await getUserProfile(userId);
  
  // New level based on XP
  const newLevel = calculateLevelFromXP(totalXP);
  
  if (newLevel > profile.niveau_actuel) {
    await updateUserLevel(userId, newLevel);
    
    // Unlock new modules
    await unlockNextModule(userId);
    
    return { leveledUp: true, newLevel };
  }
  
  return { leveledUp: false };
}
```

## Performance Tips

1. **Use indexes**: All common queries have indexes for fast lookups
2. **Select specific columns**: Instead of `select('*')`, select only needed columns
3. **Batch operations**: Update multiple records together when possible
4. **Cache results**: Cache data in React components when appropriate

## Troubleshooting

**"Table does not exist"**
→ Run migrations.sql in Supabase SQL Editor

**"Permission denied"**
→ Check RLS policies are enabled and correct

**"Unique constraint violation"**
→ User already has submission for this exercise

**"Row not found"**
→ Using `.single()` but no results, use `null` check instead

## See Also

- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Full schema documentation
- [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md) - Authentication setup
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Supabase configuration
