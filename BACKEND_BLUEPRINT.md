# TRAINARDUINO — BACKEND BLUEPRINT
## Complete Software Architecture Document
### Version 1.0 — July 2026

---

# TABLE OF CONTENTS

1. Domain Analysis
2. Folder Architecture
3. Layered Architecture
4. Database Strategy
5. Authentication System
6. Learning Engine
7. Gamification Engine
8. AI Architecture
9. API Strategy
10. Validation & Error Handling
11. Security Framework
12. Performance Strategy
13. Code Standards & Conventions
14. Implementation Roadmap
15. Scalability & Future Considerations

---

---

# PART 1: DOMAIN ANALYSIS

## 1.1 Business Domains Overview

TrainArduino operates across **8 core business domains**, each with distinct responsibilities:

```
┌─────────────────────────────────────────────────────┐
│         TRAINARDUINO BUSINESS DOMAINS               │
├─────────────────────────────────────────────────────┤
│ 1. IDENTITY                  (Who are you?)          │
│ 2. LEARNING                  (What do you learn?)    │
│ 3. PROGRESS                  (How far have you gone?)│
│ 4. GAMIFICATION              (How rewarding is it?)  │
│ 5. AI ASSISTANCE             (Help & feedback)       │
│ 6. SIMULATION                (Code execution)        │
│ 7. NOTIFICATIONS             (Communication)         │
│ 8. ANALYTICS                 (Insights & metrics)    │
└─────────────────────────────────────────────────────┘
```

---

## 1.2 Domain Responsibilities

### DOMAIN 1: IDENTITY
**Responsibility**: User authentication, profile management, session management

**Owns**:
- User registration & login
- Password management
- Session lifecycle
- User profile metadata
- Role & permission assignment
- Email verification

**Does NOT own**:
- Payment processing
- User analytics
- Learning progress
- Gamification data

**Key Entities**: `users`, `profiles`, `sessions`, `roles`

---

### DOMAIN 2: LEARNING
**Responsibility**: Course content structure and progression

**Owns**:
- Module definitions
- Lesson content
- Exercise definitions
- Wokwi simulation projects
- Code submission handling
- Grading criteria

**Does NOT own**:
- User progress (owned by Progress domain)
- XP calculation (owned by Gamification domain)
- AI feedback generation (owned by AI domain)
- User performance analytics (owned by Analytics domain)

**Key Entities**: `modules`, `lessons`, `exercises`, `submissions`

---

### DOMAIN 3: PROGRESS
**Responsibility**: Track user advancement through learning

**Owns**:
- Module progress (locked/in_progress/completed)
- Exercise completion tracking
- Positioning test results
- Module unlock conditions
- Prerequisite verification

**Does NOT own**:
- XP/level calculation
- Achievement unlock logic
- Gamification events

**Key Entities**: `progress`, `positioning_test_results`

---

### DOMAIN 4: GAMIFICATION
**Responsibility**: Reward system and motivation mechanics

**Owns**:
- XP calculation & distribution
- Level progression
- Achievement definitions & unlock logic
- Daily missions & challenges
- Streak counting
- Leaderboard calculation
- Badges
- User rewards history

**Does NOT own**:
- Learning progression (Progress domain)
- Lesson content (Learning domain)
- User authentication (Identity domain)

**Key Entities**: `xp_events`, `achievements`, `badges`, `streaks`, `leaderboard_snapshots`

---

### DOMAIN 5: AI ASSISTANCE
**Responsibility**: AI-powered code review and mentoring

**Owns**:
- Code submission evaluation
- Feedback generation
- Conversation history
- Prompt templates
- AI provider management
- Rate limiting for AI calls

**Does NOT own**:
- Submission storage (Learning domain)
- XP awarding (Gamification domain)
- User profiles (Identity domain)

**Key Entities**: `ai_evaluations`, `ai_conversations`, `ai_feedback`

---

### DOMAIN 6: SIMULATION
**Responsibility**: Code execution and circuit simulation

**Owns**:
- Wokwi integration
- Code execution environment
- Simulation results
- Arduino compilation

**Does NOT own**:
- Code storage
- User submissions
- Feedback generation

**Key Entities**: `simulation_results`

---

### DOMAIN 7: NOTIFICATIONS
**Responsibility**: User communication

**Owns**:
- Email notifications
- In-app notifications
- Push notifications (future)
- Notification preferences
- Notification history

**Does NOT own**:
- Message content generation
- Triggering events

**Key Entities**: `notifications`, `notification_preferences`

---

### DOMAIN 8: ANALYTICS
**Responsibility**: Insights and metrics

**Owns**:
- Event tracking
- User behavior analysis
- Learning effectiveness metrics
- Performance dashboards
- Cohort analysis

**Does NOT own**:
- Event triggering
- Data that belongs to other domains

**Key Entities**: `events`, `analytics_snapshots`

---

## 1.3 Domain Interactions

```
                    ┌──────────────────┐
                    │     IDENTITY     │
                    │  (Auth, Profile) │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼──────┐    ┌──────▼──────┐   ┌──────▼──────┐
    │  LEARNING  │    │  PROGRESS   │   │GAMIFICATION │
    │ (Modules,  │    │(Progression)│   │ (XP, Levels)│
    │ Lessons)   │    └──────┬──────┘   └──────┬──────┘
    └─────┬──────┘           │                 │
          │           ┌──────┴─────────────────┘
          │           │
    ┌─────▼───────────▼──────┐    ┌──────────────┐
    │     AI ASSISTANCE      │    │NOTIFICATIONS │
    │  (Code evaluation)     │    │(Email, in-app)
    └────────┬────────────────┘    └──────────────┘
             │
    ┌────────▼───────────┐    ┌──────────────────┐
    │    SIMULATION      │    │    ANALYTICS     │
    │   (Wokwi, code)    │    │  (Events, Metrics)
    └────────────────────┘    └──────────────────┘
```

---

---

# PART 2: FOLDER ARCHITECTURE

## 2.1 Complete Folder Structure

```
trainarduino/
│
├── app/                               # Next.js App Router
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Landing page
│   ├── (auth)/                        # Auth routes group
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (dashboard)/                   # Dashboard routes group
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (learning)/                    # Learning routes group
│   │   ├── layout.tsx
│   │   ├── modules/page.tsx           # All modules
│   │   ├── modules/[id]/page.tsx      # Module detail
│   │   ├── lessons/[id]/page.tsx      # Lesson view
│   │   └── exercises/[id]/page.tsx    # Exercise with editor
│   ├── (lab)/                         # Code lab
│   │   ├── layout.tsx
│   │   └── page.tsx                   # Integrated editor + simulator
│   ├── (admin)/                       # Admin routes (future)
│   │   ├── layout.tsx
│   │   ├── users/page.tsx
│   │   ├── content/page.tsx
│   │   └── analytics/page.tsx
│   ├── api/                           # API routes
│   │   ├── auth/
│   │   │   ├── callback/route.ts      # OAuth callback
│   │   │   └── logout/route.ts        # Token refresh
│   │   ├── submissions/
│   │   │   ├── route.ts               # POST /api/submissions
│   │   │   └── [id]/route.ts          # GET /api/submissions/[id]
│   │   ├── exercises/
│   │   │   ├── route.ts               # GET /api/exercises
│   │   │   └── [id]/route.ts          # GET /api/exercises/[id]
│   │   ├── progress/
│   │   │   ├── route.ts               # GET /api/progress
│   │   │   └── [moduleId]/route.ts    # GET /api/progress/[moduleId]
│   │   ├── ai/
│   │   │   ├── evaluate/route.ts      # POST /api/ai/evaluate
│   │   │   └── chat/route.ts          # POST /api/ai/chat
│   │   ├── gamification/
│   │   │   ├── profile/route.ts       # GET user XP/level
│   │   │   ├── leaderboard/route.ts   # GET leaderboard
│   │   │   └── achievements/route.ts  # GET achievements
│   │   └── health/route.ts            # System health check
│   ├── globals.css                    # Global styles
│   └── middleware.ts                  # Session & role middleware
│
├── lib/                               # Business logic layer
│   ├── auth/                          # Authentication domain
│   │   ├── service.ts                 # Auth business logic
│   │   ├── middleware.ts              # Auth checks
│   │   └── types.ts                   # Auth types
│   ├── identity/                      # User profile domain
│   │   ├── repository.ts              # Profile queries
│   │   ├── service.ts                 # Profile logic
│   │   └── types.ts
│   ├── learning/                      # Learning domain
│   │   ├── repository.ts              # Modules, lessons, exercises
│   │   ├── service.ts                 # Learning logic
│   │   └── types.ts
│   ├── progress/                      # Progress domain
│   │   ├── repository.ts              # Progress queries
│   │   ├── service.ts                 # Progression logic
│   │   └── types.ts
│   ├── gamification/                  # Gamification domain
│   │   ├── repository.ts              # XP, achievements queries
│   │   ├── service.ts                 # XP calculation, leveling
│   │   ├── events.ts                  # Event emitter
│   │   └── types.ts
│   ├── ai/                            # AI domain
│   │   ├── providers/                 # AI provider adapters
│   │   │   ├── claude.ts              # Claude provider
│   │   │   ├── gemini.ts              # Gemini provider
│   │   │   ├── openai.ts              # OpenAI provider
│   │   │   └── base.ts                # Provider interface
│   │   ├── prompts/                   # Prompt templates
│   │   │   ├── code-review.ts
│   │   │   ├── hint-generator.ts
│   │   │   └── feedback.ts
│   │   ├── service.ts                 # AI orchestration
│   │   └── types.ts
│   ├── simulation/                    # Simulation domain
│   │   ├── service.ts                 # Wokwi integration
│   │   └── types.ts
│   ├── notifications/                 # Notifications domain
│   │   ├── service.ts                 # Email, in-app
│   │   ├── templates/
│   │   │   ├── achievement.ts
│   │   │   ├── level-up.ts
│   │   │   └── submission-approved.ts
│   │   └── types.ts
│   ├── analytics/                     # Analytics domain
│   │   ├── service.ts                 # Event tracking
│   │   ├── queries.ts                 # Analytics queries
│   │   └── types.ts
│   ├── supabase/                      # Database layer
│   │   ├── server.ts                  # Server client
│   │   ├── client.ts                  # Browser client
│   │   └── middleware.ts              # Server-side session check
│   ├── validators/                    # Input validation (Zod)
│   │   ├── auth.ts
│   │   ├── submission.ts
│   │   ├── user.ts
│   │   └── schemas.ts
│   ├── errors/                        # Custom error classes
│   │   ├── AppError.ts                # Base error
│   │   ├── ValidationError.ts
│   │   ├── AuthenticationError.ts
│   │   ├── AuthorizationError.ts
│   │   └── NotFoundError.ts
│   ├── constants/                     # Global constants
│   │   ├── xp-thresholds.ts
│   │   ├── messages.ts
│   │   ├── limits.ts
│   │   └── config.ts
│   ├── utils/                         # Utility functions
│   │   ├── formatting.ts
│   │   ├── date.ts
│   │   ├── calculation.ts
│   │   └── retry.ts
│   ├── cache/                         # Caching layer
│   │   ├── redis.ts
│   │   └── memory.ts
│   └── types/                         # Global types
│       ├── database.ts
│       ├── api.ts
│       └── domain.ts
│
├── components/                        # React components
│   ├── design/                        # Design system
│   │   ├── DesignSystemProvider.tsx
│   │   ├── primitives/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── [...]
│   │   └── tokens.ts
│   ├── auth/                          # Auth components
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── [...]
│   ├── dashboard/                     # Dashboard components
│   │   ├── DashboardHeader.tsx
│   │   ├── ProgressCard.tsx
│   │   └── [...]
│   ├── learning/                      # Learning components
│   │   ├── ModuleCard.tsx
│   │   ├── LessonViewer.tsx
│   │   └── [...]
│   ├── gamification/                  # Gamification UI
│   │   ├── XpBar.tsx
│   │   ├── AchievementNotification.tsx
│   │   └── [...]
│   ├── lab/                           # Code lab components
│   │   ├── CodeEditor.tsx
│   │   ├── SimulatorView.tsx
│   │   └── [...]
│   └── shared/                        # Shared components
│       ├── Header.tsx
│       ├── Loading.tsx
│       └── [...]
│
├── hooks/                             # React hooks
│   ├── useAuth.ts                     # Auth context hook
│   ├── useUser.ts                     # User profile hook
│   ├── useProgress.ts                 # Progress hook
│   ├── useSubmission.ts               # Submission hook
│   ├── useGameification.ts            # Gamification hook
│   └── [...]
│
├── server-actions/                    # Server Actions (isolated by domain)
│   ├── auth.ts                        # signup, signin, signout
│   ├── submissions.ts                 # Submit code
│   ├── profile.ts                     # Update profile
│   ├── achievements.ts                # Claim achievements
│   └── [...]
│
├── middleware/                        # Middleware
│   ├── auth.ts                        # Session validation
│   ├── role.ts                        # Role-based access
│   ├── errorHandler.ts                # Error handling
│   └── logger.ts                      # Request logging
│
├── database/                          # Database management
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_gamification_tables.sql
│   │   └── [...]
│   ├── seeds/
│   │   ├── seed-modules.sql
│   │   ├── seed-lessons.sql
│   │   └── [...]
│   └── schema.ts                      # Schema documentation
│
├── styles/                            # Global styles
│   ├── globals.css
│   ├── variables.css
│   └── animations.css
│
├── public/                            # Static assets
│   ├── images/
│   ├── icons/
│   └── [...]
│
├── config/                            # Configuration
│   ├── environment.ts                 # Env variables
│   ├── features.ts                    # Feature flags
│   └── logging.ts
│
├── tests/                             # Test files
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
│
└── [Configuration files]
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── .env.example
    └── [...]
```

