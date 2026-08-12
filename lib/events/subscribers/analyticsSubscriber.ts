import type { EventEnvelope } from '@/lib/events/types';
import { defaultPublisher } from '@/lib/events/publisher';
import { defaultSubscriber } from '@/lib/events/subscriber';
import { makeEvent } from '@/lib/events/utils';
import * as recRepo from '@/lib/repos/recommendationRepo';

async function publishRecommendationsUpdated(userId: string, recommendations: any[], causationEvent?: EventEnvelope<any>) {
  if (!userId) return;
  const event = makeEvent({
    name: 'RecommendationsUpdated',
    version: 1,
    source: 'recommendation',
    userId,
    correlationId: causationEvent?.correlationId,
    causationId: causationEvent?.id,
    payload: { recommendations, generatedAt: new Date().toISOString() },
  });
  await defaultPublisher.publish(event);
}

async function handleKnowledgeUpdated(event: EventEnvelope<any>) {
  const userId = event.userId;
  if (!userId) return;
  const recommendations = await recRepo.listRecommendationsForUser(userId).catch(() => []);
  await publishRecommendationsUpdated(userId, recommendations, event);
}

async function handleReviewScheduled(event: EventEnvelope<any>) {
  const userId = event.userId;
  if (!userId) return;
  const recommendations = await recRepo.listRecommendationsForUser(userId).catch(() => []);
  await publishRecommendationsUpdated(userId, recommendations, event);
}

const analyticsEvents: Array<EventEnvelope> = [];

async function trackEvent(event: EventEnvelope<any>) {
  analyticsEvents.push({
    ...event,
    trackedAt: new Date().toISOString(),
  } as EventEnvelope);
}

const allEvents = [
  'UserRegistered',
  'ProfileUpdated',
  'LessonStarted',
  'LessonCompleted',
  'ExerciseStarted',
  'ExerciseSubmitted',
  'ExerciseValidated',
  'ExerciseFailed',
  'ConceptLearned',
  'ConceptForgotten',
  'MissionUnlocked',
  'MissionCompleted',
  'ModuleUnlocked',
  'ModuleCompleted',
  'ProjectStarted',
  'ProjectCompleted',
  'RecommendationGenerated',
  'ReviewScheduled',
  'KnowledgeUpdated',
  'RecommendationsUpdated',
  'ProgressUpdated',
  'XpAwarded',
  'LevelUp',
  'AchievementUnlocked',
  'DashboardUpdated',
];

for (const eventName of allEvents) {
  defaultSubscriber.subscribe(eventName, trackEvent);
}

defaultSubscriber.subscribe('KnowledgeUpdated', handleKnowledgeUpdated);
defaultSubscriber.subscribe('ReviewScheduled', handleReviewScheduled);

export function getAnalyticsEvents() {
  return analyticsEvents.slice();
}
