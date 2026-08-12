import type { EventEnvelope } from '@/lib/events/types';
import { defaultPublisher } from '@/lib/events/publisher';
import { defaultSubscriber } from '@/lib/events/subscriber';
import { makeEvent } from '@/lib/events/utils';

async function publishXpAwarded(userId: string, xp: number, causationEvent?: EventEnvelope<any>) {
  const event = makeEvent({
    name: 'XpAwarded',
    version: 1,
    source: 'gamification',
    userId,
    correlationId: causationEvent?.correlationId,
    causationId: causationEvent?.id,
    payload: { xp, awardedAt: new Date().toISOString() },
  });
  await defaultPublisher.publish(event);
}

async function handleProgressUpdated(event: EventEnvelope<any>) {
  const userId = event.userId;
  const payload = event.payload ?? {};
  if (!userId) return;

  const xpGain = Number(payload.xp ?? 0);
  if (xpGain <= 0) return;

  // Publish raw XP award event; profile domain will handle persistence and level/achievements
  await publishXpAwarded(userId, xpGain, event);
}

async function handleRecommendationsUpdated(event: EventEnvelope<any>) {
  const userId = event.userId;
  if (!userId) return;

  // No-op here; profile domain handles achievements for recommendations
}

defaultSubscriber.subscribe('ProgressUpdated', handleProgressUpdated);
defaultSubscriber.subscribe('RecommendationsUpdated', handleRecommendationsUpdated);
