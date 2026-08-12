# API_SPECIFICATION
## TrainArduino API Specification

**Status**: Design Phase  
**Version**: 1.0  
**Last Updated**: 2026-07-06  

---

## TABLE OF CONTENTS

1. [Introduction](#introduction)
2. [API Conventions](#api-conventions)
3. [Authentication Flow](#authentication-flow)
4. [Endpoint Reference](#endpoint-reference)
   - [Authentication](#authentication)
   - [Profiles](#profiles)
   - [Dashboard](#dashboard)
   - [Learning](#learning)
   - [Modules](#modules)
   - [Lessons](#lessons)
   - [Exercises](#exercises)
   - [Submissions](#submissions)
   - [Progress](#progress)
   - [Gamification](#gamification)
   - [Achievements](#achievements)
   - [Leaderboard](#leaderboard)
   - [Notifications](#notifications)
   - [Simulation](#simulation)
   - [AI](#ai)
   - [Administration](#administration)
   - [Analytics](#analytics)
5. [Cross-Cutting Standards](#cross-cutting-standards)
   - [Session Lifecycle](#session-lifecycle)
   - [Permission Matrix](#permission-matrix)
   - [Error Format](#error-format)
   - [Pagination Standard](#pagination-standard)
   - [Filtering Standard](#filtering-standard)
   - [Sorting Standard](#sorting-standard)
   - [Versioning Strategy](#versioning-strategy)
   - [File Upload Strategy](#file-upload-strategy)
   - [AI Streaming Strategy](#ai-streaming-strategy)
   - [WebSocket Events (Future)](#websocket-events-future)
   - [Webhook Strategy (Future)](#webhook-strategy-future)
6. [API Architecture](#api-architecture)
   - [Endpoint Tree](#endpoint-tree)
   - [API Dependency Graph](#api-dependency-graph)
   - [Sequence Diagrams](#sequence-diagrams)
   - [Request Flow Diagrams](#request-flow-diagrams)
   - [JSON Examples](#json-examples)
   - [Naming Conventions](#naming-conventions)
   - [REST Best Practices](#rest-best-practices)

---

## INTRODUCTION

This document is the official TrainArduino API contract.

It defines every endpoint, request, response, error, policy, and cross-cutting standard for the platform.

It is authoritative and must be followed by all future API, service, and integration work.

This API is designed for a Next.js App Router backend, but the specification is implementation-agnostic.

---

## API CONVENTIONS

- Base path: `/api`
- Content-Type: `application/json`
- All responses use JSON objects
- All non-GET requests require CSRF protection if exposed to browsers
- Authentication uses secure HTTP-only cookies plus optional bearer tokens for third-party integrations
- Time values are ISO 8601 UTC strings
- IDs are UUIDv4 strings unless otherwise specified
- Use plural resource names for collections
- Endpoints under `/api/v1` for current version
- Future versions use `/api/v2`, `/api/v3`, etc. (see Versioning Strategy)

### Request and response conventions

- Successful GET returns `200 OK`
- Successful POST returns `201 Created` for resource creation, `200 OK` for non-creation actions
- Successful PATCH returns `200 OK`
- Successful DELETE returns `204 No Content`
- Validation or permission failures return `4xx` with structured error payload
- Server failures return `5xx`

---

## AUTHENTICATION FLOW

TrainArduino authentication uses a combination of JWT session cookies and domain-level authorization.

### Flow overview

1. User sends credentials to `/api/v1/auth/signin`
2. Server validates credentials and email verification
3. Server returns success and sets a secure HTTP-only cookie (`session_token`)
4. Client uses cookie for subsequent requests
5. Protected endpoints validate session and enforce roles
6. Signout clears the session cookie and invalidates the token

### Authentication types

- **Session cookie**: Default for browser clients
- **Bearer token**: Reserved for future non-browser integrations and admin API access

---

## ENDPOINT REFERENCE

### AUTHENTICATION

#### Sign up

- Method: `POST`
- URL: `/api/v1/auth/signup`
- Purpose: Create a new user account and start the onboarding flow
- Authentication required: No
- Roles allowed: Guest

Request body:
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd!",
  "username": "arduino_student"
}
```

Response:
- `201 Created`
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "isVerified": false,
  "role": "student",
  "createdAt": "2026-07-06T12:00:00Z"
}
```

Error responses:
- `400 Bad Request` - `ValidationError`
- `409 Conflict` - `EmailAlreadyExistsError`, `UsernameAlreadyTakenError`
- `429 Too Many Requests` - `SignupRateLimitedError`

Validation rules:
- `email` must be valid format
- `password` minimum 8 chars, uppercase, lowercase, number, special
- `username` 3-20 chars, alphanumeric or underscore

Side effects:
- Creates a new user record
- Creates profile and default settings
- Sends verification email
- Emits: `UserSignedUp`
- Rate limit: 5 requests per IP per hour
- Cache policy: No cache

---

#### Sign in

- Method: `POST`
- URL: `/api/v1/auth/signin`
- Purpose: Authenticate a user and establish session
- Authentication required: No
- Roles allowed: Guest

Request body:
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd!"
}
```

Response:
- `200 OK`
```json
{
  "userId": "uuid",
  "role": "student",
  "expiresAt": "2026-07-06T14:00:00Z"
}
```

Error responses:
- `400 Bad Request` - `ValidationError`
- `401 Unauthorized` - `InvalidCredentialsError`, `EmailNotVerifiedError`
- `423 Locked` - `AccountLockedError`
- `429 Too Many Requests` - `SigninRateLimitedError`

Validation rules:
- `email` valid format
- `password` not empty

Side effects:
- Creates session cookie
- Updates `lastSignedInAt`
- Emits: `UserSignedIn`
- Rate limit: 10 failed attempts per IP per hour
- Cache policy: No cache

---

#### Sign out

- Method: `POST`
- URL: `/api/v1/auth/signout`
- Purpose: End the user session
- Authentication required: Yes
- Roles allowed: Student, Moderator, Admin

Request body: none

Response:
- `204 No Content`

Error responses:
- `401 Unauthorized` - if no valid session

Validation rules:
- None

Side effects:
- Invalidates session cookie
- Emits: `UserSignedOut`
- Cache policy: No cache

---

#### Send password reset email

- Method: `POST`
- URL: `/api/v1/auth/password-reset/request`
- Purpose: Request a password reset email
- Authentication required: No
- Roles allowed: Guest

Request body:
```json
{ "email": "user@example.com" }
```

Response:
- `200 OK`
```json
{ "status": "ok" }
```

Error responses:
- `400 Bad Request` - `ValidationError`
- `429 Too Many Requests` - `PasswordResetRateLimitedError`

Validation rules:
- `email` valid format

Side effects:
- Creates reset token
- Sends reset email
- Emits: `PasswordReset`
- Rate limit: 5 requests per email per hour
- Cache policy: No cache

---

#### Reset password

- Method: `POST`
- URL: `/api/v1/auth/password-reset/confirm`
- Purpose: Reset password using a token
- Authentication required: No
- Roles allowed: Guest

Request body:
```json
{
  "token": "reset-token",
  "newPassword": "NewP@ssw0rd!"
}
```

Response:
- `200 OK`
```json
{ "status": "ok" }
```

Error responses:
- `400 Bad Request` - `ValidationError`
- `401 Unauthorized` - `InvalidTokenError`, `TokenExpiredError`
- `409 Conflict` - `PasswordSameAsPreviousError`

Validation rules:
- `newPassword` complexity same as signup
- `token` non-empty

Side effects:
- Updates user password
- Invalidates existing sessions
- Emits: `PasswordChanged`
- Cache policy: No cache

---

#### Verify email

- Method: `POST`
- URL: `/api/v1/auth/verify`
- Purpose: Confirm email address
- Authentication required: No
- Roles allowed: Guest

Request body:
```json
{ "token": "verification-token" }
```

Response:
- `200 OK`
```json
{ "status": "verified" }
```

Error responses:
- `400 Bad Request` - `ValidationError`
- `401 Unauthorized` - `InvalidTokenError`, `TokenExpiredError`
- `409 Conflict` - `AlreadyVerifiedError`

Validation rules:
- `token` non-empty

Side effects:
- Sets user email verified
- Emits: `EmailVerified`
- Cache policy: No cache

---

#### Refresh session (optional)

- Method: `POST`
- URL: `/api/v1/auth/refresh`
- Purpose: Refresh session token and expiry
- Authentication required: Yes
- Roles allowed: Student, Moderator, Admin

Request body: none

Response:
- `200 OK`
```json
{
  "expiresAt": "2026-07-06T16:00:00Z"
}
```

Error responses:
- `401 Unauthorized` - invalid session

Validation rules:
- None

Side effects:
- Extends session expiry
- Cache policy: No cache

---

### PROFILES

#### Get current profile

- Method: `GET`
- URL: `/api/v1/profiles/me`
- Purpose: Retrieve authenticated user's profile and settings
- Authentication required: Yes
- Roles allowed: Student, Moderator, Admin

Response:
- `200 OK`
```json
{
  "userId": "uuid",
  "username": "arduino_student",
  "displayName": "Arduino Student",
  "avatarUrl": "https://...",
  "bio": "I love circuits.",
  "level": 3,
  "xpTotal": 560,
  "rank": 27,
  "preferences": {
    "language": "en",
    "theme": "dark",
    "emailNotifications": true,
    "pushNotifications": false,
    "dailyDigest": false,
    "quietHours": { "startTime": "22:00", "endTime": "07:00", "timezone": "Europe/Paris" }
  },
  "createdAt": "2026-07-06T12:00:00Z"
}
```

Error responses:
- `401 Unauthorized`
- `404 Not Found` - profile not found

Validation rules:
- None

Side effects:
- None
- Cache policy: `Cache-Control: private, max-age=30`

---

#### Update current profile

- Method: `PATCH`
- URL: `/api/v1/profiles/me`
- Purpose: Update authenticated user's profile fields
- Authentication required: Yes
- Roles allowed: Student, Moderator, Admin

Request body:
```json
{
  "displayName": "Arduino Wiz",
  "avatarUrl": "https://...",
  "bio": "I build robots",
  "preferences": {
    "language": "fr",
    "theme": "light",
    "emailNotifications": true,
    "pushNotifications": true,
    "dailyDigest": true,
    "quietHours": { "startTime": "21:00", "endTime": "07:00", "timezone": "Europe/Paris" }
  }
}
```

Response:
- `200 OK`
```json
{ "status": "updated" }
```

Error responses:
- `400 Bad Request` - `ValidationError`
- `401 Unauthorized`
- `403 Forbidden` - invalid user access
- `404 Not Found`

Validation rules:
- `displayName` 1-100 chars
- `avatarUrl` valid URL if present
- `bio` 0-500 chars
- preferences values within enum
- quiet hours valid times and timezone

Side effects:
- Updates profile and settings
- Emits: `ProfileUpdated`, `PreferencesUpdated`
- Cache policy: No cache

---

#### Get public profile by username

- Method: `GET`
- URL: `/api/v1/profiles/{username}`
- Purpose: Retrieve public profile data
- Authentication required: No
- Roles allowed: Public

Path parameters:
- `username` required

Response:
- `200 OK`
```json
{
  "username": "arduino_student",
  "displayName": "Arduino Student",
  "avatarUrl": "https://...",
  "bio": "I love circuits.",
  "level": 3,
  "rank": 27,
  "joinedAt": "2026-07-06T12:00:00Z"
}
```

Error responses:
- `404 Not Found` - profile not found

Validation rules:
- `username` 3-20 chars, alphanumeric or underscore

Side effects:
- None
- Cache policy: `Cache-Control: public, max-age=120`

---

#### Get leaderboard around current user

- Method: `GET`
- URL: `/api/v1/profiles/leaderboard`
- Purpose: Retrieve leaderboard entries
- Authentication required: No
- Roles allowed: Public

Query parameters:
- `page` integer, default 1
- `limit` integer, default 20, max 100
- `aroundMe` boolean, optional

Response:
- `200 OK`
```json
{
  "page": 1,
  "limit": 20,
  "total": 500,
  "entries": [
    { "rank": 1, "username": "top_student", "level": 10, "xpTotal": 12500, "currentStreak": 42 },
    { "rank": 2, "username": "coder_42", "level": 10, "xpTotal": 12300, "currentStreak": 37 }
  ]
}
```

Error responses:
- `400 Bad Request` - invalid pagination

Validation rules:
- `page` >= 1
- `limit` 1-100

Side effects:
- None
- Cache policy: `Cache-Control: public, max-age=60`

---

### DASHBOARD

#### Get dashboard data

- Method: `GET`
- URL: `/api/v1/dashboard`
- Purpose: Retrieve user-specific home dashboard data
- Authentication required: Yes
- Roles allowed: Student, Moderator, Admin

Response:
- `200 OK`
```json
{
  "userId": "uuid",
  "currentLevel": 4,
  "totalXP": 860,
  "currentStreak": 7,
  "rank": 32,
  "currentModule": {
    "moduleId": "uuid",
    "title": "Digital Outputs",
    "progress": 60
  },
  "recentAchievements": [
    { "achievementId": "uuid", "name": "First Arduino Program", "unlockedAt": "2026-07-05T12:00:00Z" }
  ],
  "activeMissions": [
    { "missionId": "uuid", "title": "Submit 1 Exercise Today", "xpReward": 30, "expiresAt": "2026-07-07T00:00:00Z", "status": "Active" }
  ],
  "unreadNotifications": 3,
  "learningStats": {
    "modulesCompleted": 2,
    "exercisesCompleted": 8,
    "completionRate": 40
  }
}
```

Error responses:
- `401 Unauthorized`

Validation rules:
- None

Side effects:
- None
- Cache policy: `Cache-Control: private, max-age=30`

---

### LEARNING

#### Get all courses

- Method: `GET`
- URL: `/api/v1/learning/courses`
- Purpose: List available courses and summary metadata
- Authentication required: No
- Roles allowed: Public

Query parameters:
- `page` integer, default 1
- `limit` integer, default 20, max 100
- `language` string optional
- `difficulty` string optional
- `status` string optional

Response:
- `200 OK`
```json
{
  "page": 1,
  "limit": 20,
  "total": 3,
  "courses": [
    { "courseId": "uuid", "title": "Arduino Basics", "difficulty": "Beginner", "description": "Start with LED and sensors.", "estimatedHours": 10, "status": "Published" }
  ]
}
```

Error responses:
- `400 Bad Request`

Validation rules:
- `page` >= 1
- `limit` 1-100
- `difficulty` in allowed values
- `status` in allowed values

Side effects:
- None
- Cache policy: `Cache-Control: public, max-age=60`

---

#### Get course details

- Method: `GET`
- URL: `/api/v1/learning/courses/{courseId}`
- Purpose: Retrieve a course with modules summary
- Authentication required: No
- Roles allowed: Public

Path parameters:
- `courseId` required

Response:
- `200 OK`
```json
{
  "courseId": "uuid",
  "title": "Arduino Basics",
  "description": "Start with LED and sensors.",
  "difficulty": "Beginner",
  "estimatedHours": 10,
  "status": "Published",
  "modules": [
    { "moduleId": "uuid", "title": "Digital Outputs", "order": 1, "difficulty": "Beginner", "lessonCount": 3, "exerciseCount": 2 }
  ]
}
```

Error responses:
- `404 Not Found` - invalid courseId

Validation rules:
- `courseId` must be valid UUID

Side effects:
- None
- Cache policy: `Cache-Control: public, max-age=120`

---

### MODULES

#### Get all modules

- Method: `GET`
- URL: `/api/v1/modules`
- Purpose: List modules, optionally filtered by course and difficulty
- Authentication required: No
- Roles allowed: Public

Query parameters:
- `courseId` string optional
- `difficulty` string optional
- `page` integer default 1
- `limit` integer default 20

Response:
- `200 OK`
```json
{
  "page": 1,
  "limit": 20,
  "total": 12,
  "modules": [
    { "moduleId": "uuid", "courseId": "uuid", "title": "Digital Outputs", "description": "Control LEDs and buzzers.", "order": 1, "difficulty": "Beginner" }
  ]
}
```

Error responses:
- `400 Bad Request`

Validation rules:
- `page` >= 1
- `limit` 1-100

Side effects:
- None
- Cache policy: `Cache-Control: public, max-age=60`

---

#### Get module details

- Method: `GET`
- URL: `/api/v1/modules/{moduleId}`
- Purpose: Retrieve module details, prerequisites, lessons, and exercises summary
- Authentication required: No
- Roles allowed: Public

Path parameters:
- `moduleId`

Response:
- `200 OK`
```json
{
  "moduleId": "uuid",
  "courseId": "uuid",
  "title": "Digital Outputs",
  "description": "Control LEDs and buzzers.",
  "order": 1,
  "difficulty": "Beginner",
  "estimatedHours": 3,
  "prerequisiteModuleIds": [],
  "lessons": [
    { "lessonId": "uuid", "title": "LED Basics", "order": 1 }
  ],
  "exercises": [
    { "exerciseId": "uuid", "title": "Blink LED", "difficulty": "Easy", "xpReward": 20 }
  ]
}
```

Error responses:
- `404 Not Found`

Validation rules:
- `moduleId` valid UUID

Side effects:
- None
- Cache policy: `Cache-Control: public, max-age=120`

---

#### Create module

- Method: `POST`
- URL: `/api/v1/modules`
- Purpose: Create a new module
- Authentication required: Yes
- Roles allowed: Admin

Request body:
```json
{
  "courseId": "uuid",
  "title": "Analog Inputs",
  "description": "Read sensors and buttons.",
  "order": 2,
  "difficulty": "Beginner",
  "estimatedHours": 4,
  "prerequisiteModuleIds": ["uuid"]
}
```

Response:
- `201 Created`
```json
{ "moduleId": "uuid" }
```

Error responses:
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found` - invalid courseId or prerequisite

Validation rules:
- `title` 3-200 chars
- `order` positive integer unique in course
- `difficulty` enum
- prerequisites exist in same course

Side effects:
- Creates module
- Emits: `ModuleCreated`
- Cache policy: No cache

---

#### Update module

- Method: `PATCH`
- URL: `/api/v1/modules/{moduleId}`
- Purpose: Update module metadata
- Authentication required: Yes
- Roles allowed: Admin

Request body:
```json
{
  "title": "Analog Inputs and Sensors",
  "description": "Read sensors and buttons.",
  "estimatedHours": 5
}
```

Response:
- `200 OK`
```json
{ "status": "updated" }
```

Error responses:
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict` - if module has student progress

Validation rules:
- Same as create

Side effects:
- Updates module
- Emits: `ContentUpdated`
- Cache policy: No cache

---

### LESSONS

#### Get lessons by module

- Method: `GET`
- URL: `/api/v1/modules/{moduleId}/lessons`
- Purpose: List lessons for a module
- Authentication required: No
- Roles allowed: Public

Response:
- `200 OK`
```json
{
  "lessons": [
    { "lessonId": "uuid", "title": "LED Basics", "order": 1, "estimatedMinutes": 15 }
  ]
}
```

Error responses:
- `404 Not Found`

Validation rules:
- `moduleId` valid UUID

Side effects:
- None
- Cache policy: `Cache-Control: public, max-age=60`

---

#### Get lesson details

- Method: `GET`
- URL: `/api/v1/lessons/{lessonId}`
- Purpose: Retrieve lesson content and metadata
- Authentication required: No
- Roles allowed: Public

Response:
- `200 OK`
```json
{
  "lessonId": "uuid",
  "moduleId": "uuid",
  "title": "LED Basics",
  "content": "# LED Basics...",
  "videoUrl": "https://...",
  "order": 1,
  "estimatedMinutes": 15,
  "tags": ["led","basic"],
  "keywords": ["led","output"]
}
```

Error responses:
- `404 Not Found`

Validation rules:
- `lessonId` valid UUID

Side effects:
- None
- Cache policy: `Cache-Control: public, max-age=120`

---

#### Create lesson

- Method: `POST`
- URL: `/api/v1/lessons`
- Purpose: Create a new lesson
- Authentication required: Yes
- Roles allowed: Admin

Request body:
```json
{
  "moduleId": "uuid",
  "title": "LED Basics",
  "content": "# LED Basics...",
  "videoUrl": "https://...",
  "order": 1,
  "estimatedMinutes": 15,
  "tags": ["led","output"],
  "keywords": ["arduino","led"]
}
```

Response:
- `201 Created`
```json
{ "lessonId": "uuid" }
```

Error responses:
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

Validation rules:
- `title` 3-200 chars
- `content` non-empty
- `order` positive integer unique in module
- `estimatedMinutes` 1-600

Side effects:
- Creates lesson
- Emits: `LessonCreated`
- Cache policy: No cache

---

#### Update lesson

- Method: `PATCH`
- URL: `/api/v1/lessons/{lessonId}`
- Purpose: Update lesson metadata or content
- Authentication required: Yes
- Roles allowed: Admin

Request body:
```json
{
  "title": "LED Control",
  "content": "# LED Control...",
  "videoUrl": "https://...",
  "estimatedMinutes": 20
}
```

Response:
- `200 OK`

Error responses:
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict` - if lesson has dependent progress

Validation rules:
- As create

Side effects:
- Updates lesson
- Emits: `ContentUpdated`
- Cache policy: No cache

---

### EXERCISES

#### Get exercises by module

- Method: `GET`
- URL: `/api/v1/modules/{moduleId}/exercises`
- Purpose: List exercises in a module
- Authentication required: No
- Roles allowed: Public

Response:
- `200 OK`
```json
{
  "exercises": [
    { "exerciseId": "uuid", "title": "Blink LED", "difficulty": "Easy", "xpReward": 20, "order": 1 }
  ]
}
```

Error responses:
- `404 Not Found`

Validation rules:
- `moduleId` valid UUID

Side effects:
- None
- Cache policy: `Cache-Control: public, max-age=60`

---

#### Get exercise details

- Method: `GET`
- URL: `/api/v1/exercises/{exerciseId}`
- Purpose: Retrieve exercise problem statement and metadata
- Authentication required: Yes for hidden fields? No for public metadata
- Roles allowed: Public for metadata

Response:
- `200 OK`
```json
{
  "exerciseId": "uuid",
  "moduleId": "uuid",
  "lessonId": "uuid",
  "title": "Blink LED",
  "description": "Write a program that blinks an LED every second.",
  "difficulty": "Easy",
  "xpReward": 20,
  "estimatedMinutes": 20,
  "wokwiProjectUrl": "https://wokwi.com/projects/...",