# DOMAIN CONTRACTS
## TrainArduino Business Domain Specification

**Status**: Design Phase  
**Version**: 1.0  
**Last Updated**: 2026-07-06  
**Purpose**: Define independent, testable contracts for all business domains

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Domain Contracts](#domain-contracts)
   - [Authentication Domain](#authentication-domain)
   - [Profiles Domain](#profiles-domain)
   - [Learning Domain](#learning-domain)
   - [Progress Domain](#progress-domain)
   - [Gamification Domain](#gamification-domain)
   - [AI Domain](#ai-domain)
   - [Simulation Domain](#simulation-domain)
   - [Notifications Domain](#notifications-domain)
   - [Analytics Domain](#analytics-domain)
   - [Administration Domain](#administration-domain)
3. [Cross-Domain Contracts](#cross-domain-contracts)
   - [Event Map](#event-map)
   - [Dependency Graph](#dependency-graph)
   - [Domain Interaction Diagram](#domain-interaction-diagram)
   - [Responsibility Matrix](#responsibility-matrix)

---

## EXECUTIVE SUMMARY

TrainArduino is organized into **10 independent business domains**. Each domain:
- Owns specific data and operations
- Publishes events that others consume
- Depends on specific other domains
- Validates business rules independently
- Fails explicitly with named errors
- Enforces role-based security

**Key Principle**: Domains are developed, tested, and deployed independently. Contracts ensure no breaking changes.

---

# DOMAIN CONTRACTS

---

## AUTHENTICATION DOMAIN

**Owner**: Identity Team  
**Tier**: Foundation (all other domains depend on this)

### 1. PURPOSE

**Responsibility**:
- User identity verification (email/password or OAuth)
- Session management via JWT + HTTP-only cookies
- Email verification and password reset flows
- Role assignment (Student, Administrator, Moderator)
- Token lifecycle management

**What It Solves**:
- Who is the user?
- Is the user verified?
- Does the user have a valid session?
- What role does the user have?

**What Must NEVER Belong Here**:
- User profiles (name, avatar, bio) → Profiles domain
- User progress tracking → Progress domain
- XP calculation → Gamification domain
- Admin actions → Administration domain
- Activity logging → Analytics domain

---

### 2. PUBLIC OPERATIONS

#### `signup(email: string, password: string): Promise<AuthUser>`
- **Input**: 
  - `email: string` (unique, valid format)
  - `password: string` (min 8 chars, complexity rules)
- **Output**: 
  - `{ id: string, email: string, emailVerified: boolean, role: 'student' | 'admin' | 'moderator' }`
- **Errors**:
  - `EmailAlreadyExistsError` (email registered)
  - `PasswordTooWeakError` (fails complexity)
  - `InvalidEmailFormatError`
  - `SignupRateLimitedError` (>5 attempts/hour from IP)
- **Permissions Required**: None (public endpoint)
- **Side Effects**: 
  - Profile auto-created in Profiles domain (trigger)
  - Verification email sent

---

#### `signin(email: string, password: string): Promise<{ token: string, expiresAt: Date }>`
- **Input**:
  - `email: string`
  - `password: string`
- **Output**:
  - `{ token: string, expiresAt: Date, role: string }`
- **Errors**:
  - `InvalidCredentialsError` (email not found OR password wrong)
  - `EmailNotVerifiedError` (unverified email)
  - `AccountLockedError` (too many failed attempts)
  - `SigninRateLimitedError` (>10 failed attempts/hour)
- **Permissions Required**: None
- **Side Effects**:
  - Session created (secure HTTP-only cookie)
  - Login tracked in Analytics domain

---

#### `signout(userId: string): Promise<void>`
- **Input**: `userId: string`
- **Output**: `void`
- **Errors**: None (always succeeds)
- **Permissions Required**: User must own session
- **Side Effects**:
  - JWT token invalidated
  - Session cookie cleared
  - Logout tracked in Analytics

---

#### `verifyEmail(userId: string, token: string): Promise<void>`
- **Input**:
  - `userId: string`
  - `token: string` (sent via email link)
- **Output**: `void`
- **Errors**:
  - `InvalidTokenError` (token malformed)
  - `TokenExpiredError` (>24 hours old)
  - `AlreadyVerifiedError` (email already verified)
- **Permissions Required**: None (token is permission)
- **Side Effects**:
  - Email marked as verified
  - Verification recorded in Analytics

---

#### `sendPasswordReset(email: string): Promise<void>`
- **Input**: `email: string`
- **Output**: `void`
- **Errors**: None (always succeeds to prevent email enumeration)
- **Permissions Required**: None
- **Side Effects**:
  - Reset token generated (15 min expiry)
  - Email sent with reset link
  - Request logged in Analytics (no email)

---

#### `resetPassword(token: string, newPassword: string): Promise<void>`
- **Input**:
  - `token: string`
  - `newPassword: string`
- **Output**: `void`
- **Errors**:
  - `InvalidTokenError`
  - `TokenExpiredError`
  - `PasswordTooWeakError`
  - `PasswordSameAsPreviousError`
- **Permissions Required**: Token is permission
- **Side Effects**:
  - Password updated
  - All existing sessions invalidated
  - Reset logged in Analytics

---

#### `changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>`
- **Input**:
  - `userId: string`
  - `currentPassword: string`
  - `newPassword: string`
- **Output**: `void`
- **Errors**:
  - `InvalidPasswordError` (current password wrong)
  - `PasswordTooWeakError`
  - `PasswordSameAsPreviousError`
- **Permissions Required**: User owns userId
- **Side Effects**:
  - Password updated
  - Change logged in Analytics

---

#### `validateSession(token: string): Promise<{ userId: string, role: string, expiresAt: Date }>`
- **Input**: `token: string` (from JWT cookie)
- **Output**: `{ userId, role, expiresAt }`
- **Errors**:
  - `InvalidTokenError`
  - `TokenExpiredError`
- **Permissions Required**: None
- **Side Effects**: None (read-only)

---

#### `grantRole(userId: string, role: 'admin' | 'moderator'): Promise<void>`
- **Input**:
  - `userId: string`
  - `role: string`
- **Output**: `void`
- **Errors**:
  - `UserNotFoundError`
  - `InvalidRoleError`
- **Permissions Required**: Admin role
- **Side Effects**:
  - Role updated
  - Role change logged in Analytics & Administration

---

---

### 3. EVENTS

#### `UserSignedUp`
```
{
  userId: string,
  email: string,
  createdAt: Date,
  role: 'student'
}
```
- **Trigger**: signup() completes successfully
- **Consumers**: 
  - Profiles domain (creates profile)
  - Notifications domain (welcome email)
  - Analytics domain (signup tracked)

---

#### `UserSignedIn`
```
{
  userId: string,
  email: string,
  role: string,
  signedInAt: Date,
  ipAddress: string
}
```
- **Trigger**: signin() succeeds
- **Consumers**:
  - Analytics domain (login tracked)
  - Administration domain (security monitoring)

---

#### `UserSignedOut`
```
{
  userId: string,
  signedOutAt: Date
}
```
- **Trigger**: signout() completes
- **Consumers**: Analytics domain

---

#### `EmailVerified`
```
{
  userId: string,
  email: string,
  verifiedAt: Date
}
```
- **Trigger**: verifyEmail() succeeds
- **Consumers**:
  - Analytics domain
  - Notifications domain (verified confirmation)

---

#### `PasswordReset`
```
{
  userId: string,
  resetAt: Date,
  tokenExpiry: Date
}
```
- **Trigger**: sendPasswordReset() completes
- **Consumers**: Analytics domain

---

#### `PasswordChanged`
```
{
  userId: string,
  changedAt: Date,
  changedBy: 'user' | 'admin'
}
```
- **Trigger**: resetPassword() or changePassword() succeeds
- **Consumers**:
  - Analytics domain
  - Administration domain

---

#### `RoleGranted`
```
{
  userId: string,
  newRole: string,
  grantedBy: string,
  grantedAt: Date
}
```
- **Trigger**: grantRole() succeeds
- **Consumers**:
  - Administration domain
  - Analytics domain

---

### 4. DEPENDENCIES

**Can Call**:
- `Notifications domain` - To send emails
- `Analytics domain` - To log events (one-way, fire-and-forget)

**Can NEVER Call**:
- ❌ Profiles domain
- ❌ Learning domain
- ❌ Progress domain
- ❌ Gamification domain
- ❌ AI domain
- ❌ Simulation domain
- ❌ Administration domain

**Why**: Authentication must remain pure identity. Any dependency on other domains creates circular complexity.

---

### 5. DATA OWNERSHIP

**Exclusive Ownership** (Auth domain only):
- `users` table (email, password hash, verification status)
- `auth_sessions` table (JWT, expiry, IP address)
- `password_reset_tokens` table
- `email_verification_tokens` table
- `user_roles` table

**Read-Only Access**:
- Read from user ID in any domain (to validate owner)

**Never Modify From Other Domains**:
- User passwords
- User email
- User roles
- Session tokens

---

### 6. VALIDATION RULES

**Business Rules** (not technical):
1. A user can only have ONE unverified email
2. After 3 failed signin attempts, account locked for 15 minutes
3. Password reset tokens expire after 15 minutes
4. Email verification tokens expire after 24 hours
5. Email must be unique across system
6. At least one admin must exist at all times (cannot downgrade last admin)
7. User cannot signin with unverified email
8. Password must not be same as last 3 passwords

---

### 7. ERROR CONTRACT

```typescript
// Explicit error names for all scenarios
class InvalidCredentialsError extends AuthError { }
class EmailAlreadyExistsError extends AuthError { }
class EmailNotVerifiedError extends AuthError { }
class InvalidTokenError extends AuthError { }
class TokenExpiredError extends AuthError { }
class AccountLockedError extends AuthError { }
class SignupRateLimitedError extends AuthError { }
class SigninRateLimitedError extends AuthError { }
class PasswordTooWeakError extends AuthError { }
class PasswordSameAsPreviousError extends AuthError { }
class InvalidPasswordError extends AuthError { }
class InvalidRoleError extends AuthError { }
class UserNotFoundError extends AuthError { }
class InvalidEmailFormatError extends AuthError { }
```

---

### 8. SECURITY CONTRACT

| Operation | Student | Admin | Moderator | Guest | AI |
|-----------|---------|-------|-----------|-------|-----|
| signup | ✅ | ✅ | ✅ | ✅ | ❌ |
| signin | ✅ | ✅ | ✅ | ✅ | ❌ |
| signout | ✅ | ✅ | ✅ | ❌ | ❌ |
| verifyEmail | ✅ | ✅ | ✅ | ✅ | ❌ |
| sendPasswordReset | ✅ | ✅ | ✅ | ✅ | ❌ |
| resetPassword | ✅ | ✅ | ✅ | ✅ | ❌ |
| changePassword | ✅ | ✅ | ✅ | ❌ | ❌ |
| validateSession | ✅ | ✅ | ✅ | ✅ | ✅ |
| grantRole | ❌ | ✅ | ❌ | ❌ | ❌ |

---

### 9. FUTURE EXTENSIONS

- **OAuth Integration**: Add operations like `signupWithGoogle()`, `signupWithGitHub()` without breaking existing contracts
- **2FA**: Add operations like `enableTwoFactor()`, `verifyOTP()` as new public operations
- **Single Sign-On**: Extend session validation to support federated identity
- **Session Management**: Add `listSessions()`, `revokeSession(sessionId)` without breaking current design
- **IP Allowlisting**: Add optional IP restrictions per user (separate table, queried during signin)

**Design Pattern**: New operations added as NEW methods, never modify existing signatures.

---

---

## PROFILES DOMAIN

**Owner**: User Management Team  
**Tier**: Foundation (depends on Authentication)

### 1. PURPOSE

**Responsibility**:
- User profile data (username, display name, avatar, bio)
- User preferences (language, theme, notifications settings)
- Leaderboard position and ranking
- Public profile visibility

**What It Solves**:
- Who is this user?
- What's their display name?
- What are their preferences?
- What's their leaderboard rank?

**What Must NEVER Belong Here**:
- Authentication credentials → Authentication domain
- User progress → Progress domain
- User XP → Gamification domain
- Course recommendations → Learning domain
- Activity logs → Analytics domain
- Admin actions on profiles → Administration domain

---

### 2. PUBLIC OPERATIONS

#### `createProfile(userId: string, username: string): Promise<Profile>`
- **Input**:
  - `userId: string`
  - `username: string` (3-20 chars, alphanumeric + underscore)
- **Output**:
  ```
  {
    userId: string,
    username: string,
    displayName: string,
    avatar: string | null,
    bio: string | null,
    level: number,
    xpTotal: number,
    rank: number,
    createdAt: Date
  }
  ```
- **Errors**:
  - `UsernameAlreadyTakenError`
  - `InvalidUsernameFormatError`
  - `ProfileAlreadyExistsError`
  - `UserNotFoundError`
- **Permissions Required**: Admin or own userId
- **Side Effects**: Profile created (auto-called by signup trigger)

---

#### `updateProfile(userId: string, updates: { displayName?: string, avatar?: string, bio?: string }): Promise<Profile>`
- **Input**:
  - `userId: string`
  - `updates: object` with optional fields:
    - `displayName: string` (1-100 chars)
    - `avatar: string` (URL or base64 data URI)
    - `bio: string` (0-500 chars)
- **Output**: Updated Profile object
- **Errors**:
  - `UserNotFoundError`
  - `ProfileNotFoundError`
  - `AvatarTooLargeError` (>1MB)
  - `InvalidBioFormatError`
- **Permissions Required**: User owns userId
- **Side Effects**:
  - Profile updated
  - Update tracked in Analytics

---

#### `getProfile(userId: string): Promise<Profile>`
- **Input**: `userId: string`
- **Output**: Full Profile object
- **Errors**:
  - `UserNotFoundError`
  - `ProfileNotFoundError`
- **Permissions Required**: None (public read)
- **Side Effects**: None

---

#### `getPublicProfile(username: string): Promise<PublicProfile>`
- **Input**: `username: string`
- **Output**:
  ```
  {
    username: string,
    displayName: string,
    avatar: string | null,
    bio: string | null,
    level: number,
    rank: number,
    joinedAt: Date
  }
  ```
- **Errors**:
  - `UserNotFoundError`
  - `ProfileNotFoundError`
- **Permissions Required**: None (public read)
- **Side Effects**: None

---

#### `getLeaderboard(page: number = 1, limit: number = 100): Promise<LeaderboardEntry[]>`
- **Input**:
  - `page: number` (default 1)
  - `limit: number` (default 100, max 100)
- **Output**: Array of:
  ```
  {
    rank: number,
    username: string,
    level: number,
    xpTotal: number,
    displayName: string,
    avatar: string | null
  }
  ```
- **Errors**: None
- **Permissions Required**: None (public read)
- **Side Effects**: Cache hit preferred (cached for 1 hour)

---

#### `updatePreferences(userId: string, preferences: UserPreferences): Promise<UserPreferences>`
- **Input**:
  - `userId: string`
  - `preferences: object`:
    - `language: 'en' | 'fr'`
    - `theme: 'light' | 'dark' | 'auto'`
    - `emailNotifications: boolean`
    - `pushNotifications: boolean`
- **Output**: Updated UserPreferences object
- **Errors**:
  - `UserNotFoundError`
  - `InvalidPreferenceError`
- **Permissions Required**: User owns userId
- **Side Effects**:
  - Preferences saved
  - Change tracked in Analytics

---

#### `syncXP(userId: string, newXP: number): Promise<Profile>`
- **Input**:
  - `userId: string`
  - `newXP: number` (from Gamification domain)
- **Output**: Updated Profile object
- **Errors**:
  - `UserNotFoundError`
  - `ProfileNotFoundError`
  - `InvalidXPError` (negative or unreasonable)
- **Permissions Required**: Gamification domain only
- **Side Effects**:
  - XP updated
  - Level recalculated
  - Rank updated
  - Leaderboard invalidated

---

#### `syncLevel(userId: string, newLevel: number): Promise<Profile>`
- **Input**:
  - `userId: string`
  - `newLevel: number` (from Gamification domain)
- **Output**: Updated Profile object
- **Errors**:
  - `UserNotFoundError`
  - `ProfileNotFoundError`
  - `InvalidLevelError`
- **Permissions Required**: Gamification domain only
- **Side Effects**:
  - Level updated
  - Rank updated
  - Leaderboard invalidated

---

### 3. EVENTS

#### `ProfileCreated`
```
{
  userId: string,
  username: string,
  createdAt: Date
}
```
- **Trigger**: createProfile() succeeds
- **Consumers**: Analytics domain

---

#### `ProfileUpdated`
```
{
  userId: string,
  fields: string[], // ['displayName', 'bio']
  updatedAt: Date
}
```
- **Trigger**: updateProfile() succeeds
- **Consumers**: Analytics domain

---

#### `PreferencesUpdated`
```
{
  userId: string,
  preferences: UserPreferences,
  updatedAt: Date
}
```
- **Trigger**: updatePreferences() succeeds
- **Consumers**: Notifications domain (to respect settings)

---

#### `XPSynced`
```
{
  userId: string,
  previousXP: number,
  newXP: number,
  levelChanged: boolean,
  newLevel?: number,
  syncedAt: Date
}
```
- **Trigger**: syncXP() succeeds and XP changed
- **Consumers**:
  - Analytics domain
  - Leaderboard service (rank updated)

---

#### `LevelSynced`
```
{
  userId: string,
  previousLevel: number,
  newLevel: number,
  syncedAt: Date
}
```
- **Trigger**: syncLevel() succeeds and level changed
- **Consumers**:
  - Analytics domain
  - Notifications domain (level up notification)

---

#### `RankChanged`
```
{
  userId: string,
  previousRank: number,
  newRank: number,
  changedAt: Date
}
```
- **Trigger**: Rank recalculated (after XP/level change)
- **Consumers**:
  - Notifications domain (milestone notifications)
  - Analytics domain

---

### 4. DEPENDENCIES

**Can Call**:
- `Analytics domain` - To log profile changes
- `Notifications domain` - To send notifications

**Can NEVER Call**:
- ❌ Authentication domain (read only allowed)
- ❌ Learning domain
- ❌ Progress domain
- ❌ Gamification domain (receives data via syncXP/syncLevel, doesn't call)
- ❌ AI domain
- ❌ Simulation domain

**Why**: Profiles is data layer. Must not have business logic dependencies.

---

### 5. DATA OWNERSHIP

**Exclusive Ownership**:
- `profiles` table (username, displayName, avatar, bio, bio, joinedAt)
- `user_preferences` table (language, theme, notification settings)
- `profile_avatars` table (avatar storage)

**Read-Only From Other Domains**:
- Profile ID, username, display name
- Leaderboard position (after Gamification computes)

**Never Modify From Other Domains**:
- Username (immutable after creation)
- Profile creation date
- Manual leaderboard manipulation

---

### 6. VALIDATION RULES

**Business Rules**:
1. Username is immutable (cannot change after creation)
2. Username must be unique (case-insensitive)
3. Display name can be changed anytime
4. Bio max 500 characters
5. Avatar max 1MB
6. Leaderboard position based ONLY on XP total
7. Only one active profile per user
8. Profile auto-created on signup (cannot be manually created)

---

### 7. ERROR CONTRACT

```typescript
class UsernameAlreadyTakenError extends ProfileError { }
class InvalidUsernameFormatError extends ProfileError { }
class ProfileAlreadyExistsError extends ProfileError { }
class ProfileNotFoundError extends ProfileError { }
class AvatarTooLargeError extends ProfileError { }
class InvalidBioFormatError extends ProfileError { }
class InvalidXPError extends ProfileError { }
class InvalidLevelError extends ProfileError { }
class UserNotFoundError extends ProfileError { }
class InvalidPreferenceError extends ProfileError { }
```

---

### 8. SECURITY CONTRACT

| Operation | Student | Admin | Moderator | Guest | AI |
|-----------|---------|-------|-----------|-------|-----|
| createProfile | ❌ | ✅ | ❌ | ❌ | ❌ |
| updateProfile | ✅* | ✅ | ❌ | ❌ | ❌ |
| getProfile | ✅ | ✅ | ✅ | ✅ | ✅ |
| getPublicProfile | ✅ | ✅ | ✅ | ✅ | ✅ |
| getLeaderboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| updatePreferences | ✅* | ✅ | ❌ | ❌ | ❌ |
| syncXP | ❌ | ❌ | ❌ | ❌ | ❌ |
| syncLevel | ❌ | ❌ | ❌ | ❌ | ❌ |

*own profile only

---

### 9. FUTURE EXTENSIONS

- **Social Features**: Add `followUser()`, `unfollowUser()`, `getFollowerCount()` without modifying existing operations
- **Profile Visibility**: Add `setProfileVisibility(public/private)` to control leaderboard appearance
- **Profile Badges**: Add badges section (read from Gamification domain, display on profile)
- **Activity Timeline**: Add `getRecentActivity()` showing user's recent achievements
- **Profile Customization**: Add custom profile color/theme personalization

---

---

## LEARNING DOMAIN

**Owner**: Content Team  
**Tier**: Core (depends on Authentication + Profiles)

### 1. PURPOSE

**Responsibility**:
- Course structure (modules, lessons, exercises)
- Lesson content (text, code examples, images)
- Exercise definitions (problem statement, test cases, difficulty)
- Prerequisite logic
- Learning path configuration

**What It Solves**:
- What should the user learn?
- What's the structure of the course?
- What are the prerequisites?
- What's the difficulty level?

**What Must NEVER Belong Here**:
- User progress → Progress domain
- User XP → Gamification domain
- User submissions/solutions → Progress domain
- Code evaluation → AI domain
- Simulation execution → Simulation domain
- Learning recommendations → Analytics domain (computed from data)

---

### 2. PUBLIC OPERATIONS

#### `getModules(): Promise<Module[]>`
- **Input**: None
- **Output**: Array of:
  ```
  {
    id: string,
    title: string,
    description: string,
    order: number,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    estimatedHours: number,
    prerequisites: string[], // module IDs
    lessonCount: number,
    exerciseCount: number,
    createdAt: Date
  }
  ```
- **Errors**: None
- **Permissions Required**: None (public read)
- **Side Effects**: None

---

#### `getModule(moduleId: string): Promise<Module>`
- **Input**: `moduleId: string`
- **Output**: Full Module object with metadata
- **Errors**:
  - `ModuleNotFoundError`
- **Permissions Required**: None
- **Side Effects**: None

---

#### `getLessonsByModule(moduleId: string): Promise<Lesson[]>`
- **Input**: `moduleId: string`
- **Output**: Array of:
  ```
  {
    id: string,
    moduleId: string,
    title: string,
    order: number,
    content: string, // Markdown
    videoUrl?: string,
    estimatedMinutes: number,
    keywords: string[],
    createdAt: Date
  }
  ```
- **Errors**:
  - `ModuleNotFoundError`
- **Permissions Required**: None
- **Side Effects**: None

---

#### `getLesson(lessonId: string): Promise<Lesson>`
- **Input**: `lessonId: string`
- **Output**: Full Lesson object with content
- **Errors**:
  - `LessonNotFoundError`
  - `ModuleNotFoundError`
- **Permissions Required**: None
- **Side Effects**: None

---

#### `getExercisesByModule(moduleId: string): Promise<Exercise[]>`
- **Input**: `moduleId: string`
- **Output**: Array of:
  ```
  {
    id: string,
    moduleId: string,
    title: string,
    order: number,
    difficulty: 'easy' | 'medium' | 'hard',
    xpReward: number,
    estimatedMinutes: number,
    wokwiProjectUrl: string,
    createdAt: Date
  }
  ```
- **Errors**:
  - `ModuleNotFoundError`
- **Permissions Required**: None
- **Side Effects**: None

---

#### `getExercise(exerciseId: string): Promise<Exercise>`
- **Input**: `exerciseId: string`
- **Output**:
  ```
  {
    id: string,
    moduleId: string,
    lessonId?: string,
    title: string,
    description: string, // Problem statement
    difficulty: string,
    xpReward: number,
    wokwiProjectUrl: string,
    starterCode: string,
    testCases: TestCase[], // NOT exposed to student
    constraints: string[],
    hints: string[],
    tags: string[],
    createdAt: Date
  }
  ```
- **Errors**:
  - `ExerciseNotFoundError`
- **Permissions Required**: Student (hints/tests withheld), Admin sees all
- **Side Effects**: Exercise access tracked in Analytics

---

#### `searchExercises(query: string, filters?: { difficulty?: string, tag?: string }): Promise<Exercise[]>`
- **Input**:
  - `query: string`
  - `filters: object` (optional)
- **Output**: Paginated array of matching Exercise objects
- **Errors**: None (empty array if no matches)
- **Permissions Required**: None
- **Side Effects**: Search tracked in Analytics

---

#### `createModule(data: ModuleInput): Promise<Module>`
- **Input**:
  ```
  {
    title: string,
    description: string,
    difficulty: string,
    estimatedHours: number,
    prerequisites: string[]
  }
  ```
- **Output**: Created Module object
- **Errors**:
  - `InvalidModuleError`
  - `PrerequisiteNotFoundError`
- **Permissions Required**: Admin
- **Side Effects**:
  - Module created
  - Creation logged in Administration domain

---

#### `createLesson(data: LessonInput): Promise<Lesson>`
- **Input**:
  ```
  {
    moduleId: string,
    title: string,
    content: string,
    videoUrl?: string,
    estimatedMinutes: number,
    keywords: string[]
  }
  ```
- **Output**: Created Lesson object
- **Errors**:
  - `ModuleNotFoundError`
  - `InvalidLessonError`
- **Permissions Required**: Admin
- **Side Effects**: Lesson created, logged in Administration

---

#### `createExercise(data: ExerciseInput): Promise<Exercise>`
- **Input**:
  ```
  {
    moduleId: string,
    lessonId?: string,
    title: string,
    description: string,
    difficulty: string,
    xpReward: number,
    wokwiProjectUrl: string,
    starterCode: string,
    testCases: TestCase[],
    hints: string[],
    tags: string[]
  }
  ```
- **Output**: Created Exercise object (with test cases)
- **Errors**:
  - `ModuleNotFoundError`
  - `LessonNotFoundError`
  - `InvalidExerciseError`
  - `InvalidTestCaseError`
  - `InvalidXPRewardError`
- **Permissions Required**: Admin
- **Side Effects**: Exercise created, logged in Administration

---

#### `updateModule(moduleId: string, updates: Partial<Module>): Promise<Module>`
- **Input**:
  - `moduleId: string`
  - `updates: object` (partial Module fields)
- **Output**: Updated Module object
- **Errors**:
  - `ModuleNotFoundError`
  - `InvalidModuleError`
- **Permissions Required**: Admin
- **Side Effects**: Update logged in Administration

---

#### `deleteExercise(exerciseId: string): Promise<void>`
- **Input**: `exerciseId: string`
- **Output**: `void`
- **Errors**:
  - `ExerciseNotFoundError`
  - `ExerciseHasSubmissionsError` (cannot delete if submissions exist)
- **Permissions Required**: Admin
- **Side Effects**: Deletion logged, Analytics cleaned up

---

### 3. EVENTS

#### `ModuleCreated`
```
{
  moduleId: string,
  title: string,
  createdBy: string,
  createdAt: Date
}
```
- **Trigger**: createModule() succeeds
- **Consumers**: Administration domain

---

#### `LessonCreated`
```
{
  lessonId: string,
  moduleId: string,
  title: string,
  createdBy: string,
  createdAt: Date
}
```
- **Trigger**: createLesson() succeeds
- **Consumers**: Administration domain

---

#### `ExerciseCreated`
```
{
  exerciseId: string,
  moduleId: string,
  title: string,
  difficulty: string,
  xpReward: number,
  createdBy: string,
  createdAt: Date
}
```
- **Trigger**: createExercise() succeeds
- **Consumers**: Administration domain

---

#### `ExerciseAccessed`
```
{
  exerciseId: string,
  userId: string,
  accessedAt: Date
}
```
- **Trigger**: getExercise() called
- **Consumers**: Analytics domain

---

#### `ContentUpdated`
```
{
  contentType: 'module' | 'lesson' | 'exercise',
  contentId: string,
  fields: string[],
  updatedBy: string,
  updatedAt: Date
}
```
- **Trigger**: updateModule() or similar succeeds
- **Consumers**: Administration domain

---

### 4. DEPENDENCIES

**Can Call**:
- `Analytics domain` - To log access
- `Administration domain` - To audit changes

**Can NEVER Call**:
- ❌ Authentication domain (read userId only from session)
- ❌ Profiles domain
- ❌ Progress domain (reads progress only for unlocking logic)
- ❌ Gamification domain
- ❌ AI domain
- ❌ Simulation domain

**Why**: Learning is purely content. No business logic beyond structure.

---

### 5. DATA OWNERSHIP

**Exclusive Ownership**:
- `modules` table (structure, metadata)
- `lessons` table (content, videos)
- `exercises` table (problem definitions, test cases, hints)
- `test_cases` table (grading criteria, hidden from students)
- `exercise_prerequisites` table

**Read-Only From Other Domains**:
- Module/lesson/exercise metadata
- Exercise difficulty and XP reward
- Lesson prerequisites (used by Progress domain for unlocking)

**Never Modify From Other Domains**:
- Test cases (only Learning domain can edit)
- Exercise grading criteria
- Lesson content

---

### 6. VALIDATION RULES

**Business Rules**:
1. Module difficulty must be in enum (beginner/intermediate/advanced)
2. Exercise XP reward must be 10-500
3. Difficulty affects XP (easy: 10-50, medium: 50-200, hard: 200-500)
4. Prerequisites must exist before module is created
5. Cannot create exercise without module
6. Lesson order within module must be unique and sequential
7. Cannot modify lesson after submissions exist (safety rule)
8. Cannot delete exercise if student submissions exist
9. Wokwi project URL must be valid

---

### 7. ERROR CONTRACT

```typescript
class ModuleNotFoundError extends LearningError { }
class LessonNotFoundError extends LearningError { }
class ExerciseNotFoundError extends LearningError { }
class InvalidModuleError extends LearningError { }
class InvalidLessonError extends LearningError { }
class InvalidExerciseError extends LearningError { }
class InvalidTestCaseError extends LearningError { }
class InvalidXPRewardError extends LearningError { }
class PrerequisiteNotFoundError extends LearningError { }
class ExerciseHasSubmissionsError extends LearningError { }
```

---

### 8. SECURITY CONTRACT

| Operation | Student | Admin | Moderator | Guest |
|-----------|---------|-------|-----------|-------|
| getModules | ✅ | ✅ | ✅ | ✅ |
| getModule | ✅ | ✅ | ✅ | ✅ |
| getLessonsByModule | ✅ | ✅ | ✅ | ✅ |
| getLesson | ✅ | ✅ | ✅ | ✅ |
| getExercisesByModule | ✅ | ✅ | ✅ | ✅ |
| getExercise | ✅ | ✅ | ✅ | ✅ |
| searchExercises | ✅ | ✅ | ✅ | ✅ |
| createModule | ❌ | ✅ | ❌ | ❌ |
| createLesson | ❌ | ✅ | ❌ | ❌ |
| createExercise | ❌ | ✅ | ❌ | ❌ |
| updateModule | ❌ | ✅ | ❌ | ❌ |
| deleteExercise | ❌ | ✅ | ❌ | ❌ |

---

### 9. FUTURE EXTENSIONS

- **Video Integration**: Add `uploadLessonVideo()` to embed educational videos
- **Code Snippets**: Add `codeSnippets: CodeSnippet[]` to lessons (shareable code blocks)
- **Interactive Challenges**: Add challenge-type exercises (multiple-choice, fill-in-blank)
- **Learning Paths**: Add curated paths (e.g., "Arduino Basics → Intermediate → Advanced")
- **Content Versioning**: Add lesson versioning (students always see latest)

---

---

## PROGRESS DOMAIN

**Owner**: Progress Tracking Team  
**Tier**: Core (depends on Authentication + Learning)

### 1. PURPOSE

**Responsibility**:
- Track user progress through modules
- Track lesson completion
- Track exercise submission status
- Unlock next modules based on completion
- Progress calculations (% complete, mastery level)
- Prerequisite checking

**What It Solves**:
- Has the user completed this module?
- What's the user's current progress?
- Can the user access this lesson?
- Should the next module unlock?
- What's the user's mastery level?

**What Must NEVER Belong Here**:
- XP calculation → Gamification domain
- User profiles → Profiles domain
- Exercise evaluation → AI domain
- Lesson content → Learning domain
- Submissions code → AI domain

---

### 2. PUBLIC OPERATIONS

#### `getUserProgress(userId: string): Promise<UserProgress>`
- **Input**: `userId: string`
- **Output**:
  ```
  {
    userId: string,
    currentModuleId: string,
    completedModules: string[],
    inProgressModules: string[],
    lockedModules: string[],
    totalCompletionPercentage: number,
    lastActivityAt: Date
  }
  ```
- **Errors**:
  - `UserNotFoundError`
- **Permissions Required**: User owns userId or Admin
- **Side Effects**: None (read-only)

---

#### `getModuleProgress(userId: string, moduleId: string): Promise<ModuleProgress>`
- **Input**:
  - `userId: string`
  - `moduleId: string`
- **Output**:
  ```
  {
    moduleId: string,
    status: 'locked' | 'in_progress' | 'completed',
    completionPercentage: number,
    lessonsCompleted: number,
    lessonsTotal: number,
    exercisesCompleted: number,
    exercisesTotal: number,
    lastActivityAt: Date,
    startedAt?: Date,
    completedAt?: Date
  }
  ```
- **Errors**:
  - `UserNotFoundError`
  - `ModuleNotFoundError`
- **Permissions Required**: User owns userId or Admin
- **Side Effects**: None

---

#### `canAccessLesson(userId: string, lessonId: string): Promise<boolean>`
- **Input**:
  - `userId: string`
  - `lessonId: string`
- **Output**: `boolean`
- **Errors**: None
- **Permissions Required**: None
- **Side Effects**: None (read-only)
- **Logic**: 
  - Check if module is unlocked
  - Check if previous lessons completed
  - Check prerequisites met

---

#### `canAccessExercise(userId: string, exerciseId: string): Promise<boolean>`
- **Input**:
  - `userId: string`
  - `exerciseId: string`
- **Output**: `boolean`
- **Errors**: None
- **Permissions Required**: None
- **Side Effects**: None
- **Logic**:
  - Check if module is unlocked
  - Check if related lesson completed
  - Check prerequisites met

---

#### `completeLesson(userId: string, lessonId: string): Promise<LessonProgress>`
- **Input**:
  - `userId: string`
  - `lessonId: string`
- **Output**:
  ```
  {
    lessonId: string,
    moduleId: string,
    status: 'completed',
    completedAt: Date
  }
  ```
- **Errors**:
  - `UserNotFoundError`
  - `LessonNotFoundError`
  - `LessonLockedError`
  - `LessonAlreadyCompletedError`
- **Permissions Required**: User owns userId
- **Side Effects**:
  - Lesson marked complete
  - Module progress updated
  - Event emitted for other domains

---

#### `updateModuleProgress(userId: string, moduleId: string): Promise<ModuleProgress>`
- **Input**:
  - `userId: string`
  - `moduleId: string`
- **Output**: Updated ModuleProgress object
- **Errors**:
  - `UserNotFoundError`
  - `ModuleNotFoundError`
  - `ModuleLockedError`
- **Permissions Required**: Progress domain only (internal call)
- **Side Effects**:
  - Module progress recalculated
  - Unlock next module if 100% complete
  - Event emitted

---

#### `unlockNextModule(userId: string, moduleId: string): Promise<Module | null>`
- **Input**:
  - `userId: string`
  - `moduleId: string` (current completed module)
- **Output**: Next Module object or null if no next module
- **Errors**:
  - `UserNotFoundError`
  - `ModuleNotFoundError`
- **Permissions Required**: Progress domain only
- **Side Effects**:
  - Next module unlocked
  - Event emitted for Gamification (milestone)

---

#### `getProgressHistory(userId: string, days: number = 30): Promise<ProgressEntry[]>`
- **Input**:
  - `userId: string`
  - `days: number` (default 30)
- **Output**: Array of:
  ```
  {
    date: Date,
    lessonsCompleted: number,
    exercisesCompleted: number,
    xpGained: number
  }
  ```
- **Errors**:
  - `UserNotFoundError`
- **Permissions Required**: User owns userId or Admin
- **Side Effects**: None

---

#### `getUserMasteryLevel(userId: string, moduleId: string): Promise<number>`
- **Input**:
  - `userId: string`
  - `moduleId: string`
- **Output**: Number 0-100 (mastery percentage)
- **Errors**:
  - `UserNotFoundError`
  - `ModuleNotFoundError`
- **Permissions Required**: None
- **Side Effects**: None
- **Calculation**: Based on exercise submission quality & speed

---

### 3. EVENTS

#### `LessonCompleted`
```
{
  userId: string,
  lessonId: string,
  moduleId: string,
  completedAt: Date
}
```
- **Trigger**: completeLesson() succeeds
- **Consumers**:
  - Gamification domain (award XP)
  - Notifications domain (celebration)
  - Analytics domain

---

#### `ModuleStarted`
```
{
  userId: string,
  moduleId: string,
  startedAt: Date
}
```
- **Trigger**: First exercise submission in module
- **Consumers**:
  - Analytics domain
  - Notifications domain (encouragement)

---

#### `ModuleCompleted`
```
{
  userId: string,
  moduleId: string,
  completedAt: Date,
  timeToCompletionHours: number,
  nextModuleId?: string
}
```
- **Trigger**: All exercises in module completed
- **Consumers**:
  - Gamification domain (bonus XP, achievement check)
  - Notifications domain (milestone)
  - Analytics domain

---

#### `ModuleUnlocked`
```
{
  userId: string,
  moduleId: string,
  reason: 'prerequisite_met' | 'manual',
  unlockedAt: Date
}
```
- **Trigger**: unlockNextModule() succeeds or admin unlock
- **Consumers**:
  - Notifications domain (new content available)
  - Analytics domain

---

#### `ProgressUpdated`
```
{
  userId: string,
  previousCompletion: number,
  newCompletion: number,
  updatedAt: Date
}
```
- **Trigger**: Module progress changes
- **Consumers**: Analytics domain

---

### 4. DEPENDENCIES

**Can Call**:
- `Learning domain` - Read modules/lessons/exercises (to check unlocking logic)
- `Gamification domain` - To request XP awards (one-way)
- `Notifications domain` - To send notifications
- `Analytics domain` - To log events

**Can NEVER Call**:
- ❌ Authentication domain (read userId from context only)
- ❌ Profiles domain

**Why**: Progress is computation layer. Can read from Learning (immutable), can notify others via events.

---

### 5. DATA OWNERSHIP

**Exclusive Ownership**:
- `progress` table (user + module, status, completion %)
- `lesson_completion` table (user + lesson, completion date)
- `progress_history` table (audit trail)

**Read-Only From Other Domains**:
- Completion status (to show on UI)
- Module unlock status
- Progress percentage

**Never Modify From Other Domains**:
- Completion status
- Module unlock status
- Progress history

---

### 6. VALIDATION RULES

**Business Rules**:
1. Module unlocks only when all prerequisites completed
2. Can only complete lesson if module is unlocked
3. Lesson can only be completed once (idempotent)
4. Module completes when all exercises are submitted + passing
5. Cannot unlock a module twice
6. Completion percentage must be 0-100
7. Cannot skip lessons (must do in order)

---

### 7. ERROR CONTRACT

```typescript
class LessonLockedError extends ProgressError { }
class ModuleLockedError extends ProgressError { }
class LessonAlreadyCompletedError extends ProgressError { }
class ModuleNotFoundError extends ProgressError { }
class LessonNotFoundError extends ProgressError { }
class UserNotFoundError extends ProgressError { }
class PrerequisiteNotMetError extends ProgressError { }
```

---

### 8. SECURITY CONTRACT

| Operation | Student | Admin | Moderator |
|-----------|---------|-------|-----------|
| getUserProgress | ✅* | ✅ | ❌ |
| getModuleProgress | ✅* | ✅ | ❌ |
| canAccessLesson | ✅ | ✅ | ✅ |
| canAccessExercise | ✅ | ✅ | ✅ |
| completeLesson | ✅ | ✅ | ❌ |
| updateModuleProgress | ❌ | ❌ | ❌ |
| unlockNextModule | ❌ | ❌ | ❌ |
| getProgressHistory | ✅* | ✅ | ❌ |
| getUserMasteryLevel | ✅* | ✅ | ✅ |

*own progress only

---

### 9. FUTURE EXTENSIONS

- **Spaced Repetition**: Track review attempts, suggest review dates
- **Adaptive Learning**: Recommend next lesson based on mastery level
- **Learning Analytics**: Identify struggling users, suggest help
- **Time Tracking**: Track time spent per lesson, per module
- **Practice Mode**: Allow re-attempts without counting to progress

---

---

## GAMIFICATION DOMAIN

**Owner**: Engagement Team  
**Tier**: Feature (depends on Authentication + Profiles + Progress + AI)

### 1. PURPOSE

**Responsibility**:
- XP calculation and award
- Level progression (1-10)
- Achievement system
- Streak tracking
- Leaderboard computation
- Daily missions/challenges
- Badge system

**What It Solves**:
- How much XP should a user get?
- What level should they be?
- What achievements have they earned?
- Where do they rank?
- How long is their streak?

**What Must NEVER Belong Here**:
- User profiles → Profiles domain (stores final XP)
- Exercise evaluation → AI domain
- User progress → Progress domain
- Streak notifications → Notifications domain

---

### 2. PUBLIC OPERATIONS

#### `calculateXP(exerciseId: string, submission: SubmissionData): Promise<{ baseXP: number, bonusXP: number, totalXP: number }>`
- **Input**:
  - `exerciseId: string`
  - `submission: object`:
    - `difficulty: 'easy' | 'medium' | 'hard'`
    - `isFirstAttempt: boolean`
    - `timeSpentSeconds: number`
    - `passedAllTests: boolean`
- **Output**:
  ```
  {
    baseXP: number,     // from difficulty
    bonusXP: number,    // first attempt, streak, speed
    totalXP: number
  }
  ```
- **Errors**: None (always computable)
- **Permissions Required**: AI domain only
- **Side Effects**: None (pure calculation)

---

#### `grantXP(userId: string, amount: number, source: string): Promise<{ previousXP: number, newXP: number, levelChanged: boolean, newLevel?: number }>`
- **Input**:
  - `userId: string`
  - `amount: number` (positive, 1-1000)
  - `source: string` (exerciseId, achievementId, etc.)
- **Output**:
  ```
  {
    previousXP: number,
    newXP: number,
    levelChanged: boolean,
    newLevel?: number,
    xpEventId: string
  }
  ```
- **Errors**:
  - `UserNotFoundError`
  - `InvalidXPAmountError` (negative or >1000)
- **Permissions Required**: Gamification domain only (called from other domains via events)
- **Side Effects**:
  - XP awarded
  - Level recalculated
  - Event emitted
  - Profiles domain synced (syncXP)
  - Achievement progress updated

---

#### `calculateLevelFromXP(totalXP: number): Promise<{ level: number, xpInLevel: number, xpToNextLevel: number }>`
- **Input**: `totalXP: number`
- **Output**:
  ```
  {
    level: number,         // 1-10
    xpInLevel: number,     // XP in current level
    xpToNextLevel: number  // XP needed for next level
  }
  ```
- **Errors**: None
- **Permissions Required**: None
- **Side Effects**: None (pure calculation)
- **Formula**:
  ```
  Level 1: 0-100 XP
  Level 2: 100-300 XP (200 required)
  Level 3: 300-600 XP (300 required)
  Level 4: 600-1000 XP (400 required)
  ... (increases by 100 each level)
  Level 10: 4500+ XP (500 required)
  ```

---

#### `unlockAchievement(userId: string, achievementId: string): Promise<Achievement>`
- **Input**:
  - `userId: string`
  - `achievementId: string`
- **Output**:
  ```
  {
    achievementId: string,
    name: string,
    description: string,
    icon: string,
    xpBonus: number,
    unlockedAt: Date
  }
  ```
- **Errors**:
  - `UserNotFoundError`
  - `AchievementNotFoundError`
  - `AchievementAlreadyUnlockedError`
- **Permissions Required**: Gamification domain only
- **Side Effects**:
  - Achievement recorded
  - XP bonus awarded (via grantXP)
  - Event emitted

---

#### `getAchievements(userId: string): Promise<{ unlocked: Achievement[], locked: Achievement[] }>`
- **Input**: `userId: string`
- **Output**:
  ```
  {
    unlocked: Achievement[],
    locked: Achievement[]
  }
  ```
- **Errors**:
  - `UserNotFoundError`
- **Permissions Required**: User owns userId or Admin
- **Side Effects**: None

---

#### `recordStreak(userId: string): Promise<{ currentStreak: number, longestStreak: number }>`
- **Input**: `userId: string`
- **Output**:
  ```
  {
    currentStreak: number,
    longestStreak: number,
    streakUpdatedAt: Date
  }
  ```
- **Errors**:
  - `UserNotFoundError`
- **Permissions Required**: Gamification domain only (called from Progress/AI)
- **Side Effects**:
  - Streak updated
  - Event emitted if streak milestone reached (10, 30, 100 days)

---

#### `getStreak(userId: string): Promise<{ currentStreak: number, longestStreak: number, lastActivityDate: Date }>`
- **Input**: `userId: string`
- **Output**:
  ```
  {
    currentStreak: number,
    longestStreak: number,
    lastActivityDate: Date
  }
  ```
- **Errors**:
  - `UserNotFoundError`
- **Permissions Required**: None
- **Side Effects**: None

---

#### `getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]>`
- **Input**: `limit: number` (1-100, default 100)
- **Output**: Array of:
  ```
  {
    rank: number,
    userId: string,
    username: string,
    level: number,
    xpTotal: number,
    currentStreak: number
  }
  ```
- **Errors**: None
- **Permissions Required**: None
- **Side Effects**: None (cached for 1 hour)

---

#### `createDailyMission(): Promise<DailyMission>`
- **Input**: None (automatic, called by scheduler)
- **Output**:
  ```
  {
    missionId: string,
    title: string,
    description: string,
    difficulty: string,
    xpReward: number,
    expiresAt: Date
  }
  ```
- **Errors**: None
- **Permissions Required**: Admin or scheduled task
- **Side Effects**:
  - Mission created
  - Event emitted for Notifications

---

#### `completeDailyMission(userId: string, missionId: string): Promise<{ xpAwarded: number }>`
- **Input**:
  - `userId: string`
  - `missionId: string`
- **Output**: `{ xpAwarded: number }`
- **Errors**:
  - `UserNotFoundError`
  - `MissionNotFoundError`
  - `MissionAlreadyCompletedError`
  - `MissionExpiredError`
- **Permissions Required**: User owns userId
- **Side Effects**:
  - Mission marked complete
  - XP awarded (grantXP)
  - Event emitted

---

#### `getActiveDailyMissions(): Promise<DailyMission[]>`
- **Input**: None
- **Output**: Array of unexpired DailyMission objects
- **Errors**: None
- **Permissions Required**: None
- **Side Effects**: None

---

### 3. EVENTS

#### `XPAwarded`
```
{
  userId: string,
  amount: number,
  source: string, // exerciseId, achievementId, missionId
  previousXP: number,
  newXP: number,
  levelChanged: boolean,
  newLevel?: number,
  awardedAt: Date
}
```
- **Trigger**: grantXP() succeeds
- **Consumers**:
  - Profiles domain (sync XP)
  - Notifications domain (celebration)
  - Analytics domain
  - Leaderboard service (refresh)

---

#### `LevelIncreased`
```
{
  userId: string,
  previousLevel: number,
  newLevel: number,
  totalXP: number,
  leveledUpAt: Date
}
```
- **Trigger**: grantXP() causes level increase
- **Consumers**:
  - Profiles domain (sync level)
  - Notifications domain (milestone celebration)
  - Analytics domain

---

#### `AchievementUnlocked`
```
{
  userId: string,
  achievementId: string,
  achievementName: string,
  xpBonus: number,
  unlockedAt: Date
}
```
- **Trigger**: unlockAchievement() succeeds
- **Consumers**:
  - Profiles domain (update achievements list)
  - Notifications domain (celebration)
  - Analytics domain

---

#### `StreakMilestone`
```
{
  userId: string,
  streakLength: number, // 10, 30, 100, 365
  achievedAt: Date
}
```
- **Trigger**: Streak reaches 10/30/100/365 days
- **Consumers**:
  - Notifications domain (celebration)
  - Analytics domain
  - Achievements system (unlock streak badges)

---

#### `DailyMissionCompleted`
```
{
  userId: string,
  missionId: string,
  xpAwarded: number,
  completedAt: Date
}
```
- **Trigger**: completeDailyMission() succeeds
- **Consumers**:
  - Notifications domain
  - Analytics domain

---

### 4. DEPENDENCIES

**Can Call**:
- `Profiles domain` - To sync XP and level
- `Notifications domain` - To celebrate achievements
- `Analytics domain` - To log events
- `Learning domain` - To check exercise metadata

**Can NEVER Call**:
- ❌ Authentication domain
- ❌ Progress domain (listens to its events)
- ❌ AI domain (reads submission data only)
- ❌ Simulation domain
- ❌ Administration domain

**Why**: Gamification is event-driven. Reacts to others' events, doesn't drive them.

---

### 5. DATA OWNERSHIP

**Exclusive Ownership**:
- `achievements` table (achievement definitions)
- `user_achievements` table (unlock tracking)
- `xp_events` table (XP audit trail)
- `streaks` table (current + longest)
- `daily_missions` table (mission definitions + user completions)
- `leaderboard_cache` table (denormalized view, refresh every hour)

**Read-Only From Other Domains**:
- XP amounts (computed, not stored in Profiles)
- Level numbers
- Achievement unlock status

**Never Modify From Other Domains**:
- XP events (audit trail)
- Achievement unlock records
- Streak records

---

### 6. VALIDATION RULES

**Business Rules**:
1. XP amount must be 1-1000 per award
2. XP is never negative (cannot subtract)
3. Level is always 1-10
4. XP required per level increases by 100 (except last)
5. Achievement can only unlock once per user
6. Daily mission can only complete once per user per day
7. Streak resets if no activity for 24+ hours
8. Cannot level up beyond level 10
9. XP formula: Base(difficulty) + First Attempt Bonus(50%) + Speed Bonus(0-50%) + Streak Bonus(0-20%)

---

### 7. ERROR CONTRACT

```typescript
class InvalidXPAmountError extends GamificationError { }
class UserNotFoundError extends GamificationError { }
class AchievementNotFoundError extends GamificationError { }
class AchievementAlreadyUnlockedError extends GamificationError { }
class MissionNotFoundError extends GamificationError { }
class MissionAlreadyCompletedError extends GamificationError { }
class MissionExpiredError extends GamificationError { }
class InvalidDifficultyError extends GamificationError { }
```

---

### 8. SECURITY CONTRACT

| Operation | Student | Admin | AI | Scheduler |
|-----------|---------|-------|-----|-----------|
| calculateXP | ❌ | ❌ | ✅ | ❌ |
| grantXP | ❌ | ❌ | ✅ | ✅ |
| calculateLevelFromXP | ✅ | ✅ | ✅ | ✅ |
| unlockAchievement | ❌ | ❌ | ✅ | ✅ |
| getAchievements | ✅* | ✅ | ❌ | ❌ |
| recordStreak | ❌ | ❌ | ✅ | ❌ |
| getStreak | ✅ | ✅ | ✅ | ✅ |
| getLeaderboard | ✅ | ✅ | ✅ | ✅ |
| createDailyMission | ❌ | ✅ | ❌ | ✅ |
| completeDailyMission | ✅ | ✅ | ❌ | ❌ |
| getActiveDailyMissions | ✅ | ✅ | ✅ | ✅ |

*own achievements only

---

### 9. FUTURE EXTENSIONS

- **Prestige System**: After reaching level 10, reset to level 1 with badge
- **Seasonal Leaderboards**: Monthly/weekly leaderboards (reset)
- **Achievements Tiers**: Easy/medium/hard achievements
- **XP Multipliers**: Weekends 2x XP, special events 3x XP
- **Custom Badges**: Unlock different visual badges
- **Challenge Events**: Limited-time challenges (earn extra XP)

---

---

## AI DOMAIN

**Owner**: AI/ML Team  
**Tier**: Feature (depends on Gamification + Progress + Learning)

### 1. PURPOSE

**Responsibility**:
- Code evaluation and grading
- Hint generation
- Personalized feedback
- Learning gap identification
- Cost optimization across providers
- Prompt management and caching

**What It Solves**:
- Is the code correct?
- What feedback should we give?
- What hints should we suggest?
- Which AI provider to use?
- How to cache evaluations?

**What Must NEVER Belong Here**:
- User profiles → Profiles domain
- XP calculation → Gamification domain
- Exercise definitions → Learning domain
- User progress → Progress domain
- Notification sending → Notifications domain

---

### 2. PUBLIC OPERATIONS

#### `evaluateSubmission(submissionId: string, code: string, exerciseId: string): Promise<Evaluation>`
- **Input**:
  - `submissionId: string`
  - `code: string` (user's code)
  - `exerciseId: string` (to get test cases)
- **Output**:
  ```
  {
    evaluationId: string,
    passed: boolean,
    testsPassed: number,
    testsFailed: number,
    score: number, // 0-100
    feedback: string,
    suggestions: string[],
    hints?: string[],
    evaluatedAt: Date
  }
  ```
- **Errors**:
  - `SubmissionNotFoundError`
  - `ExerciseNotFoundError`
  - `InvalidCodeError` (syntax error, won't compile)
  - `EvaluationTimeoutError`
  - `AIProviderError` (Claude/Gemini down)
- **Permissions Required**: AI domain only
- **Side Effects**:
  - Evaluation saved
  - Submission status updated
  - XP calculation triggered (Gamification)
  - Event emitted

---

#### `generateHint(exerciseId: string, attemptNumber: number): Promise<{ hint: string, difficulty: 'beginner' | 'intermediate' | 'advanced' }>`
- **Input**:
  - `exerciseId: string`
  - `attemptNumber: number` (1st, 2nd, 3rd hint increases detail)
- **Output**:
  ```
  {
    hint: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  }
  ```
- **Errors**:
  - `ExerciseNotFoundError`
  - `MaxHintsReachedError` (limit 3 hints)
  - `AIProviderError`
- **Permissions Required**: None
- **Side Effects**: Hint tracked in Analytics

---

#### `getStudentLearningGaps(userId: string): Promise<LearningGap[]>`
- **Input**: `userId: string`
- **Output**: Array of:
  ```
  {
    topic: string,
    difficulty: string,
    strugglesCount: number,
    recommendedExercises: string[] // exerciseIds
  }
  ```
- **Errors**:
  - `UserNotFoundError`
- **Permissions Required**: Student owns userId or Admin
- **Side Effects**: Analysis tracked in Analytics

---

#### `getCodeQualityScore(code: string): Promise<{ score: number, issues: CodeIssue[] }>`
- **Input**: `code: string` (user's code)
- **Output**:
  ```
  {
    score: number, // 0-100
    issues: [
      {
        type: 'style' | 'efficiency' | 'readability' | 'bug',
        severity: 'info' | 'warning' | 'error',
        message: string,
        line: number
      }
    ]
  }
  ```
- **Errors**:
  - `InvalidCodeError`
  - `AIProviderError`
- **Permissions Required**: None
- **Side Effects**: Analysis tracked

---

#### `chatWithAI(userId: string, question: string, context?: string): Promise<{ response: string, sources: string[] }>`
- **Input**:
  - `userId: string`
  - `question: string` (user's question about code/concepts)
  - `context?: string` (optional exercise context)
- **Output**:
  ```
  {
    response: string,
    sources: string[] // URLs/documentation links
  }
  ```
- **Errors**:
  - `InvalidQuestionError`
  - `AIProviderError`
  - `RateLimitedError` (5 questions/hour per user)
- **Permissions Required**: Authenticated user
- **Side Effects**: Chat logged in Analytics

---

#### `selectAIProvider(costWeight: number = 0.5): Promise<'claude' | 'gemini' | 'openai'>`
- **Input**: `costWeight: number` (0-1, 0=quality, 1=cost)
- **Output**: Provider name
- **Errors**: None
- **Permissions Required**: Internal (admin)
- **Side Effects**: None (pure selection)
- **Logic**: 
  - If quality > cost: Use Claude
  - If cost > quality: Use Gemini
  - Fallback: OpenAI

---

#### `preloadEvaluationCache(exercises: string[]): Promise<void>`
- **Input**: `exercises: string[]` (exerciseIds)
- **Output**: `void`
- **Errors**: None
- **Permissions Required**: Admin
- **Side Effects**: Cache pre-warmed for faster responses

---

#### `clearEvaluationCache(exerciseId?: string): Promise<void>`
- **Input**: `exerciseId?: string` (optional, clear all if omitted)
- **Output**: `void`
- **Errors**: None
- **Permissions Required**: Admin
- **Side Effects**: Cache invalidated

---

### 3. EVENTS

#### `SubmissionEvaluated`
```
{
  submissionId: string,
  userId: string,
  exerciseId: string,
  passed: boolean,
  score: number,
  xpAwarded: number,
  evaluatedAt: Date
}
```
- **Trigger**: evaluateSubmission() completes successfully
- **Consumers**:
  - Gamification domain (award XP)
  - Progress domain (track submission)
  - Notifications domain (feedback notification)
  - Analytics domain

---

#### `HintGenerated`
```
{
  exerciseId: string,
  userId: string,
  hintNumber: number,
  difficulty: string,
  generatedAt: Date
}
```
- **Trigger**: generateHint() returns
- **Consumers**: Analytics domain

---

#### `LearningGapsIdentified`
```
{
  userId: string,
  gaps: string[], // topic names
  analyzedAt: Date
}
```
- **Trigger**: getStudentLearningGaps() completes
- **Consumers**: Notifications domain (send recommendations)

---

#### `CodeChatStarted`
```
{
  userId: string,
  question: string,
  startedAt: Date
}
```
- **Trigger**: chatWithAI() called
- **Consumers**: Analytics domain

---

### 4. DEPENDENCIES

**Can Call**:
- `Learning domain` - Read exercises, test cases (immutable)
- `Progress domain` - Read user progress (to contextualize feedback)
- `Gamification domain` - Request XP award
- `Profiles domain` - Read user preferences
- `Notifications domain` - Send evaluation notifications
- `Analytics domain` - Log AI usage

**External**:
- Claude API / Gemini API / OpenAI API

**Can NEVER Call**:
- ❌ Authentication domain
- ❌ Simulation domain

**Why**: AI is a service layer. Reads immutable data, fires events for others to react.

---

### 5. DATA OWNERSHIP

**Exclusive Ownership**:
- `ai_evaluations` table (evaluation results, cost tracking)
- `ai_hints` table (hint generation history)
- `ai_prompts` table (prompt templates)
- `evaluation_cache` table (caching layer for identical submissions)
- `ai_provider_usage` table (usage stats per provider)

**Read-Only From Other Domains**:
- Evaluation results (passed/failed)
- Feedback strings
- Hints

**Never Modify From Other Domains**:
- Evaluation records
- Cache entries

---

### 6. VALIDATION RULES

**Business Rules**:
1. Code must be syntactically valid (or error explicitly)
2. User can request max 5 hints per exercise
3. User can ask max 5 AI chat questions per hour
4. Evaluation must complete within 30 seconds
5. Test cases must be from Learning domain (never user-defined)
6. Feedback must be constructive and encouraging
7. Evaluation results are immutable (once scored, cannot change)

---

### 7. ERROR CONTRACT

```typescript
class InvalidCodeError extends AIError { }
class SubmissionNotFoundError extends AIError { }
class ExerciseNotFoundError extends AIError { }
class EvaluationTimeoutError extends AIError { }
class AIProviderError extends AIError { }
class MaxHintsReachedError extends AIError { }
class RateLimitedError extends AIError { }
class InvalidQuestionError extends AIError { }
```

---

### 8. SECURITY CONTRACT

| Operation | Student | Admin | Scheduler |
|-----------|---------|-------|-----------|
| evaluateSubmission | ❌ | ❌ | ✅ |
| generateHint | ✅ | ✅ | ❌ |
| getStudentLearningGaps | ✅* | ✅ | ❌ |
| getCodeQualityScore | ✅ | ✅ | ✅ |
| chatWithAI | ✅ | ✅ | ❌ |
| selectAIProvider | ❌ | ✅ | ❌ |
| preloadEvaluationCache | ❌ | ✅ | ✅ |
| clearEvaluationCache | ❌ | ✅ | ✅ |

*own gaps only

---

### 9. FUTURE EXTENSIONS

- **Provider Selection Per Exercise**: Different providers for different difficulty levels
- **Live Code Review**: Real-time feedback as user types (debounced)
- **Video Explanations**: Generate video explanations for complex topics
- **Plagiarism Detection**: Check submissions against previous submissions/public code
- **Code Refactoring Suggestions**: Suggest how to improve code structure
- **Performance Analysis**: Analyze code performance and suggest optimizations

---

---

## SIMULATION DOMAIN

**Owner**: Simulation Team  
**Tier**: Feature (depends on Progress + AI)

### 1. PURPOSE

**Responsibility**:
- Arduino code simulation (via Wokwi)
- Hardware simulation management
- Code execution control
- Simulation result capture
- Connection management

**What It Solves**:
- Can we test the code?
- Does the hardware simulation work?
- What are the simulation results?
- Did the code compile?
- Did it behave correctly?

**What Must NEVER Belong Here**:
- Code evaluation → AI domain
- XP calculation → Gamification domain
- User submissions → Progress domain
- Lesson content → Learning domain

---

### 2. PUBLIC OPERATIONS

#### `startSimulation(exerciseId: string, code: string): Promise<{ simulationId: string, wokwiUrl: string, status: 'running' }>`
- **Input**:
  - `exerciseId: string`
  - `code: string` (user's code)
- **Output**:
  ```
  {
    simulationId: string,
    wokwiUrl: string,
    status: 'running',
    startedAt: Date
  }
  ```
- **Errors**:
  - `ExerciseNotFoundError`
  - `InvalidCodeError` (syntax error)
  - `SimulationStartError` (Wokwi unavailable)
- **Permissions Required**: None
- **Side Effects**: Simulation tracked

---

#### `stopSimulation(simulationId: string): Promise<void>`
- **Input**: `simulationId: string`
- **Output**: `void`
- **Errors**:
  - `SimulationNotFoundError`
  - `SimulationAlreadyStoppedError`
- **Permissions Required**: User owns simulation or Admin
- **Side Effects**: Simulation stopped, results captured

---

#### `getSimulationResult(simulationId: string): Promise<SimulationResult>`
- **Input**: `simulationId: string`
- **Output**:
  ```
  {
    simulationId: string,
    status: 'running' | 'completed' | 'error',
    output: string, // Serial output
    durationSeconds: number,
    hasErrors: boolean,
    errorMessage?: string,
    completedAt?: Date
  }
  ```
- **Errors**:
  - `SimulationNotFoundError`
  - `SimulationStillRunningError`
- **Permissions Required**: None
- **Side Effects**: None

---

#### `validateCodeBeforeSimulation(code: string): Promise<{ valid: boolean, errors: string[] }>`
- **Input**: `code: string`
- **Output**:
  ```
  {
    valid: boolean,
    errors: string[] // Compilation errors
  }
  ```
- **Errors**: None
- **Permissions Required**: None
- **Side Effects**: None (read-only validation)

---

### 3. EVENTS

#### `SimulationStarted`
```
{
  simulationId: string,
  exerciseId: string,
  userId: string,
  startedAt: Date
}
```
- **Trigger**: startSimulation() succeeds
- **Consumers**: Analytics domain

---

#### `SimulationCompleted`
```
{
  simulationId: string,
  exerciseId: string,
  userId: string,
  durationSeconds: number,
  success: boolean,
  completedAt: Date
}
```
- **Trigger**: Wokwi simulation finishes
- **Consumers**:
  - AI domain (evaluate against tests)
  - Analytics domain

---

#### `SimulationError`
```
{
  simulationId: string,
  errorMessage: string,
  errorAt: Date
}
```
- **Trigger**: Simulation fails to compile/run
- **Consumers**: Analytics domain

---

### 4. DEPENDENCIES

**Can Call**:
- `Learning domain` - Read exercise definitions
- `Analytics domain` - Log simulations

**External**:
- Wokwi API (to create/manage simulations)

**Can NEVER Call**:
- ❌ Gamification domain
- ❌ Progress domain
- ❌ AI domain (AI calls Simulation, not reverse)
- ❌ Profiles domain

**Why**: Simulation is isolated hardware layer. Pure I/O with external service.

---

### 5. DATA OWNERSHIP

**Exclusive Ownership**:
- `simulations` table (simulation instances)
- `simulation_results` table (output, errors)
- `wokwi_projects` table (project mappings)

**Read-Only From Other Domains**:
- Simulation status
- Serial output

**Never Modify From Other Domains**:
- Simulation state
- Results (append-only)

---

### 6. VALIDATION RULES

**Business Rules**:
1. Code must compile (syntax-valid Arduino)
2. Simulation must complete within 60 seconds
3. Cannot start multiple simulations simultaneously per user
4. Wokwi project URL must be valid
5. Serial output max 10MB

---

### 7. ERROR CONTRACT

```typescript
class InvalidCodeError extends SimulationError { }
class ExerciseNotFoundError extends SimulationError { }
class SimulationStartError extends SimulationError { }
class SimulationNotFoundError extends SimulationError { }
class SimulationAlreadyStoppedError extends SimulationError { }
class SimulationTimeoutError extends SimulationError { }
```

---

### 8. SECURITY CONTRACT

| Operation | Student | Admin |
|-----------|---------|-------|
| startSimulation | ✅ | ✅ |
| stopSimulation | ✅* | ✅ |
| getSimulationResult | ✅* | ✅ |
| validateCodeBeforeSimulation | ✅ | ✅ |

*own simulations only

---

### 9. FUTURE EXTENSIONS

- **Custom Wokwi Projects**: Allow creating custom hardware setups per exercise
- **Simulation Debugging**: Add breakpoints, step-through execution
- **Performance Profiling**: Track CPU/memory during simulation
- **Multiple Hardware Options**: Arduino Uno, Mega, MKR variants
- **Sensor Simulation**: Simulate environmental sensors with realistic data

---

---

## NOTIFICATIONS DOMAIN

**Owner**: Communications Team  
**Tier**: Feature (depends on Authentication + Profiles)

### 1. PURPOSE

**Responsibility**:
- In-app notifications
- Email notifications
- Push notifications (future)
- Notification preferences
- Notification history
- Unread count tracking

**What It Solves**:
- How do we notify users?
- Do they want this notification?
- What's their notification history?
- How many unread messages?

**What Must NEVER Belong Here**:
- User preferences → Profiles domain (reads only)
- Event triggering → Publishing domains
- Message content logic → Each domain

---

### 2. PUBLIC OPERATIONS

#### `sendNotification(userId: string, notification: NotificationInput): Promise<NotificationId>`
- **Input**:
  - `userId: string`
  - `notification: object`:
    - `title: string`
    - `message: string`
    - `type: 'achievement' | 'level_up' | 'lesson_complete' | 'feedback' | 'system'`
    - `actionUrl?: string`
    - `metadata?: object`
- **Output**: `{ notificationId: string, sentAt: Date }`
- **Errors**:
  - `UserNotFoundError`
  - `InvalidNotificationError`
- **Permissions Required**: Publishing domains only
- **Side Effects**:
  - Notification saved
  - Email sent if preferences allow
  - Event emitted

---

#### `getNotifications(userId: string, limit: number = 50): Promise<Notification[]>`
- **Input**:
  - `userId: string`
  - `limit: number` (1-100, default 50)
- **Output**: Array of Notification objects
- **Errors**:
  - `UserNotFoundError`
- **Permissions Required**: User owns userId or Admin
- **Side Effects**: None

---

#### `markAsRead(userId: string, notificationId: string): Promise<void>`
- **Input**:
  - `userId: string`
  - `notificationId: string`
- **Output**: `void`
- **Errors**:
  - `NotificationNotFoundError`
  - `PermissionDeniedError`
- **Permissions Required**: User owns userId
- **Side Effects**: Notification marked read

---

#### `markAllAsRead(userId: string): Promise<void>`
- **Input**: `userId: string`
- **Output**: `void`
- **Errors**:
  - `UserNotFoundError`
- **Permissions Required**: User owns userId
- **Side Effects**: All unread marked read

---

#### `getUnreadCount(userId: string): Promise<number>`
- **Input**: `userId: string`
- **Output**: `number`
- **Errors**:
  - `UserNotFoundError`
- **Permissions Required**: User owns userId
- **Side Effects**: None

---

#### `deleteNotification(userId: string, notificationId: string): Promise<void>`
- **Input**:
  - `userId: string`
  - `notificationId: string`
- **Output**: `void`
- **Errors**:
  - `NotificationNotFoundError`
  - `PermissionDeniedError`
- **Permissions Required**: User owns userId
- **Side Effects**: Notification deleted

---

#### `getNotificationPreferences(userId: string): Promise<NotificationPreferences>`
- **Input**: `userId: string`
- **Output**:
  ```
  {
    emailNotifications: boolean,
    pushNotifications: boolean,
    achievementNotifications: boolean,
    feedbackNotifications: boolean,
    systemNotifications: boolean,
    dailyDigest: boolean,
    quietHours: { start: string, end: string }
  }
  ```
- **Errors**:
  - `UserNotFoundError`
- **Permissions Required**: User owns userId or Admin
- **Side Effects**: None

---

### 3. EVENTS

#### `NotificationSent`
```
{
  notificationId: string,
  userId: string,
  type: string,
  sentAt: Date
}
```
- **Trigger**: sendNotification() completes
- **Consumers**: Analytics domain

---

#### `NotificationRead`
```
{
  notificationId: string,
  userId: string,
  readAt: Date
}
```
- **Trigger**: markAsRead() completes
- **Consumers**: Analytics domain

---

### 4. DEPENDENCIES

**Can Call**:
- `Profiles domain` - Read preferences
- `Analytics domain` - Log notifications

**External**:
- Email service (SendGrid/AWS SES)
- Push service (Firebase Cloud Messaging)

**Can NEVER Call**:
- ❌ Authentication domain
- ❌ Learning domain
- ❌ Gamification domain
- ❌ Other publishing domains

**Why**: Notifications is pure delivery layer. Receives requests, doesn't initiate business logic.

---

### 5. DATA OWNERSHIP

**Exclusive Ownership**:
- `notifications` table (in-app)
- `email_queue` table (outbound emails)
- `notification_history` table (audit)

**Read-Only From Other Domains**:
- Notification status
- Preferences

**Never Modify From Other Domains**:
- Sent notifications
- Preferences (only Profiles domain modifies)

---

### 6. VALIDATION RULES

**Business Rules**:
1. Cannot send notification without user consent
2. Email must be sent within 5 minutes
3. Respect quiet hours (no notifications)
4. Unread count never negative
5. Cannot mark deleted notification as read

---

### 7. ERROR CONTRACT

```typescript
class UserNotFoundError extends NotificationError { }
class NotificationNotFoundError extends NotificationError { }
class InvalidNotificationError extends NotificationError { }
class PermissionDeniedError extends NotificationError { }
class EmailSendError extends NotificationError { }
```

---

### 8. SECURITY CONTRACT

| Operation | Student | Admin |
|-----------|---------|-------|
| sendNotification | ❌ | ❌ |
| getNotifications | ✅* | ✅ |
| markAsRead | ✅* | ✅ |
| markAllAsRead | ✅* | ✅ |
| getUnreadCount | ✅* | ✅ |
| deleteNotification | ✅* | ✅ |
| getNotificationPreferences | ✅* | ✅ |

*own notifications/preferences only

---

### 9. FUTURE EXTENSIONS

- **SMS Notifications**: Text message alerts for milestones
- **Notification Templates**: Customizable templates per notification type
- **Batch Digest**: Daily/weekly digest of all notifications
- **Notification Scheduling**: Schedule notifications for later
- **Web Push**: Browser push notifications

---

---

## ANALYTICS DOMAIN

**Owner**: Data/BI Team  
**Tier**: Insight (depends on all other domains)

### 1. PURPOSE

**Responsibility**:
- Event tracking (all domain events)
- User activity analytics
- Learning effectiveness metrics
- Performance metrics
- Dashboard data
- Data aggregation

**What It Solves**:
- How are users engaging?
- Where are people struggling?
- What's the completion rate?
- What's the effectiveness per module?
- Performance metrics?

**What Must NEVER Belong Here**:
- User authentication → Authentication domain
- User profiles → Profiles domain
- Progress tracking → Progress domain
- XP calculation → Gamification domain
- Content creation → Learning domain

---

### 2. PUBLIC OPERATIONS

#### `trackEvent(event: Event): Promise<void>`
- **Input**:
  - `event: object`:
    - `eventType: string` (e.g., 'UserSignedUp', 'ExerciseCompleted')
    - `userId?: string`
    - `metadata: object`
    - `timestamp: Date`
- **Output**: `void`
- **Errors**: None (best-effort)
- **Permissions Required**: Any domain
- **Side Effects**: Event stored (async)

---

#### `getUserStats(userId: string): Promise<UserStats>`
- **Input**: `userId: string`
- **Output**:
  ```
  {
    userId: string,
    totalXP: number,
    currentLevel: number,
    modulesCompleted: number,
    exercisesCompleted: number,
    successRate: number, // 0-100
    averageTimePerExercise: number,
    currentStreak: number,
    joinedAt: Date,
    lastActiveAt: Date
  }
  ```
- **Errors**:
  - `UserNotFoundError`
- **Permissions Required**: User owns userId or Admin
- **Side Effects**: None (read-only)

---

#### `getModuleAnalytics(moduleId: string): Promise<ModuleAnalytics>`
- **Input**: `moduleId: string`
- **Output**:
  ```
  {
    moduleId: string,
    title: string,
    studentsEnrolled: number,
    studentsCompleted: number,
    completionRate: number, // %
    averageTimeToComplete: number,
    averageScore: number,
    strugglingExercises: string[], // exerciseIds
    commonErrors: string[],
    difficulty: 'easy' | 'medium' | 'hard'
  }
  ```
- **Errors**:
  - `ModuleNotFoundError`
- **Permissions Required**: Admin
- **Side Effects**: None

---

#### `getGlobalStats(): Promise<GlobalStats>`
- **Input**: None
- **Output**:
  ```
  {
    totalUsers: number,
    activeUsersLast30Days: number,
    averageUserLevel: number,
    modulesCreated: number,
    exercisesCreated: number,
    totalSubmissions: number,
    averageSuccessRate: number,
    lastUpdatedAt: Date
  }
  ```
- **Errors**: None
- **Permissions Required**: Admin
- **Side Effects**: None (cached for 1 hour)

---

#### `getEngagementMetrics(days: number = 30): Promise<EngagementMetric[]>`
- **Input**: `days: number` (1-365, default 30)
- **Output**: Array of daily:
  ```
  {
    date: Date,
    activeUsers: number,
    newUsers: number,
    submissions: number,
    completions: number,
    xpAwarded: number
  }
  ```
- **Errors**: None
- **Permissions Required**: Admin
- **Side Effects**: None

---

#### `getLearningEffectiveness(moduleId?: string): Promise<EffectivenessReport>`
- **Input**: `moduleId?: string` (if omitted, all modules)
- **Output**:
  ```
  {
    moduleId?: string,
    completionRate: number,
    avgTimeToMastery: number,
    retentionRate: number, // how many users review content
    strugglingTopics: string[],
    recommendations: string[]
  }
  ```
- **Errors**: None
- **Permissions Required**: Admin
- **Side Effects**: None

---

#### `getStudentCohortAnalysis(cohortSize: number = 100): Promise<CohortAnalysis>`
- **Input**: `cohortSize: number`
- **Output**:
  ```
  {
    cohortSize: number,
    averageDaysToFirstCompletion: number,
    dropoutRate: number,
    averageLevelReached: number,
    topPerformers: number,
    atRiskStudents: number
  }
  ```
- **Errors**: None
- **Permissions Required**: Admin
- **Side Effects**: None

---

### 3. EVENTS

#### `EventTracked`
```
{
  eventId: string,
  eventType: string,
  userId?: string,
  metadata: object,
  timestamp: Date
}
```
- **Trigger**: trackEvent() called
- **Consumers**: Dashboard, Analytics queries

---

### 4. DEPENDENCIES

**Can Read**:
- All events from all domains (via event stream)
- Can read any table (read-only) for analysis

**Can NEVER Write**:
- To other domains' tables (only append to events)

**Why**: Analytics is pure observer. Aggregates data without modifying business logic.

---

### 5. DATA OWNERSHIP

**Exclusive Ownership**:
- `events` table (all events, immutable)
- `analytics_cache` table (computed metrics)
- `cohort_analysis` table (cohort computations)

**Read-Only From Other Domains**:
- Analytics reports
- User stats

**Never Write From Other Domains**:
- Event records (only Analytics appends)

---

### 6. VALIDATION RULES

**Business Rules**:
1. Events are immutable (append-only)
2. Timestamps cannot be in future
3. User IDs must be valid
4. Metrics are computed, never manually set

---

### 7. ERROR CONTRACT

```typescript
class UserNotFoundError extends AnalyticsError { }
class ModuleNotFoundError extends AnalyticsError { }
class InvalidDateRangeError extends AnalyticsError { }
```

---

### 8. SECURITY CONTRACT

| Operation | Student | Admin | BI Team |
|-----------|---------|-------|---------|
| trackEvent | ❌ | ❌ | ❌ |
| getUserStats | ✅* | ✅ | ✅ |
| getModuleAnalytics | ❌ | ✅ | ✅ |
| getGlobalStats | ❌ | ✅ | ✅ |
| getEngagementMetrics | ❌ | ✅ | ✅ |
| getLearningEffectiveness | ❌ | ✅ | ✅ |
| getStudentCohortAnalysis | ❌ | ✅ | ✅ |

*own stats only

---

### 9. FUTURE EXTENSIONS

- **Real-Time Dashboards**: Live metrics via WebSockets
- **Predictive Analytics**: Predict which users will drop out
- **AB Testing**: Compare different exercise versions
- **Recommendation Engine**: AI-powered recommendations
- **Export Reports**: PDF/CSV reports for stakeholders

---

---

## ADMINISTRATION DOMAIN

**Owner**: Admin/Operations Team  
**Tier**: System (depends on all other domains for data, is independent for operations)

### 1. PURPOSE

**Responsibility**:
- User management (disable/enable accounts)
- Content moderation
- System health monitoring
- Audit logging
- Configuration management
- Backup/recovery

**What It Solves**:
- Who is an admin?
- Can we disable a user?
- What changed when?
- Is the system healthy?
- What configuration do we have?

**What Must NEVER Belong Here**:
- Direct user business logic changes (through proper domain APIs)
- Automatic feature decisions (domains decide)

---

### 2. PUBLIC OPERATIONS

#### `disableUser(userId: string, reason: string): Promise<void>`
- **Input**:
  - `userId: string`
  - `reason: string`
- **Output**: `void`
- **Errors**:
  - `UserNotFoundError`
  - `CannotDisableLastAdminError`
  - `UserAlreadyDisabledError`
- **Permissions Required**: Admin
- **Side Effects**:
  - User sessions invalidated
  - Audit logged
  - Event emitted

---

#### `enableUser(userId: string): Promise<void>`
- **Input**: `userId: string`
- **Output**: `void`
- **Errors**:
  - `UserNotFoundError`
  - `UserNotDisabledError`
- **Permissions Required**: Admin
- **Side Effects**: Audit logged

---

#### `grantAdminRole(userId: string, grantedBy: string): Promise<void>`
- **Input**:
  - `userId: string`
  - `grantedBy: string` (admin ID)
- **Output**: `void`
- **Errors**:
  - `UserNotFoundError`
  - `InvalidRoleError`
- **Permissions Required**: Admin
- **Side Effects**: Role changed via Authentication, audit logged

---

#### `revokeAdminRole(userId: string): Promise<void>`
- **Input**: `userId: string`
- **Output**: `void`
- **Errors**:
  - `UserNotFoundError`
  - `CannotRevokeLastAdminError`
- **Permissions Required**: Admin
- **Side Effects**: Audit logged

---

#### `getAuditLog(filters?: { userId?: string, action?: string, fromDate?: Date, toDate?: Date }, limit: number = 100): Promise<AuditEntry[]>`
- **Input**:
  - `filters: object` (optional)
  - `limit: number` (1-1000, default 100)
- **Output**: Array of AuditEntry objects
- **Errors**: None
- **Permissions Required**: Admin
- **Side Effects**: None (read-only)

---

#### `getSystemHealth(): Promise<SystemHealth>`
- **Input**: None
- **Output**:
  ```
  {
    status: 'healthy' | 'degraded' | 'critical',
    databaseHealth: 'ok' | 'slow' | 'error',
    apiHealth: 'ok' | 'error',
    storageUsed: number, // bytes
    storageTotal: number,
    lastCheckAt: Date,
    alerts: Alert[]
  }
  ```
- **Errors**: None
- **Permissions Required**: Admin
- **Side Effects**: None

---

#### `backupDatabase(): Promise<{ backupId: string, size: number, completedAt: Date }>`
- **Input**: None
- **Output**: Backup metadata
- **Errors**:
  - `BackupAlreadyRunningError`
  - `InsufficientStorageError`
- **Permissions Required**: Admin
- **Side Effects**: Backup created (async)

---

#### `getConfiguration(): Promise<SystemConfig>`
- **Input**: None
- **Output**: Current system configuration
- **Errors**: None
- **Permissions Required**: Admin
- **Side Effects**: None

---

#### `updateConfiguration(config: Partial<SystemConfig>): Promise<void>`
- **Input**: `config: object` (partial config)
- **Output**: `void`
- **Errors**:
  - `InvalidConfigurationError`
- **Permissions Required**: Admin
- **Side Effects**: Config updated, audit logged

---

### 3. EVENTS

#### `UserDisabled`
```
{
  userId: string,
  reason: string,
  disabledBy: string,
  disabledAt: Date
}
```
- **Trigger**: disableUser() succeeds
- **Consumers**: Audit trail

---

#### `AdminRoleGranted`
```
{
  userId: string,
  grantedBy: string,
  grantedAt: Date
}
```
- **Trigger**: grantAdminRole() succeeds
- **Consumers**: Audit trail

---

#### `AuditedAction`
```
{
  actionType: string,
  userId: string,
  targetUserId?: string,
  targetResource?: string,
  details: object,
  timestamp: Date
}
```
- **Trigger**: Admin operation completes
- **Consumers**: Audit log storage

---

### 4. DEPENDENCIES

**Can Call**:
- `Authentication domain` - Modify roles
- `Profiles domain` - Get user info
- `Learning domain` - Content moderation
- `All other domains` - For operations (via their public APIs)

**Can NEVER Call** (should not):
- None (can call any, but shouldn't bypass domain operations)

**Why**: Administration is the override layer for system maintenance.

---

### 5. DATA OWNERSHIP

**Exclusive Ownership**:
- `audit_log` table (immutable)
- `system_config` table
- `admin_actions` table
- `backup_metadata` table

**Read-Only From Other Domains**:
- Configuration (all read-only)
- Audit (admins read-only)

---

### 6. VALIDATION RULES

**Business Rules**:
1. Cannot disable all admins (min 1 admin required)
2. Cannot revoke admin from last admin
3. Audit log is immutable (append-only)
4. All changes logged with timestamp + admin ID
5. Backup must complete within 30 minutes

---

### 7. ERROR CONTRACT

```typescript
class UserNotFoundError extends AdminError { }
class CannotDisableLastAdminError extends AdminError { }
class CannotRevokeLastAdminError extends AdminError { }
class UserAlreadyDisabledError extends AdminError { }
class UserNotDisabledError extends AdminError { }
class InvalidRoleError extends AdminError { }
class InvalidConfigurationError extends AdminError { }
class BackupAlreadyRunningError extends AdminError { }
class InsufficientStorageError extends AdminError { }
```

---

### 8. SECURITY CONTRACT

| Operation | Admin | Other |
|-----------|-------|-------|
| disableUser | ✅ | ❌ |
| enableUser | ✅ | ❌ |
| grantAdminRole | ✅ | ❌ |
| revokeAdminRole | ✅ | ❌ |
| getAuditLog | ✅ | ❌ |
| getSystemHealth | ✅ | ❌ |
| backupDatabase | ✅ | ❌ |
| getConfiguration | ✅ | ❌ |
| updateConfiguration | ✅ | ❌ |

---

### 9. FUTURE EXTENSIONS

- **Data Anonymization**: GDPR compliance, delete user data
- **Bulk Operations**: Bulk enable/disable users
- **Scheduled Backups**: Auto-backup on schedule
- **Restore from Backup**: Restore data from backup
- **Log Export**: Export audit logs to external systems
- **Security Alerts**: Alert admins to suspicious activity

---

---

# CROSS-DOMAIN CONTRACTS

---

## EVENT MAP

### Event Publishing & Consumption

```
AUTHENTICATION DOMAIN publishes:
  ├─ UserSignedUp → [Profiles, Notifications, Analytics]
  ├─ UserSignedIn → [Analytics, Administration]
  ├─ UserSignedOut → [Analytics]
  ├─ EmailVerified → [Analytics, Notifications]
  ├─ PasswordChanged → [Analytics, Administration]
  ├─ PasswordReset → [Analytics]
  └─ RoleGranted → [Administration, Analytics]

PROFILES DOMAIN publishes:
  ├─ ProfileCreated → [Analytics]
  ├─ ProfileUpdated → [Analytics]
  ├─ PreferencesUpdated → [Notifications]
  ├─ XPSynced → [Analytics, Leaderboard]
  ├─ LevelSynced → [Analytics, Notifications]
  └─ RankChanged → [Notifications, Analytics]

LEARNING DOMAIN publishes:
  ├─ ModuleCreated → [Administration]
  ├─ LessonCreated → [Administration]
  ├─ ExerciseCreated → [Administration]
  ├─ ExerciseAccessed → [Analytics]
  └─ ContentUpdated → [Administration]

PROGRESS DOMAIN publishes:
  ├─ LessonCompleted → [Gamification, Notifications, Analytics]
  ├─ ModuleStarted → [Analytics, Notifications]
  ├─ ModuleCompleted → [Gamification, Notifications, Analytics]
  ├─ ModuleUnlocked → [Notifications, Analytics]
  └─ ProgressUpdated → [Analytics]

GAMIFICATION DOMAIN publishes:
  ├─ XPAwarded → [Profiles, Notifications, Analytics, Leaderboard]
  ├─ LevelIncreased → [Profiles, Notifications, Analytics]
  ├─ AchievementUnlocked → [Profiles, Notifications, Analytics]
  ├─ StreakMilestone → [Notifications, Analytics, Achievements]
  └─ DailyMissionCompleted → [Notifications, Analytics]

AI DOMAIN publishes:
  ├─ SubmissionEvaluated → [Gamification, Progress, Notifications, Analytics]
  ├─ HintGenerated → [Analytics]
  ├─ LearningGapsIdentified → [Notifications]
  └─ CodeChatStarted → [Analytics]

SIMULATION DOMAIN publishes:
  ├─ SimulationStarted → [Analytics]
  ├─ SimulationCompleted → [AI, Analytics]
  └─ SimulationError → [Analytics]

NOTIFICATIONS DOMAIN publishes:
  ├─ NotificationSent → [Analytics]
  └─ NotificationRead → [Analytics]

ANALYTICS DOMAIN publishes:
  └─ EventTracked → [Dashboard, Reports]

ADMINISTRATION DOMAIN publishes:
  ├─ UserDisabled → [Audit]
  ├─ AdminRoleGranted → [Audit]
  └─ AuditedAction → [Audit]
```

---

## DEPENDENCY GRAPH

```
Layer 1 (Foundation - no dependencies):
  └─ Authentication

Layer 2 (Core - depends on Layer 1):
  ├─ Profiles (depends on: Authentication)
  └─ Learning (depends on: Authentication)

Layer 3 (Business - depends on Layer 1-2):
  ├─ Progress (depends on: Authentication, Learning, Profiles)
  └─ Analytics (depends on: ALL - read-only)

Layer 4 (Features - depends on Layer 1-3):
  ├─ Gamification (depends on: Profiles, Progress, Learning, Analytics)
  ├─ AI (depends on: Learning, Progress, Gamification, Profiles)
  ├─ Simulation (depends on: Progress, Learning, Analytics)
  └─ Notifications (depends on: Authentication, Profiles, Analytics)

Layer 5 (System - depends on ALL):
  └─ Administration (depends on: ALL - for operations only)

Forbidden Dependencies:
  ❌ Gamification → Progress (only via events)
  ❌ AI → Gamification (only via requests)
  ❌ Simulation → AI (only via events)
  ❌ Notifications → Business domains (only sends)
  ❌ Analytics → Anything (read-only only)
  ❌ Backward dependencies (higher layer → lower layer)
```

---

## DOMAIN INTERACTION DIAGRAM

```
┌──────────────────────────────────────────────────────────────────┐
│                        ADMINISTRATION                            │
│ (System operations, audit, health, backup)                       │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │ operates
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
┌─────────┐  ┌─────────────┐  │  ┌──────────┐  ┌────────────┐
│ Analytics│  │Notifications│  │  │     AI   │  │ Simulation │
│ (Events, │  │ (In-app,   │  │  │ (Code    │  │ (Wokwi,   │
│ Metrics) │  │  Email)     │  │  │ eval,    │  │ Hardware)  │
│          │  │             │  │  │ Hints)   │  │            │
└─────────┘  └─────────────┘  │  └──────────┘  └────────────┘
     ▲            ▲            │        ▲              ▲
     │            │            │        │              │
     └────────────┴────────────┴────────┴──────────────┘
                  Events from all domains
                  
     ┌────────────────┬──────────────────┬──────────────────┐
     │                │                  │                  │
┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────┐
│Gamification  │  │  Progress    │  │  Learning   │  │Profiles │
│ (XP, levels, │  │  (Module     │  │ (Modules,   │  │(User    │
│  achieve)    │  │   progress,  │  │  exercises) │  │ data)   │
│              │  │  unlocking)  │  │             │  │         │
└──────────────┘  └──────────────┘  └─────────────┘  └─────────┘
     ▲                    ▲                ▲               ▲
     │                    │                │               │
     └────────────────────┴────────────────┴───────────────┘
              Events & Data Flow
              
              ┌──────────────────────────┐
              │   AUTHENTICATION         │
              │  (Sessions, User ID,     │
              │   Roles, Verification)   │
              └──────────────────────────┘
                        ▲
                        │ Validates all requests
                        │
              All domains depend on this
```

---

## RESPONSIBILITY MATRIX

| Operation | Auth | Profiles | Learning | Progress | Gamification | AI | Simulation | Notifications | Analytics | Admin |
|-----------|------|----------|----------|----------|--------------|-----|------------|---------------|-----------|-------|
| User signup | ✅ | Create via event | - | - | - | - | - | Send welcome | Track | - |
| User login | ✅ | - | - | - | - | - | - | - | Track | - |
| User profile | - | ✅ | - | - | - | - | - | - | Track | - |
| Module unlock | - | - | Read | ✅ | Listen | - | - | Notify | Track | - |
| Exercise submit | - | - | Read | Track | Calculate XP | Evaluate | Simulate | Notify | Track | - |
| Award XP | - | Sync | - | - | ✅ | Request | - | - | Track | - |
| Level up | - | Sync | - | - | ✅ | - | - | Celebrate | Track | - |
| Achievement | - | - | - | - | ✅ | Trigger | - | Celebrate | Track | - |
| User disable | Admin API | - | - | - | - | - | - | - | Track | ✅ |
| Content mod | - | - | ✅ | - | - | - | - | - | - | ✅ |

**Legend**: ✅ = Primary responsibility, - = Not involved

---

## CROSS-DOMAIN CONTRACTS

### 1. Data Flow Contracts

#### Student Submission Flow
```
1. Student submits code (UI → Progress)
2. Progress creates submission record
3. Progress emits SubmissionReceived event
4. Simulation domain listens, starts Wokwi simulation
5. Wokwi completes, Simulation emits SimulationCompleted
6. AI domain listens, evaluates code
7. AI emits SubmissionEvaluated event
8. Gamification listens, calculates/awards XP
9. Gamification emits XPAwarded event
10. Profiles listens, syncs XP and recalculates level
11. Profiles emits XPSynced event
12. Notifications listens, sends congratulation
13. Analytics listens to all, tracks event

Result: Student sees score, XP, level-up, notification within 5-10 seconds
```

#### Achievement Unlock Flow
```
1. Gamification detects achievement condition met
2. Gamification emits AchievementUnlocked event
3. Profiles listens, adds achievement to profile
4. Notifications listens, sends celebration notification
5. Analytics listens, tracks achievement
6. All three complete within 2 seconds

Result: Achievement appears on profile, notification sent, tracked
```

### 2. Contract Enforcement

**Each domain MUST**:
1. Define explicit public operations (contracts)
2. Document input/output/errors for each operation
3. Publish events when state changes
4. Listen only to events from domains above in dependency graph
5. Never modify another domain's data
6. Validate all inputs (own business rules only)
7. Return explicit, documented errors
8. Handle failures gracefully (never crash other domains)

**Each domain MUST NOT**:
1. Call domains below in dependency graph (backwards)
2. Modify another domain's data directly
3. Skip validation because "it came from another domain"
4. Assume events will be processed (best-effort)
5. Expose internal implementation details
6. Create circular dependencies

### 3. Error Propagation Contract

```
Domain A calls Domain B:
  ├─ Success: Return result
  ├─ Business Error: Return explicit error type (e.g., LessonLockedError)
  └─ System Error: Return generic error (database down, timeout)

Domain A listens to Domain B event:
  ├─ Event received: Process immediately or queue
  ├─ Error in processing: Log and continue (don't crash)
  └─ Unknown event: Ignore gracefully

Errors NEVER bubble up between domains
Each domain handles its own exceptions
```

### 4. Backward Compatibility Contract

When evolving domains:

1. **Adding new operations**: Always allowed (append, never modify)
2. **Adding new events**: Always allowed (subscribers ignore unknown events)
3. **Modifying operations**: Requires deprecation period (new version alongside old)
4. **Removing operations**: Requires 2-week deprecation notice
5. **Breaking changes**: Only allowed with major version bump + migration guide

---

## IMPLEMENTATION SEQUENCES

### Safe Deployment Order

Since domains have dependencies, deploy in this order:

1. **Phase 1** (Foundation):
   - ✅ Deploy: Authentication
   - ✅ Test: All auth operations

2. **Phase 2** (Core):
   - ✅ Deploy: Learning, Profiles
   - ✅ Test: CRUD operations on modules/exercises and profiles

3. **Phase 3** (Business):
   - ✅ Deploy: Progress
   - ✅ Test: Module unlock, lesson completion

4. **Phase 4** (Features):
   - ✅ Deploy: Gamification, AI, Simulation, Notifications (in any order)
   - ✅ Test: Each independently

5. **Phase 5** (Analytics):
   - ✅ Deploy: Analytics (receives events from all)
   - ✅ Test: Event tracking

6. **Phase 6** (System):
   - ✅ Deploy: Administration
   - ✅ Test: Admin operations

### Rollback Contracts

If a domain fails:

```
Gamification fails:
  → XP not awarded (acceptable, retry later)
  → Progress still tracks completions
  → User can continue learning
  → Admin can manually grant XP

AI fails:
  → Submissions not evaluated
  → User sees "Evaluation pending" (queued)
  → Retry automatically in 1 hour
  → Manual evaluation by instructor fallback

Notifications fails:
  → User doesn't see notification (acceptable)
  → Analytics still logs
  → User experience unaffected
  → Admin can manually resend

Analytics fails:
  → Metrics unavailable (acceptable)
  → All other domains unaffected
  → Restart Analytics anytime
```

Each domain designed to fail independently without cascading.

---

# CONTRACT ENFORCEMENT RULES

## Code Review Checklist

Before merging any domain code, verify:

- [ ] All public operations documented (input, output, errors, permissions)
- [ ] All events published with payload schema
- [ ] No direct database writes to other domains' tables
- [ ] No circular dependencies introduced
- [ ] Error types are explicit (not generic)
- [ ] Validation rules documented (business rules, not technical)
- [ ] Security contract verified (who can call each operation)
- [ ] No console.log (use proper logging)
- [ ] Tests verify contract, not implementation
- [ ] Backward compatibility maintained
- [ ] Documentation includes examples

## Testing Contract

Each domain must have:

1. **Unit Tests**: Public operations in isolation
2. **Integration Tests**: Domain interactions via events
3. **Contract Tests**: Verify contract compliance
4. **Error Tests**: All error cases handled
5. **Security Tests**: Authorization verified

Example test structure:
```typescript
describe('Progress Domain', () => {
  describe('completeLesson', () => {
    it('should complete lesson if module unlocked', async () => {
      // Arrange: Setup pre-conditions
      // Act: Call completeLesson
      // Assert: Verify output and events published
    })
    
    it('should error if module locked', async () => {
      // Should throw LessonLockedError explicitly
    })
  })
})
```

---

# SUMMARY

**10 Business Domains** with clear, enforceable contracts:

1. **Authentication** - Identity & verification
2. **Profiles** - User data & preferences
3. **Learning** - Course structure & content
4. **Progress** - Module & lesson tracking
5. **Gamification** - XP, levels, achievements
6. **AI** - Code evaluation & feedback
7. **Simulation** - Hardware simulation (Wokwi)
8. **Notifications** - User communications
9. **Analytics** - Event tracking & metrics
10. **Administration** - System operations & audit

**Key Principles**:
- ✅ Each domain can be built independently
- ✅ Explicit contracts prevent breaking changes
- ✅ Event-driven architecture enables loose coupling
- ✅ Clear dependency graph guides deployment
- ✅ Failure isolation prevents cascades
- ✅ Backward compatibility enforced

**Result**: A scalable, maintainable, independently-testable system.

