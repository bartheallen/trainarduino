# Authenticated E2E

This test uses the existing Supabase SSR/Auth architecture. It never creates users and never uses a service-role key.

Provide a pre-created, confirmed Supabase test account through local environment variables:

```powershell
$env:E2E_TEST_EMAIL = 'controlled-test-user@example.test'
$env:E2E_TEST_PASSWORD = 'local-only-password'
$env:E2E_BASE_URL = 'http://localhost:3000'
```

Start the production server in another terminal, then run:

```powershell
npm run test:e2e
```

The test uses the anon key, authenticates with `signInWithPassword`, sends the resulting SSR cookies to the application, verifies module 11, approved/rejected submissions, persistence, idempotence, progression, and the unauthenticated 401 path. It does not delete the controlled account or shared curriculum data.