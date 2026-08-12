import type { EventEnvelope } from '@/lib/events/types';
import { defaultPublisher } from '@/lib/events/publisher';
import { defaultSubscriber } from '@/lib/events/subscriber';
import { makeEvent } from '@/lib/events/utils';
import * as mem from '@/lib/services/memoryEngineService';
import * as db from '@/lib/db';

async function publishKnowledgeUpdated(userId: string, payload: any, causationEvent?: EventEnvelope<any>) {
  const event = makeEvent({
    name: 'KnowledgeUpdated',
    version: 1,
    source: 'memory',
    userId,
    correlationId: causationEvent?.correlationId,
    causationId: causationEvent?.id,
    payload,
  });
  await defaultPublisher.publish(event);
}

async function publishReviewScheduled(userId: string, reviewItems: any[], causationEvent?: EventEnvelope<any>) {
  if (reviewItems.length === 0) return;
  const event = makeEvent({
    name: 'ReviewScheduled',
    version: 1,
    source: 'memory',
    userId,
    correlationId: causationEvent?.correlationId,
    causationId: causationEvent?.id,
    payload: { reviewItems, scheduledAt: new Date().toISOString() },
  });
  await defaultPublisher.publish(event);
}

async function handleExerciseValidated(event: EventEnvelope<any>) {
  const userId = event.userId;
  const payload = event.payload ?? {};
  if (!userId) return;

  const exerciseId = Number(payload.exerciseId ?? 0);
  if (!exerciseId) return;

  const exercise = await db.getExercise(exerciseId).catch(() => null);
  if (!exercise) return;

  const concepts = ((exercise as any).skills_learned || (exercise as any).concepts || []) as string[];
  const reviewItems: any[] = [];
  const results: any[] = [];

  for (const conceptId of concepts) {
    try {
      await mem.upsertConceptState({
        user_id: userId,
        concept_id: conceptId,
        attempts: 1,
        successful_attempts: payload.correct ? 1 : 0,
        last_review: new Date().toISOString(),
      } as any);
      const mastery = await mem.computeMastery(userId, conceptId);
      const forgetting = await mem.updateForgetting(userId, conceptId);
      results.push({ conceptId, mastery, forgetting });
      if ((forgetting.review_urgency ?? 0) >= 60) {
        reviewItems.push({ conceptId, urgency: forgetting.review_urgency });
      }
    } catch (error) {
      console.error('[MemorySubscriber] failed to update concept state', conceptId, error);
    }
  }

  await publishKnowledgeUpdated(userId, {
    exerciseId,
    moduleId: payload.moduleId,
    correct: payload.correct,
    xp: payload.xp,
    concepts: results,
    score: payload.score,
    completedExercises: payload.completedExercises,
  }, event);

  await publishReviewScheduled(userId, reviewItems, event);
}

async function handleProgressUpdated(event: EventEnvelope<any>) {
  const userId = event.userId;
  const payload = event.payload ?? {};
  if (!userId) return;

  await mem.updateLearningDNA(userId, {
    lastProgressAt: new Date().toISOString(),
    progress: payload,
  });

  await publishKnowledgeUpdated(userId, {
    progress: payload,
    updatedAt: new Date().toISOString(),
  }, event);
}

defaultSubscriber.subscribe('ExerciseValidated', handleExerciseValidated);
defaultSubscriber.subscribe('ProgressUpdated', handleProgressUpdated);
