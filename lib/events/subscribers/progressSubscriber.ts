import type { EventEnvelope } from '@/lib/events/types';
import { defaultPublisher } from '@/lib/events/publisher';
import { defaultSubscriber } from '@/lib/events/subscriber';
import { makeEvent } from '@/lib/events/utils';
import * as db from '@/lib/db';
import { evaluatePracticalModuleCompletion } from '@/lib/services/practicalModuleCompletion';

async function triggerStreakForSuccessfulActivity(userId: string, activityAt?: string) {
  if (!userId) return;

  const timestamp = activityAt || new Date().toISOString();
  await db.updateUserStreak(userId, timestamp).catch((err) => {
    console.error('[ProgressSubscriber] updateUserStreak failed', err);
  });
}

async function publishProgressUpdated(userId: string, payload: any, causationEvent?: EventEnvelope<any>) {
  const event = makeEvent({
    name: 'ProgressUpdated',
    version: 1,
    source: 'progress',
    userId,
    correlationId: causationEvent?.correlationId,
    causationId: causationEvent?.id,
    payload,
  });
  await defaultPublisher.publish(event);
}

async function publishModuleCompleted(userId: string, moduleId: number, payload: any, causationEvent?: EventEnvelope<any>) {
  const event = makeEvent({
    name: 'ModuleCompleted',
    version: 1,
    source: 'progress',
    userId,
    correlationId: causationEvent?.correlationId,
    causationId: causationEvent?.id,
    payload: { moduleId, ...payload },
  });
  await defaultPublisher.publish(event);
}

async function publishModuleUnlocked(userId: string, moduleId: number, causationEvent?: EventEnvelope<any>) {
  const event = makeEvent({
    name: 'ModuleUnlocked',
    version: 1,
    source: 'progress',
    userId,
    correlationId: causationEvent?.correlationId,
    causationId: causationEvent?.id,
    payload: { moduleId, unlockedAt: new Date().toISOString() },
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

  const moduleId = exercise.module_id;
  const previousProgress = await db.getModuleProgress(userId, moduleId).catch(() => null);
  const lessonMetrics = await db.getModuleLessonProgressMetrics(userId, moduleId).catch(() => ({ totalLessons: 0, completedLessons: 0, completionPercent: 0, allLessonsCompleted: false } as any));
  const progressMetrics = await db.getModuleProgressMetrics(userId, moduleId).catch(() => ({ totalItems: 0, completedItems: 0, completedExercises: 0, completedLessons: 0, totalLessons: 0, totalExercises: 0 } as any));
  const practicalTestCompleted = payload.type === 'practical';
  const practicalTestPassed = payload.type === 'practical' ? payload.passed === true : false;
  const moduleRequiresPractical = await db.moduleHasPracticalTest(moduleId).catch(() => false);

  const status = moduleRequiresPractical
    ? evaluatePracticalModuleCompletion({
        allLessonsCompleted: lessonMetrics.allLessonsCompleted,
        practicalTestCompleted,
        practicalTestPassed,
      }).status
    : lessonMetrics.allLessonsCompleted
    ? 'completed'
    : 'in_progress';

  // Debug: expose completion inputs for troubleshooting unlock issues
  try {
    console.log('[debug-completion]', {
      allLessonsCompleted: lessonMetrics.allLessonsCompleted,
      practicalTestCompleted,
      practicalTestPassed,
      moduleId,
      userId,
    });
  } catch (e) {
    // ignore logging failures
  }

  const score = status === 'completed' ? 100 : lessonMetrics.completionPercent;

  await db.updateModuleProgress(userId, moduleId, status, score, progressMetrics.completedExercises);
  await db.updateCurrentModule(userId, moduleId);

  await publishProgressUpdated(userId, {
    exerciseId,
    moduleId,
    completedExercises: progressMetrics.completedExercises,
    totalExercises: progressMetrics.totalExercises,
    completedLessons: lessonMetrics.completedLessons,
    score,
    status,
    lessonCompleted: false,
    projectCompleted: false,
    practicalSuccess: practicalTestPassed,
    practicalTestCompleted,
    practicalTestPassed,
    xp: payload.xp ?? 0,
  }, event);

  const successPayload = payload.passed === true || payload.status === 'approved';
  if (successPayload) {
    await triggerStreakForSuccessfulActivity(userId, payload.completedAt || payload.awardedAt || event.timestamp);
  }

  if (status === 'completed' && previousProgress?.statut !== 'completed') {
    await publishModuleCompleted(userId, moduleId, { score, completedExercises: progressMetrics.completedExercises, completedLessons: lessonMetrics.completedLessons, practicalTestPassed }, event);
    const nextModule = await db.unlockNextModule(userId).catch(() => null);
    if (nextModule) {
      await publishModuleUnlocked(userId, nextModule.id, event);
    }
  }
}

async function handleLessonCompleted(event: EventEnvelope<any>) {
  const userId = event.userId;
  const payload = event.payload ?? {};
  if (!userId) return;

  const completedAt = payload.completedAt ?? new Date().toISOString();

  await publishProgressUpdated(userId, {
    sessionId: payload.sessionId,
    lessonCompleted: true,
    goal: payload.goal,
    completedAt,
  }, event);

  await triggerStreakForSuccessfulActivity(userId, completedAt);
}

async function handleProjectCompleted(event: EventEnvelope<any>) {
  const userId = event.userId;
  const payload = event.payload ?? {};
  if (!userId) return;

  await publishProgressUpdated(userId, {
    sessionId: payload.sessionId,
    projectCompleted: true,
    practicalTestCompleted: payload.practicalTestCompleted ?? false,
    practicalTestPassed: payload.practicalTestPassed ?? false,
    goal: payload.goal,
    completedAt: payload.completedAt ?? new Date().toISOString(),
  }, event);
}

defaultSubscriber.subscribe('ExerciseValidated', handleExerciseValidated);
defaultSubscriber.subscribe('LessonCompleted', handleLessonCompleted);
defaultSubscriber.subscribe('ProjectCompleted', handleProjectCompleted);
