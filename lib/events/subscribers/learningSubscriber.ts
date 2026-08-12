import type { EventEnvelope } from '@/lib/events/types';
import { defaultSubscriber } from '@/lib/events/subscriber';
import * as learningRepo from '@/lib/repos/learningProfileRepo';

async function handleUserRegistered(event: EventEnvelope<any>) {
  const userId = event.userId;
  if (!userId) return;

  const existingLearning = await learningRepo.getProfileByUserId(userId).catch(() => null);
  if (existingLearning) return;

  await learningRepo.upsertLearningProfile(userId, {
    concept_mastery: {},
    skill_mastery: {},
    avg_solving_time_ms: 0,
    retry_count: 0,
    review_history: [],
    learning_velocity: 0,
    forgetting_rate: 0,
    preferred_exercise_type: 'code',
    preferred_project_difficulty: 1,
    confidence_score: 0,
    weak_concepts: [],
    strong_concepts: [],
    metadata: {},
  });
}

function trackLearningEvent(event: EventEnvelope) {
  console.debug('[LearningSubscriber]', event.name, { userId: event.userId, payload: event.payload });
}

defaultSubscriber.subscribe('UserRegistered', handleUserRegistered);
defaultSubscriber.subscribe('ExerciseStarted', trackLearningEvent);
defaultSubscriber.subscribe('ExerciseSubmitted', trackLearningEvent);
defaultSubscriber.subscribe('LessonStarted', trackLearningEvent);
defaultSubscriber.subscribe('LessonCompleted', trackLearningEvent);
defaultSubscriber.subscribe('ProjectStarted', trackLearningEvent);
defaultSubscriber.subscribe('ProjectCompleted', trackLearningEvent);
