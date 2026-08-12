import type { EventEnvelope } from '@/lib/events/types';
import { defaultPublisher } from '@/lib/events/publisher';
import { defaultSubscriber } from '@/lib/events/subscriber';
import { makeEvent } from '@/lib/events/utils';
import * as dashboardRepo from '@/lib/repos/dashboardRepo';

async function publishDashboardUpdated(userId: string, causationEvent?: EventEnvelope<any>) {
  const event = makeEvent({
    name: 'DashboardUpdated',
    version: 1,
    source: 'dashboard',
    userId,
    correlationId: causationEvent?.correlationId,
    causationId: causationEvent?.id,
    payload: { updatedAt: new Date().toISOString(), sourceEvent: causationEvent?.name },
  });
  await defaultPublisher.publish(event);
}

async function refreshDashboardProjection(userId: string) {
  if (!userId) return;
  const projection = await dashboardRepo.getDashboardProjection(userId).catch(() => null);
  if (!projection) return;
  await dashboardRepo.upsertDashboardProjection(userId, { ...projection, updated_at: new Date().toISOString() });
}

async function handleDashboardTrigger(event: EventEnvelope<any>) {
  const userId = event.userId;
  if (!userId) return;

  await refreshDashboardProjection(userId);
  await publishDashboardUpdated(userId, event);
}

defaultSubscriber.subscribe('XpAwarded', handleDashboardTrigger);
defaultSubscriber.subscribe('KnowledgeUpdated', handleDashboardTrigger);
defaultSubscriber.subscribe('RecommendationsUpdated', handleDashboardTrigger);
defaultSubscriber.subscribe('AchievementUnlocked', handleDashboardTrigger);
defaultSubscriber.subscribe('ReviewScheduled', handleDashboardTrigger);