---

## 2.2 Folder Responsibility Matrix

| Folder | Responsibility | What Goes Here | What NEVER Goes Here |
|--------|-----------------|-----------------|----------------------|
| `app/` | Routes & pages | Page components, layouts | Business logic, data fetching |
| `lib/` | Business logic | Services, repositories, utilities | React components, hooks |
| `components/` | React UI | Components, design system | Business logic, API calls |
| `hooks/` | React state | Custom hooks | API calls, business logic |
| `server-actions/` | Server functions | Async server-only code | Client state, browser APIs |
| `api/` | API endpoints | Route handlers | Complex business logic (use services) |
| `database/` | Schema | Migrations, seeds | Application logic |
| `validators/` | Input validation | Zod schemas | Business rules |
| `errors/` | Error handling | Custom error classes | UI components |
| `constants/` | Fixed values | Config, limits, messages | Calculated values, state |
| `utils/` | Helpers | Pure functions | Side effects, API calls |

---

---

# PART 3: LAYERED ARCHITECTURE

## 3.1 Clean Architecture Overview

TrainArduino follows **Hexagonal (Ports & Adapters)** architecture with 5 layers:

```
┌─────────────────────────────────────────────────────┐
│              UI LAYER                               │
│         (React Components, Pages)                   │
│  - Display data                                     │
│  - Handle user interactions                         │
│  - Call server actions / fetch API                  │
└──────────────────┬──────────────────────────────────┘
                   │ (only calls down)
┌──────────────────▼──────────────────────────────────┐
│         APPLICATION LAYER                           │
│   (Server Actions, Route Handlers, Hooks)           │
│  - Orchestrate business logic                       │
│  - Handle requests                                  │
│  - Return serializable data                         │
│  - Use dependency injection                         │
└──────────────────┬──────────────────────────────────┘
                   │ (only calls down)
┌──────────────────▼──────────────────────────────────┐
│         BUSINESS LOGIC LAYER                        │
│      (Services, Domain Logic)                       │
│  - Pure business rules                              │
│  - XP calculations                                  │
│  - Progression logic                                │
│  - No database calls directly                       │
│  - No HTTP calls                                    │
│  - Testable in isolation                            │
└──────────────────┬──────────────────────────────────┘
                   │ (only calls down)
┌──────────────────▼──────────────────────────────────┐
│       DATA ACCESS LAYER                             │
│      (Repositories, Supabase Client)                │
│  - Encapsulate database queries                     │
│  - Abstract Supabase details                        │
│  - Handle transactions                              │
│  - Cache management                                 │
└──────────────────┬──────────────────────────────────┘
                   │ (only calls down)
┌──────────────────▼──────────────────────────────────┐
│       PERSISTENCE LAYER                             │
│    (PostgreSQL via Supabase)                        │
│  - Store data durably                               │
│  - Enforce constraints                              │
│  - RLS policies                                     │
└─────────────────────────────────────────────────────┘
```

---

## 3.2 Layer Responsibilities & Constraints

### LAYER 1: PERSISTENCE (Database)
**Responsibility**: Durable data storage

**What belongs here**:
- PostgreSQL schema (tables, columns, types)
- Constraints (UNIQUE, FK, NOT NULL)
- Indexes for performance
- RLS policies for security
- Triggers for automatic updates (updated_at)
- Views for common queries

**What NEVER belongs here**:
- Application logic
- Business rule validation
- XP calculations
- Progress calculations

**Allowed dependencies**: None (bottom layer)

---

### LAYER 2: DATA ACCESS (Repositories)
**Responsibility**: Encapsulate database queries

**What belongs here**:
```typescript
// ✅ CORRECT: Repository pattern
class ExerciseRepository {
  async getById(id: number) {
    return supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();
  }
  
  async getByModule(moduleId: number) {
    return supabase
      .from('exercises')
      .select('*')
      .eq('module_id', moduleId);
  }
}
```

**Constraints**:
- One repository per entity (or domain if grouped)
- Pure data queries (no logic)
- Handle caching
- Convert database records to domain types
- Handle null/undefined safely

**What NEVER belongs here**:
- Business logic
- XP calculations
- Conditional logic beyond filtering
- API calls to external services

**Allowed dependencies**: Supabase client, cache, logging

---

### LAYER 3: BUSINESS LOGIC (Services)
**Responsibility**: Domain rules and calculations

**What belongs here**:
```typescript
// ✅ CORRECT: Business logic in service
class GamificationService {
  calculateLevel(totalXp: number): number {
    if (totalXp >= 10000) return 10;
    if (totalXp >= 8000) return 9;
    // ...
    return 1;
  }
  
  calculateXpReward(
    difficulty: 'easy' | 'medium' | 'hard',
    timeSpent: number
  ): number {
    const baseReward = {
      easy: 25,
      medium: 50,
      hard: 100
    }[difficulty];
    
    // Bonus for quick completion
    const bonus = timeSpent < 300 ? 10 : 0;
    return baseReward + bonus;
  }
}
```

**Constraints**:
- Pure functions (no side effects)
- Testable in isolation
- Use repositories for data access
- Never call external APIs directly
- Never render UI

**What NEVER belongs here**:
- HTTP calls
- Database calls (use repositories)
- React hooks
- UI rendering

**Allowed dependencies**: Repositories, other services, validators, errors

---

### LAYER 4: APPLICATION (Controllers/Handlers)
**Responsibility**: Orchestrate requests and coordinate layers

**What belongs here**:
```typescript
// ✅ CORRECT: Server action orchestrating layers
export async function submitExercise(formData: FormData) {
  // 1. Validate input
  const validation = submitExerciseSchema.safeParse(formData);
  if (!validation.success) {
    throw new ValidationError(validation.error);
  }
  
  // 2. Get user
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError();
  
  // 3. Fetch data
  const exercise = await exerciseRepo.getById(validation.data.exerciseId);
  if (!exercise) throw new NotFoundError('Exercise');
  
  // 4. Apply business logic
  const xpReward = gamificationService.calculateXpReward(
    exercise.difficulty,
    validation.data.timeSpent
  );
  
  // 5. Update data
  const submission = await submissionRepo.create({
    userId: user.id,
    exerciseId: exercise.id,
    code: validation.data.code,
    xpGained: xpReward
  });
  
  // 6. Trigger side effects
  await notificationService.send({
    userId: user.id,
    type: 'submission_received'
  });
  
  // 7. Return serializable response
  return {
    success: true,
    submissionId: submission.id,
    xpGained: xpReward
  };
}
```

**Constraints**:
- Orchestrate between layers
- Handle errors and convert to appropriate responses
- Validate input before business logic
- Return serializable data only (JSON)
- Use dependency injection for testability

**What NEVER belongs here**:
- Complex business logic
- Direct database queries
- React hooks

**Allowed dependencies**: Services, repositories, validators, errors, external APIs

---

