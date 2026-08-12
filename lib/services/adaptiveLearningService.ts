import * as repo from '@/lib/repos/learningProfileRepo';
import * as events from '@/lib/repos/eventRepo';
import * as db from '@/lib/db';
import * as memoryEngine from '@/lib/services/memoryEngineService';
import { studentLearningProfileSchema } from '@/lib/validation/adaptive';

export async function getLearningProfile(userId: string) {
  return repo.getProfileByUserId(userId);
}

export async function upsertLearningProfile(userId: string, payload: unknown) {
  const safePayload = (typeof payload === 'object' && payload !== null) ? (payload as Record<string, any>) : {};
  const parsed = studentLearningProfileSchema.partial().parse(Object.assign({ user_id: userId }, safePayload));
  const profile = await repo.upsertLearningProfile(userId, parsed as any);
  await events.emitEvent(userId, 'LearningProfileUpdated', { userId, changes: parsed });
  return profile;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function refreshAdaptivePreferences(userId: string) {
  const profile = await repo.getProfileByUserId(userId).catch(() => null);
  const projection = await memoryEngine.getDashboardProjection(userId).catch(() => null);
  const submissions = await db.getUserSubmissions(userId).catch(() => []);
  const recent = submissions.slice(0, 20);
  const accepted = recent.filter((submission) => submission.statut === 'approved').length;
  const successRate = recent.length > 0 ? accepted / recent.length : 0.5;
  // avgXp calculation intentionally omitted (not used here)
  const weakConcepts = Array.isArray(projection?.weak_concepts) ? projection?.weak_concepts.map(String).filter(Boolean) : [];
  const strongConcepts = Array.isArray(projection?.strong_concepts) ? projection?.strong_concepts.map(String).filter(Boolean) : [];

  const derivedProjectDifficulty = clamp(
    Math.round((profile?.preferred_project_difficulty ?? 1) * 0.4 + successRate * 4 + (weakConcepts.length > 2 ? 0.5 : 0)),
    1,
    5
  );

  const derivedLearningVelocity = clamp(Math.round(Math.min(10, Math.max(1, recent.length / 2 + successRate * 2))), 1, 10);
  const derivedConfidence = clamp(Math.round(successRate * 100), 0, 100);

  const updatedProfile = await repo.upsertLearningProfile(userId, {
    preferred_project_difficulty: derivedProjectDifficulty,
    learning_velocity: derivedLearningVelocity,
    confidence_score: derivedConfidence,
    weak_concepts: weakConcepts,
    strong_concepts: strongConcepts,
    retry_count: recent.length,
    avg_solving_time_ms: profile?.avg_solving_time_ms ?? 0,
    review_history: profile?.review_history ?? [],
    forgetting_rate: profile?.forgetting_rate ?? 0,
    metadata: profile?.metadata ?? {},
  });

  await events.emitEvent(userId, 'LearningProfileUpdated', {
    userId,
    changes: {
      preferred_project_difficulty: derivedProjectDifficulty,
      learning_velocity: derivedLearningVelocity,
      confidence_score: derivedConfidence,
      weak_concepts: weakConcepts,
      strong_concepts: strongConcepts,
    },
  });

  return updatedProfile;
}
