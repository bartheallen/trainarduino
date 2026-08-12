# DOMAIN MODEL
## TrainArduino Business Domain Language (Ubiquitous Language)

**Status**: Design Phase  
**Version**: 1.0  
**Last Updated**: 2026-07-06  
**Purpose**: Define every business object and their relationships  
**Owner**: Architecture Team  

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Domain Models](#domain-models)
   - [Identity Domain](#identity-domain)
   - [Learning Domain](#learning-domain)
   - [Progress Domain](#progress-domain)
   - [Gamification Domain](#gamification-domain)
   - [Simulation Domain](#simulation-domain)
   - [Analytics Domain](#analytics-domain)
3. [Cross-Domain Structures](#cross-domain-structures)
4. [Aggregate Analysis](#aggregate-analysis)
5. [Value Objects & Entities](#value-objects--entities)
6. [Root Aggregates](#root-aggregates)
7. [Bounded Context Mapping](#bounded-context-mapping)
8. [Domain Glossary](#domain-glossary)
9. [Diagrams](#diagrams)

---

## EXECUTIVE SUMMARY

**TrainArduino Domain Model** defines the business language across 10 domains:

```
SHARED KERNEL (across all domains):
├─ Value Objects: UserId, Email, Level, XP
├─ Enumerations: Roles, Status, Difficulty
└─ Domain Exceptions: Explicit error types

IDENTITY DOMAIN:
├─ User (Aggregate Root)
├─ Session
└─ Role

LEARNING DOMAIN:
├─ Course (Aggregate Root)
├─ Module (Aggregate Root)
├─ Lesson (Aggregate Root)
├─ Exercise (Aggregate Root)
├─ ExerciseHint
└─ TestCase

PROGRESS DOMAIN:
├─ Progress (Aggregate Root)
├─ ModuleProgress
├─ LessonProgress
├─ ExerciseAttempt (Aggregate Root)
└─ Submission (Aggregate Root)

GAMIFICATION DOMAIN:
├─ XPAccount (Aggregate Root)
├─ XPTransaction
├─ Level (Value Object)
├─ Badge (Aggregate Root)
├─ Achievement (Aggregate Root)
├─ DailyMission (Aggregate Root)
└─ Streak (Value Object)

SIMULATION DOMAIN:
├─ Simulation (Aggregate Root)
├─ SimulationSession (Aggregate Root)
└─ SimulationResult

ANALYTICS DOMAIN:
├─ Event (Aggregate Root)
├─ Statistics (Aggregate Root)
└─ LeaderboardEntry

SHARED INFRASTRUCTURE:
├─ Notification (Aggregate Root)
├─ UserSettings (Aggregate Root)
├─ Certificate (Aggregate Root)
└─ Dashboard (Value Object)
```

---

# DOMAIN MODELS

---

## IDENTITY DOMAIN

### User

**Purpose**: Represents an authenticated user in the system

**Type**: Aggregate Root

**Description**: 
A User is the principal of the system. They have identity (email), authentication credentials, and role-based permissions. Users are created through registration and deleted only through account termination.

**Properties**:
```
- id: UserId (Value Object)
- email: Email (Value Object)
- passwordHash: string (never exposed)
- firstName: string
- lastName: string
- role: Role (enum: Student, Admin, Moderator)
- isVerified: boolean
- isActive: boolean
- createdAt: Date
- updatedAt: Date
- lastSignedInAt: Date | null
```

**Required Fields**:
- id
- email
- passwordHash
- role
- createdAt

**Optional Fields**:
- firstName
- lastName
- lastSignedInAt

**Relationships**:
- ONE User → MANY Sessions (1:N)
- ONE User → ONE Profile (1:1)
- ONE User → ONE XPAccount (1:1)
- ONE User → MANY Submissions (1:N)

**Lifecycle**:
```
1. Created (signup) → isVerified = false, isActive = true
2. Verified (email link) → isVerified = true
3. Active → Can signin, access platform
4. Disabled → isActive = false, cannot signin
5. Deleted (rare) → Anonymized data, user cannot recover
```

**Business Invariants**:
1. Email must be unique and valid format
2. Password hash must exist and be non-empty
3. Cannot downgrade the last Admin to Student
4. Verified email required to signin
5. At least one Admin must exist at all times

**Validation Rules**:
- Email: Valid email format, unique, case-insensitive
- First/Last Name: Optional, 1-100 chars
- Role: Must be from enum (Student, Admin, Moderator)
- At least one admin must exist

**Ownership**: Authentication Domain

**Lifecycle Events**:
- **Created**: `UserSignedUp` (email, role)
- **Updated**: `EmailVerified`, `PasswordChanged`, `RoleGranted`
- **Deleted**: `UserTerminated`, `AccountDeleted`

**Business Events Emitted**:
- `UserSignedUp` → Triggers profile creation
- `UserVerified` → User can now signin
- `UserDisabled` → Sessions invalidated

**Operations**:
- `create(email, password, role)` → User
- `verify(token)` → void
- `changePassword(oldPassword, newPassword)` → void
- `disable(reason)` → void
- `enable()` → void
- `grantRole(newRole)` → void

**Creating**: Authentication domain (signup)
**Updating**: Authentication domain (role changes, password), User self-service (password change)
**Deleting**: Administration domain only
**Owner**: Authentication domain

---

### Session

**Purpose**: Represents a user's active authenticated session

**Type**: Entity (within User aggregate)

**Description**:
A Session is created when a user successfully signs in. It contains the JWT token, expiry information, and security metadata (IP address). Sessions are invalidated on logout or expiry.

**Properties**:
```
- id: SessionId (Value Object)
- userId: UserId (Value Object)
- token: string (JWT)
- expiresAt: Date
- createdAt: Date
- ipAddress: string
- userAgent: string
- isValid: boolean
```

**Required Fields**:
- id
- userId
- token
- expiresAt
- createdAt

**Optional Fields**:
- ipAddress
- userAgent

**Relationships**:
- MANY Sessions → ONE User (N:1)

**Lifecycle**:
```
1. Created (signin) → isValid = true, set expiresAt
2. Active → Token valid for API calls
3. Expired → isValid = false, user must signin again
4. Revoked → isValid = false, immediate logout
```

**Business Invariants**:
1. Only one active session per user at a time (new signin invalidates old)
2. Token must not expire in past
3. Expiry must be within 24 hours from creation

**Validation Rules**:
- Token format valid JWT
- Expiry in future
- IP address valid format (optional)

**Ownership**: Authentication Domain

**Creating**: Authentication domain (signin)
**Updating**: None (immutable after creation)
**Deleting**: Authentication domain (logout, expiry, revocation)
**Owner**: Authentication domain

---

### Role

**Purpose**: Represents user permissions and system access level

**Type**: Value Object (Enumeration)

**Description**:
A Role is an immutable set of permissions. Users have exactly one active role. Roles are defined at system level.

**Values**:
```
- Student: Can access learning content, submit exercises
- Moderator: Can moderate submissions, provide feedback
- Admin: Full system access, can modify content and users
```

**Business Rules**:
- Cannot have multiple roles (only one per user)
- Cannot change role without admin action
- At least one Admin must exist always

**Ownership**: Authentication Domain

---

---

## LEARNING DOMAIN

### Course

**Purpose**: Represents a complete learning program

**Type**: Aggregate Root

**Description**:
A Course is the highest-level learning structure. It contains modules and represents a complete curriculum (e.g., "Arduino Basics"). Courses are created by admins and can be published or in draft.

**Properties**:
```
- id: CourseId (Value Object)
- title: string
- description: string
- difficulty: Difficulty (enum: Beginner, Intermediate, Advanced)
- estimatedHours: number
- status: CourseStatus (enum: Draft, Published, Archived)
- createdBy: UserId (Value Object)
- createdAt: Date
- updatedAt: Date
- isActive: boolean
```

**Required Fields**:
- id
- title
- difficulty
- createdBy
- createdAt

**Optional Fields**:
- description
- estimatedHours

**Relationships**:
- ONE Course → MANY Modules (1:N)
- ONE Course → MANY Progress (1:N)

**Lifecycle**:
```
1. Created → Draft status
2. Published → Students can enroll
3. Archived → No new students, existing can continue
```

**Business Invariants**:
1. Title unique across published courses
2. Must have at least 1 module to publish
3. Cannot delete course with students enrolled

**Validation Rules**:
- Title: 3-200 chars, unique
- Description: 0-2000 chars
- Difficulty: Must be enum value
- EstimatedHours: 1-1000 hours

**Ownership**: Learning Domain

**Creating**: Admin only
**Updating**: Admin only
**Deleting**: Admin only (archive instead)
**Owner**: Learning domain

---

### Module

**Purpose**: Represents a unit within a course

**Type**: Aggregate Root

**Description**:
A Module is a logical grouping of lessons and exercises. Modules have prerequisites and unlock sequentially. Each module represents a distinct learning objective.

**Properties**:
```
- id: ModuleId (Value Object)
- courseId: CourseId (Value Object)
- title: string
- description: string
- order: number
- difficulty: Difficulty
- estimatedHours: number
- prerequisiteModuleIds: ModuleId[] (Value Objects)
- lessonCount: number
- exerciseCount: number
- createdAt: Date
- updatedAt: Date
```

**Required Fields**:
- id
- courseId
- title
- order
- difficulty

**Optional Fields**:
- description
- prerequisiteModuleIds
- estimatedHours

**Relationships**:
- ONE Module → MANY Lessons (1:N)
- ONE Module → MANY Exercises (1:N)
- ONE Module → MANY Progress (1:N)
- ONE Module → MANY Exercises (1:N)

**Lifecycle**:
```
1. Created → Draft
2. Published → Available to students (if prerequisites met)
3. Locked → Students cannot access yet
4. Completed → Student has finished all exercises
```

**Business Invariants**:
1. Module order unique within course
2. All prerequisites must exist
3. Cannot have circular prerequisites
4. Module difficulty must be >= all exercise difficulties

**Validation Rules**:
- Title: 3-200 chars
- Order: 1-1000, unique per course
- Prerequisites: Must be ModuleIds in same course
- Difficulty: Must be enum

**Ownership**: Learning Domain

**Creating**: Admin only
**Updating**: Admin only (content team)
**Deleting**: Admin only (if no student progress)
**Owner**: Learning domain

---

### Lesson

**Purpose**: Represents a single learning unit with educational content

**Type**: Aggregate Root

**Description**:
A Lesson contains educational content (text, code examples, images, videos). Lessons are sequentially ordered within a module. Students must complete lessons before accessing exercises.

**Properties**:
```
- id: LessonId (Value Object)
- moduleId: ModuleId (Value Object)
- title: string
- content: LessonContent (Value Object)
- videoUrl: string | null
- order: number
- estimatedMinutes: number
- tags: string[]
- keywords: string[]
- createdAt: Date
- updatedAt: Date
```

**Required Fields**:
- id
- moduleId
- title
- content
- order

**Optional Fields**:
- videoUrl
- estimatedMinutes
- tags
- keywords

**Relationships**:
- ONE Lesson → MANY LessonProgress (1:N)
- ONE Lesson → MANY Exercises (1:N)

**Lifecycle**:
```
1. Created → Draft
2. Published → Students can access
3. Completed → Student has read it
```

**Business Invariants**:
1. Order unique within module
2. Content must not be empty
3. Video URL must be valid format (if provided)

**Validation Rules**:
- Title: 3-200 chars
- Order: 1-10000, unique per module
- EstimatedMinutes: 1-600
- Tags: Max 10, each 1-50 chars
- Keywords: Max 20, each 1-50 chars

**Ownership**: Learning Domain

**Creating**: Admin/Content team only
**Updating**: Admin/Content team only
**Deleting**: Admin only (if no student progress)
**Owner**: Learning domain

---

### LessonContent

**Purpose**: Encapsulates lesson educational material

**Type**: Value Object

**Description**:
LessonContent holds the actual educational material in Markdown format. It's immutable and versioned with lessons.

**Properties**:
```
- markdown: string (Markdown content)
- htmlVersion: string (Compiled HTML, generated)
- codeExamples: CodeSnippet[]
- images: ImageReference[]
- version: number
```

**Required Fields**:
- markdown

**Optional Fields**:
- codeExamples
- images
- version

**Invariants**:
- Markdown must not be empty
- Must be valid Markdown
- Code examples must have valid Arduino code

**Ownership**: Learning Domain

---

### Exercise

**Purpose**: Represents a coding challenge to be solved by students

**Type**: Aggregate Root

**Description**:
An Exercise is a coding problem that students solve to practice. It contains the problem statement, starter code, test cases, and grading criteria. Exercises are ordered within modules.

**Properties**:
```
- id: ExerciseId (Value Object)
- moduleId: ModuleId (Value Object)
- lessonId: LessonId | null (Value Object)
- title: string
- description: string
- difficulty: Difficulty
- xpReward: number
- estimatedMinutes: number
- wokwiProjectUrl: string
- starterCode: string
- hints: ExerciseHint[]
- testCases: TestCase[]
- constraints: string[]
- tags: string[]
- order: number
- createdAt: Date
- updatedAt: Date
```

**Required Fields**:
- id
- moduleId
- title
- description
- difficulty
- xpReward
- wokwiProjectUrl

**Optional Fields**:
- lessonId
- estimatedMinutes
- tags
- constraints
- hints (added later)

**Relationships**:
- ONE Exercise → MANY Submissions (1:N)
- ONE Exercise → MANY ExerciseAttempts (1:N)
- ONE Exercise → MANY ExerciseHints (1:N)

**Lifecycle**:
```
1. Created → Draft
2. Published → Available to students
3. Deprecated → No longer recommended
```

**Business Invariants**:
1. XP reward must match difficulty (easy: 10-50, medium: 50-200, hard: 200-500)
2. Must have at least 1 test case to publish
3. Wokwi URL must be valid
4. Order unique within module
5. Cannot modify exercise with student submissions

**Validation Rules**:
- Title: 3-200 chars
- Description: 50-5000 chars
- Difficulty: Must be enum
- XPReward: 10-500
- EstimatedMinutes: 5-180
- Order: 1-10000
- Tags: Max 10, each 1-50 chars

**Ownership**: Learning Domain

**Creating**: Admin only
**Updating**: Admin only (can't modify if submissions exist)
**Deleting**: Admin only (if no submissions)
**Owner**: Learning domain

---

### ExerciseHint

**Purpose**: Provides guidance for struggling students

**Type**: Entity (within Exercise aggregate)

**Description**:
A Hint is a piece of guidance that helps students without giving away the solution. Hints are progressively more detailed.

**Properties**:
```
- id: HintId (Value Object)
- exerciseId: ExerciseId (Value Object)
- content: string
- difficulty: Difficulty (Beginner, Intermediate, Advanced)
- sequenceNumber: number
```

**Required Fields**:
- id
- exerciseId
- content
- sequenceNumber

**Relationships**:
- MANY Hints → ONE Exercise (N:1)

**Business Rules**:
- Max 5 hints per exercise
- Hints presented in sequence
- Each hint slightly more revealing than previous

**Ownership**: Learning Domain

---

### TestCase

**Purpose**: Defines grading criteria for an exercise

**Type**: Entity (within Exercise aggregate)

**Description**:
A TestCase is an automated test that validates student code. Test cases are hidden from students (not exposed in submissions).

**Properties**:
```
- id: TestCaseId (Value Object)
- exerciseId: ExerciseId (Value Object)
- input: string
- expectedOutput: string
- description: string
- weight: number (0-100, importance)
- timeout: number (milliseconds)
```

**Required Fields**:
- id
- exerciseId
- input
- expectedOutput

**Optional Fields**:
- description
- weight
- timeout

**Relationships**:
- MANY TestCases → ONE Exercise (N:1)

**Business Rules**:
- Weight values must sum to 100 for exercise
- Timeout min 100ms, max 5000ms
- Test cases are immutable (never modified)

**Ownership**: Learning Domain

---

---

## PROGRESS DOMAIN

### Progress

**Purpose**: Tracks overall user progress through entire course

**Type**: Aggregate Root

**Description**:
Progress represents a user's journey through a course. It tracks current position, completion percentage, and unlocked/locked status of modules.

**Properties**:
```
- id: ProgressId (Value Object)
- userId: UserId (Value Object)
- courseId: CourseId (Value Object)
- currentModuleId: ModuleId | null (Value Object)
- completedModules: ModuleId[] (Value Objects)
- inProgressModules: ModuleId[] (Value Objects)
- lockedModules: ModuleId[] (Value Objects)
- totalCompletionPercentage: number (0-100)
- startedAt: Date
- completedAt: Date | null
- lastActivityAt: Date
```

**Required Fields**:
- id
- userId
- courseId
- startedAt

**Optional Fields**:
- currentModuleId
- completedAt

**Relationships**:
- ONE Progress → MANY ModuleProgress (1:N)
- ONE Progress → MANY LessonProgress (1:N)
- ONE Progress → MANY ExerciseAttempts (1:N)

**Lifecycle**:
```
1. Created → User enrolls in course
2. In Progress → User working through content
3. Completed → User finished all modules
```

**Business Invariants**:
1. CompletionPercentage must be 0-100
2. ModuleProgresses must partition modules (no overlaps)
3. Cannot have module in both completed and inProgress
4. CurrentModule must be in inProgress or completed

**Validation Rules**:
- CompletionPercentage: 0-100
- Modules: Must be from course

**Ownership**: Progress Domain

**Creating**: Progress domain (when user enrolls)
**Updating**: Progress domain (as user completes)
**Deleting**: None (never delete, only archive)
**Owner**: Progress domain

---

### ModuleProgress

**Purpose**: Tracks progress through a single module

**Type**: Entity (within Progress aggregate)

**Description**:
ModuleProgress tracks student advancement through a module: which lessons completed, which exercises passed, overall completion percentage.

**Properties**:
```
- id: ModuleProgressId (Value Object)
- userId: UserId (Value Object)
- moduleId: ModuleId (Value Object)
- status: ProgressStatus (enum: Locked, InProgress, Completed)
- lessonsCompleted: number
- lessonsTotal: number
- exercisesCompleted: number
- exercisesTotal: number
- completionPercentage: number (0-100)
- score: number (0-100, average)
- startedAt: Date | null
- completedAt: Date | null
```

**Required Fields**:
- id
- userId
- moduleId
- status

**Relationships**:
- MANY ModuleProgress → ONE Progress (N:1)
- MANY ModuleProgress → MANY LessonProgress (N:M)

**Business Invariants**:
1. Status must match actual progress (Locked if not all prerequisites met)
2. CompletionPercentage must match lessons + exercises
3. Cannot be Completed if exercisesCompleted < exercisesTotal

**Validation Rules**:
- CompletionPercentage: 0-100
- Score: 0-100
- LessonsCompleted: 0-lessonsTotal
- ExercisesCompleted: 0-exercisesTotal

**Ownership**: Progress Domain

---

### LessonProgress

**Purpose**: Tracks student completion of individual lessons

**Type**: Entity (within Progress aggregate)

**Description**:
LessonProgress tracks when a student has read/completed a specific lesson.

**Properties**:
```
- id: LessonProgressId (Value Object)
- userId: UserId (Value Object)
- lessonId: LessonId (Value Object)
- status: ProgressStatus (enum: Locked, InProgress, Completed)
- completedAt: Date | null
- viewedAt: Date | null
```

**Required Fields**:
- id
- userId
- lessonId
- status

**Relationships**:
- MANY LessonProgress → ONE Progress (N:1)

**Business Rules**:
- Cannot complete if module locked
- Cannot complete before previous lesson (ordering)

**Ownership**: Progress Domain

---

### ExerciseAttempt

**Purpose**: Represents a single attempt at solving an exercise

**Type**: Aggregate Root

**Description**:
ExerciseAttempt tracks each time a student tries to solve an exercise. Multiple attempts allowed per exercise. Attempts include code, execution results, and submission.

**Properties**:
```
- id: AttemptId (Value Object)
- userId: UserId (Value Object)
- exerciseId: ExerciseId (Value Object)
- submissionId: SubmissionId | null (Value Object)
- attemptNumber: number
- code: string
- status: AttemptStatus (enum: InProgress, Submitted, Evaluated)
- score: number | null (0-100)
- testsPassed: number | null
- testsTotal: number | null
- createdAt: Date
- completedAt: Date | null
- timeTaken: number | null (seconds)
```

**Required Fields**:
- id
- userId
- exerciseId
- attemptNumber
- code
- status
- createdAt

**Optional Fields**:
- submissionId
- score
- completedAt
- timeTaken

**Relationships**:
- ONE ExerciseAttempt → ONE Submission (1:1)
- MANY ExerciseAttempts → ONE Exercise (N:1)

**Lifecycle**:
```
1. Created → User starts coding
2. InProgress → Code being written
3. Submitted → User submits for evaluation
4. Evaluated → AI evaluated, score assigned
```

**Business Invariants**:
1. Code must not be empty when submitted
2. Score must be 0-100
3. TestsPassed <= TestsTotal
4. TimeTaken >= 0

**Validation Rules**:
- Code: Non-empty, valid Arduino syntax
- Score: 0-100
- TestsPassed: 0-testsTotal
- AttemptNumber: 1+

**Ownership**: Progress Domain

**Creating**: Progress domain (when student starts attempt)
**Updating**: Progress domain (during coding), AI domain (evaluation)
**Deleting**: None (always keep for history)
**Owner**: Progress domain

---

### Submission

**Purpose**: Represents student's final submission of exercise code

**Type**: Aggregate Root

**Description**:
A Submission is a finalized attempt at an exercise, ready for AI evaluation. It includes the code, metadata, and evaluation results.

**Properties**:
```
- id: SubmissionId (Value Object)
- userId: UserId (Value Object)
- exerciseId: ExerciseId (Value Object)
- attemptNumber: number
- code: string
- language: string (always "arduino" currently)
- status: SubmissionStatus (enum: Pending, Reviewing, Approved, Rejected)
- score: number | null (0-100)
- feedback: string | null
- aiEvaluation: AIFeedback | null (Value Object)
- xpAwarded: number | null
- createdAt: Date
- evaluatedAt: Date | null
- submittedBy: UserId (Value Object)
```

**Required Fields**:
- id
- userId
- exerciseId
- code
- status
- createdAt
- submittedBy

**Optional Fields**:
- score
- feedback
- aiEvaluation
- xpAwarded
- evaluatedAt

**Relationships**:
- ONE Submission → ONE ExerciseAttempt (1:1)
- MANY Submissions → ONE Exercise (N:1)
- MANY Submissions → ONE User (N:1)

**Lifecycle**:
```
1. Created → Pending evaluation
2. Reviewing → AI evaluating code
3. Approved → Code passes tests, XP awarded
4. Rejected → Code fails tests, feedback provided
```

**Business Invariants**:
1. Code must be syntactically valid Arduino
2. Score only set after evaluation
3. XP only awarded after approval
4. Cannot submit twice simultaneously

**Validation Rules**:
- Code: Valid Arduino syntax
- Language: Must be "arduino"
- Score: 0-100 (only if evaluated)
- XPAwarded: 0-1000 (only if approved)

**Ownership**: Progress Domain

**Creating**: Progress domain (when student submits)
**Updating**: AI domain (evaluation), Progress domain (score update)
**Deleting**: None (always keep for history)
**Owner**: Progress domain

---

---

## GAMIFICATION DOMAIN

### XPAccount

**Purpose**: Represents a user's XP ledger and balance

**Type**: Aggregate Root

**Description**:
XPAccount tracks total XP earned by a user across all activities. It's the source of truth for user's XP balance.

**Properties**:
```
- id: XPAccountId (Value Object)
- userId: UserId (Value Object)
- totalXP: number (immutable, sum of all transactions)
- currentLevel: Level (Value Object)
- xpToNextLevel: number (computed)
- history: XPTransaction[] (immutable ledger)
- lastUpdatedAt: Date
```

**Required Fields**:
- id
- userId
- totalXP
- currentLevel

**Relationships**:
- ONE XPAccount → MANY XPTransactions (1:N)
- ONE XPAccount → ONE User (1:1)

**Lifecycle**:
```
1. Created → On user signup
2. Updated → As transactions added (never modified)
3. Closed → On user deletion (archived)
```

**Business Invariants**:
1. TotalXP = sum of all approved transactions
2. TotalXP never negative
3. TotalXP only increases (immutable ledger)
4. CurrentLevel based on totalXP
5. Cannot subtract XP

**Validation Rules**:
- TotalXP: 0-unlimited
- CurrentLevel: 1-10
- XpToNextLevel: 0-500

**Ownership**: Gamification Domain

**Creating**: Gamification domain (on user creation)
**Updating**: Gamification domain (via transactions)
**Deleting**: None (archived only)
**Owner**: Gamification domain

---

### XPTransaction

**Purpose**: Immutable record of XP award

**Type**: Entity (within XPAccount aggregate)

**Description**:
XPTransaction is an immutable ledger entry recording XP earned. Every XP award creates a transaction. Transactions are never modified or deleted.

**Properties**:
```
- id: TransactionId (Value Object)
- userId: UserId (Value Object)
- amount: number (positive, never negative)
- source: string (exerciseId, achievementId, missionId)
- sourceType: SourceType (enum: Exercise, Achievement, Mission, Bonus)
- status: TransactionStatus (enum: Pending, Approved, Rejected)
- approvedBy: UserId | null (Value Object)
- createdAt: Date
- approvedAt: Date | null
- metadata: object
```

**Required Fields**:
- id
- userId
- amount
- source
- sourceType
- status
- createdAt

**Optional Fields**:
- approvedBy
- approvedAt
- metadata

**Relationships**:
- MANY Transactions → ONE XPAccount (N:1)

**Business Rules**:
- Amount must be positive (1-1000)
- Immutable (never modified after creation)
- Transactions create audit trail

**Ownership**: Gamification Domain

---

### Level

**Purpose**: Represents user's progression level

**Type**: Value Object

**Description**:
Level is an immutable value representing user's progression (1-10). Levels are purely based on accumulated XP with fixed thresholds.

**Properties**:
```
- value: number (1-10)
- xpThreshold: number (XP required to reach this level)
- xpToNextLevel: number (XP needed for next level)
```

**Formula**:
```
Level 1: 0-100 XP
Level 2: 100-300 XP (200 more needed)
Level 3: 300-600 XP (300 more needed)
Level 4: 600-1000 XP (400 more needed)
Level 5: 1000-1500 XP (500 more needed)
Level 6: 1500-2100 XP (600 more needed)
Level 7: 2100-2800 XP (700 more needed)
Level 8: 2800-3600 XP (800 more needed)
Level 9: 3600-4500 XP (900 more needed)
Level 10: 4500+ XP (unlimited)

Formula: xpRequired(n) = 100 + (n-1) * 100 for n < 10
```

**Business Rules**:
- Levels immutable (cannot downgrade)
- Progression purely by XP
- Max level is 10

**Ownership**: Gamification Domain

---

### Badge

**Purpose**: Represents a special achievement or milestone

**Type**: Aggregate Root

**Description**:
A Badge is a special marker of achievement (different from general achievements). Badges recognize milestones like "First Submission", "100 XP", "10-Day Streak", etc.

**Properties**:
```
- id: BadgeId (Value Object)
- name: string
- description: string
- icon: string (icon name/URL)
- rarity: Rarity (enum: Common, Rare, Epic, Legendary)
- unlockCondition: UnlockCondition (Value Object)
- totalEarned: number (how many users earned this)
- createdAt: Date
```

**Required Fields**:
- id
- name
- icon
- rarity
- unlockCondition

**Optional Fields**:
- description

**Relationships**:
- MANY Badges → MANY Users (N:M, through UserBadges)

**Business Rules**:
- Badge earned only once per user
- Cannot be removed once earned
- Defined by system

**Ownership**: Gamification Domain

---

### Achievement

**Purpose**: Represents a major accomplishment

**Type**: Aggregate Root

**Description**:
An Achievement is a significant milestone (e.g., "Complete Module 5", "Reach Level 5"). Achievements unlock when conditions met, trigger XP bonus, and are recorded permanently.

**Properties**:
```
- id: AchievementId (Value Object)
- name: string
- description: string
- icon: string
- category: AchievementCategory (enum: Learning, Gamification, Milestone, Special)
- xpBonus: number (XP awarded on unlock)
- unlockCondition: UnlockCondition (Value Object)
- rarity: Rarity (enum: Common, Rare, Epic, Legendary)
- createdAt: Date
```

**Required Fields**:
- id
- name
- xpBonus
- unlockCondition
- category

**Optional Fields**:
- description
- icon
- rarity

**Relationships**:
- MANY Achievements → MANY Users (N:M, through UserAchievements)

**Lifecycle**:
```
1. Created → System defines achievement
2. Unlocked → User meets conditions
3. Permanent → Cannot be removed or re-earned
```

**Business Invariants**:
1. Can only unlock once per user
2. XP bonus awarded immediately on unlock
3. Conditions must be checkable

**Ownership**: Gamification Domain

**Creating**: System/Admin only
**Updating**: System/Admin only
**Deleting**: Never (archive only)
**Owner**: Gamification domain

---

### DailyMission

**Purpose**: Daily challenge to keep users engaged

**Type**: Aggregate Root

**Description**:
A DailyMission is a time-limited challenge (24 hours). New missions generated daily. Users complete missions for XP bonus.

**Properties**:
```
- id: MissionId (Value Object)
- userId: UserId (Value Object)
- title: string
- description: string
- difficulty: Difficulty
- xpReward: number
- condition: MissionCondition (Value Object)
- status: MissionStatus (enum: Active, Completed, Expired)
- createdAt: Date (midnight today)
- expiresAt: Date (midnight tomorrow)
- completedAt: Date | null
```

**Required Fields**:
- id
- userId
- title
- difficulty
- xpReward
- condition
- expiresAt

**Optional Fields**:
- description

**Relationships**:
- ONE Mission → ONE User (N:1)

**Lifecycle**:
```
1. Created → Generated at midnight
2. Active → User can work on it (24 hours)
3. Completed → User finished condition
4. Expired → 24 hours elapsed, mission fails
```

**Business Invariants**:
1. Exactly one mission per user per day
2. Can only complete once
3. Must complete before expiry
4. XP awarded on completion only

**Validation Rules**:
- Difficulty: Must be enum
- XPReward: 10-200
- Expires in exactly 24 hours

**Ownership**: Gamification Domain

**Creating**: Scheduler (daily)
**Updating**: Gamification domain (completion)
**Deleting**: None (archived after expiry)
**Owner**: Gamification domain

---

### Streak

**Purpose**: Tracks consecutive days of activity

**Type**: Value Object

**Description**:
Streak is an immutable value representing consecutive days without activity gap. Resets if 24+ hours without activity.

**Properties**:
```
- current: number (consecutive days)
- longest: number (personal record)
- lastActivityDate: Date
```

**Business Rules**:
- Increments by 1 each day with activity
- Resets to 0 if gap > 24 hours
- Longest never decreases

**Ownership**: Gamification Domain

---

---

## SIMULATION DOMAIN

### Simulation

**Purpose**: Represents a code simulation session

**Type**: Aggregate Root

**Description**:
A Simulation is the container for running and testing code on simulated hardware (Wokwi). One simulation per exercise attempt.

**Properties**:
```
- id: SimulationId (Value Object)
- userId: UserId (Value Object)
- exerciseId: ExerciseId (Value Object)
- code: string
- wokwiProjectUrl: string
- status: SimulationStatus (enum: Pending, Running, Completed, Error)
- startedAt: Date
- completedAt: Date | null
- durationSeconds: number | null
- output: string (serial output)
- errors: string[]
```

**Required Fields**:
- id
- userId
- exerciseId
- code
- wokwiProjectUrl
- status
- startedAt

**Optional Fields**:
- completedAt
- durationSeconds
- output
- errors

**Relationships**:
- ONE Simulation → MANY SimulationSessions (1:N)

**Lifecycle**:
```
1. Created → Code submitted to Wokwi
2. Running → Wokwi executing code
3. Completed → Simulation finished, results captured
4. Error → Compilation or runtime error
```

**Business Invariants**:
1. Duration must be > 0 if completed
2. Code must be valid Arduino
3. Max duration 60 seconds

**Ownership**: Simulation Domain

**Creating**: Simulation domain (when code submitted)
**Updating**: Simulation domain (during/after execution)
**Deleting**: None (always keep for history)
**Owner**: Simulation domain

---

### SimulationSession

**Purpose**: Tracks execution of a simulation

**Type**: Entity (within Simulation aggregate)

**Description**:
SimulationSession records each execution run. Multiple runs allowed per simulation (debugging).

**Properties**:
```
- id: SessionId (Value Object)
- simulationId: SimulationId (Value Object)
- sequenceNumber: number
- startedAt: Date
- completedAt: Date | null
- durationSeconds: number | null
- output: string
- errors: string[]
- success: boolean
```

**Required Fields**:
- id
- simulationId
- sequenceNumber
- startedAt

**Optional Fields**:
- completedAt
- durationSeconds
- output
- errors

**Relationships**:
- MANY Sessions → ONE Simulation (N:1)

**Business Rules**:
- Max 10 sessions per simulation
- Each session immutable

**Ownership**: Simulation Domain

---

### SimulationResult

**Purpose**: Represents the outcome of a simulation

**Type**: Value Object

**Description**:
SimulationResult captures what happened during simulation execution.

**Properties**:
```
- serialOutput: string
- hasErrors: boolean
- errorMessages: string[]
- durationSeconds: number
- outputMatches: boolean (matches expected output?)
```

**Ownership**: Simulation Domain

---

---

## ANALYTICS DOMAIN

### Event

**Purpose**: Represents a tracked system event

**Type**: Aggregate Root

**Description**:
An Event is an immutable record of something that happened in the system. All events are tracked for analytics.

**Properties**:
```
- id: EventId (Value Object)
- eventType: string (e.g., "UserSignedUp", "ExerciseCompleted")
- userId: UserId | null (Value Object)
- metadata: object
- timestamp: Date
- context: EventContext (Value Object)
```

**Required Fields**:
- id
- eventType
- timestamp

**Optional Fields**:
- userId
- metadata
- context

**Relationships**:
- MANY Events → ONE Statistics (N:1)

**Business Rules**:
- Events immutable (append-only)
- Timestamps cannot be in future
- Provide audit trail

**Ownership**: Analytics Domain

**Creating**: Any domain (via events)
**Updating**: None (immutable)
**Deleting**: None (append-only)
**Owner**: Analytics domain

---

### Statistics

**Purpose**: Computed analytics metrics

**Type**: Aggregate Root

**Description**:
Statistics represents computed metrics about user behavior, learning effectiveness, engagement.

**Properties**:
```
- id: StatisticsId (Value Object)
- userId: UserId | null (Value Object)
- scope: Scope (enum: Global, User, Module, Exercise)
- scopeId: string | null
- period: Period (enum: Daily, Weekly, Monthly, AllTime)
- periodStart: Date
- periodEnd: Date
- metrics: Metrics (Value Object)
- computedAt: Date
```

**Required Fields**:
- id
- scope
- metrics
- computedAt

**Optional Fields**:
- userId
- scopeId
- period

**Relationships**:
- MANY Statistics → MANY Events (N:M)

**Business Rules**:
- Computed from events
- Cached for performance
- Refreshed periodically

**Ownership**: Analytics Domain

---

### LeaderboardEntry

**Purpose**: User's position on leaderboard

**Type**: Entity

**Description**:
LeaderboardEntry represents a single user's current ranking and score on the leaderboard.

**Properties**:
```
- userId: UserId (Value Object)
- username: string
- rank: number (1-based)
- totalXP: number
- level: Level (Value Object)
- currentStreak: number
- lastUpdatedAt: Date
```

**Required Fields**:
- userId
- username
- rank
- totalXP
- level

**Relationships**:
- MANY Entries → ONE Leaderboard (N:1)

**Business Rules**:
- Rank 1 = highest XP
- Updated hourly
- Cached for performance

**Ownership**: Analytics Domain

---

---

## SHARED INFRASTRUCTURE

### Notification

**Purpose**: User communication message

**Type**: Aggregate Root

**Description**:
A Notification is a message sent to user (in-app, email, push). Notifications track user engagement.

**Properties**:
```
- id: NotificationId (Value Object)
- userId: UserId (Value Object)
- title: string
- message: string
- type: NotificationType (enum: Achievement, LevelUp, Feedback, System, Milestone)
- actionUrl: string | null
- isRead: boolean
- readAt: Date | null
- createdAt: Date
- expiresAt: Date | null
```

**Required Fields**:
- id
- userId
- title
- message
- type
- createdAt

**Optional Fields**:
- actionUrl
- expiresAt
- readAt

**Relationships**:
- MANY Notifications → ONE User (N:1)

**Lifecycle**:
```
1. Created → Sent to user
2. Unread → User sees it
3. Read → User has read it
4. Archived → Older than 30 days
```

**Business Rules**:
- Cannot be unread once read
- Permanent record

**Ownership**: Notifications Domain (creates), Shared Infrastructure (stores)

**Creating**: Publishing domains (Gamification, Progress, etc.)
**Updating**: User (mark read)
**Deleting**: None (archived after 30 days)
**Owner**: Notifications domain

---

### UserSettings

**Purpose**: User preferences and configuration

**Type**: Aggregate Root

**Description**:
UserSettings stores user preferences: language, theme, notifications, privacy.

**Properties**:
```
- id: SettingsId (Value Object)
- userId: UserId (Value Object)
- language: Language (enum: English, French)
- theme: Theme (enum: Light, Dark, Auto)
- emailNotifications: boolean
- pushNotifications: boolean
- soundEnabled: boolean
- privateProfile: boolean
- dailyDigest: boolean
- quietHours: QuietHours | null (Value Object)
- updatedAt: Date
```

**Required Fields**:
- id
- userId
- language
- theme

**Relationships**:
- ONE Settings → ONE User (1:1)

**Business Rules**:
- User controls all preferences
- Defaults provided on signup

**Ownership**: Profiles Domain

**Creating**: Profiles domain (on user creation)
**Updating**: User self-service
**Deleting**: None (archived with user)
**Owner**: Profiles domain

---

### Certificate

**Purpose**: Proof of course completion

**Type**: Aggregate Root

**Description**:
A Certificate is issued when user completes a course. It's a permanent record and can be shared.

**Properties**:
```
- id: CertificateId (Value Object)
- userId: UserId (Value Object)
- courseId: CourseId (Value Object)
- issueDate: Date
- expiryDate: Date | null (some certificates never expire)
- certificateNumber: string (unique identifier)
- skills: string[] (skills demonstrated)
- score: number (final course score)
- shareableUrl: string (public proof URL)
```

**Required Fields**:
- id
- userId
- courseId
- issueDate
- certificateNumber
- score

**Optional Fields**:
- expiryDate
- skills
- shareableUrl

**Lifecycle**:
```
1. Created → User completes course
2. Issued → Certificate generated
3. Valid → Can be shared
4. Expired (optional) → Certificate no longer valid
```

**Business Rules**:
- Issued only on 100% course completion
- Immutable once issued
- Publicly verifiable

**Ownership**: Learning Domain

**Creating**: Progress domain (on course completion)
**Updating**: None (immutable)
**Deleting**: None (archived only)
**Owner**: Learning domain

---

### Dashboard

**Purpose**: User's home dashboard view

**Type**: Value Object

**Description**:
Dashboard aggregates data shown to user on home page: progress, XP, missions, notifications.

**Properties**:
```
- userId: UserId (Value Object)
- currentLevel: Level (Value Object)
- totalXP: number
- currentStreak: number
- rank: number
- currentModule: ModuleCard | null (Value Object)
- recentAchievements: Achievement[]
- activeMissions: DailyMission[]
- unreadNotifications: number
- learningStats: LearningStats (Value Object)
```

**Invariants**:
- All data current as of request time
- Read-only (not persisted)

**Ownership**: Shared between domains (aggregated data)

---

### QuietHours

**Purpose**: Time window when user doesn't want notifications

**Type**: Value Object

**Description**:
QuietHours represents a daily time range (e.g., 9 PM - 7 AM) when notifications are suppressed.

**Properties**:
```
- startTime: Time (HH:MM format)
- endTime: Time (HH:MM format)
- timezone: string (e.g., "America/New_York")
```

**Business Rules**:
- Optional (user may not have quiet hours)
- Timezone-aware
- Applies every day

**Ownership**: Shared Infrastructure

---

---

# CROSS-DOMAIN STRUCTURES

## Value Objects (Shared Across Domains)

### UserId
```
Value Object
- Unique identifier for user
- Immutable
- Used in every domain
- Format: UUID v4
```

### Email
```
Value Object
- Valid email format
- Unique across system
- Case-insensitive comparison
- Immutable
```

### ModuleId, ExerciseId, LessonId, CourseId
```
Value Objects
- Unique identifiers for learning resources
- UUID v4 format
- Immutable
- Cannot be reused
```

### Difficulty
```
Enumeration (Value Object)
- Beginner
- Intermediate
- Advanced

Business Rule: Difficulty determines:
- XP reward for exercise
- Module sequencing
- Prerequisite requirements
```

### ProgressStatus
```
Enumeration (Value Object)
- Locked (prerequisites not met)
- InProgress (started but not completed)
- Completed (100% finished)
```

### SubmissionStatus
```
Enumeration (Value Object)
- Pending (waiting for evaluation)
- Reviewing (AI is evaluating)
- Approved (passes tests)
- Rejected (fails tests)
```

### Level
```
Value Object
- Immutable progression level
- Range: 1-10
- Purely based on XP
- Cannot decrease
```

---

## Shared Kernel

**Definition**: Concepts, models, and language shared across all domains.

```
SHARED ENUMERATIONS:
├─ Difficulty: Beginner, Intermediate, Advanced
├─ ProgressStatus: Locked, InProgress, Completed
├─ SubmissionStatus: Pending, Reviewing, Approved, Rejected
├─ Role: Student, Moderator, Admin
├─ Rarity: Common, Rare, Epic, Legendary
└─ Language: English, French

SHARED VALUE OBJECTS:
├─ UserId (UUID)
├─ Email (valid email)
├─ Level (1-10)
├─ Streak (consecutive days)
├─ XP (points earned)
└─ Date/Time values

SHARED EXCEPTIONS:
├─ ValidationError (input invalid)
├─ PermissionError (unauthorized)
├─ NotFoundError (resource missing)
├─ BusinessRuleError (rule violation)
└─ ExternalServiceError (service unavailable)

SHARED PATTERNS:
├─ Aggregate Roots
├─ Value Objects
├─ Domain Events
├─ Repository Pattern
└─ Service Layer
```

---

# AGGREGATE ANALYSIS

## Aggregate Definition

**Aggregate**: A cluster of associated objects treated as a unit. Has:
- Single Root Entity (Aggregate Root)
- Clear boundary
- Invariants that must be maintained
- Internal consistency

---

## Aggregates in TrainArduino

### User Aggregate
```
Root: User
Children:
  - Session (N)
  - Role (1)

Invariants:
  - Email unique
  - At least 1 admin exists
  - Cannot delete last admin

Ownership: Authentication Domain
Transaction Boundary: Changes to user/session atomic
```

### Course Aggregate
```
Root: Course
Children:
  - Module (N)
  - Lesson (N)
  - Exercise (N)

Invariants:
  - Module order unique
  - Exercise order unique
  - Cannot delete course with enrollments

Ownership: Learning Domain
Transaction Boundary: All course content changes atomic
```

### Module Aggregate
```
Root: Module
Children:
  - Lesson (N)
  - Exercise (N)
  - ExerciseHint (N)
  - TestCase (N)

Invariants:
  - Lessons ordered
  - Exercises ordered
  - Prerequisites valid
  - Cannot modify with submissions

Ownership: Learning Domain
Transaction Boundary: All module content changes atomic
```

### Exercise Aggregate
```
Root: Exercise
Children:
  - ExerciseHint (N)
  - TestCase (N)

Invariants:
  - At least 1 test case
  - XP matches difficulty
  - Wokwi URL valid
  - Cannot modify with submissions

Ownership: Learning Domain
Transaction Boundary: Exercise + hints + tests atomic
```

### Progress Aggregate
```
Root: Progress
Children:
  - ModuleProgress (N)
  - LessonProgress (N)
  - ExerciseAttempt (N)
  - Submission (N)

Invariants:
  - Modules partition correctly
  - Completion % matches actual
  - Cannot complete before prerequisites

Ownership: Progress Domain
Transaction Boundary: All user progress changes atomic
```

### ExerciseAttempt Aggregate
```
Root: ExerciseAttempt
Children: None (single entity)

Invariants:
  - Code must be non-empty if submitted
  - Score 0-100 if evaluated
  - TestsPassed <= TestsTotal

Ownership: Progress Domain
Transaction Boundary: Single entity changes atomic
```

### Submission Aggregate
```
Root: Submission
Children: None (single entity)

Invariants:
  - Code must be valid Arduino
  - Score only after evaluation
  - XP only after approval
  - Cannot submit twice simultaneously

Ownership: Progress Domain
Transaction Boundary: Single entity changes atomic
```

### XPAccount Aggregate
```
Root: XPAccount
Children:
  - XPTransaction (N, immutable ledger)

Invariants:
  - TotalXP = sum of transactions
  - TotalXP never negative
  - Only appends to ledger

Ownership: Gamification Domain
Transaction Boundary: XP changes and transactions atomic
```

### Achievement Aggregate
```
Root: Achievement
Children: None (single entity)

Invariants:
  - Can unlock only once per user
  - XP bonus awarded immediately
  - Conditions must be checkable

Ownership: Gamification Domain
Transaction Boundary: Single entity changes atomic
```

### DailyMission Aggregate
```
Root: DailyMission
Children: None (single entity)

Invariants:
  - Exactly one per user per day
  - Can only complete once
  - Must complete before expiry (24h)

Ownership: Gamification Domain
Transaction Boundary: Single entity changes atomic
```

### Notification Aggregate
```
Root: Notification
Children: None (single entity)

Invariants:
  - Cannot be unread once read
  - Permanent record
  - Expiry after 30 days

Ownership: Notifications Domain
Transaction Boundary: Single entity changes atomic
```

### UserSettings Aggregate
```
Root: UserSettings
Children: None (single entity)

Invariants:
  - Valid language, theme values
  - Quiet hours valid time ranges
  - One settings per user

Ownership: Profiles Domain
Transaction Boundary: Single entity changes atomic
```

---

# VALUE OBJECTS & ENTITIES

## Value Objects (Immutable)

```
IDENTITY DOMAIN:
├─ UserId
├─ Email
├─ Role
└─ SessionId

LEARNING DOMAIN:
├─ CourseId
├─ ModuleId
├─ LessonId
├─ ExerciseId
├─ HintId
├─ TestCaseId
├─ Difficulty
├─ LessonContent
├─ CodeSnippet
└─ ImageReference

PROGRESS DOMAIN:
├─ ProgressId
├─ ModuleProgressId
├─ LessonProgressId
├─ AttemptId
├─ SubmissionId
├─ ProgressStatus
├─ SubmissionStatus
└─ AIFeedback

GAMIFICATION DOMAIN:
├─ XPAccountId
├─ TransactionId
├─ BadgeId
├─ AchievementId
├─ MissionId
├─ Level (1-10, immutable)
├─ Streak
├─ Rarity
└─ SourceType

SIMULATION DOMAIN:
├─ SimulationId
├─ SessionId (sim)
└─ SimulationResult

ANALYTICS DOMAIN:
├─ EventId
├─ StatisticsId
├─ EventContext
└─ Metrics

SHARED:
├─ Language
├─ Theme
├─ QuietHours
├─ LearningStats
├─ Dashboard
└─ Time-based Value Objects
```

## Entities (Mutable, Identifiable)

```
IDENTITY DOMAIN:
├─ User (Root)
└─ Session

LEARNING DOMAIN:
├─ Course (Root)
├─ Module (Root)
├─ Lesson (Root)
├─ Exercise (Root)
├─ ExerciseHint
└─ TestCase

PROGRESS DOMAIN:
├─ Progress (Root)
├─ ModuleProgress
├─ LessonProgress
├─ ExerciseAttempt (Root)
└─ Submission (Root)

GAMIFICATION DOMAIN:
├─ XPAccount (Root)
├─ XPTransaction
├─ Badge (Root)
├─ Achievement (Root)
└─ DailyMission (Root)

SIMULATION DOMAIN:
├─ Simulation (Root)
├─ SimulationSession
└─ (Results as Value Objects)

ANALYTICS DOMAIN:
├─ Event (Root)
├─ Statistics (Root)
└─ LeaderboardEntry

SHARED:
├─ Notification (Root)
├─ UserSettings (Root)
└─ Certificate (Root)
```

---

# ROOT AGGREGATES

**Root Aggregates** are the entry points for domain operations. All access goes through the root.

```
User Aggregate Root
  ├─ create(email, password, role): User
  ├─ verify(token): void
  ├─ signin(password): Session
  ├─ signout(): void
  └─ disable(reason): void

Course Aggregate Root
  ├─ create(title, difficulty): Course
  ├─ addModule(module): void
  ├─ publish(): void
  └─ archive(): void

Module Aggregate Root
  ├─ create(title, order): Module
  ├─ addLesson(lesson): void
  ├─ addExercise(exercise): void
  └─ setPrerequisites(moduleIds): void

Lesson Aggregate Root
  ├─ create(title, content): Lesson
  ├─ updateContent(content): void
  └─ publish(): void

Exercise Aggregate Root
  ├─ create(title, wokwiUrl): Exercise
  ├─ addTestCase(testCase): void
  ├─ addHint(hint): void
  └─ publish(): void

Progress Aggregate Root
  ├─ create(userId, courseId): Progress
  ├─ startModule(moduleId): void
  ├─ completeLesson(lessonId): void
  ├─ submitExercise(code): Submission
  └─ unlockNextModule(): void

ExerciseAttempt Aggregate Root
  ├─ create(userId, exerciseId): ExerciseAttempt
  ├─ updateCode(code): void
  └─ submit(): Submission

Submission Aggregate Root
  ├─ create(userId, code): Submission
  ├─ evaluate(score, feedback): void
  └─ approve(): void

XPAccount Aggregate Root
  ├─ create(userId): XPAccount
  ├─ award(amount, source): void
  └─ calculateLevel(): Level

Badge Aggregate Root
  ├─ create(name, condition): Badge
  ├─ earn(userId): void
  └─ getEarners(): UserId[]

Achievement Aggregate Root
  ├─ create(name, condition): Achievement
  ├─ unlock(userId): void
  └─ getUnlockers(): UserId[]

DailyMission Aggregate Root
  ├─ generate(userId): DailyMission
  ├─ updateProgress(): void
  ├─ complete(): void
  └─ expire(): void

Notification Aggregate Root
  ├─ create(userId, title, message): Notification
  ├─ send(): void
  ├─ markRead(): void
  └─ archive(): void

UserSettings Aggregate Root
  ├─ create(userId): UserSettings
  ├─ updatePreferences(prefs): void
  ├─ setQuietHours(hours): void
  └─ disableNotifications(type): void

Certificate Aggregate Root
  ├─ issue(userId, courseId): Certificate
  ├─ getShareUrl(): string
  └─ verify(token): Certificate

Simulation Aggregate Root
  ├─ create(userId, code): Simulation
  ├─ start(): void
  ├─ getResults(): SimulationResult
  └─ stop(): void

Event Aggregate Root
  ├─ record(eventType, metadata): Event
  └─ (immutable after creation)

Statistics Aggregate Root
  ├─ compute(events): Statistics
  ├─ getMetrics(): Metrics
  └─ refresh(): void
```

---

# BOUNDED CONTEXT MAPPING

## Bounded Contexts

**Bounded Context**: A linguistic and organizational boundary within which the domain model applies.

```
┌─────────────────────────────────────────────────────────────┐
│                  IDENTITY CONTEXT                          │
│  Language: Authentication, Verification, Sessions          │
│  Models: User, Session, Role                               │
│  Responsibility: User identity & access control            │
│  Owner: Authentication Team                                │
└─────────────────────────────────────────────────────────────┘
        │
        │ publishes: UserSignedUp, UserVerified
        │
┌─────────────────────────────────────────────────────────────┐
│                  LEARNING CONTEXT                          │
│  Language: Modules, Lessons, Exercises, Content            │
│  Models: Course, Module, Lesson, Exercise                  │
│  Responsibility: Learning structure & content              │
│  Owner: Content Team                                       │
└─────────────────────────────────────────────────────────────┘
        │
        │ consumed by: Progress, Analytics
        │
┌─────────────────────────────────────────────────────────────┐
│                  PROGRESS CONTEXT                          │
│  Language: Progress, Completion, Submissions, Attempts     │
│  Models: Progress, ModuleProgress, Submission              │
│  Responsibility: Track user advancement                    │
│  Owner: Progress Team                                      │
└─────────────────────────────────────────────────────────────┘
        │
        │ publishes: LessonCompleted, ModuleCompleted
        │
┌─────────────────────────────────────────────────────────────┐
│              GAMIFICATION CONTEXT                          │
│  Language: XP, Levels, Achievements, Missions              │
│  Models: XPAccount, Level, Achievement, Badge              │
│  Responsibility: Reward & motivate users                   │
│  Owner: Engagement Team                                    │
└─────────────────────────────────────────────────────────────┘
        │
        │ publishes: XPAwarded, LevelIncreased
        │
┌─────────────────────────────────────────────────────────────┐
│               SIMULATION CONTEXT                           │
│  Language: Code Execution, Wokwi, Simulation               │
│  Models: Simulation, SimulationSession                     │
│  Responsibility: Hardware simulation                       │
│  Owner: Simulation Team                                    │
└─────────────────────────────────────────────────────────────┘
        │
        │ publishes: SimulationCompleted
        │
┌─────────────────────────────────────────────────────────────┐
│                ANALYTICS CONTEXT                           │
│  Language: Events, Metrics, Statistics, Analytics          │
│  Models: Event, Statistics, LeaderboardEntry               │
│  Responsibility: System observability                      │
│  Owner: Analytics Team                                     │
└─────────────────────────────────────────────────────────────┘
```

## Context Interactions

### Shared Kernel Between Contexts
```
Shared Concepts:
- UserId: Every context needs to identify user
- Email: Identity context shares with others
- Difficulty: Learning context → others use it
- Level: Gamification context → others display it
- Timestamp: All contexts track time

Shared Enumerations:
- Difficulty: Beginner/Intermediate/Advanced
- ProgressStatus: Locked/InProgress/Completed
- Role: Student/Admin/Moderator
```

### Anti-Corruption Layers

**Where contexts meet**, we use Anti-Corruption Layers:

```
Progress Context → Learning Context (Anti-Corruption Layer)
  ├─ Translates: ProgressModuleId → LearningModuleId
  └─ Validates: Module still exists, not deleted

Gamification Context → Progress Context (Anti-Corruption Layer)
  ├─ Translates: XPAwarded event → Points value
  └─ Enforces: XP calculation rules

Analytics Context → All Contexts (Anti-Corruption Layer)
  ├─ Listens to events from all
  ├─ Translates: Domain events → Analytics events
  └─ Never modifies other contexts' data
```

---

# DOMAIN GLOSSARY

**Official Business Language (Ubiquitous Language)**

| Term | Definition | Domain | Context |
|------|-----------|--------|---------|
| **User** | An authenticated principal in the system with role and permissions | Identity | All |
| **Profile** | User's public data (name, avatar, bio) | Profiles | User-facing |
| **Role** | User's permission level (Student, Admin, Moderator) | Identity | Access control |
| **Course** | Complete learning program (e.g., "Arduino Basics") | Learning | Learning path |
| **Module** | Logical unit within course (e.g., "Digital Outputs") | Learning | Learning structure |
| **Lesson** | Educational content unit (text, images, code) | Learning | Learning content |
| **Exercise** | Coding problem to solve (with test cases) | Learning | Learning practice |
| **Submission** | Student's code submission for evaluation | Progress | Code evaluation |
| **Attempt** | Single try at an exercise (may submit multiple times) | Progress | Learning engagement |
| **Progress** | User's overall advancement through course | Progress | User tracking |
| **XP** | Experience points earned from activities | Gamification | Reward system |
| **Level** | User's progression level (1-10) based on XP | Gamification | User advancement |
| **Achievement** | Major milestone earned by user | Gamification | Reward system |
| **Badge** | Special marker of achievement | Gamification | Recognition |
| **Streak** | Consecutive days of activity | Gamification | Engagement |
| **Daily Mission** | Time-limited daily challenge | Gamification | Daily engagement |
| **Simulation** | Code execution on simulated hardware (Wokwi) | Simulation | Code testing |
| **Feedback** | AI-generated guidance on student's code | AI | Learning support |
| **Notification** | User message (in-app, email, push) | Notifications | Communication |
| **Event** | Recorded system activity for analytics | Analytics | Observability |
| **Statistics** | Computed metrics from events | Analytics | Analytics |
| **Leaderboard** | User ranking by XP | Analytics/Gamification | Competition |
| **Certificate** | Proof of course completion | Learning | Achievement |
| **Test Case** | Automated test for exercise grading | Learning | Exercise validation |
| **Hint** | Guidance for struggling students | Learning | Learning support |

---

# DIAGRAMS

## 1. Complete UML Class Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRAINARDUINO DOMAIN MODEL                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ IDENTITY DOMAIN                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────┐                                │
│  │ User (Aggregate Root)                   │                                │
│  ├─────────────────────────────────────────┤                                │
│  │ - id: UserId                            │                                │
│  │ - email: Email                          │                                │
│  │ - passwordHash: string                  │                                │
│  │ - role: Role (enum)                     │                                │
│  │ - isVerified: boolean                   │                                │
│  │ - isActive: boolean                     │                                │
│  │ - createdAt: Date                       │                                │
│  ├─────────────────────────────────────────┤                                │
│  │ + create()                              │                                │
│  │ + verify()                              │                                │
│  │ + signin()                              │                                │
│  │ + signout()                             │                                │
│  │ + disable()                             │                                │
│  └─────────────────────────────────────────┘                                │
│           │ 1                          N │                                  │
│           │ ├─────────────────────────────┤                                 │
│           │                               │                                  │
│           │                      ┌────────┴────────┐                        │
│           │                      │ Session (Entity)│                        │
│           │                      ├─────────────────┤                        │
│           │                      │ - id: SessionId │                        │
│           │                      │ - token: JWT    │                        │
│           │                      │ - expiresAt     │                        │
│           │                      │ - isValid       │                        │
│           │                      └─────────────────┘                        │
│           │                                                                  │
│           └─→ Role (Value Object)                                           │
│               (Student|Admin|Moderator)                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ LEARNING DOMAIN                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────┐                                               │
│  │ Course (Aggregate Root)  │                                               │
│  ├──────────────────────────┤                                               │
│  │ - id: CourseId          │                                               │
│  │ - title: string         │                                               │
│  │ - difficulty            │                                               │
│  │ - status: CourseStatus  │                                               │
│  └──────────────────────────┘                                               │
│           │ 1                                                               │
│           │ ├──────────────────────────────────────┐                        │
│           │                                        │                        │
│       N ┌─┴──────────────────────┐  N ┌──────────┴───────────┐            │
│       ┌─┤ Module (Aggregate Root)├────┤ Lesson (Aggregate)  │            │
│       │ ├──────────────────────────┤   ├─────────────────────┤            │
│       │ │ - id: ModuleId          │   │ - id: LessonId      │            │
│       │ │ - order: number         │   │ - content           │            │
│       │ │ - difficulty            │   │ - videoUrl          │            │
│       │ │ - prerequisites: []     │   │ - order             │            │
│       │ └─────────────────────────┘   └─────────────────────┘            │
│       │         │                                                          │
│       │     N ┌─┴────────────────────────┐                                 │
│       │       │ Exercise (Aggregate Root)│                                 │
│       │       ├───────────────────────────┤                                │
│       │       │ - id: ExerciseId         │                                │
│       │       │ - title: string          │                                │
│       │       │ - difficulty: Difficulty │                                │
│       │       │ - xpReward: number       │                                │
│       │       │ - wokwiProjectUrl        │                                │
│       │       │ - starterCode            │                                │
│       │       ├───────────────────────────┤                                │
│       │       │ + addHint()              │                                │
│       │       │ + addTestCase()          │                                │
│       │       └───────────────────────────┘                                │
│       │           │  1           N                                         │
│       │           ├─────────────────┤                                      │
│       │                 │      ┌────┴────────────┐                         │
│       │                 │      │ ExerciseHint    │                         │
│       │                 │      ├─────────────────┤                         │
│       │                 │      │ - id: HintId    │                         │
│       │                 │      │ - content       │                         │
│       │                 │      │ - difficulty    │                         │
│       │                 │      └─────────────────┘                         │
│       │                 │                                                   │
│       │                 └─→ TestCase (Entity)                              │
│       │                     - id: TestCaseId                               │
│       │                     - input/expectedOutput                         │
│       │                                                                     │
│       └─────────────────────────────────────────────────────────────────────┘
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ PROGRESS DOMAIN                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────┐                                  │
│  │ Progress (Aggregate Root)             │                                  │
│  ├───────────────────────────────────────┤                                  │
│  │ - id: ProgressId                      │                                  │
│  │ - userId: UserId ─────────────────────────────→ (Links to User)         │
│  │ - courseId: CourseId                  │                                  │
│  │ - currentModuleId                     │                                  │
│  │ - completedModules: []                │                                  │
│  │ - totalCompletionPercentage: 0-100    │                                  │
│  └───────────────────────────────────────┘                                  │
│           │ 1                                                               │
│           ├──────────────────────────────────────────┐                      │
│           │                                          │                      │
│       N ┌─┴──────────────────────────┐  N ┌────────┴──────────────────┐   │
│       ┌─┤ ModuleProgress (Entity)    ├────┤ LessonProgress (Entity)  │   │
│       │ ├──────────────────────────────┤   ├───────────────────────────┤   │
│       │ │ - userId: UserId            │   │ - userId: UserId         │   │
│       │ │ - moduleId: ModuleId        │   │ - lessonId: LessonId     │   │
│       │ │ - status: ProgressStatus    │   │ - status: ProgressStatus │   │
│       │ │ - completionPercentage      │   │ - completedAt: Date      │   │
│       │ │ - score: 0-100              │   └───────────────────────────┘   │
│       │ └──────────────────────────────┘                                    │
│       │                                                                      │
│       │  1 ┌────────────────────────────────────────┐                       │
│       │    │ ExerciseAttempt (Aggregate Root)       │                       │
│       │    ├─────────────────────────────────────────┤                       │
│       │    │ - id: AttemptId                        │                       │
│       │    │ - userId: UserId                       │                       │
│       │    │ - exerciseId: ExerciseId              │                       │
│       │    │ - attemptNumber: number                │                       │
│       │    │ - code: string                         │                       │
│       │    │ - status: AttemptStatus                │                       │
│       │    │ - score: 0-100 | null                  │                       │
│       │    ├─────────────────────────────────────────┤                       │
│       │    │ + submit()                             │                       │
│       │    └─────────────────────────────────────────┘                       │
│       │        │ 1     │                                                     │
│       │        │       │ publishes                                           │
│       │        │       └──→ SubmissionCreated event                         │
│       │        │                                                             │
│       │        └─→ Submission (Aggregate Root)                              │
│       │            ├──────────────────────────────────┐                     │
│       │            │ - id: SubmissionId              │                     │
│       │            │ - userId: UserId                │                     │
│       │            │ - exerciseId: ExerciseId       │                     │
│       │            │ - code: string                  │                     │
│       │            │ - status: SubmissionStatus      │                     │
│       │            │ - score: 0-100 | null           │                     │
│       │            │ - feedback: string | null       │                     │
│       │            │ - aiEvaluation: AIFeedback      │                     │
│       │            │ - xpAwarded: number | null      │                     │
│       │            └──────────────────────────────────┘                     │
│       │                                                                      │
│       └──────────────────────────────────────────────────────────────────────┘
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ GAMIFICATION DOMAIN                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────┐                               │
│  │ XPAccount (Aggregate Root)               │                               │
│  ├──────────────────────────────────────────┤                               │
│  │ - id: XPAccountId                        │                               │
│  │ - userId: UserId ─────────────────→ (Links to User)                      │
│  │ - totalXP: number                        │                               │
│  │ - currentLevel: Level (Value Object)     │                               │
│  │ - xpToNextLevel: number                  │                               │
│  └──────────────────────────────────────────┘                               │
│           │ 1                                                               │
│           ├──────────────────────────────────────────┐                      │
│           │                                          │                      │
│       N ┌──┴──────────────────────────┐              │                     │
│       │  XPTransaction (Entity)        │              │                     │
│       ├─────────────────────────────────┤              │                     │
│       │ - id: TransactionId            │              │                     │
│       │ - amount: number (1-1000)      │              │                     │
│       │ - source: string (sourceId)    │              │                     │
│       │ - sourceType: SourceType       │              │                     │
│       │ - status: TransactionStatus    │              │                     │
│       │ - createdAt: Date              │              │                     │
│       └─────────────────────────────────┘              │                     │
│                                                       │                     │
│                          ┌──────────────────────────────┘                   │
│                          │                                                   │
│                    ┌─────┴──────────────────────────┐                       │
│                    │ Level (Value Object)           │                       │
│                    ├────────────────────────────────┤                       │
│                    │ - value: 1-10 (immutable)     │                       │
│                    │ - xpThreshold: number          │                       │
│                    │ - xpToNextLevel: number        │                       │
│                    └────────────────────────────────┘                       │
│                                                                              │
│  ┌────────────────────────────────┐   ┌────────────────────────────────┐   │
│  │ Achievement (Aggregate Root)    │   │ Badge (Aggregate Root)         │   │
│  ├────────────────────────────────┤   ├────────────────────────────────┤   │
│  │ - id: AchievementId            │   │ - id: BadgeId                 │   │
│  │ - name: string                 │   │ - name: string                │   │
│  │ - xpBonus: number              │   │ - icon: string                │   │
│  │ - unlockCondition              │   │ - rarity: Rarity              │   │
│  │ - category: Category           │   │ - unlockCondition             │   │
│  └────────────────────────────────┘   └────────────────────────────────┘   │
│           │ N                                  │ N                          │
│           └─────────────────────────────────────┘                          │
│               (Relates to Users via UserAchievements/UserBadges)           │
│                                                                              │
│  ┌──────────────────────────────────────────┐                               │
│  │ DailyMission (Aggregate Root)            │                               │
│  ├──────────────────────────────────────────┤                               │
│  │ - id: MissionId                          │                               │
│  │ - userId: UserId                         │                               │
│  │ - title: string                          │                               │
│  │ - condition: MissionCondition            │                               │
│  │ - xpReward: number                       │                               │
│  │ - status: MissionStatus                  │                               │
│  │ - expiresAt: Date (24h from creation)   │                               │
│  └──────────────────────────────────────────┘                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ SIMULATION DOMAIN                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────┐                                   │
│  │ Simulation (Aggregate Root)          │                                   │
│  ├──────────────────────────────────────┤                                   │
│  │ - id: SimulationId                   │                                   │
│  │ - userId: UserId                     │                                   │
│  │ - exerciseId: ExerciseId            │                                   │
│  │ - code: string                       │                                   │
│  │ - status: SimulationStatus           │                                   │
│  │ - wokwiProjectUrl: string            │                                   │
│  └──────────────────────────────────────┘                                   │
│           │ 1                                                               │
│           ├──────────────────────────────────────┐                          │
│           │                                      │                          │
│       N ┌──┴──────────────────────┐              │                         │
│       │  SimulationSession (Entity)│              │                         │
│       ├───────────────────────────┤              │                         │
│       │ - id: SessionId           │              │                         │
│       │ - sequenceNumber: number  │              │                         │
│       │ - output: string          │              │                         │
│       │ - durationSeconds: number │              │                         │
│       │ - success: boolean        │              │                         │
│       └───────────────────────────┘              │                         │
│                                                  │                         │
│                                    ┌─────────────┴──────────────┐         │
│                                    │ SimulationResult (VO)      │         │
│                                    ├────────────────────────────┤         │
│                                    │ - serialOutput: string     │         │
│                                    │ - hasErrors: boolean       │         │
│                                    │ - durationSeconds: number  │         │
│                                    └────────────────────────────┘         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ANALYTICS DOMAIN                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────┐                                   │
│  │ Event (Aggregate Root)               │                                   │
│  ├──────────────────────────────────────┤                                   │
│  │ - id: EventId                        │                                   │
│  │ - eventType: string                  │                                   │
│  │ - userId: UserId | null              │                                   │
│  │ - metadata: object                   │                                   │
│  │ - timestamp: Date                    │                                   │
│  │ - context: EventContext (Value Obj) │                                   │
│  └──────────────────────────────────────┘                                   │
│           │ N                                                               │
│           └───────────────────────────────────────┐                         │
│                                                   │                         │
│                                    ┌──────────────┴──────────────┐          │
│                                    │ Statistics (Aggregate Root) │          │
│                                    ├─────────────────────────────┤          │
│                                    │ - id: StatisticsId          │          │
│                                    │ - userId: UserId | null     │          │
│                                    │ - scope: Scope              │          │
│                                    │ - metrics: Metrics (VO)     │          │
│                                    │ - computedAt: Date          │          │
│                                    └─────────────────────────────┘          │
│                                                                              │
│  ┌──────────────────────────────────────────┐                               │
│  │ LeaderboardEntry (Entity)                │                               │
│  ├──────────────────────────────────────────┤                               │
│  │ - userId: UserId                         │                               │
│  │ - username: string                       │                               │
│  │ - rank: number                           │                               │
│  │ - totalXP: number                        │                               │
│  │ - level: Level (Value Object)            │                               │
│  │ - currentStreak: number                  │                               │
│  └──────────────────────────────────────────┘                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ SHARED INFRASTRUCTURE                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │ Notification (Aggregate Root)      │  │ UserSettings (Aggregate Root)│  │
│  ├────────────────────────────────────┤  ├──────────────────────────────┤  │
│  │ - id: NotificationId               │  │ - id: SettingsId            │  │
│  │ - userId: UserId                   │  │ - userId: UserId            │  │
│  │ - title: string                    │  │ - language: Language        │  │
│  │ - message: string                  │  │ - theme: Theme              │  │
│  │ - type: NotificationType           │  │ - emailNotifications: bool  │  │
│  │ - isRead: boolean                  │  │ - pushNotifications: bool   │  │
│  │ - actionUrl: string | null         │  │ - quietHours: QuietHours    │  │
│  └────────────────────────────────────┘  └──────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────┐                                 │
│  │ Certificate (Aggregate Root)           │                                 │
│  ├────────────────────────────────────────┤                                 │
│  │ - id: CertificateId                    │                                 │
│  │ - userId: UserId                       │                                 │
│  │ - courseId: CourseId                   │                                 │
│  │ - issueDate: Date                      │                                 │
│  │ - certificateNumber: string (unique)   │                                 │
│  │ - skills: string[]                     │                                 │
│  │ - score: number (0-100)                │                                 │
│  │ - shareableUrl: string                 │                                 │
│  └────────────────────────────────────────┘                                 │
│                                                                              │
│  ┌────────────────────────────────────────┐                                 │
│  │ Dashboard (Value Object)               │                                 │
│  ├────────────────────────────────────────┤                                 │
│  │ - userId: UserId                       │                                 │
│  │ - currentLevel: Level                  │                                 │
│  │ - totalXP: number                      │                                 │
│  │ - currentStreak: number                │                                 │
│  │ - currentModule: ModuleCard            │                                 │
│  │ - recentAchievements: Achievement[]    │                                 │
│  │ - activeMissions: DailyMission[]       │                                 │
│  │ - unreadNotifications: number          │                                 │
│  └────────────────────────────────────────┘                                 │
│                                                                              │
│  ┌────────────────────────────────────────┐                                 │
│  │ QuietHours (Value Object)              │                                 │
│  ├────────────────────────────────────────┤                                 │
│  │ - startTime: Time (HH:MM)              │                                 │
│  │ - endTime: Time (HH:MM)                │                                 │
│  │ - timezone: string                     │                                 │
│  └────────────────────────────────────────┘                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

```

---

## 2. Entity Relationship Diagram

```
                                    USER (Identity Domain)
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    │ 1:1                │ 1:1                │ 1:N
                    │                    │                    │
                 PROFILE             XPACCOUNT           SESSION
                    │                    │
                    │                    └─────────────────┐
                    │                                      │
                    │ references:                          │
        ┌───────────────────────────┐          ┌──────────┴─────┐
        │ USER_SETTINGS             │          │ XP_TRANSACTION │
        │ NOTIFICATIONS             │          │ (audit ledger) │
        │ DAILY_MISSIONS            │          └────────────────┘
        │ CERTIFICATES              │
        └───────────────────────────┘


                        COURSE (Learning Domain)
                             │
                    ┌────────┴────────┐
                    │                 │
                1:N │                 │ 1:N
                    │                 │
                 MODULE            PROGRESS
                    │                 │
        ┌───────┬───┴───┬──────┐      │
        │       │       │      │      │ 1:N
    LESSON  EXERCISE HINT  TESTCASE   │
        │       │                     │
        │       │                 MODULEINFO
        │       │                     │
        │       │             ┌───────┴────────┐
        │       │             │                │
        │       │        LESSON_INFO       EXERCISE_ATTEMPT
        │       │             │                │ 1:1
        │       │             │                │
        │       │             │           SUBMISSION
        │       │             │                │
        │       └─────────┬───┴────────────┬───┘
        │                 │                │
        │      ┌──────────┴────────────┐   │
        │      │                       │   │
        │      │                  AI_FEEDBACK
        │      │
        └──────┴─→ SIMULATION (Simulation Domain)
                      │
                      │ 1:N
                      │
                  SIMULATION_SESSION


        XP_ACCOUNT (Gamification)
             │
        ┌────┴────┬────────┬──────────┐
        │          │        │          │
    ACHIEVEMENT  BADGE  DAILY_MISSION  STREAK
        │          │
        └────┬─────┘
             │ N:M
        USER_ACHIEVEMENTS
        USER_BADGES


        EVENT (Analytics)
             │
        ┌────┴────┐
        │          │
    STATISTICS  LEADERBOARD
        │
        │ computed from
        │
        └─→ (All domain events)

```

---

## 3. Object Interaction Diagram

```
SCENARIO: Student Submits Exercise

1. Student (UI) → Progress Domain
   "submitExercise(userId, exerciseId, code)"
   
   └─→ Progress Domain
       - Validates: Module unlocked? Lesson completed?
       - Creates: ExerciseAttempt
       - Emits: ExerciseAttemptCreated event

2. Progress Domain → Simulation Domain (event-based)
   "SimulateCode(userId, code, exerciseId)"
   
   └─→ Simulation Domain
       - Starts: Wokwi simulation
       - Monitors: Execution
       - Returns: SimulationResult
       - Emits: SimulationCompleted event

3. Simulation Domain → AI Domain (event-based)
   "EvaluateSubmission(code, testCases)"
   
   └─→ AI Domain
       - Checks: Code against test cases
       - Calculates: Score (0-100)
       - Generates: Feedback
       - Emits: SubmissionEvaluated event

4. AI Domain → Gamification Domain (event-based)
   "SubmissionEvaluated(score, difficulty)"
   
   └─→ Gamification Domain
       - Calculates: XP = difficulty_base + first_attempt + speed + streak
       - Creates: XPTransaction
       - Checks: Achievements unlocked?
       - Emits: XPAwarded, AchievementUnlocked events

5. Gamification Domain → Profiles Domain (event-based)
   "XPAwarded(amount)"
   
   └─→ Profiles Domain
       - Updates: User XP total
       - Recalculates: Level
       - Updates: Leaderboard rank
       - Emits: XPSynced, LevelChanged events

6. Gamification Domain → Notifications Domain (event-based)
   "AchievementUnlocked(achievement)"
   
   └─→ Notifications Domain
       - Creates: Notification
       - Sends: In-app message
       - Sends: Email (if enabled)
       - Emits: NotificationSent event

7. All Domains → Analytics Domain (event-based)
   (All above events collected)
   
   └─→ Analytics Domain
       - Records: All events
       - Updates: User statistics
       - Refreshes: Leaderboard
       - Updates: Module effectiveness

RESULT (visible to user in < 10 seconds):
- ✅ Score shown
- ✅ Feedback displayed
- ✅ XP gained announced
- ✅ Level-up celebrated (if applicable)
- ✅ Achievement displayed (if applicable)
- ✅ Notification received
```

---

## 4. Aggregate Boundaries

```
AGGREGATE ROOT BOUNDARIES
(Each box is independently transactional)

┌───────────────────────────────────────┐
│ USER AGGREGATE                        │
│ Root: User                            │
│ Contains: Session, Role               │
│ Transaction: User + Sessions atomic   │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ COURSE AGGREGATE                      │
│ Root: Course                          │
│ Contains: (reference to modules)      │
│ Transaction: Course metadata atomic   │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ MODULE AGGREGATE                      │
│ Root: Module                          │
│ Contains: Lessons, Exercises, Hints   │
│ Transaction: All module content atomic│
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ LESSON AGGREGATE                      │
│ Root: Lesson                          │
│ Contains: Content                     │
│ Transaction: Lesson + content atomic  │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ EXERCISE AGGREGATE                    │
│ Root: Exercise                        │
│ Contains: Hints, TestCases            │
│ Transaction: Exercise + tests atomic  │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ PROGRESS AGGREGATE                    │
│ Root: Progress                        │
│ Contains: ModuleProgress,             │
│           LessonProgress,             │
│           ExerciseAttempts,           │
│           Submissions                 │
│ Transaction: All progress changes     │
│ atomic per user per course            │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ EXERCISE_ATTEMPT AGGREGATE            │
│ Root: ExerciseAttempt                 │
│ Contains: None                        │
│ Transaction: Single entity atomic     │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ SUBMISSION AGGREGATE                  │
│ Root: Submission                      │
│ Contains: AIFeedback (embedded)       │
│ Transaction: Submission + feedback    │
│ atomic                                │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ XPACCOUNT AGGREGATE                   │
│ Root: XPAccount                       │
│ Contains: XPTransactions (immutable)  │
│ Transaction: XP change + transaction  │
│ atomic (append-only ledger)           │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ ACHIEVEMENT AGGREGATE                 │
│ Root: Achievement                     │
│ Contains: None                        │
│ Transaction: Single entity atomic     │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ BADGE AGGREGATE                       │
│ Root: Badge                           │
│ Contains: None                        │
│ Transaction: Single entity atomic     │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ DAILY_MISSION AGGREGATE               │
│ Root: DailyMission                    │
│ Contains: None                        │
│ Transaction: Single entity atomic     │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ SIMULATION AGGREGATE                  │
│ Root: Simulation                      │
│ Contains: SimulationSessions          │
│ Transaction: Simulation + sessions    │
│ atomic                                │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ EVENT AGGREGATE                       │
│ Root: Event                           │
│ Contains: None                        │
│ Transaction: Single event atomic      │
│ (immutable, append-only)              │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ STATISTICS AGGREGATE                  │
│ Root: Statistics                      │
│ Contains: None                        │
│ Transaction: Single statistics atomic │
│ (computed, not mutable)               │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ NOTIFICATION AGGREGATE                │
│ Root: Notification                    │
│ Contains: None                        │
│ Transaction: Single notification      │
│ atomic                                │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ USER_SETTINGS AGGREGATE               │
│ Root: UserSettings                    │
│ Contains: QuietHours (embedded VO)    │
│ Transaction: Settings change atomic   │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ CERTIFICATE AGGREGATE                 │
│ Root: Certificate                     │
│ Contains: None                        │
│ Transaction: Single cert atomic       │
│ (immutable once issued)               │
└───────────────────────────────────────┘
```

---

## 5. Domain Glossary (Extended)

[See Domain Glossary section above]

---

# SUMMARY

**TrainArduino Domain Model** consists of:

- **30+ Domain Models** precisely defined
- **10 Bounded Contexts** clearly separated
- **16 Aggregate Roots** with clear boundaries
- **40+ Value Objects** capturing immutable concepts
- **5 Shared Domains** across contexts
- **Complete Lifecycle** for every model
- **Clear Ownership** for each model
- **Business Invariants** documented
- **Event Flow** between models
- **No Duplication** of concepts

**Key Principle**: This domain model is the official business language. Every API, service, repository, and component must use these models consistently.

**Result**: A scalable, maintainable, domain-driven design that supports 1K to 1M+ users without architectural changes.