### LAYER 5: PRESENTATION (UI Components)
**Responsibility**: Display data and collect input

**What belongs here**:
```typescript
// ✅ CORRECT: Component handling UI only
'use client';

export function ExerciseSubmitForm({ exerciseId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function handleSubmit(code: string) {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await submitExercise(
        new FormData(Object.entries({ exerciseId, code }))
      );
      
      if (result.success) {
        // Update UI, show notification
        showNotification(`+${result.xpGained} XP`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <CodeEditor />
      <button disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit'}
      </button>
      {error && <Alert message={error} />}
    </form>
  );
}
```

**Constraints**:
- Only display logic and user interactions
- Call server actions for business operations
- Never execute business logic
- Manage only UI state

**What NEVER belongs here**:
- Business rules
- Data fetching (use server actions)
- Direct database queries

**Allowed dependencies**: Server actions, hooks, other components

---

## 3.3 Forbidden Dependencies

```
┌─────────────────────────────────────────────────────┐
│           DEPENDENCY FLOW                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Persistence ◄─── Data Access ◄─── Business        │
│                                      Logic          │
│                                        ▲            │
│                                        │            │
│                                    Application      │
│                                        ▲            │
│                                        │            │
│                                  Presentation       │
│                                                     │
├─────────────────────────────────────────────────────┤
│           FORBIDDEN FLOWS                           │
├─────────────────────────────────────────────────────┤
│  ❌ Persistence → Application                       │
│  ❌ Persistence → Presentation                      │
│  ❌ Data Access → Presentation                      │
│  ❌ Business Logic → Presentation                   │
│  ❌ Business Logic → Persistence (only repos)       │
│  ❌ Presentation → Business Logic                   │
│  ❌ Presentation → Data Access                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Allowed directions**: Down only (Presentation → Application → Business → Data → Persistence)

---

---

# PART 4: DATABASE STRATEGY

## 4.1 Current Schema Assessment

**Current State**: ✅ 7 core tables exist and are well-designed

### ✅ Tables That Should Remain

```
profiles
├─ Correctly links to auth.users (1:1)
├─ Has proper indexes (username)
├─ RLS policies implemented
└─ Auto-created via trigger

modules
├─ Linear progression (ordre)
├─ Palier (level requirement)
└─ Ready for content

lessons
├─ Proper FK relationships
├─ Ordered within modules
└─ Ready to expand

exercises
├─ Linked to modules
├─ Difficulty levels defined
├─ XP reward defined
├─ Wokwi project URL support
└─ Solves proper SQLing

submissions
├─ User + Exercise composite key (no duplicates)
├─ Status tracking (pending/reviewing/approved/rejected)
├─ XP earned recorded
└─ Feedback stored

progress
├─ Module-level tracking
├─ Status tracking (locked/in_progress/completed)
├─ Score and completion count
└─ User + Module composite key

positioning_test_results
├─ One result per user
├─ Level determination
└─ Performance tracking
```

---

## 4.2 Missing Tables (To Be Added)

### TABLE 8: XP_EVENTS (Event sourcing for gamification)
```sql
CREATE TABLE xp_events (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  submission_id INTEGER REFERENCES submissions(id),
  event_type VARCHAR(50) NOT NULL, -- 'exercise_approved', 'achievement_unlocked', 'daily_mission', 'first_submission'
  xp_amount INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX xp_events_user_id ON xp_events(user_id);
CREATE INDEX xp_events_created_at ON xp_events(created_at);
```

**Purpose**: Audit trail for XP, enables replay and analytics

---

### TABLE 9: ACHIEVEMENTS
```sql
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL, -- 'first_exercise', 'level_5', 'streak_7'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria_type VARCHAR(50) NOT NULL, -- 'submission_count', 'level_reached', 'streak'
  criteria_value INTEGER,
  xp_reward INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX achievements_slug ON achievements(slug);
```

**Purpose**: Define achievement rules, decoupled from user state

---

### TABLE 10: USER_ACHIEVEMENTS
```sql
CREATE TABLE user_achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  achievement_id INTEGER NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX user_achievements_achievement_id ON user_achievements(achievement_id);
```

**Purpose**: Track which achievements a user has unlocked

---

### TABLE 11: AI_EVALUATIONS
```sql
CREATE TABLE ai_evaluations (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id),
  model_name VARCHAR(50) NOT NULL, -- 'claude-3-sonnet', 'gemini-pro'
  prompt_used TEXT,
  evaluation_result TEXT NOT NULL, -- JSON
  score NUMERIC(3,2), -- 0.0 to 1.0
  suggestions TEXT[],
  tokens_used INTEGER,
  cost_cents NUMERIC(8,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ai_evaluations_submission_id ON ai_evaluations(submission_id);
CREATE INDEX ai_evaluations_model_name ON ai_evaluations(model_name);
```

**Purpose**: Track AI evaluations for cost, quality, and improvement

---

### TABLE 12: NOTIFICATIONS
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(50) NOT NULL, -- 'achievement', 'level_up', 'submission_approved'
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSONB, -- Additional context
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX notifications_user_id ON notifications(user_id);
CREATE INDEX notifications_read ON notifications(read);
```

**Purpose**: In-app notification system

---

### TABLE 13: DAILY_MISSIONS
```sql
CREATE TABLE daily_missions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reward_xp INTEGER,
  requirement_type VARCHAR(50), -- 'submissions_count', 'module_completion'
  requirement_value INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX daily_missions_date ON daily_missions(date);
```

**Purpose**: Daily challenges

---

### TABLE 14: USER_DAILY_MISSIONS
```sql
CREATE TABLE user_daily_missions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  daily_mission_id INTEGER NOT NULL REFERENCES daily_missions(id),
  completed_at TIMESTAMP,
  UNIQUE(user_id, daily_mission_id)
);

CREATE INDEX user_daily_missions_user_id ON user_daily_missions(user_id);
CREATE INDEX user_daily_missions_completed ON user_daily_missions(completed_at);
```

**Purpose**: Track daily mission progress per user

---

## 4.3 Schema Enhancements

### Add to PROFILES table:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS (
  last_active_at TIMESTAMP,
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  total_submissions INTEGER DEFAULT 0,
  completed_modules INTEGER DEFAULT 0,
  notifications_enabled BOOLEAN DEFAULT TRUE
);
```

### Add to SUBMISSIONS table:
```sql
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS (
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  evaluated_at TIMESTAMP,
  time_spent_seconds INTEGER, -- For analytics
  ai_evaluated BOOLEAN DEFAULT FALSE
);
```

---

## 4.4 Indexing Strategy

### Existing Indexes (Good)
```
profiles(username)
modules(ordre)
lessons(module_id, ordre)
exercises(module_id, difficulte)
submissions(user_id, exercise_id, statut)
progress(user_id, module_id)
```

### Add Missing Indexes (Performance)
```sql
-- Common queries
CREATE INDEX submissions_statut_created ON submissions(statut, created_at);
CREATE INDEX progress_statut ON progress(statut);
CREATE INDEX xp_events_user_created ON xp_events(user_id, created_at DESC);

-- Leaderboard queries
CREATE INDEX profiles_xp_total ON profiles(xp_total DESC);
CREATE INDEX profiles_niveau_actuel ON profiles(niveau_actuel DESC);

-- Analytics
CREATE INDEX submissions_created_by_month ON submissions(DATE_TRUNC('month', created_at), user_id);
```

---

## 4.5 Migration Strategy

### Versioning System
- Format: `YYYY_MM_DD_HH_MM_SS_description.sql`
- Example: `2026_07_06_14_30_00_add_xp_events.sql`
- Track executed migrations in `schema_migrations` table

### Deployment Process
```
1. Create migration file locally
2. Test on staging database
3. Review with team
4. Deploy to production with backup
5. Record migration execution
6. Monitor for errors
```

---

## 4.6 Scalability Considerations

### Current Architecture: ✅ Good for 100K users

**Bottlenecks at scale**:
- `profiles` table: Will need partitioning by created_at for 1M+ users
- `submissions` table: May need partitioning by user_id or month
- `xp_events` table: Append-only, plan for archiving old events

### Future Optimizations (Not needed now):
- PostgreSQL table partitioning for submissions
- Read replicas for leaderboard queries
- Cache layer (Redis) for:
  - User profiles
  - Leaderboard snapshots
  - Completion ratios

---

---

# PART 5: AUTHENTICATION SYSTEM

## 5.1 Authentication Architecture

### Current: ✅ Supabase Auth (Excellent)

```
┌─────────────────────────────────────────┐
│        User Browser                     │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │  Next.js    │
        │ Middleware  │
        │  (checks    │
        │   session)  │
        └──────┬──────┘
               │
        ┌──────▼───────────────┐
        │  Supabase Auth       │
        │  (JWT + PostgreSQL)  │
        └──────┬───────────────┘
               │
        ┌──────▼──────────────┐
        │ PostgreSQL          │
        │ (auth.users table)  │
        │ (profiles table)    │
        └─────────────────────┘
```

### Authentication Flow

**1. Signup**
```
User fills form
    ↓
Next.js Form Action: signup()
    ↓
Supabase.auth.signUp({email, password})
    ↓
Database trigger creates profiles row
    ↓
Send verification email
    ↓
Redirect to /verify-email
```

**2. Email Verification**
```
User clicks email link (with token)
    ↓
Supabase confirms email
    ↓
User can now login
```

**3. Login**
```
User fills form
    ↓
Next.js Form Action: signin()
    ↓
Supabase.auth.signInWithPassword({email, password})
    ↓
JWT token issued
    ↓
Token stored in secure HTTP-only cookie
    ↓
Redirect to /dashboard or /positioning-test
```

**4. Session Persistence**
```
Page load
    ↓
Middleware checks request cookies
    ↓
Validates JWT with Supabase
    ↓
getCurrentUser() retrieves user + profile
    ↓
User data available to page
```

**5. Logout**
```
User clicks logout button
    ↓
Server Action: signout()
    ↓
Supabase.auth.signOut()
    ↓
Cookies cleared
    ↓
Redirect to /login
```

---

## 5.2 Session Management

### Cookie Strategy (Secure)

```typescript
// Stored by @supabase/ssr:
- sb-access-token: JWT (short-lived, 1 hour)
- sb-refresh-token: Refresh JWT (long-lived, 7 days)

// Both are:
- HTTP-only (not accessible by JS)
- Secure (HTTPS only)
- SameSite=Lax (CSRF protection)
```

### Session Validation

```typescript
// On every request (via middleware):
1. Extract JWT from cookies
2. Validate signature with Supabase
3. Check expiration
4. If expired, use refresh token to get new JWT
5. Attach user to request context
```

---

## 5.3 Protected Routes

### Middleware Route Protection

```typescript
// middleware.ts

const protectedRoutes = [
  '/dashboard',
  '/modules',
  '/exercises',
  '/lab'
];

const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password'
];

