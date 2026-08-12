# Memory Engine Implementation Report

Status: Initial scaffolding implemented (types, validation, repos, services, server actions, DB migrations).

## Architecture
- Repository layer: `lib/repos/*` (conceptRepo, conceptStateRepo, masteryRepo, learningDnaRepo, memoryEventsRepo, dashboardProjectionRepo)
- Service layer: `lib/services/memoryEngineService.ts` (core orchestration and algorithms)
- Validation: `lib/validation/memory.ts` (Zod schemas)
- Types: `lib/memory/types.ts`
- Server Actions: `lib/memoryServerActions.ts`
- DB: `database/migrations.sql` additions for concepts, concept_states, mastery history, learning_dna, memory_events, memory_dashboard_projections

## New Files
- lib/memory/types.ts
- lib/validation/memory.ts
- lib/repos/conceptRepo.ts
- lib/repos/conceptStateRepo.ts
- lib/repos/masteryRepo.ts
- lib/repos/learningDnaRepo.ts
- lib/repos/memoryEventsRepo.ts
- lib/repos/dashboardProjectionRepo.ts
- lib/services/memoryEngineService.ts
- lib/memoryServerActions.ts
- MEMORY_ENGINE_IMPLEMENTATION_REPORT.md

## Migrations
See `database/migrations.sql` appended blocks: concepts, concept_dependencies, concept associations, concept_states, concept_mastery_history, learning_dna, memory_events, memory_dashboard_projections.

## Events
- ConceptMastered
- ConceptForgotten
- ReviewScheduled
- ReviewCompleted
- KnowledgeHealthChanged
- MemoryUpdated
- DependencyUnlocked

## Services
- `registerConcept(payload)` — idempotent concept registration
- `upsertConceptState(state)` — update per-user concept state and record mastery history
- `computeMastery(userId, conceptId)` — scaffolding algorithm to compute mastery score
- `updateForgetting(userId, conceptId)` — apply decay to retention score
- `updateLearningDNA(userId, traits)` — upsert user's inferred traits
- `getDashboardProjection(userId)` — returns or builds a fast projection

## Tests recommended
- Unit tests for each repo with Supabase mocking
- Unit tests for `computeMastery` covering varied historical patterns
- Integration tests for upsertConceptState -> mastery history -> events
- End-to-end test: user completes exercises and memory updates reflect on projection

## Next steps
1. Implement robust mastery algorithm (time, attempts, quality, spacing)
2. Implement forgetting curve prediction (Ebbinghaus-based modeling)
3. Build Dependency Engine enforcement in missions & unlocking paths
4. Hook Recommendation Engine to ask Memory Engine for "what to learn now"
5. Add daily background job to decay retention and schedule reviews
6. Add UI components for Memory Dashboard and Review flow
