# ARCHITECTURE

## Overview
The backend is organized around a Next.js application with modular services under lib, repositories for persistence, and an event-driven layer for cross-cutting updates.

## Core layers
- Presentation: Next.js app routes and components.
- Application services: AI, correction, pedagogy, recommendation, adaptive learning, and memory services.
- Persistence: Supabase-backed repositories and local in-memory stores.
- Integration: Event bus and domain subscribers.

## Production principles applied
- Keep business logic in services rather than route handlers.
- Use repositories as persistence adapters.
- Prefer deterministic, low-allocation operations in hot paths.