export async function middleware(request: NextRequest) {
  const user = await getCurrentUser();
  
  // If accessing protected route without auth → redirect to login
  if (protectedRoutes.includes(pathname) && !user) {
    return NextResponse.redirect('/login');
  }
  
  // If logged in and accessing auth routes → redirect to dashboard
  if (publicRoutes.includes(pathname) && user) {
    return NextResponse.redirect('/dashboard');
  }
}
```

### Positioning Test Route Protection

```typescript
// Special rule: If authenticated but level not set,
// redirect to positioning test UNLESS already there

if (protectedRoutes.includes(pathname) && 
    user && 
    !user.profile.niveau_actuel &&
    pathname !== '/onboarding/positioning-test') {
  return NextResponse.redirect('/onboarding/positioning-test');
}
```

---

## 5.4 Roles & Permissions

### Current: Simple role system

```sql
-- In auth.raw_user_meta_data (JWT claims):
{
  "role": "student" | "teacher" | "admin",
  "email_confirmed": true | false
}
```

### Role-Based Middleware

```typescript
export async function checkRole(
  user: User,
  requiredRole: 'student' | 'teacher' | 'admin'
): boolean {
  const userRole = user.user_metadata?.role ?? 'student';
  
  const roleHierarchy = {
    'admin': 3,
    'teacher': 2,
    'student': 1
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// In protected routes:
if (!checkRole(user, 'admin')) {
  throw new AuthorizationError('Admin access required');
}
```

---

## 5.5 Email Verification

### Implementation

```typescript
// 1. Signup creates unverified user
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    // Send confirmation email automatically
    emailRedirectTo: `${baseUrl}/auth/verify-email`
  }
});

// 2. Email contains magic link with token
// 3. User clicks link
// 4. Verifies token with Supabase
// 5. Email marked confirmed
// 6. Can now access dashboard
```

---

## 5.6 Password Reset

### Flow

```
User forgets password
    ↓
Visits /forgot-password
    ↓
Enters email address
    ↓
Server Action: resetPassword(email)
    ↓
Supabase.auth.resetPasswordForEmail()
    ↓
Email sent with reset link
    ↓
User clicks link → /reset-password?token=...
    ↓
Form to enter new password
    ↓
Server Action: updatePassword(newPassword)
    ↓
Supabase.auth.updateUser({ password: newPassword })
    ↓
Session invalidated
    ↓
User redirected to /login
```

---

## 5.7 Security Best Practices

✅ Already implemented:
- HTTP-only cookies (not accessible by JS)
- CSRF protection (implicit via Next.js)
- JWT signature verification
- Rate limiting on password attempts (Supabase built-in)
- Password requirements (8+ chars, enforced by Supabase)

⚠️ To implement:
- Email verification mandatory
- 2FA option (future)
- Device fingerprinting (future)
- Session activity timeout
- Concurrent session limit per user
- Failed login attempt tracking

---

---

# PART 6: LEARNING ENGINE

## 6.1 Learning Progression Model

### Hierarchy

```
Module (e.g., "Arduino Basics")
  ├─ Lesson 1 (e.g., "What is Arduino?")
  ├─ Lesson 2 (e.g., "Setup Function")
  ├─ Lesson 3 (e.g., "Loop Function")
  └─ Exercise 1-5 (Code challenges)

Module (e.g., "Digital I/O")
  ├─ Lesson 1
  ├─ Lesson 2
  └─ Exercise 1-3
```

### Module Attributes

```typescript
interface Module {
  id: number;
  title: string;
  description: string;
  ordre: number;                // Display order
  palier_test: number;          // Level requirement
  estimated_hours: number;      // Time to complete
  learning_objectives: string[]; // What you'll learn
  prerequisite_module_id?: number; // Must complete before
  is_published: boolean;        // Admin control
}
```

### Lesson Attributes

```typescript
interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content: string;              // Markdown or HTML
  ordre: number;
  estimated_minutes: number;
  learning_type: 'theory' | 'code_along' | 'challenge';
  video_url?: string;           // Future: video lessons
  attachments?: string[];       // PDFs, resources
}
```

### Exercise Attributes

```typescript
interface Exercise {
  id: number;
  module_id: number;
  title: string;
  prompt: string;               // What to code
  correction_criteria: string;  // Grading rubric
  starter_code?: string;        // Initial template
  solution_code?: string;       // Reference solution
  xp_reward: number;            // Base XP (50, 100, 200)
  difficulty: 'easy' | 'medium' | 'hard';
  wokwi_project_url?: string;   // Simulator template
  testable: boolean;            // Has automated tests
  time_limit_minutes?: number;
  ordre: number;
}
```

---

## 6.2 Learning Flow

### Step 1: Module Selection
```
User views module list
    ↓
Checks prerequisites (shown as locked/unlocked)
    ↓
Clicks "Start Module"
    ↓
Progress set to 'in_progress'
    ↓
Redirected to first lesson
```

### Step 2: Lesson Completion
```
User reads lesson
    ↓
Clicks "Lesson complete"
    ↓
Unlocks next lesson (if exists)
    ↓
OR shows first exercise
```

### Step 3: Exercise Attempt
```
User views exercise prompt
    ↓
Opens code editor
    ↓
Writes code
    ↓
Clicks "Run" or "Submit"
    ↓
Code sent to Wokwi simulator OR AI evaluator
    ↓
Results shown
    ↓
If correct:
   - Submission marked 'approved'
   - XP awarded
   - Exercise marked complete
   - Next exercise shown
     └─ OR module marked 'completed'
└─ If incorrect:
   - Submission marked 'rejected'
   - Feedback provided (AI)
   - User can retry
```

### Step 4: Module Completion
```
All exercises completed
    ↓
Progress set to 'completed'
    ↓
Next module unlocked (if level requirements met)
    ↓
Achievement checked (e.g., "Complete Module 1")
    ↓
User directed to next available module
```

---

## 6.3 Progress Tracking

### What Gets Tracked

```typescript
interface Progress {
  id: number;
  user_id: UUID;
  module_id: number;
  status: 'locked' | 'in_progress' | 'completed';
  completion_percentage: number; // 0-100
  exercises_completed: number;
  total_exercises: number;
  score: number;                 // Average exercise score
  time_spent_minutes: number;
  last_accessed: DateTime;
  started_at: DateTime;
  completed_at?: DateTime;
}
```

### Calculation Logic

**Completion %**: (exercises_completed / total_exercises) * 100

**Score**: Average of all exercise submission scores (0.0 - 1.0)

**Status**:
- `locked` if prerequisites not met
- `in_progress` if started but not complete
- `completed` if all exercises done

---

## 6.4 Unlock Conditions

### Module Unlocking Logic

```typescript
async function canUnlockModule(
  user: User,
  module: Module
): boolean {
  // Check prerequisite module
  if (module.prerequisite_module_id) {
    const prerequisiteProgress = await progressRepo.getByModule(
      user.id,
      module.prerequisite_module_id
    );
    
    if (!prerequisiteProgress || 
        prerequisiteProgress.status !== 'completed') {
      return false;
    }
  }
  
  // Check level requirement
  if (module.palier_test > user.profile.niveau_actuel) {
    return false;
  }
  
  return true;
}

// Used when:
// 1. Module page loads → show if locked
// 2. Module completion → auto-unlock next
// 3. Level up → check for newly unlocked modules
```

---

## 6.5 Lesson Completion

**Note**: Lessons do not require explicit approval. They are marked complete when user navigates forward.

```typescript
async function markLessonComplete(
  userId: string,
  lessonId: number
) {
  // 1. Find lesson
  const lesson = await lessonRepo.getById(lessonId);
  
  // 2. Get module lessons (ordered)
  const moduleLessons = await lessonRepo.getByModule(lesson.module_id);
  
  // 3. Find next lesson (if exists)
  const nextLesson = moduleLessons.find(
    l => l.ordre > lesson.ordre
  );
  
  // 4. If next lesson exists, show it
  // Otherwise, show first exercise
  return nextLesson || await exerciseRepo.getFirstByModule(lesson.module_id);
}
```

---

---

# PART 7: GAMIFICATION ENGINE

## 7.1 XP System

### XP Architecture

```
Event Occurs (exercise completed, achievement unlocked)
    ↓
Calculate XP using GamificationService
    ↓
Create XP_EVENTS record (audit trail)
    ↓
Update profiles.xp_total
    ↓
Recalculate level
    ↓
Check for achievements
    ↓
Send notification
```

### XP Calculation Rules

```typescript
// Exercise submission: Base XP by difficulty
exercise_easy:   25 XP
exercise_medium: 50 XP
exercise_hard:   100 XP

// Speed bonus (completed in < 5 minutes)
+10 XP

// First submission (any difficulty)
+5 XP

// Achievement unlock
achievement.xp_reward (typically 50 XP)

// Daily mission completion
daily_mission.reward_xp (typically 25-50 XP)

// Streak bonus (7+ day streak)
+5% XP multiplier

// Total example:
User completes hard exercise in 3 minutes on day 7 streak
= 100 (base) + 10 (speed) + 5 (first) * 1.05 (streak) = 126 XP
```

---

## 7.2 Level System

### Level Thresholds

```typescript
const LEVEL_THRESHOLDS = [
  { level: 1,  minXp: 0 },
  { level: 2,  minXp: 200 },
  { level: 3,  minXp: 600 },
  { level: 4,  minXp: 1200 },
  { level: 5,  minXp: 2000 },
  { level: 6,  minXp: 3000 },
  { level: 7,  minXp: 4500 },
  { level: 8,  minXp: 6000 },
  { level: 9,  minXp: 8000 },
  { level: 10, minXp: 10000 }
];

function calculateLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i].minXp) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
}
```

### Level Up Event

```
User earns XP → Total XP crosses threshold
    ↓
Calculate new level
    ↓
