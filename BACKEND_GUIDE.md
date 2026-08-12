# BACKEND GUIDE

## Running locally
- Install dependencies with npm install.
- Start the app with npm run dev.
- Validate with npm run lint, npm run typecheck, npm run test -- --run, and npm run build.

## Main backend areas
- lib/ai: AI provider orchestration.
- lib/correction: Arduino-specific correction engine.
- lib/events: Event bus, registry, and subscribers.
- lib/services: recommendation, adaptive learning, mastery, memory, and pedagogical services.
- lib/repos: persistence adapters for Supabase and in-memory data.
