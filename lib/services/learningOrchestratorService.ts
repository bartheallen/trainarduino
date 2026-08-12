import * as db from '@/lib/db';
import * as dashboardRepo from '@/lib/repos/dashboardRepo';
import * as recommendationRepo from '@/lib/repos/recommendationRepo';
import { defaultPublisher, makeEvent } from '@/lib/events';
import type { LearningSession, SessionOptions, ProgressSnapshot, Explanation } from '@/lib/orchestrator/types';

const sessionStore: Map<string, LearningSession> = new Map();

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

export async function startSession(userId: string, options?: SessionOptions) {
  const id = generateId();
  const now = new Date().toISOString();
  const session: LearningSession = {
    id,
    userId,
    startedAt: now,
    lastActivityAt: now,
    goal: options?.goal,
    timeAvailableMinutes: options?.timeAvailableMinutes ?? 30,
    fatigueEstimate: 10,
    context: {},
  };
  sessionStore.set(id, session);
  // Preload projection (read-only from projection table)
  await dashboardRepo.getDashboardProjection(userId).catch(() => null);

  const lessonStartedEvent = makeEvent({
    name: 'LessonStarted',
    version: 1,
    source: 'learning',
    userId,
    payload: { sessionId: id, goal: options?.goal ?? null, startedAt: now },
  });
  await defaultPublisher.publish(lessonStartedEvent);

  if (options?.goal === 'project') {
    const projectStartedEvent = makeEvent({
      name: 'ProjectStarted',
      version: 1,
      source: 'learning',
      userId,
      correlationId: lessonStartedEvent.correlationId,
      causationId: lessonStartedEvent.id,
      payload: { sessionId: id, goal: options.goal, startedAt: now },
    });
    await defaultPublisher.publish(projectStartedEvent);
  }

  return session;
}

export function getSession(sessionId: string) {
  return sessionStore.get(sessionId) || null;
}

export async function generateRecommendationsForSession(sessionId: string) {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');
  // Use projections and persisted recommendations to compute session recommendations
  const proj = await dashboardRepo.getDashboardProjection(session.userId).catch(() => null);
  const weakConcepts: string[] = (proj?.weak_skills || []) as string[];
  const recs = await recommendationRepo.listRecommendationsForUser(session.userId).catch(() => []);
  const fused = recs.map((r: any) => ({
    candidate: r,
    score: r.score ?? 0,
    matchCount: ((r.payload?.concepts || []) as string[]).filter((c: string) => weakConcepts.includes(c)).length,
  }));
  fused.sort((a: any, b: any) => (b.matchCount || 0) - (a.matchCount || 0) || (b.score || 0) - (a.score || 0));
  return fused;
}

export async function handleExerciseResult(sessionId: string, exerciseResult: { exerciseId: number; correct: boolean; timeMs?: number; xp?: number; quality?: number }) {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');
  session.lastActivityAt = new Date().toISOString();

  const exerciseStartedEvent = makeEvent({
    name: 'ExerciseStarted',
    version: 1,
    source: 'learning',
    userId: session.userId,
    payload: {
      sessionId,
      exerciseId: exerciseResult.exerciseId,
      startedAt: new Date().toISOString(),
      goal: session.goal,
    },
  });
  await defaultPublisher.publish(exerciseStartedEvent);

  const exerciseSubmittedEvent = makeEvent({
    name: 'ExerciseSubmitted',
    version: 1,
    source: 'learning',
    userId: session.userId,
    correlationId: exerciseStartedEvent.correlationId,
    causationId: exerciseStartedEvent.id,
    payload: {
      sessionId,
      exerciseId: exerciseResult.exerciseId,
      correct: exerciseResult.correct,
      xp: exerciseResult.xp ?? 0,
      timeMs: exerciseResult.timeMs,
      quality: exerciseResult.quality,
      goal: session.goal,
    },
  });
  await defaultPublisher.publish(exerciseSubmittedEvent);

  return { ok: true };
}

export async function getProgressSnapshot(userId: string): Promise<ProgressSnapshot> {
  const proj = await dashboardRepo.getDashboardProjection(userId).catch(() => null);
  const profile = await db.getUserProfile(userId);
  const snapshot: ProgressSnapshot = {
    userId,
    generatedAt: new Date().toISOString(),
    masteryPercent: 0,
    knowledgeHealth: 0,
    xpTotal: profile.xp_total || 0,
    level: profile.niveau_actuel || 1,
    weakConcepts: (proj?.weak_skills || []) as string[],
    strongConcepts: [],
    reviewQueue: (proj?.knowledge_to_review || []).map((r: any) => ({ conceptId: r.concept_id || r.conceptId || null, urgency: r.urgency || 0 })).filter((i) => i.conceptId),
    currentMission: null,
    currentLesson: null,
    currentProject: null,
    learningDNA: {},
  };
  return snapshot;
}

export function explainDecision(kind: string, context: any): Explanation {
  // Very small explainability engine: craft human message from context
  if (kind === 'mission_selection') {
    const reasons = context.reasons || [];
    const message = `Recommended because: ${reasons.map((r: any) => r.reason || r.key).join(', ')}`;
    return { kind, message, details: context };
  }
  return { kind, message: 'No explanation available', details: context };
}

export async function endSession(sessionId: string) {
  const session = getSession(sessionId);
  if (!session) return null;

  const completedAt = new Date().toISOString();
  const lessonCompletedEvent = makeEvent({
    name: 'LessonCompleted',
    version: 1,
    source: 'learning',
    userId: session.userId,
    payload: {
      sessionId,
      completedAt,
      goal: session.goal,
    },
  });
  await defaultPublisher.publish(lessonCompletedEvent);

  if (session.goal === 'project') {
    const projectCompletedEvent = makeEvent({
      name: 'ProjectCompleted',
      version: 1,
      source: 'learning',
      userId: session.userId,
      correlationId: lessonCompletedEvent.correlationId,
      causationId: lessonCompletedEvent.id,
      payload: {
        sessionId,
        completedAt,
      },
    });
    await defaultPublisher.publish(projectCompletedEvent);
  }

  sessionStore.delete(sessionId);
  return { endedAt: completedAt, sessionId };
}