If level > old level:
  ├─ Create xp_event with type='level_up'
  ├─ Send notification
  ├─ Check for achievement unlock ('level_5_reached')
  └─ Unlock new modules (if applicable)
```

---

## 7.3 Achievements System

### Achievement Types

```typescript
type AchievementCriteria = 
  | { type: 'submission_count'; value: number } // 10, 50, 100 exercises
  | { type: 'level_reached'; value: number }     // Level 5, 10
  | { type: 'streak_days'; value: number }       // 7, 30 day streak
  | { type: 'module_completed'; moduleId: number }
  | { type: 'perfect_score'; moduleid: number }  // 100% on module
  | { type: 'speed_run'; seconds: number }       // Complete in X seconds
  | { type: 'first_achievement' };               // Meta: unlock any achievement
```

### Achievement Examples

```typescript
[
  {
    id: 1,
    slug: 'first_exercise',
    title: 'First Steps',
    description: 'Complete your first exercise',
    criteria: { type: 'submission_count', value: 1 },
    xp_reward: 25,
    icon_url: '/icons/achievements/first-steps.png'
  },
  {
    id: 2,
    slug: 'level_5_reached',
    title: 'Intermediate Programmer',
    description: 'Reach Level 5',
    criteria: { type: 'level_reached', value: 5 },
    xp_reward: 100,
    icon_url: '/icons/achievements/level-5.png'
  },
  {
    id: 3,
    slug: 'week_streak',
    title: 'On Fire',
    description: 'Maintain a 7-day learning streak',
    criteria: { type: 'streak_days', value: 7 },
    xp_reward: 50,
    icon_url: '/icons/achievements/on-fire.png'
  }
]
```

### Achievement Unlock Flow

```typescript
// Event-driven: triggered after XP calculation
async function checkAchievementUnlocks(user: User, event: XpEvent) {
  const achievements = await achievementRepo.getAll();
  
  for (const achievement of achievements) {
    // Check if already unlocked
    const already = await userAchievementRepo.getByAchievementId(
      user.id,
      achievement.id
    );
    if (already) continue;
    
    // Check if criteria met
    const isMet = await checkAchievementCriteria(
      user,
      achievement.criteria
    );
    
    if (isMet) {
      // Unlock achievement
      await userAchievementRepo.create({
        user_id: user.id,
        achievement_id: achievement.id
      });
      
      // Award XP
      await gamificationService.addXp(user.id, {
        amount: achievement.xp_reward,
        source: 'achievement',
        achievementId: achievement.id
      });
      
      // Notify user
      await notificationService.send({
        userId: user.id,
        type: 'achievement_unlocked',
        data: { achievement }
      });
    }
  }
}
```

---

## 7.4 Streak System

### Streak Calculation

```typescript
interface Streak {
  current: number;      // Days in current streak
  best: number;         // Longest streak ever
  lastActivityDate: Date;
}

async function updateStreak(userId: string) {
  const profile = await profileRepo.getById(userId);
  const now = new Date();
  const lastActive = new Date(profile.last_active_at);
  
  const daysDifference = Math.floor(
    (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Same day or consecutive day → streak continues
  if (daysDifference <= 1) {
    profile.current_streak += 1;
    profile.best_streak = Math.max(
      profile.best_streak,
      profile.current_streak
    );
  } else {
    // More than 1 day gap → streak reset
    profile.current_streak = 1;
  }
  
  profile.last_active_at = now;
  return await profileRepo.update(userId, profile);
}

// Called when user submits exercise or completes lesson
```

---

## 7.5 Leaderboard

### Leaderboard Query

```typescript
async function getLeaderboard(
  limit: number = 100,
  timeframe: 'week' | 'month' | 'alltime' = 'month'
) {
  const period = {
    'week': 7,
    'month': 30,
    'alltime': 10000
  }[timeframe];
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - period);
  
  // Get XP earned in period
  const xpByUser = await xpEventRepo.getSumByUserSince(cutoffDate);
  
  // Join with profiles for level/username
  return Promise.all(
    xpByUser.map(async (row) => {
      const profile = await profileRepo.getById(row.user_id);
      return {
        rank: 0, // Assigned later
        userId: row.user_id,
        username: profile.username,
        level: profile.niveau_actuel,
        xp: row.total_xp,
        submissions: row.submission_count
      };
    })
  ).then(results => {
    // Sort and assign ranks
    return results
      .sort((a, b) => b.xp - a.xp)
      .map((r, idx) => ({ ...r, rank: idx + 1 }))
      .slice(0, limit);
  });
}
```

### Leaderboard Cache

```
Leaderboard snapshot taken hourly:
├─ Weekly leaderboard
├─ Monthly leaderboard
└─ All-time leaderboard

Cached in Redis for performance
```

---

## 7.6 Daily Missions

### Daily Mission Example

```typescript
// 2026-07-06
const dailyMission = {
  date: '2026-07-06',
  title: 'Code Master',
  description: 'Complete 3 exercises',
  reward_xp: 50,
  requirement_type: 'submissions_count',
  requirement_value: 3
};

// Check completion
async function checkDailyMissionCompletion(
  userId: string,
  missionId: number
) {
  const mission = await dailyMissionRepo.getById(missionId);
  
  if (mission.requirement_type === 'submissions_count') {
    const today = new Date().toISOString().split('T')[0];
    const count = await submissionRepo.countByUserSinceDate(
      userId,
      today
    );
    
    return count >= mission.requirement_value;
  }
  
  // Other requirement types...
}

// Completion flow:
// 1. Check at end of each exercise submission
// 2. If completed, award XP
// 3. Mark as completed in user_daily_missions
// 4. Show notification
```

---

## 7.7 Event-Driven Architecture

### Event Types

```typescript
type GameficationEvent =
  | { type: 'exercise_submitted'; exerciseId: number; timeSec: number }
  | { type: 'exercise_approved'; exerciseId: number; xpGained: number }
  | { type: 'achievement_unlocked'; achievementId: number }
  | { type: 'level_up'; newLevel: number }
  | { type: 'streak_updated'; currentStreak: number }
  | { type: 'daily_mission_completed'; missionId: number }
  | { type: 'module_completed'; moduleId: number };

// Event emitter pattern:
class GameficationService {
  private eventBus = new EventEmitter();
  
  async submitExercise(exerciseId: number, code: string) {
    // ... evaluate code ...
    
    this.eventBus.emit('exercise_submitted', {
      exerciseId,
      timeSec
    });
  }
  
  on(event: string, callback: Function) {
    this.eventBus.on(event, callback);
  }
}

// Listeners:
gamificationService.on('exercise_approved', async (event) => {
  await updateStreak(userId);
  await checkAchievementUnlocks(userId, event);
  await checkDailyMissionCompletion(userId);
});
```

---

---

# PART 8: AI ARCHITECTURE

## 8.1 Pluggable AI Provider Pattern

### Architecture

```
Application Layer
    ↓
AIService (Orchestrator)
    ↓
├─ ClaudeProvider
├─ GeminiProvider
├─ OpenAIProvider
└─ [FutureProvider]
    ↓
External AI APIs
```

---

## 8.2 Provider Interface

```typescript
// Define what every AI provider must implement
interface AIProvider {
  /**
   * Evaluate a code submission
   * Returns structured feedback
   */
  evaluateCode(
    code: string,
    exercise: Exercise,
    context: {
      language: 'cpp' | 'python'; // Arduino compatible
      timeSpent: number;
      previousAttempts: number;
    }
  ): Promise<EvaluationResult>;
  
  /**
   * Generate hint for stuck user
   */
  generateHint(
    exercise: Exercise,
    previousHints: string[]
  ): Promise<string>;
  
  /**
   * Chat for live mentoring
   */
  chat(message: string): Promise<string>;
  
  /**
   * Cost for this provider
   */
  estimateCost(): Promise<number>; // in cents
  
  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
}

interface EvaluationResult {
  score: number; // 0.0 to 1.0
  passed: boolean; // score >= 0.7
  feedback: string;
  suggestions: string[];
  commonMistakes: string[];
  nextSteps: string[];
}
```

---

## 8.3 Provider Implementations

### Claude Provider

```typescript
class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  
  async evaluateCode(code, exercise, context): Promise<EvaluationResult> {
    const prompt = buildCodeReviewPrompt(code, exercise, context);
    
    const message = await this.client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });
    
    return parseResponse(message.content[0].text);
  }
}
```

### Gemini Provider

```typescript
class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }
  
  async evaluateCode(code, exercise, context): Promise<EvaluationResult> {
    const model = this.client.getGenerativeModel({
      model: 'gemini-1.5-pro'
    });
    
    const prompt = buildCodeReviewPrompt(code, exercise, context);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    return parseResponse(text);
  }
}
```

### Provider Selector

```typescript
class AIService {
  private providers: Map<string, AIProvider> = new Map();
  
  registerProvider(name: string, provider: AIProvider) {
    this.providers.set(name, provider);
  }
  
  async selectBestProvider(): Promise<AIProvider> {
    for (const [name, provider] of this.providers) {
      if (await provider.isAvailable()) {
        const cost = await provider.estimateCost();
        // Select cheapest available
      }
    }
    
    // Fallback to first available
    return this.providers.values().next().value;
  }
  
  async evaluateCode(code, exercise, context) {
    const provider = await this.selectBestProvider();
    return provider.evaluateCode(code, exercise, context);
  }
}
```

---

## 8.4 Prompt Management

### Prompt Templates

```typescript
// lib/ai/prompts/code-review.ts

const CODE_REVIEW_PROMPT = `
You are an Arduino programming instructor evaluating student code.

EXERCISE:
{exercise_title}
{exercise_prompt}
{correction_criteria}

STUDENT CODE:
{code}

EVALUATION CRITERIA:
- Does it compile?
- Does it follow Arduino conventions?
- Is it efficient?
- Are there logical errors?
- Is the solution elegant?

Provide:
1. Score (0.0-1.0)
2. Brief feedback (2-3 sentences)
3. 2-3 specific suggestions
4. 1 common mistake if applicable
5. Next steps to improve

Format as JSON:
{
  "score": 0.75,
  "passed": true,
  "feedback": "...",
  "suggestions": ["...", "..."],
  "commonMistakes": ["..."],
  "nextSteps": ["..."]
}
`;

function buildCodeReviewPrompt(
  code: string,
  exercise: Exercise,
  context: EvaluationContext
): string {
  return CODE_REVIEW_PROMPT
    .replace('{exercise_title}', exercise.title)
    .replace('{exercise_prompt}', exercise.prompt)
    .replace('{correction_criteria}', exercise.correction_criteria)
    .replace('{code}', code);
}
```

---

## 8.5 Caching Strategy

### Cache Levels

```
┌─────────────────────────────────┐
│  L1: Request Cache              │ (memory, 1 minute)
│  "Same evaluation → cached result"
├─────────────────────────────────┤
│  L2: Redis Cache                │ (1 hour)
│  "Same code + exercise → cached"
├─────────────────────────────────┤
│  L3: Database                   │ (permanent)
│  "Store all evaluations"
└─────────────────────────────────┘
```

```typescript
async function evaluateCode(
  code: string,
  exerciseId: number
): Promise<EvaluationResult> {
  const cacheKey = `eval:${hash(code)}:${exerciseId}`;
  
  // L1: Memory
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }
  
  // L2: Redis
  const cached = await redis.get(cacheKey);
  if (cached) {
    requestCache.set(cacheKey, cached);
    return cached;
  }
  
  // Fallback: Call AI provider
  const result = await aiService.evaluateCode(code, exerciseId);
  
  // Store in caches
  requestCache.set(cacheKey, result);
  await redis.setex(cacheKey, 3600, JSON.stringify(result));
  
  // Store in DB for history
  await aiEvaluationRepo.create({
    submissionId: submission.id,
    result: result
  });
  
  return result;
}
```

---

## 8.6 Cost Optimization

```typescript
interface AIProviderCost {
  name: string;
  inputTokenCost: number;  // cents per 1M tokens
  outputTokenCost: number;
  minCostPerRequest: number;
}

const COSTS = {
  claude: {
    inputTokenCost: 0.3,      // $0.003 per 1K input tokens
    outputTokenCost: 0.15,    // $0.015 per 1K output tokens
  },
  gemini: {
    inputTokenCost: 0.075,    // Cheaper
    outputTokenCost: 0.3,
  }
};

function selectProviderByBudget(budget: number) {
  // Select provider that:
  // 1. Is available
  // 2. Fits within budget
  // 3. Highest quality for price
}

// Daily AI budget: $10
// Monthly AI budget: $300
```

---

## 8.7 Rate Limiting

```typescript
class AIRateLimiter {
  async checkLimit(userId: string): Promise<boolean> {
    // Per-user limits
    const todayEvals = await redis.get(`ai:evals:user:${userId}:today`);
    if (todayEvals > 50) return false; // Max 50 evaluations/day
    
    // Per-minute limits (prevent abuse)
    const minEvals = await redis.get(`ai:evals:user:${userId}:minute`);
    if (minEvals > 5) return false; // Max 5/minute
    
    return true;
  }
  
  async incrementUsage(userId: string) {
    await redis.incr(`ai:evals:user:${userId}:today`);
    await redis.expire(`ai:evals:user:${userId}:today`, 86400);
    
    await redis.incr(`ai:evals:user:${userId}:minute`);
    await redis.expire(`ai:evals:user:${userId}:minute`, 60);
  }
}
```

---

---

# PART 9: API STRATEGY

## 9.1 When to Use What

| Scenario | Use | Why |
|----------|-----|-----|
| User signup | Server Action | Auth only, no response data needed |
| Submit exercise code | Server Action | Secure, XP awarded server-side |
| Get user progress | Server Component | Direct DB query, no client overhead |
| Leaderboard (client-rendered) | Route Handler | External clients may need it |
| Live AI chat | Route Handler | Streaming support needed |
| Update profile | Server Action | User-specific data |
| List modules | Server Component | Static-ish data, cache friendly |
| Analytics event | Route Handler | Could come from mobile app |

---

## 9.2 Server Actions (Primary)

### Use Case: Mutations (state changes)

```typescript
// server-actions/submissions.ts
'use server';

export async function submitExercise(
  exerciseId: number,
  code: string
): Promise<{ success: boolean; xpGained: number; message: string }> {
  // 1. Authenticate
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError();
  
  // 2. Validate
  const validation = submitExerciseSchema.safeParse({ exerciseId, code });
  if (!validation.success) throw new ValidationError(validation.error);
  
  // 3. Business logic
  const submission = await exerciseService.submitCode(
    user.id,
    exerciseId,
    code
  );
  
  // 4. Return serializable response
  return {
    success: true,
    xpGained: submission.xpGained,
    message: 'Code submitted successfully'
  };
}

// Client usage:
'use client';
const result = await submitExercise(exerciseId, code);
```

**Advantages**:
- ✅ No network latency (co-located)
- ✅ Secure by default (no exposure)
- ✅ Direct DB access
- ✅ TypeScript-safe

**Limitations**:
- ❌ Only from React
- ❌ Must return serializable data
- ❌ No streaming

---

## 9.3 Route Handlers (API Routes)

### Use Case: External APIs, streaming, or complex protocols

```typescript
// app/api/submissions/route.ts
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request
    const body = await request.json();
    const validation = submitExerciseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message },
        { status: 400 }
      );
    }
    
    // 2. Authenticate (via headers or session)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 3. Business logic
    const submission = await exerciseService.submitCode(
      user.id,
      validation.data.exerciseId,
      validation.data.code
    );
    
    // 4. Return JSON response
    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        xpGained: submission.xpGained,
        feedback: submission.feedback
      }
    }, { status: 201 });
    
  } catch (error) {
    return errorHandler(error);
  }
}

export async function GET(request: NextRequest) {
  // Get user submissions
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const submissions = await submissionRepo.getByUserId(user.id);
  return NextResponse.json({ submissions });
}
```

**When to use**:
- External clients (mobile app)
- Webhooks from Wokwi/AI services
- Streaming responses
- Complex protocols

---

## 9.4 Server Components (Queries)

### Use Case: Server-side data fetching for pages

```typescript
// app/(learning)/modules/page.tsx
export default async function ModulesPage() {
  // Direct database access (no API overhead)
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  const modules = await moduleRepo.getAll();
  const progress = await progressRepo.getByUserId(user.id);
  
  // Determine which can be unlocked
  const modulesWithStatus = modules.map(mod => {
    const userProgress = progress.find(p => p.module_id === mod.id);
    return {
      ...mod,
      status: userProgress?.status || 'locked'
    };
  });
  
  return (
    <div>
      {modulesWithStatus.map(mod => (
        <ModuleCard key={mod.id} module={mod} />
      ))}
    </div>
  );
}
```

**Advantages**:
- ✅ No client-side fetching code needed
- ✅ Direct DB access
- ✅ Automatic caching via Next.js
- ✅ SEO-friendly

---

## 9.5 Supabase Client (Real-time)

### Use Case: Real-time updates (future)

```typescript
// For features like:
// - Live leaderboard updates
// - Notification streaming
// - Collaborative features

'use client';

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

export function LiveLeaderboard() {
  const leaderboard = useRealtimeSubscription('leaderboard');
  
  return (
    <div>
      {leaderboard.map((entry, idx) => (
        <div key={entry.userId}>
          #{idx + 1} - {entry.username}: {entry.xp} XP
        </div>
      ))}
    </div>
  );
}
```

---

## 9.6 API Response Format

### Standard Response Schema

```typescript
// Success
{
  success: true,
  data: { ... },
  timestamp: "2026-07-06T14:30:00Z"
}

// Error
{
  success: false,
  error: {
    code: "VALIDATION_ERROR" | "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_ERROR",
    message: "Human readable message",
    details: { ... } // Optional
  },
  timestamp: "2026-07-06T14:30:00Z"
}
```

---

## 9.7 API Endpoints (Future)

```
┌─────────────────────────────────────────┐
│          API ENDPOINTS                  │
├─────────────────────────────────────────┤
│ POST   /api/auth/signup                 │
│ POST   /api/auth/signin                 │
│ POST   /api/auth/signout                │
│ POST   /api/auth/refresh                │
│                                         │
│ GET    /api/user                        │
│ PUT    /api/user                        │
│                                         │
│ GET    /api/modules                     │
│ GET    /api/modules/:id                 │
│                                         │
│ GET    /api/exercises/:id               │
│ POST   /api/submissions                 │
│ GET    /api/submissions                 │
│ GET    /api/submissions/:id             │
│                                         │
│ POST   /api/ai/evaluate                 │
│ POST   /api/ai/chat                     │
│ POST   /api/ai/hint                     │
│                                         │
│ GET    /api/progress                    │
│ GET    /api/progress/:moduleId          │
│                                         │
│ GET    /api/gamification/profile        │
│ GET    /api/gamification/leaderboard    │
│ GET    /api/gamification/achievements   │
│                                         │
│ GET    /api/health                      │
└─────────────────────────────────────────┘
```

---

---

# PART 10: VALIDATION & ERROR HANDLING

## 10.1 Validation Strategy (Zod)

### Input Schemas

```typescript
// lib/validators/auth.ts
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  username: z.string().min(3).max(20)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// lib/validators/submission.ts
export const submitExerciseSchema = z.object({
  exerciseId: z.number().int().positive(),
  code: z.string().min(1).max(50000),
  timeSpent: z.number().optional()
});

// Usage:
const validation = signupSchema.safeParse(formData);
if (!validation.success) {
  throw new ValidationError(validation.error);
}
const { email, password, username } = validation.data;
```

---

## 10.2 DTO (Data Transfer Objects)

### Request DTOs

```typescript
// From client to server
interface SubmitExerciseRequest {
  exerciseId: number;
  code: string;
  timeSpent?: number;
}

// Validate and coerce
const dto = submitExerciseSchema.parse(request);
```

### Response DTOs

```typescript
// From server to client (always serializable)
interface SubmitExerciseResponse {
  success: boolean;
  submissionId: number;
  xpGained: number;
  passed: boolean;
  feedback?: string;
}
```

---

## 10.3 Error Hierarchy

```typescript
// lib/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Specific errors
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Not authenticated') {
    super('AUTHENTICATION_ERROR', message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Not authorized') {
    super('AUTHORIZATION_ERROR', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super(
      'RATE_LIMIT',
      `Too many requests. Retry after ${retryAfter}s`,
      429,
      { retryAfter }
    );
  }
}
```

---

## 10.4 Error Handling Middleware

```typescript
// middleware/errorHandler.ts
export function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: error.flatten()
        }
      },
      { status: 400 }
    );
  }
  
  // Log unknown errors
  console.error('Unhandled error:', error);
  
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    },
    { status: 500 }
  );
}
```

---

## 10.5 Validation in Layers

```
┌─────────────────────────────┐
│    LAYER 1: PRESENTATION    │
│  Client-side validation     │
│  (User feedback)            │
└────────────────┬────────────┘
                 │
┌────────────────▼────────────┐
│   LAYER 2: APPLICATION      │
│  Zod schema validation      │
│  Type coercion              │
└────────────────┬────────────┘
                 │
┌────────────────▼────────────┐
│   LAYER 3: BUSINESS LOGIC   │
│  Domain rule validation     │
│  (Can user submit again?)   │
└────────────────┬────────────┘
                 │
┌────────────────▼────────────┐
│   LAYER 4: DATABASE         │
│  Constraint validation      │
│  (FK integrity, UNIQUE)     │
└─────────────────────────────┘
```

---

---

# PART 11: SECURITY FRAMEWORK

## 11.1 Security by Layer

### Layer 1: Network Security (HTTPS)
- ✅ All communication encrypted
- ✅ Enforce HSTS headers
- ✅ Secure cookies (HTTPS-only)

### Layer 2: Authentication
- ✅ Supabase Auth (industry-standard)
- ✅ Session validation on every request
- ✅ JWT signature verification
- ⚠️ Add: Email verification mandatory
- ⚠️ Add: 2FA option

### Layer 3: Authorization (RLS)
- ✅ Row-level security on all tables
- ✅ Users can only access their own data
- ✅ Rate limiting per user
- ⚠️ Add: Role-based access control

### Layer 4: Input Validation
- ✅ Zod schemas validate all input
- ✅ Type coercion prevents injection
- ⚠️ Add: Rate limiting on API endpoints

### Layer 5: Database Constraints
- ✅ Foreign keys prevent orphaned data
- ✅ UNIQUE constraints prevent duplicates
- ✅ NOT NULL prevents null dereference

---

## 11.2 RLS Policies (Row-Level Security)

### Current Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Anonymous can read exercises (for logged-in users)
CREATE POLICY "Authenticated can read exercises" ON exercises
  FOR SELECT USING (auth.role() = 'authenticated');
```

### To Add (Admin access)

```sql
-- Admin can read/write all data
CREATE POLICY "Admins can access all" ON profiles
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Teachers can grade submissions
CREATE POLICY "Teachers can grade" ON submissions
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'teacher'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'teacher'
  );
```

---

## 11.3 Secrets Management

### Environment Variables (Never committed)

```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

SUPABASE_SERVICE_ROLE_KEY=... # Never exposed to client
CLAUDE_API_KEY=...
GEMINI_API_KEY=...
WOKWI_API_KEY=...

JWT_SECRET=... # For internal use
REDIS_URL=...

ADMIN_EMAIL=...
```

### Secrets in Production

- GitHub Secrets for CI/CD
- Vercel Environment Variables
- AWS Secrets Manager (if needed)
- Never log secrets
- Rotate regularly

---

## 11.4 API Protection

### Rate Limiting

```typescript
// Per IP address
- 60 requests/minute for public endpoints
- 1000 requests/hour for authenticated endpoints

// Per user
- 50 AI evaluations/day
- 100 submissions/hour
- 5 requests/minute for AI endpoints
```

### CORS (Cross-Origin Resource Sharing)

```typescript
// Only allow:
// - Same origin (Next.js app)
// - Wokwi domain (for simulation)
// - Future mobile app domain

const allowedOrigins = [
  'https://trainarduino.com',
  'https://wokwi.com',
  'https://api.wokwi.com'
];
```

### CSRF Protection

✅ Implicit via Next.js middleware (same-site cookies)

---

## 11.5 Data Protection

### Encryption at Rest
- ✅ PostgreSQL running on Supabase (encrypted)
- ✅ Backups encrypted

### Encryption in Transit
- ✅ HTTPS for all connections
- ✅ TLS 1.2+

### Data Minimization
- ❌ Don't store passwords (Supabase handles)
- ✅ Only store necessary data
- ✅ Regular cleanup of old submissions

---

## 11.6 Audit & Logging

```typescript
// What to log
- User authentication events
- Permission checks
- Data access
- Error events

// What NOT to log
- Passwords
- API keys
- User code (sensitive data)
- Personal information

// Format:
{
  timestamp: ISO8601,
  userId: UUID,
  action: 'login' | 'submit_code' | 'view_profile',
  resource: 'exercises:123',
  result: 'success' | 'forbidden' | 'error',
  details: {}
}
```

---

---

# PART 12: PERFORMANCE STRATEGY

## 12.1 Database Optimization

### Query Optimization

```typescript
// ❌ BAD: N+1 query problem
const modules = await getModules();
for (const module of modules) {
  const lessons = await getLessons(module.id); // Repeated queries!
}

// ✅ GOOD: Single batch query
const modules = await supabase
  .from('modules')
  .select('*, lessons(*)')
  .order('ordre');
```

### Pagination

```typescript
// ❌ BAD: Load all
const submissions = await submissionRepo.getAll();

// ✅ GOOD: Paginate
const submissions = await submissionRepo.getByUserId(
  userId,
  { page: 1, limit: 20 }
);
```

---

## 12.2 Caching Layers

### L1: In-Memory (Request-scoped)
```typescript
// Cache within single request
const cache = new Map();

function getModule(id) {
  if (cache.has(`module:${id}`)) return cache.get(`module:${id}`);
  const module = db.query(...);
  cache.set(`module:${id}`, module);
  return module;
}
```

### L2: Redis (Distributed)
```typescript
// Cache for 1 hour
const module = await redis.getOrSet(
  `module:${id}`,
  async () => db.modules.findById(id),
  3600
);
```

### L3: CDN (Static content)
```typescript
// Use Next.js static generation
export const revalidate = 3600; // 1 hour
```

### Cache Invalidation
```
When data changes:
├─ Invalidate L1 (in-memory) immediately
├─ Invalidate L2 (Redis) immediately
└─ Invalidate L3 (CDN) via revalidate
```

---

## 12.3 React Optimization

### Server Components (Default)
```typescript
// ✅ Use server components for data fetching
export default async function ModuleList() {
  const modules = await getModules();
  return <ModuleGrid modules={modules} />;
}
```

### Client Components (Only when needed)
```typescript
// ✅ Use client components for interactivity
'use client';

export function SubmitForm() {
  const [isLoading, setIsLoading] = useState(false);
  // ...
}
```

### Streaming (Large lists)
```typescript
// ✅ Stream large datasets
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <LeaderboardStream />
    </Suspense>
  );
}
```

---

## 12.4 Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/module-thumbnail.jpg"
  alt="Module"
  width={300}
  height={200}
  priority // For above-fold images
/>
```

---

## 12.5 Monitoring & Metrics

```typescript
// What to monitor
- Page load time (aim for < 2s)
- Database query time (aim for < 100ms)
- API response time (aim for < 500ms)
- Error rate (aim for < 0.1%)
- Cache hit rate (aim for > 80%)

// Tools
- Next.js Analytics
- Supabase logs
- Sentry for errors
- Custom metrics via events
```

---

---

# PART 13: CODE STANDARDS & CONVENTIONS

## 13.1 File Naming

```
Domain/Feature Directory Structure:
domain-name/
├─ service.ts          (Business logic)
├─ repository.ts       (Data access)
├─ types.ts            (TypeScript types)
├─ constants.ts        (Constants)
├─ validators.ts       (Input validation)
└─ __tests__/          (Tests)

Examples:
lib/learning/service.ts
lib/gamification/repository.ts
server-actions/submissions.ts
components/dashboard/ModuleCard.tsx
hooks/useProgress.ts
```

---

## 13.2 Naming Conventions

### Services (Business Logic)
```typescript
// class FeatureService
class LearningService { }
class GamificationService { }
class AIService { }

// methods: verb + noun
calculateXp()
evaluateSubmission()
unlockAchievement()
```

### Repositories (Data Access)
```typescript
// class FeatureRepository
class ModuleRepository { }
class ProgressRepository { }

// methods: standard CRUD
getById(id)
getByUserId(userId)
create(data)
update(id, data)
delete(id)
```

### Hooks (React)
```typescript
// use + FeatureName
useAuth()
useUser()
useProgress()
useGamification()
```

### Components
```typescript
// PascalCase, descriptive
ModuleCard
ExerciseSubmitForm
DashboardHeader
XpProgressBar
```

### Constants
```typescript
// UPPER_SNAKE_CASE
const XP_THRESHOLDS = [...]
const MAX_SUBMISSIONS_PER_HOUR = 10
```

### Type Names
```typescript
// PascalCase
interface User { }
type ProgressStatus = 'locked' | 'in_progress' | 'completed'
```

---

## 13.3 Folder Organization

### By Feature (Recommended)
```
app/
├─ (learning)/
│  ├─ modules/page.tsx
│  ├─ modules/[id]/page.tsx
│  └─ exercises/[id]/page.tsx

lib/
├─ learning/
│  ├─ service.ts
│  ├─ repository.ts
│  └─ types.ts

components/
├─ learning/
│  ├─ ModuleCard.tsx
│  └─ ExerciseEditor.tsx

hooks/
├─ useProgress.ts
└─ useExercise.ts
```

### By Layer (Alternative)
```
lib/
├─ repositories/
│  ├─ module.ts
│  ├─ progress.ts
│  └─ submission.ts
├─ services/
│  ├─ learning.ts
│  ├─ gamification.ts
│  └─ ai.ts
```

---

## 13.4 Import Organization

```typescript
// Group imports in order:
// 1. External libraries
import { z } from 'zod';
import { Anthropic } from '@anthropic-ai/sdk';

// 2. Next.js
import { redirect } from 'next/navigation';
import Image from 'next/image';

// 3. App code (lib, components)
import { learningService } from '@/lib/learning/service';
import { ModuleCard } from '@/components/learning/ModuleCard';

// 4. Types
import type { Module } from '@/lib/learning/types';

// 5. Relative (./same folder)
import { helper } from './helper';
```

---

## 13.5 Code Comments

```typescript
// Good comments:
// ✅ Explain WHY, not WHAT
// ✅ Document assumptions
// ✅ Link to related code

// Bad comments:
// ❌ State the obvious
// ❌ Repeat the code
// ❌ Outdated info

// Example:
// Calculate streak bonus to encourage daily engagement
// Streak multiplier: 7+ days = +5%, 14+ days = +10%, etc.
function calculateStreakBonus(streakDays: number): number {
  if (streakDays >= 14) return 1.1;
  if (streakDays >= 7) return 1.05;
  return 1.0;
}
```

---

## 13.6 Type Safety

```typescript
// ✅ Use specific types
type Status = 'locked' | 'in_progress' | 'completed';

// ❌ Avoid any
const data: any = { ... };

// ✅ Use interfaces for extensible types
interface User { }

// ✅ Use types for unions
type Result<T> = { success: true; data: T } | { success: false; error: Error };
```

---

---

# PART 14: IMPLEMENTATION ROADMAP

## 14.1 Phased Implementation

### PHASE 1: Foundation (Weeks 1-2)

**Goal**: Fix build, establish architecture, core auth working

```
WEEK 1:
├─ Fix dashboard rendering (client/server boundary)
├─ Remove duplicate Supabase exports
├─ Complete folder structure
└─ Create base service/repository classes

WEEK 2:
├─ Implement position test completion flow
├─ Setup Zod validators
├─ Implement error handling middleware
├─ Add logging infrastructure
```

**Deliverable**: 
- ✅ Build succeeds
- ✅ Auth flow complete
- ✅ Positioning test redirects to dashboard with level set

---

### PHASE 2: Learning System (Weeks 3-4)

**Goal**: Core learning progression working

```
WEEK 3:
├─ Create ModuleRepository & service
├─ Create LessonRepository & service
├─ Create ExerciseRepository & service
└─ Build module/lesson/exercise pages

WEEK 4:
├─ Implement submission flow
├─ Create ProgressRepository & service
├─ Implement progress tracking
└─ Module completion logic
```

**Deliverable**:
- ✅ Users can navigate modules → lessons → exercises
- ✅ Progress saved
- ✅ Modules unlock based on completion
- ✅ All routes protected by auth

---

### PHASE 3: Gamification (Weeks 5-6)

**Goal**: XP, levels, achievements working

```
WEEK 5:
├─ Create GamificationService
├─ Implement XP calculation
├─ Create xp_events table
├─ Wire XP to submissions
├─ Implement level calculation

WEEK 6:
├─ Create achievements table & service
├─ Implement achievement unlock logic
├─ Create streak tracking
├─ Build gamification UI components
```

**Deliverable**:
- ✅ Users earn XP for submissions
- ✅ Level up when XP threshold crossed
- ✅ Achievements unlock
- ✅ Dashboard displays XP/level/achievements

---

### PHASE 4: AI Integration (Weeks 7-8)

**Goal**: AI-powered code evaluation

```
WEEK 7:
├─ Create AIService with provider interface
├─ Implement Claude provider
├─ Create ai_evaluations table
├─ Setup prompt templates

WEEK 8:
├─ Implement caching strategy
├─ Add rate limiting
├─ Implement cost tracking
├─ Test with real submissions
```

**Deliverable**:
- ✅ Code submissions evaluated by AI
- ✅ Feedback shown to users
- ✅ XP awarded for approved submissions
- ✅ Cost tracking working

---

### PHASE 5: Polish (Weeks 9-10)

**Goal**: Performance, testing, deployment

```
WEEK 9:
├─ Add Wokwi simulator integration
├─ Implement caching layer (Redis)
├─ Optimize database queries
├─ Add error boundaries & loading states

WEEK 10:
├─ Write comprehensive tests
├─ Performance testing & optimization
├─ Security audit
├─ Prepare for deployment
```

**Deliverable**:
- ✅ Full test coverage
- ✅ Performance metrics met
- ✅ Ready for public beta

---

## 14.2 Testing Strategy

### Unit Tests (Services)
```typescript
// Test business logic in isolation
describe('GamificationService', () => {
  it('should calculate level correctly', () => {
    const level = gamificationService.calculateLevel(1500);
    expect(level).toBe(4);
  });
  
  it('should calculate XP reward with streak bonus', () => {
    const xp = gamificationService.calculateXpReward({
      difficulty: 'hard',
      timeSpent: 120,
      streakDays: 7
    });
    expect(xp).toBe(157.5); // 150 * 1.05
  });
});
```

### Integration Tests (Service + Repository)
```typescript
// Test interaction between layers
describe('Exercise submission', () => {
  it('should save submission and update progress', async () => {
    const submission = await learningService.submitExercise(...);
    const progress = await progressRepo.getByModule(...);
    
    expect(progress.exercises_completed).toBe(1);
    expect(submission.status).toBe('approved');
  });
});
```

### E2E Tests (Full flow)
```typescript
// Test user journey
describe('User learns and gets XP', () => {
  it('should complete module and unlock next', async () => {
    // 1. Login
    // 2. Start module 1
    // 3. Complete all exercises
    // 4. Check module 2 unlocked
    // 5. Check XP increased
  });
});
```

---

## 14.3 Deployment Checklist

```
PRE-DEPLOYMENT:
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Database migrations tested
- [ ] Error logging configured
- [ ] Backups configured
- [ ] Rollback plan documented

DEPLOYMENT:
- [ ] Tag release in git
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Monitor performance

POST-DEPLOYMENT:
- [ ] Verify all features working
- [ ] Check user feedback
- [ ] Monitor for issues
- [ ] Plan next release
```

---

---

# PART 15: SCALABILITY & FUTURE CONSIDERATIONS

## 15.1 Current Scale (What works now)

```
Users:           1K - 10K
Monthly API calls: 10M - 100M
Database size:    1GB - 10GB
```

**Actions to take at this scale**: None needed

---

## 15.2 Medium Scale (10K - 100K users)

**When to plan**: At 50K users

```
Bottleneck: Database connections
Solution: Connection pooling (PgBouncer)

Bottleneck: Leaderboard queries (sorting 50K users)
Solution: Cache leaderboard snapshots hourly

Bottleneck: AI costs ($5K - $50K/month)
Solution: Queue submissions, batch process

Bottleneck: Redis memory
Solution: Implement TTL policies, archive old data
```

---

## 15.3 Large Scale (100K - 1M users)

**When to plan**: At 200K users

```
Bottleneck: Database scalability
Solution: PostgreSQL read replicas, sharding

Bottleneck: Storage (submissions)
Solution: Archive old submissions to cold storage

Bottleneck: Real-time features
Solution: WebSocket server, Kafka for events

Action: Move to managed database service (RDS, CloudSQL)
```

---

## 15.4 Future Features (Not in MVP)

```
TIER 1 (High value):
├─ Wokwi circuit simulation
├─ AI conversation (not just evaluation)
├─ Video lessons
└─ Team competitions

TIER 2 (Medium value):
├─ Mobile app (React Native)
├─ Offline mode
├─ Social features
└─ Content creator dashboard

TIER 3 (Nice to have):
├─ VR learning environment
├─ IoT integration (control real Arduino)
├─ AR circuit visualization
└─ Blockchain certificates
```

---

## 15.5 Technology Debt to Monitor

```
Current ✅:
- Well-organized code
- Good separation of concerns
- Comprehensive types

Potential 🚨:
- Query performance at scale
- Cache invalidation complexity
- AI cost optimization
- Real-time infrastructure
- Mobile app parity
```

---

## 15.6 Monitoring in Production

```
Set up monitoring for:
├─ API response times (target < 500ms)
├─ Database query times (target < 100ms)
├─ Error rate (target < 0.1%)
├─ AI API usage & cost
├─ Cache hit rate (target > 80%)
├─ User engagement
└─ Churn rate
```

---

---

# APPENDIX: ARCHITECTURE SUMMARY

## Complete System Diagram

```
┌─────────────────────────────────────────────────────┐
│              USER BROWSER                           │
│  (React components, pages)                          │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS
                   │
┌──────────────────▼──────────────────────────────────┐
│           NEXT.JS APP ROUTER                        │
│  ├─ Pages (Server Components)                       │
│  ├─ API Routes (Route Handlers)                     │
│  ├─ Server Actions                                  │
│  ├─ Middleware                                      │
│  └─ Error Handling                                  │
└──────────────────┬──────────────────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
┌────▼─────┐ ┌────▼──────┐ ┌───▼────────┐
│ Services │ │Repository │ │ Validators │
│(Business │ │(Database │ │  (Input)   │
│ Logic)   │ │ Access)  │ └────────────┘
└────┬─────┘ └────┬──────┘
     │            │
┌────▼──────────────▼────────────────────────────────┐
│         SUPABASE (PostgreSQL)                       │
│  ├─ 14 Tables                                       │
│  ├─ RLS Policies                                    │
│  ├─ Triggers                                        │
│  └─ Indexes                                         │
└─────────────────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────▼───┐  ┌──▼────┐  ┌──▼────┐
   │ Redis  │  │ Cache │  │ Logs  │
   │(1hr)   │  │(5min) │  │       │
   └────────┘  └───────┘  └───────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────▼───┐  ┌──▼────┐  ┌──▼────┐
   │ Claude │  │Gemini │  │OpenAI │
   │(AI)    │  │(AI)   │  │(AI)   │
   └────────┘  └───────┘  └───────┘
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Layered architecture | Clear separation of concerns, testable |
| Supabase for backend | Fast development, RLS out of box, scalable |
| Server Actions for mutations | Secure, no API latency, TypeScript end-to-end |
| Route Handlers for APIs | External clients, webhooks, streaming |
| Zod for validation | Runtime safety, excellent DX |
| Event-driven gamification | Decoupled, auditable, scalable |
| Pluggable AI providers | Not locked into one provider, cost optimization |
| Redis caching | Performance, distributed, simple |
| PostgreSQL RLS | Security by default, no API gate needed |

---

---

# FINAL NOTES

This blueprint defines:
- ✅ How the code should be organized
- ✅ How layers interact
- ✅ How data flows
- ✅ Security measures
- ✅ Performance strategies
- ✅ Development standards

**Any developer joining this project should:**
1. Read this document
2. Understand the architecture
3. Follow the standards
4. Implement features consistently

**This is the source of truth for TrainArduino backend development.**

---

**Document Version**: 1.0  
**Date**: July 6, 2026  
**Status**: Approved - Ready for Implementation
